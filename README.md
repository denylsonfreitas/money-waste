# 💸 Money Waste

**Controle de gastos desenvolvido por um time Scrum autônomo de agentes de IA.**

Este repositório é um experimento: um time de quatro agentes no [Claude Code](https://claude.com/claude-code)
planeja, implementa, testa e documenta o produto sozinho. O humano entra como **stakeholder**:
define a visão e aprova cada pull request antes do merge.

## 👥 O time

| | Agente | Papel |
|---|---|---|
| 🧭 | **Marina** — PO | Mantém o backlog e escreve histórias com critérios de aceite |
| 🛠️ | **Caio** — Dev | Implementa em .NET + Angular, sempre com testes |
| 🔍 | **Bia** — QA | Confere cada critério com evidências e reprova sem dó |
| ✍️ | **Leo** — Tech Writer | Mantém README, CHANGELOG, ADRs e docs da API |

As personas e regras de cada um estão em [`.claude/agents/`](.claude/agents).

## 🔄 Como o time trabalha

```
Backlog ─▶ PO ─▶ Dev ─▶ QA ──aprovado──▶ Tech Writer ─▶ PR ─▶ 👤 merge humano
                   ▲       │
                   └─reprovado (máx. 2x)
```

Uma rodada é disparada pelo comando `/sprint` ([`.claude/commands/sprint.md`](.claude/commands/sprint.md)),
manualmente ou por uma tarefa agendada. Cada rodada entrega **uma história** em um PR.
Os agentes só conversam por artefatos no repositório, então todo o processo fica rastreável:

- [`docs/backlog/`](docs/backlog) — backlog e histórias
- [`docs/sprints/`](docs/sprints) — dailies do time e relatórios do QA
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

Ainda nenhuma — o time está começando. Acompanhe o [backlog](docs/backlog/BACKLOG.md).
