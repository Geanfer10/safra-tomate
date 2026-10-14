"""
Atualiza o painel da Safra de Tomate a partir do Monday.

Fluxo:
  1. Lê o quadro "Safra de Tomate – Preparação e Investimentos" pela API do Monday.
     O token vem do secret MONDAY_API_TOKEN e nunca é gravado nem impresso.
  2. Converte os itens para o formato do painel.
  3. Baixa os anexos (fotos do local, orçamentos e NF-e) para data/arquivos/,
     porque os links de arquivo do Monday expiram em pouco tempo.
  4. Grava data/dados.json. Se algo falhar, o arquivo anterior é mantido.

Cuidados de segurança aplicados:
  - Token só por variável de ambiente; mensagens de erro nunca incluem o token.
  - Downloads apenas por HTTPS, com limite de tamanho e lista de extensões permitidas.
  - Nomes de arquivo limpos (sem caminhos, sem caracteres especiais) para evitar
    gravação fora da pasta de destino.
  - Fotos regravadas como JPEG (remove metadados como localização GPS do celular).
  - Gravação atômica: os dados novos só substituem os antigos se tudo der certo.
"""
import io
import json
import os
import re
import shutil
import sys
import tempfile
import unicodedata
import urllib.request
from datetime import datetime, timezone

from PIL import Image

BOARD_ID = os.environ.get("MONDAY_BOARD_ID", "18435486131")
CONTA = os.environ.get("MONDAY_CONTA", "messigean18s-team")
SAFRA_PADRAO = os.environ.get("SAFRA_PADRAO", "2027")  # quando a coluna Safra estiver vazia

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PASTA_DADOS = os.path.join(RAIZ, "data")
ARQ_JSON = os.path.join(PASTA_DADOS, "dados.json")
PASTA_ARQ = os.path.join(PASTA_DADOS, "arquivos")

DEPARTAMENTOS = {"Mecânica", "Elétrica", "Automação", "Civil"}
LADO_FOTO = 1600                     # px no maior lado
MAX_BYTES = 25 * 1024 * 1024         # 25 MB por arquivo
EXT_FOTO = {"jpg", "jpeg", "png", "webp", "gif", "bmp"}
EXT_DOC = {"pdf", "xml", "xlsx", "xls", "csv", "docx", "doc", "txt", "jpg", "jpeg", "png"}

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
    print(f"ERRO: {msg}", file=sys.stderr)
    sys.exit(1)


def monday(query, variables, token):
    req = urllib.request.Request(
        "https://api.monday.com/v2",
        data=json.dumps({"query": query, "variables": variables}).encode(),
        headers={"Authorization": token, "Content-Type": "application/json", "API-Version": "2024-10"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            resp = json.loads(r.read())
    except Exception as e:  # não repassa detalhes que possam conter o cabeçalho
        falha(f"não foi possível acessar a API do Monday ({type(e).__name__})")
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
    d = monday("query($b:[ID!]){ boards(ids:$b){ items_page(limit:200){ cursor items {" + CAMPOS_ITEM + "} } } }",
               {"b": [BOARD_ID]}, token)
    if not d["boards"]:
        falha("quadro não encontrado (verifique MONDAY_BOARD_ID e o acesso do token)")
    pagina = d["boards"][0]["items_page"]
    itens, cursor = list(pagina["items"]), pagina["cursor"]
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


def nome_seguro(nome):
    """Remove caminhos e caracteres especiais do nome do arquivo."""
    nome = os.path.basename(str(nome or "arquivo"))
    nome = unicodedata.normalize("NFKD", nome).encode("ascii", "ignore").decode()
    nome = re.sub(r"[^A-Za-z0-9._-]+", "-", nome).strip(".-") or "arquivo"
    return nome[:80]


def extensao(nome, asset):
    ext = (asset or {}).get("file_extension") or os.path.splitext(nome)[1]
    return str(ext).lower().lstrip(".")


def baixar(url):
    if not str(url).startswith("https://"):
        return None
    try:
        with urllib.request.urlopen(url, timeout=90) as r:
            dados = r.read(MAX_BYTES + 1)
        return None if len(dados) > MAX_BYTES else dados
    except Exception:
        return None  # anexo que não baixa é ignorado, sem derrubar a atualização


def arquivos_coluna(cv, assets):
    if not cv or not cv.get("value"):
        return []
    try:
        files = json.loads(cv["value"]).get("files", [])
    except (ValueError, AttributeError):
        return []
    por_id = {str(a["id"]): a for a in assets}
    return [(f.get("name") or "arquivo", por_id.get(str(f.get("assetId")))) for f in files]


def salvar_anexos(cv, item, destino, tipo, usados):
    """Baixa os anexos de uma coluna. tipo = 'foto' ou 'doc'."""
    saida = []
    for nome, asset in arquivos_coluna(cv, item.get("assets", [])):
        if not asset or not asset.get("public_url"):
            continue
        ext = extensao(nome, asset)
        if ext not in (EXT_FOTO if tipo == "foto" else EXT_DOC):
            continue
        conteudo = baixar(asset["public_url"])
        if not conteudo:
            continue
        base = nome_seguro(os.path.splitext(nome)[0])
        if tipo == "foto":
            try:
                img = Image.open(io.BytesIO(conteudo)).convert("RGB")  # descarta metadados (EXIF/GPS)
                img.thumbnail((LADO_FOTO, LADO_FOTO))
                buf = io.BytesIO()
                img.save(buf, "JPEG", quality=80, optimize=True)
                conteudo, ext = buf.getvalue(), "jpg"
            except Exception:
                continue
        arq = f"{nome_seguro(str(asset['id']))}-{base}.{ext}"
        if arq in usados:
            continue
        usados.add(arq)
        pasta = os.path.join(destino, nome_seguro(str(item["id"])))
        os.makedirs(pasta, exist_ok=True)
        with open(os.path.join(pasta, arq), "wb") as f:
            f.write(conteudo)
        saida.append({"nome": nome, "url": f"data/arquivos/{nome_seguro(str(item['id']))}/{arq}"})
    return saida


def converter(item, destino):
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
    usados = set()
    nfes = salvar_anexos(cv.get(COL["nfe_arq"]), item, destino, "doc", usados)
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
        "nfeArq": nfes[0] if nfes else None,
        "fotos": salvar_anexos(cv.get(COL["fotos"]), item, destino, "foto", usados),
        "orcamentos": salvar_anexos(cv.get(COL["orcamentos"]), item, destino, "doc", usados),
        "obs": t("obs"),
        "url": url,
    }


def main():
    token = os.environ.get("MONDAY_API_TOKEN", "")
    if not token:
        falha("secret MONDAY_API_TOKEN não configurado")

    brutos = ler_itens(token)
    tmp = tempfile.mkdtemp(prefix="arquivos-")
    try:
        itens = [x for x in (converter(i, tmp) for i in brutos) if x]
        # Ordem estável para o Git só registrar mudanças reais
        itens.sort(key=lambda x: (x["dept"], x["nome"], x["id"]))
        os.makedirs(PASTA_DADOS, exist_ok=True)

        anterior = None
        if os.path.exists(ARQ_JSON):
            try:
                with open(ARQ_JSON, encoding="utf-8") as f:
                    anterior = json.load(f)
            except ValueError:
                pass
        gerado = datetime.now(timezone.utc).isoformat(timespec="seconds")
        if anterior and anterior.get("itens") == itens:
            gerado = anterior.get("gerado", gerado)  # nada mudou: mantém a data

        # Troca a pasta de anexos e o JSON só depois de tudo pronto
        if os.path.exists(PASTA_ARQ):
            shutil.rmtree(PASTA_ARQ)
        shutil.move(tmp, PASTA_ARQ)
        tmp_json = ARQ_JSON + ".tmp"
        with open(tmp_json, "w", encoding="utf-8") as f:
            json.dump({"gerado": gerado, "itens": itens}, f, ensure_ascii=False, indent=1)
        os.replace(tmp_json, ARQ_JSON)
    finally:
        if os.path.exists(tmp):
            shutil.rmtree(tmp, ignore_errors=True)

    print(f"OK: {len(itens)} atividades, {sum(len(i['fotos']) for i in itens)} fotos, "
          f"{sum(len(i['orcamentos']) for i in itens)} orçamentos.")


if __name__ == "__main__":
    main()
