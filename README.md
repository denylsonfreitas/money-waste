# 💸 Money Waste

**Controle de gastos desenvolvido por um time Scrum autônomo de agentes de IA.**

Este repositório é um experimento: um time de seis agentes no [Claude Code](https://claude.com/claude-code)
planeja, implementa, testa, documenta, revisa e faz o merge do produto sozinho, num turno
noturno, até o MVP ficar pronto. O humano entra como **stakeholder**: define a visão e a
escala do time, e testa o MVP quando o time sai de férias.

## 👥 O time

| | Agente | Papel |
|---|---|---|
| 🧭 | **Marina** — PO | Mantém o backlog e escreve histórias com critérios de aceite |
| 🛠️ | **Caio** — Dev | Implementa em .NET + Angular, sempre com testes |
| 🔍 | **Bia** — QA | Confere cada critério com evidências e reprova sem dó |
| ✍️ | **Leo** — Tech Writer | Mantém README, CHANGELOG, ADRs e docs da API |
| 🧑‍💻 | **Rafa** — Revisor | Revisa o PR inteiro e decide: merge ou volta para o Dev |
| ⚙️ | **Duda** — DevOps | Cuida do deploy (Vercel + Render) e do pipeline |

As personas e regras de cada um estão em [`.claude/agents/`](.claude/agents).

## 🔄 Como o time trabalha

```
Backlog ─▶ PO ─▶ Dev ─▶ QA ─▶ Tech Writer ─▶ Revisor ──aprovado──▶ merge na main
                  ▲      │                      │
                  └──────┴──────reprovado───────┘
```

## 🕕 Escala

| | |
|---|---|
| **Turno** | 18h à meia-noite (horário da Bahia), por tarefa agendada |
| **Ritmo** | sem limite fixo: uma história atrás da outra até acabar o turno ou o limite de uso do plano |
| **Até quando** | até o MVP (MW-001 a MW-007) estar na `main` |
| **Depois** | férias 🏖️ — o stakeholder testa o MVP e o processo é repensado |

Regras completas em [`docs/team/escala.md`](docs/team/escala.md).

Cada turno é o comando `/sprint` ([`.claude/commands/sprint.md`](.claude/commands/sprint.md)).
Cada rodada entrega **uma história** em um PR.
Os agentes só conversam por artefatos no repositório, então todo o processo fica rastreável:

- [`docs/backlog/`](docs/backlog) — backlog e histórias
- [`docs/sprints/`](docs/sprints) — dailies do time e relatórios do QA
- Revisões do Rafa — publicadas em cada [pull request](https://github.com/denylsonfreitas/money-waste/pulls?q=is%3Apr)
- [`docs/adr/`](docs/adr) — decisões de arquitetura
- [`CHANGELOG.md`](CHANGELOG.md)

## 🧱 Stack

- **API:** .NET 8, Minimal APIs, xUnit
- **Web:** Angular 20, standalone components, signals
- **CI:** GitHub Actions (só build e testes — sem IA)

## ▶️ Rodando localmente

```bash
# API (http://localhost:5215)
dotnet run --project api/src/MoneyWaste.Api

# Web (http://localhost:4200)
cd web && npm install && npx ng serve

# Verificação completa (o mesmo que o time roda antes de abrir PR)
scripts/check.sh
```

## 🌐 No ar

| | Endereço |
|---|---|
| **App** | https://money-waste.vercel.app |
| **API** | https://money-waste-api.onrender.com/api/health |

Plano gratuito: a API dorme depois de 15 min sem uso (a primeira abertura leva ~1 min) e os
gastos se perdem quando ela reinicia. Detalhes e como refazer o deploy em
[`docs/deploy.md`](docs/deploy.md).

## 🧪 Como testar o MVP

O MVP (MW-001 a MW-007) está na versão `v0.1.0`. Notas em [`CHANGELOG.md`](CHANGELOG.md).

### Pré-requisitos

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) (`dotnet --version` → `8.x`).
- Node.js 22 (o CI usa 22; o Angular 20 pede 20.19+ ou 22.12+) e npm.
- Angular CLI **não** precisa ser instalado globalmente: vem no `web/package.json` e roda por
  `npm start` / `npx ng`.
- Um navegador. As portas `5215` (API) e `4200` (front) precisam estar livres.

### Subir a API e o front

Dois terminais, a partir da raiz do repositório:

```bash
# Terminal 1 — API em http://localhost:5215
dotnet run --project api/src/MoneyWaste.Api --urls http://localhost:5215

# Terminal 2 — front em http://localhost:4200
cd web && npm install && npm start
```

Confira a API em <http://localhost:5215/api/health> (`{"status":"ok"}`) e abra
<http://localhost:4200>.

- O front chama a API sempre em `http://localhost:5215` (fixo em `web/src/app/api.config.ts`).
  Use essa porta.
- A API só aceita chamadas (CORS) de `http://localhost:4200`. Abra o front por `localhost`, não
  por `127.0.0.1`.

### Roteiro

Comece do zero (veja [abaixo](#começar-do-zero)) para os números baterem. Os valores esperados
estão entre aspas.

1. **Tela vazia.** Ao abrir: "Total do mês: R$ 0,00", "Mês anterior: R$ 0,00", "Igual ao mês
   anterior.", "Nenhum gasto neste mês." e "Nenhum gasto registrado neste mês.".
2. **Validação (MW-001).** Clique "Registrar" sem preencher nada. Aparecem erros em português
   ("Informe o valor do gasto.", "A descrição é obrigatória.", "Escolha uma categoria.") e nada
   é registrado.
3. **Registrar (MW-001).** Registre três gastos:
   - `45,90` · Almoço · Alimentação · data de hoje (já vem preenchida). Confirmação: "Gasto
     registrado: Almoço — R$ 45,90".
   - `22,50` · Uber · Transporte · hoje.
   - `120,00` · Mercado · Alimentação · dia 1 deste mês.
4. **Listar (MW-002).** Em "Gastos do mês", os três aparecem com data dd/mm/aaaa, do mais
   recente para o mais antigo: Uber e Almoço (hoje; o registrado por último em cima), depois
   Mercado.
5. **Total (MW-003).** "Total do mês: R$ 188,40".
6. **Por categoria (MW-004).** "Alimentação — R$ 165,90" e, abaixo, "Transporte — R$ 22,50".
7. **Mês anterior (MW-006).** Antes de registrar, a comparação mostra "Mês anterior: R$ 0,00"
   e "R$ 188,40 a mais que no mês anterior.". Agora registre um gasto **no mês passado**,
   mudando o campo Data: `150,00` · Aluguel · Moradia · dia 15 do mês anterior.
   - Ele **não** aparece na lista, no total nem nas categorias (são só do mês atual).
   - A comparação vira "Mês anterior: R$ 150,00" e "R$ 38,40 a mais que no mês anterior.".
8. **Editar (MW-005).** Clique "Editar" no Uber. O formulário vira "Editar gasto". Mude o valor
   para `30,00` e clique "Salvar alterações": "Gasto atualizado: Uber — R$ 30,00". Total
   "R$ 195,90", "Transporte — R$ 30,00", "R$ 45,90 a mais que no mês anterior.". O Uber fica
   na mesma posição da lista. "Cancelar" sai da edição sem salvar.
9. **Excluir (MW-005).** Clique "Excluir" no Almoço e confirme `Excluir o gasto "Almoço —
   R$ 45,90"?`. Total "R$ 150,00", "Alimentação — R$ 120,00", "Transporte — R$ 30,00" e
   "Igual ao mês anterior.".
10. **Persistência (MW-007).** No terminal 1, pare a API (`Ctrl+C`) e suba de novo com o mesmo
    comando. Recarregue a página (F5). Tudo continua igual ao passo 9: Uber e Mercado na
    lista, na mesma ordem, total "R$ 150,00" e "Mês anterior: R$ 150,00".

Com a API parada, recarregar a página mostra as mensagens de erro de cada seção ("Não foi
possível carregar..."), nunca um "R$ 0,00" falso.

### Onde ficam os dados do teste

No arquivo `~/.local/share/MoneyWaste/expenses.json` (Linux) ou
`%LOCALAPPDATA%\MoneyWaste\expenses.json` (Windows). Detalhes e avisos na
[próxima seção](#-onde-ficam-os-dados).

### Começar do zero

Pare a API, apague o arquivo e suba a API de novo:

```bash
rm ~/.local/share/MoneyWaste/expenses.json
```

Para testar sem mexer nos seus dados de verdade, aponte a API para outro arquivo:

```bash
Storage__DataFile=/tmp/money-waste-teste.json dotnet run --project api/src/MoneyWaste.Api --urls http://localhost:5215
```

### Limitações conhecidas

As que um teste pode encontrar estão em [`CHANGELOG.md`](CHANGELOG.md), seção
"Limitações conhecidas" da `v0.1.0`. As principais: rode uma API só por arquivo; apagar a data
ao editar muda o gasto para hoje; perto da virada do mês, fusos diferentes entre servidor e
navegador podem esconder um gasto.

## 💾 Onde ficam os dados

Os gastos ficam num arquivo JSON na sua máquina (MW-007). Nada vai para a nuvem.

**Local padrão** (sem configurar nada):

| Sistema | Arquivo |
|---|---|
| Linux | `~/.local/share/MoneyWaste/expenses.json` |
| Windows | `%LOCALAPPDATA%\MoneyWaste\expenses.json` |

A pasta é criada no primeiro registro. Antes disso, a API sobe com a lista vazia.

**Trocar o local:** configuração `Storage:DataFile`. Pela variável de ambiente:

```bash
Storage__DataFile=/home/eu/gastos/expenses.json dotnet run --project api/src/MoneyWaste.Api
```

Ou pela linha de comando: `dotnet run --project api/src/MoneyWaste.Api -- --Storage:DataFile=/home/eu/gastos/expenses.json`.

**Começar do zero:** pare a API e apague o arquivo.

```bash
rm ~/.local/share/MoneyWaste/expenses.json
```

**Avisos:**
- **Rode uma instância só** por arquivo. Com duas APIs no mesmo arquivo, a última que grava
  apaga as mudanças da outra.
- **Caminho relativo** em `Storage:DataFile` vale a partir da pasta de onde você rodou o
  comando (diretório de trabalho), não da pasta do projeto. Prefira caminho absoluto.
- O `.gitignore` só protege arquivos chamados `expenses.json` (e `expenses.json.tmp`). Se apontar
  para outro nome dentro do repositório (ex.: `dados/gastos.json`), ele pode ir para o Git.
- Se o arquivo estiver ilegível (corrompido, editado à mão com erro), a API **não sobe** e o log
  mostra "Não foi possível ler os dados dos gastos em '<caminho>'". O arquivo não é alterado:
  corrija, mova ou aponte outro local.

## 🤖 Rodando o time você mesmo

```bash
git clone https://github.com/denylsonfreitas/money-waste
cd money-waste
claude            # abra o Claude Code na pasta
> /sprint         # o time pega a próxima história do backlog
```

## 📌 Funcionalidades

- **Registrar um gasto** (MW-001) — valor, descrição, categoria e data (hoje por padrão).
- **Listar os gastos do mês atual** (MW-002) — abaixo do formulário, do mais recente para o
  mais antigo, com data, descrição, categoria e valor. Atualiza depois de cada registro.
- **Ver o total gasto no mês** (MW-003) — "Total do mês: R$ 1.234,56", entre o formulário e a
  lista. É a soma dos mesmos gastos da lista e atualiza depois de cada registro.
- **Ver o total por categoria** (MW-004) — seção "Gastos por categoria", entre o total e a
  lista: "Alimentação — R$ 58,40", da categoria que mais gastou para a que menos. Só mostra
  categorias com gasto no mês e atualiza depois de cada registro.
- **Editar e excluir um gasto** (MW-005) — cada item da lista tem "Editar" e "Excluir".
  "Editar" preenche o formulário do topo ("Editar gasto", com "Salvar alterações" e
  "Cancelar"), com as mesmas regras do registro. "Excluir" pede confirmação e apaga de vez.
  Lista, total e categorias atualizam sem recarregar a página.
- **Comparar com o mês anterior** (MW-006) — logo abaixo do "Total do mês": "Mês anterior:
  R$ 100,00" e "R$ 50,00 a mais que no mês anterior." (ou "a menos", ou "Igual ao mês
  anterior."). Compara o mês anterior inteiro; em janeiro, com dezembro. Atualiza depois de
  registrar, editar ou excluir.
- **Gastos guardados entre reinícios** (MW-007) — registros, edições e exclusões continuam lá
  depois de reiniciar a API, com o mesmo id e a mesma ordem. Veja
  [Onde ficam os dados](#-onde-ficam-os-dados).

Próximas histórias: acompanhe o [backlog](docs/backlog/BACKLOG.md).

## 🔌 Endpoints

| Método | Rota | O que faz |
|---|---|---|
| `GET` | `/api/health` | Verifica se a API está no ar |
| `GET` | `/api/expenses` | Lista os gastos do mês atual |
| `GET` | `/api/expenses/total` | Devolve o total gasto no mês atual |
| `GET` | `/api/expenses/totals-by-category` | Devolve o total de cada categoria no mês atual |
| `GET` | `/api/expenses/month-comparison` | Compara o total do mês atual com o do mês anterior |
| `POST` | `/api/expenses` | Registra um gasto |
| `PUT` | `/api/expenses/{id}` | Edita um gasto |
| `DELETE` | `/api/expenses/{id}` | Exclui um gasto |

Corpo, respostas e exemplos em [`docs/api.md`](docs/api.md).
