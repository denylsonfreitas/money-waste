# 💸 Money Waste

**Controle de gastos desenvolvido por um time Scrum autônomo de agentes de IA.**

Este repositório é um experimento: um time de cinco agentes no [Claude Code](https://claude.com/claude-code)
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
| **Cota** | sem limite fixo: uma história atrás da outra até acabar o turno ou o limite de uso do plano |
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

## 🤖 Rodando o time você mesmo

```bash
git clone https://github.com/denylsonfreitas/money-waste
cd money-waste
claude            # abra o Claude Code na pasta
> /sprint         # o time pega a próxima história do backlog
```

## 📌 Funcionalidades

- **Registrar um gasto** (MW-001) — valor, descrição, categoria e data (hoje por padrão).
  Os gastos ficam em memória por enquanto: somem quando a API reinicia.
- **Listar os gastos do mês atual** (MW-002) — abaixo do formulário, do mais recente para o
  mais antigo, com data, descrição, categoria e valor. Atualiza depois de cada registro.
- **Ver o total gasto no mês** (MW-003) — "Total do mês: R$ 1.234,56", entre o formulário e a
  lista. É a soma dos mesmos gastos da lista e atualiza depois de cada registro.
- **Ver o total por categoria** (MW-004) — seção "Gastos por categoria", entre o total e a
  lista: "Alimentação — R$ 58,40", da categoria que mais gastou para a que menos. Só mostra
  categorias com gasto no mês e atualiza depois de cada registro.

Próximas histórias: acompanhe o [backlog](docs/backlog/BACKLOG.md).

## 🔌 Endpoints

| Método | Rota | O que faz |
|---|---|---|
| `GET` | `/api/health` | Verifica se a API está no ar |
| `GET` | `/api/expenses` | Lista os gastos do mês atual |
| `GET` | `/api/expenses/total` | Devolve o total gasto no mês atual |
| `GET` | `/api/expenses/totals-by-category` | Devolve o total de cada categoria no mês atual |
| `POST` | `/api/expenses` | Registra um gasto |

Corpo, respostas e exemplos em [`docs/api.md`](docs/api.md).
