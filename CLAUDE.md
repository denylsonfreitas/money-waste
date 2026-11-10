# Money Waste — manual do time

Este repositório é desenvolvido por um **time Scrum de agentes de IA** rodando no Claude Code.
O humano (@denylsonfreitas) é o **stakeholder**: define a visão do produto e aprova cada merge.

## Produto
Money Waste é um app de controle de gastos pessoais. Visão completa em `docs/product-vision.md`.

## Stack
- `api/` — .NET 8, Minimal APIs, testes com xUnit + WebApplicationFactory.
- `web/` — Angular 20 (standalone components, signals), testes com Jasmine/Karma.

## O time
| Agente | Arquivo | Responsabilidade |
|---|---|---|
| Scrum Master (sessão principal) | `.claude/commands/sprint.md` | Orquestra a rodada, escreve a daily |
| PO | `.claude/agents/po.md` | Backlog, histórias, critérios de aceite |
| Dev | `.claude/agents/dev.md` | Implementa a história com testes |
| QA | `.claude/agents/qa.md` | Verifica critérios de aceite, aprova ou reprova |
| Tech Writer | `.claude/agents/tech-writer.md` | README, CHANGELOG, ADRs, relatório da sprint |

Os agentes se comunicam **só por artefatos no repositório**: backlog, arquivos de história,
relatório do QA, daily. Nada de contexto "por fora" — se não está escrito, não aconteceu.

## Fluxo de uma rodada (`/sprint`)
1. **PO** escolhe a próxima história de `docs/backlog/BACKLOG.md` (ou refina uma nova).
2. **Dev** cria a branch `feat/<id>-<slug>`, implementa e escreve testes.
3. **QA** roda `scripts/check.sh`, confere cada critério de aceite e escreve o relatório.
   Se reprovar, o Dev corrige (no máximo 2 voltas; depois a história volta para o PO).
4. **Tech Writer** atualiza a documentação.
5. **Scrum Master** escreve a daily em `docs/sprints/`, faz commit e abre o PR.
6. **Stakeholder humano revisa e faz o merge.** Nenhum agente faz merge na `main`.

## Regras
- Uma história por rodada. Pequena o bastante para um PR revisável no celular.
- Commits no padrão Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- Todo comportamento novo vem com teste.
- Código e identificadores em inglês; documentação e mensagens para o usuário em português.
- `scripts/check.sh` precisa passar antes de abrir o PR.
