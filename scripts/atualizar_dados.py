"""
Atualiza o painel da Safra de Tomate a partir do Monday.

Fluxo:
  1. Lê o quadro "Safra de Tomate – Preparação e Investimentos" pela API do Monday
     (token vem do secret MONDAY_API_TOKEN; nunca fica no código).
  2. Converte para o formato que o painel usa.
  3. Baixa as fotos do local, reduz para miniaturas e embute no pacote.
     Orçamentos e NF-e NÃO são publicados: o painel só mostra o nome e um link
     para o item no Monday, que exige login.
  4. Criptografa tudo com AES-256-GCM (chave derivada da senha PAINEL_SENHA
     por PBKDF2-SHA256) e grava data/dados.enc.json.
  5. Se o conteúdo não mudou desde a última execução, mantém o arquivo como
     está (evita commits desnecessários).

Nenhum dado em texto aberto é gravado no repositório.
"""
import base64
import io
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from PIL import Image

BOARD_ID = os.environ.get("MONDAY_BOARD_ID", "18435486131")
CONTA = os.environ.get("MONDAY_CONTA", "messigean18s-team")
SAIDA = os.path.join(os.path.dirname(__file__), "..", "data", "dados.enc.json")
ITERACOES = 310_000
MAX_FOTOS = 4
LADO_FOTO = 800  # px no maior lado
DEPARTAMENTOS = {"Mecânica", "Elétrica", "Automação", "Civil"}
# Safra usada quando a coluna "Safra" estiver vazia no Monday
SAFRA_PADRAO = os.environ.get("SAFRA_PADRAO", "2027")

# IDs das colunas do quadro no Monday
COL = {
    "safra": "dropdown_mm84n1xv",
    "status": "color_mm84tzx3",
    "prioridade": "color_mm849tr8",
    "tipo": "color_mm847r3q",
    "resp": "multiple_person_mm84ppvf",
    "area": "text_mm84ez9s",
    "periodo": "timerange_mm845p5y",
    "prev": "numeric_mm8431mb",
    "real": "numeric_mm845car",
    "compra": "color_mm84jq",
    "fornecedor": "text_mm842bzm",
    "rc": "text_mm84p8t",
    "obs": "long_text_mm84m673",
    "orcamentos": "file_mm8476y7",
    "os": "text_mm84dk7y",
    "nfe": "text_mm84pz70",
    "nfe_arq": "file_mm84gxd5",
    "fotos": "file_mm84qj1x",
}


def falha(msg):
    # Mensagem sem dados sensíveis; o arquivo publicado anterior é mantido
    print(f"ERRO: {msg}", file=sys.stderr)
    sys.exit(1)


def segredo(nome):
    v = os.environ.get(nome, "")
    if not v:
        falha(f"secret {nome} não configurado")
    return v


def monday(query, variables, token):
    req = urllib.request.Request(
        "https://api.monday.com/v2",
        data=json.dumps({"query": query, "variables": variables}).encode(),
        headers={"Authorization": token, "Content-Type": "application/json", "API-Version": "2024-10"},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        resp = json.loads(r.read())
    if resp.get("errors"):
        falha("a API do Monday retornou erro: " + "; ".join(e.get("message", "") for e in resp["errors"])[:300])
    return resp["data"]


CAMPOS_ITEM = """
  id name
  group { title }
  column_values { id text value }
  assets { id name public_url file_extension }
"""


def ler_itens(token):
    itens, cursor = [], None
    d = monday(
        "query($b:[ID!]){ boards(ids:$b){ items_page(limit:200){ cursor items {" + CAMPOS_ITEM + "} } } }",
        {"b": [BOARD_ID]}, token)
    if not d["boards"]:
        falha("quadro não encontrado (verifique MONDAY_BOARD_ID e o acesso do token)")
    pagina = d["boards"][0]["items_page"]
    itens += pagina["items"]
    cursor = pagina["cursor"]
    while cursor:
        d = monday("query($c:String!){ next_items_page(limit:200, cursor:$c){ cursor items {" + CAMPOS_ITEM + "} } }",
                   {"c": cursor}, token)
        itens += d["next_items_page"]["items"]
        cursor = d["next_items_page"]["cursor"]
    return itens


def numero(txt):
    try:
        return float(str(txt).replace(",", ".")) if txt not in (None, "") else None
    except ValueError:
        return None


def arquivos(cv, assets):
    """Lista de arquivos de uma coluna de arquivo: [(nome, asset)]."""
    if not cv or not cv.get("value"):
        return []
    try:
        files = json.loads(cv["value"]).get("files", [])
    except (ValueError, AttributeError):
        return []
    por_id = {str(a["id"]): a for a in assets}
    return [(f.get("name") or "arquivo", por_id.get(str(f.get("assetId")))) for f in files]


def miniatura(url):
    if not str(url).startswith("https://"):
        return None  # só baixa de endereços HTTPS
    try:
        with urllib.request.urlopen(url, timeout=60) as r:
            img = Image.open(io.BytesIO(r.read()))
            img = img.convert("RGB")
            img.thumbnail((LADO_FOTO, LADO_FOTO))
            buf = io.BytesIO()
            img.save(buf, "JPEG", quality=72, optimize=True)
            return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
    except Exception:
        return None  # foto que não abre é ignorada, sem derrubar a atualização


def converter(item):
    dept = (item.get("group") or {}).get("title", "").strip()
    if dept not in DEPARTAMENTOS:
        return None
    cv = {c["id"]: c for c in item["column_values"]}
    t = lambda k: (cv.get(COL[k]) or {}).get("text") or ""
    url = f"https://{CONTA}.monday.com/boards/{BOARD_ID}/pulses/{item['id']}"
    ini = fim = None
    per = cv.get(COL["periodo"])
    if per and per.get("value"):
        try:
            v = json.loads(per["value"])
            ini, fim = v.get("from"), v.get("to")
        except ValueError:
            pass
    fotos = []
    for nome, asset in arquivos(cv.get(COL["fotos"]), item.get("assets", []))[:MAX_FOTOS]:
        if asset and asset.get("public_url"):
            img = miniatura(asset["public_url"])
            if img:
                fotos.append({"nome": nome, "url": img})
    # Orçamentos e NF-e: só o nome + link para o item no Monday (exige login)
    orcs = [{"nome": n, "url": url} for n, _ in arquivos(cv.get(COL["orcamentos"]), item.get("assets", []))]
    nfe_arqs = arquivos(cv.get(COL["nfe_arq"]), item.get("assets", []))
    return {
        "id": item["id"],
        "nome": item["name"],
        "dept": dept,
        "safra": t("safra").split(",")[0].strip() or SAFRA_PADRAO,
        "status": t("status") or "Não iniciado",
        "prioridade": t("prioridade") or "Média",
        "tipo": t("tipo") or "Serviço interno",
        "resp": t("resp"),
        "area": t("area"),
        "ini": ini,
        "fim": fim,
        "prev": numero(t("prev")) or 0,
        "real": numero(t("real")),
        "compra": t("compra") or "Sem compra",
        "fornecedor": t("fornecedor"),
        "rc": t("rc"),
        "os": t("os"),
        "nfe": t("nfe"),
        "nfeArq": {"nome": nfe_arqs[0][0], "url": url} if nfe_arqs else None,
        "fotos": fotos,
        "orcamentos": orcs,
        "obs": t("obs"),
        "url": url,
    }


def chave(senha, salt):
    return PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITERACOES).derive(senha.encode())


def decifrar(pkg, senha):
    k = chave(senha, base64.b64decode(pkg["salt"]))
    return AESGCM(k).decrypt(base64.b64decode(pkg["iv"]), base64.b64decode(pkg["ct"]), None)


def main():
    token = segredo("MONDAY_API_TOKEN")
    senha = segredo("PAINEL_SENHA")
    if len(senha) < 12:
        falha("PAINEL_SENHA precisa ter pelo menos 12 caracteres")

    itens = [x for x in (converter(i) for i in ler_itens(token)) if x]
    corpo = json.dumps(itens, ensure_ascii=False, sort_keys=True)

    # Mantém o arquivo atual se nada mudou
    if os.path.exists(SAIDA):
        try:
            with open(SAIDA, encoding="utf-8") as f:
                antigo = json.loads(decifrar(json.load(f), senha))
            if json.dumps(antigo.get("itens"), ensure_ascii=False, sort_keys=True) == corpo:
                print(f"Sem mudanças ({len(itens)} atividades).")
                return
        except Exception:
            pass  # senha trocada ou arquivo antigo inválido: gera de novo

    pacote = {"gerado": datetime.now(timezone.utc).isoformat(timespec="seconds"), "itens": itens}
    salt, iv = os.urandom(16), os.urandom(12)
    ct = AESGCM(chave(senha, salt)).encrypt(iv, json.dumps(pacote, ensure_ascii=False).encode(), None)
    os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8") as f:
        json.dump({"v": 1, "alg": "AES-256-GCM/PBKDF2-SHA256", "iter": ITERACOES,
                   "salt": base64.b64encode(salt).decode(), "iv": base64.b64encode(iv).decode(),
                   "ct": base64.b64encode(ct).decode()}, f)
    print(f"Atualizado: {len(itens)} atividades, {sum(len(i['fotos']) for i in itens)} fotos.")


if __name__ == "__main__":
    main()
