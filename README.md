# Painel da Safra de Tomate · PCM Goiás Verde

Painel de acompanhamento da preparação da safra de tomate, por departamento (Mecânica, Elétrica, Automação e Civil), alimentado pelo quadro **“Safra de Tomate – Preparação e Investimentos”** do Monday.

## Como funciona

```
Monday ──(GitHub Actions, a cada hora)──> scripts/atualizar_dados.py
          lê o quadro → baixa fotos, orçamentos e NF-e → grava data/dados.json e data/arquivos/
GitHub Pages ──> index.html lê data/dados.json e mostra o painel
```

Todos os dados e anexos ficam abertos no painel, sem senha.

## Boas práticas de segurança aplicadas

| Cuidado | Como está feito |
|---|---|
| Token do Monday protegido | Fica só no secret `MONDAY_API_TOKEN` do GitHub (guardado criptografado pelo GitHub). Nunca aparece no código, nos logs, nas mensagens de erro nem na página. |
| Permissão mínima da automação | O workflow só tem `contents: write` neste repositório. |
| Anexos baixados com segurança | Só por HTTPS, até 25 MB por arquivo e apenas extensões permitidas (PDF, XML, planilhas, documentos e imagens). Executáveis e outros tipos são ignorados. |
| Nomes de arquivo limpos | Caminhos e caracteres especiais são removidos, evitando gravar fora da pasta `data/arquivos/`. |
| Fotos sem metadados | As fotos são regravadas em JPEG, o que remove dados embutidos como a localização GPS do celular. |
| Falha não apaga dados | Se o Monday estiver fora do ar ou algo der erro, o painel continua com a última versão boa. |
| Página sem scripts de terceiros | Política de segurança (CSP): a página só executa os próprios scripts e só busca dados do próprio site. |
| Links externos seguros | Links para o Monday abrem em nova aba sem repassar a origem (`noopener noreferrer`). |
| Fora dos buscadores | `robots.txt` e meta `noindex` evitam que o painel apareça no Google (quem tem o link acessa normalmente). |

**Recomendações**

- Crie o token do Monday com um usuário que tenha acesso só ao necessário e troque-o se alguém sair da equipe.
- Ative a autenticação em dois fatores na conta do GitHub.
- Lembre que o repositório é público: tudo que está no quadro do Monday (valores, NF-e, fornecedores, fotos) fica visível para quem tiver o link do painel.

## Configuração (uma vez)

1. **Secret** — *Settings → Secrets and variables → Actions → New repository secret*
   - `MONDAY_API_TOKEN`: token da API do Monday (*Avatar → Developers → My access tokens*).
2. **Pages** — *Settings → Pages → Build and deployment*: Source **Deploy from a branch**, branch `main`, pasta `/ (root)`.
3. **Primeira carga** — *Actions → Atualizar dados do painel → Run workflow*.

Depois disso, a atualização roda sozinha a cada hora, das 6h às 20h, de segunda a sábado.

## Estrutura

```
index.html                     página do painel
assets/style.css               visual
assets/app.js                  lógica do painel
scripts/atualizar_dados.py     Monday → dados.json + anexos
scripts/requirements.txt       dependências do script
.github/workflows/atualizar.yml  agendamento da atualização
data/dados.json                dados do painel (gerado pela automação)
data/arquivos/                 fotos, orçamentos e NF-e baixados do Monday
```

## Ajustes comuns

- **Safra padrão** para itens sem safra preenchida: variável `SAFRA_PADRAO` no workflow.
- **Novo departamento**: crie o grupo no Monday e inclua o nome em `DEPARTAMENTOS` (script) e em `DEPTS` (`assets/app.js`).
- **Frequência**: linha `cron` em `.github/workflows/atualizar.yml` (horário em UTC).
