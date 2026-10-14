# Painel da Safra de Tomate · PCM Goiás Verde

Painel de acompanhamento da preparação da safra de tomate, por departamento (Mecânica, Elétrica, Automação e Civil), alimentado pelo quadro **“Safra de Tomate – Preparação e Investimentos”** do Monday.

## Como funciona

```
Monday ──(GitHub Actions, a cada hora)──> scripts/atualizar_dados.py
          lê o quadro → converte → baixa fotos → CRIPTOGRAFA → data/dados.enc.json
GitHub Pages ──> index.html pede a senha → decifra no navegador → mostra o painel
```

## Segurança dos dados

| Risco | Como está tratado |
|---|---|
| Token do Monday vazar | Fica só no secret `MONDAY_API_TOKEN` do GitHub. Nunca aparece no código, no log nem na página. |
| Repositório e site públicos | Os dados só são publicados **criptografados** (AES-256-GCM, chave derivada da senha por PBKDF2-SHA256 com 310 mil iterações). Sem a senha, o arquivo é ilegível. |
| Senha do painel vazar pelo GitHub | Fica só no secret `PAINEL_SENHA`. A decifragem acontece no navegador de quem digita a senha. |
| Orçamentos e NF-e expostos | Os arquivos **não são publicados**. O painel mostra só o nome e um link para o item no Monday, que exige login. |
| Fotos expostas | Viram miniaturas e vão **dentro** do pacote criptografado. |
| Histórico do Git guardar dados abertos | Nenhum dado em texto aberto é gravado. O `.gitignore` bloqueia `dados.json` e arquivos `.env`. |
| Página indexada no Google | `robots.txt` e meta `noindex` bloqueiam buscadores. |
| Script de terceiros na página | Política de segurança (CSP): a página só executa os próprios scripts e só busca dados do próprio site. |
| Automação com permissão demais | O workflow só tem `contents: write` neste repositório. |

**Boas práticas**

- Use uma senha de painel com **12 caracteres ou mais**, diferente de qualquer outra senha.
- “Lembrar neste equipamento” guarda a senha no navegador: marque só em TV ou computador de uso exclusivo.
- Ao trocar a senha (secret `PAINEL_SENHA`), rode o workflow manualmente: o arquivo é recriptografado com a nova senha e a antiga deixa de funcionar.
- Crie o token do Monday com um usuário que tenha acesso **apenas** ao necessário e troque-o se alguém sair da equipe.
- O site e o código ficam visíveis publicamente (exigência do GitHub Pages gratuito). O que fica protegido são os **dados**.

## Configuração (uma vez)

1. **Secrets** — *Settings → Secrets and variables → Actions → New repository secret*
   - `MONDAY_API_TOKEN`: token da API do Monday (*Avatar → Developers → My access tokens*).
   - `PAINEL_SENHA`: senha de acesso ao painel (mínimo 12 caracteres).
2. **Pages** — *Settings → Pages → Build and deployment*: Source **Deploy from a branch**, branch `main`, pasta `/ (root)`.
3. **Primeira carga** — *Actions → Atualizar dados do painel → Run workflow*.

Depois disso, a atualização roda sozinha a cada hora, das 6h às 20h, de segunda a sábado.

## Estrutura

```
index.html                     página do painel
assets/style.css               visual
assets/app.js                  lógica do painel + decifragem
scripts/atualizar_dados.py     Monday → pacote criptografado
scripts/requirements.txt       dependências do script
.github/workflows/atualizar.yml  agendamento da atualização
data/dados.enc.json            dados criptografados (gerado pela automação)
```

## Ajustes comuns

- **Safra padrão** para itens sem safra preenchida: variável `SAFRA_PADRAO` no workflow.
- **Novo departamento**: crie o grupo no Monday e inclua o nome em `DEPARTAMENTOS` (script) e em `DEPTS` (`assets/app.js`).
- **Frequência**: linha `cron` em `.github/workflows/atualizar.yml` (horário em UTC).
