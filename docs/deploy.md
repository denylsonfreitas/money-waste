# Deploy do Money Waste

O MVP fica no ar de graça para o stakeholder testar pelo celular.

## Arquitetura

```
Celular ──▶ Vercel (web, Angular estático) ──HTTPS/CORS──▶ Render (API .NET 8, Docker, plano free)
            https://money-waste.vercel.app                 https://money-waste-api.onrender.com
                                                            └─ /app/data/expenses.json (disco efêmero)
```

| | Onde | Como sobe | Config no repositório |
|---|---|---|---|
| **Web** | Vercel, projeto `money-waste`, raiz `web/` | a cada push na `main` (integração Git do Vercel) | `web/vercel.json`, `web/src/environments/` |
| **API** | Render, web service `money-waste-api`, plano free | a cada push na `main` (`autoDeploy: true`) | `render.yaml`, `api/Dockerfile`, `api/.dockerignore` |

O CI (`.github/workflows/ci.yml`, job `docker`) faz `docker build -f api/Dockerfile api` em todo PR,
para provar que a imagem da API builda.

## URLs

- Web: <https://money-waste.vercel.app>
- API: <https://money-waste-api.onrender.com> — saúde em `/api/health`

## Variáveis de ambiente

### API (Render, definidas no `render.yaml`)

| Variável | Valor no Render | Padrão local | Para quê |
|---|---|---|---|
| `Cors__AllowedOrigins__0` | `https://money-waste.vercel.app` | `http://localhost:4200` | Origem do front liberada no CORS (config `Cors:AllowedOrigins`; mais origens em `__1`, `__2`...) |
| `Storage__DataFile` | `/app/data/expenses.json` | `~/.local/share/MoneyWaste/expenses.json` | Arquivo dos gastos (MW-007). O Dockerfile já usa esse valor por padrão |
| `TZ` | `America/Bahia` | fuso da máquina | Fuso do "hoje" da API (ver limitações) |
| `PORT` | o Render define sozinho | — | Porta em que a API escuta no container |

Como a porta funciona: o `ENTRYPOINT` do Dockerfile monta `ASPNETCORE_URLS=http://0.0.0.0:${PORT:-8080}`.
No Render vale o `PORT` dele; num `docker run` comum, 8080. Localmente (`dotnet run`) nada muda:
continua `http://localhost:5215` pelo `launchSettings.json`.

Não há HTTPS dentro do container (o `Program.cs` não tem `UseHttpsRedirection`): o Render termina
o TLS na frente do serviço.

**CORS e previews do Vercel:** só o domínio de produção está liberado. O CORS não aceita curinga como
`https://money-waste-*.vercel.app`, então os deploys de preview do Vercel (URLs com hash) carregam a
tela, mas as chamadas à API são bloqueadas pelo navegador. Para testar um preview, adicione a URL exata
dele como `Cors__AllowedOrigins__1` no painel do Render.

### Web (Vercel)

Nenhuma variável no painel do Vercel. A URL da API vem do arquivo de ambiente do Angular:

| Arquivo | `apiBaseUrl` | Usado em |
|---|---|---|
| `web/src/environments/environment.ts` | `http://localhost:5215` | `ng serve`, `ng test`, build de desenvolvimento |
| `web/src/environments/environment.production.ts` | `https://money-waste-api.onrender.com` | `ng build` (configuração `production`, via `fileReplacements` no `angular.json`) |

`web/vercel.json`: framework `angular`, `npm ci`, `npx ng build`, saída `dist/web/browser` e rewrite de
todas as rotas para `/index.html` (SPA).

## Passo a passo do stakeholder (pelo celular)

### Render (API) — uma vez só

1. Abra <https://render.com> e toque em **Get Started** / **Sign in** → **GitHub**. Entre com a conta
   `denylsonfreitas`.
2. Quando o GitHub pedir, autorize o app do Render e, em *Repository access*, escolha
   **Only select repositories** → `money-waste` → **Install/Authorize**.
3. No painel do Render: **New +** → **Blueprint**.
4. Escolha o repositório `denylsonfreitas/money-waste` (branch `main`). O Render lê o `render.yaml` e
   mostra o serviço `money-waste-api` (plano *Free*).
5. Dê um nome ao Blueprint (ex.: `money-waste`) e toque em **Apply**/**Deploy Blueprint**.
6. Espere o primeiro deploy (alguns minutos: ele builda a imagem Docker). Quando ficar **Live**, abra
   `https://money-waste-api.onrender.com/api/health` — deve aparecer `{"status":"ok"}`.

Se o Render pedir cartão de crédito em algum passo, pare e avise o time: o plano previsto é o gratuito.

**Se o nome `money-waste-api` já estiver tomado:** o Render cria o serviço com outro endereço (ex.:
`https://money-waste-api-abcd.onrender.com`; ele aparece no topo da página do serviço). Aí:

1. Troque o `apiBaseUrl` em `web/src/environments/environment.production.ts` pelo endereço novo
   (sem barra no final) e faça o merge na `main` — o Vercel publica o front de novo.
2. Atualize as URLs deste arquivo.

**Se o domínio do Vercel não for `money-waste.vercel.app`:** troque `Cors__AllowedOrigins__0` no
`render.yaml` (e no painel do Render, em *Environment*) pelo domínio real.

### Vercel (web)

O orquestrador cria e liga o projeto `money-waste` (raiz `web/`) pela API do Vercel. Se precisar refazer
na mão: <https://vercel.com/new> → importar `money-waste` → **Root Directory** `web` → **Deploy**
(o resto vem do `web/vercel.json`).

### Testar

Abra <https://money-waste.vercel.app> no celular. A primeira carga de dados pode levar cerca de
1 minuto (a API estava dormindo); depois fica rápida.

## Como refazer o deploy

- **Normal:** merge na `main`. Vercel e Render publicam sozinhos.
- **API à mão:** no Render, serviço `money-waste-api` → **Manual Deploy** → **Deploy latest commit**.
- **Web à mão:** no Vercel, projeto `money-waste` → **Deployments** → último → **Redeploy**.
- **Imagem localmente** (precisa de Docker e acesso ao nuget.org):
  ```bash
  docker build -f api/Dockerfile -t money-waste-api api
  docker run --rm -p 8080:8080 money-waste-api   # http://localhost:8080/api/health
  ```

## Limitações do plano gratuito

- **A API dorme** depois de 15 minutos sem requisições. A próxima requisição acorda o serviço e leva
  cerca de 1 minuto; enquanto isso o front fica esperando (ou mostra erro, se o navegador desistir —
  é só recarregar).
- **Disco efêmero: os gastos somem.** O `expenses.json` fica no disco do container, que é apagado
  quando o serviço reinicia, recebe um deploy novo ou dorme. Para o teste do MVP, conte com perder os
  dados entre uma sessão e outra. Guardar de verdade exige disco persistente (pago no Render) ou um banco
  externo — decisão para depois das férias.
- **Fuso horário.** O "hoje" da API (data padrão de um gasto novo, mês atual, mês anterior) vem de
  `TimeProvider.System.GetLocalNow()` (`CurrentMonth.cs`, `ExpenseRequest.cs`), ou seja, do fuso local do
  servidor. Os servidores do Render rodam em UTC: sem ajuste, entre 21h e meia-noite (horário da Bahia)
  a API já estaria no dia seguinte — e, no último dia do mês, no mês seguinte. Por isso o `render.yaml`
  define `TZ=America/Bahia` (a imagem `aspnet:8.0` já traz o `tzdata`).
- **Um único usuário.** Não há login: quem abrir a URL vê e altera os mesmos gastos.
