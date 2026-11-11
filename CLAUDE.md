# Money Waste — manual do time

Este repositório é desenvolvido por um **time Scrum de agentes de IA** rodando no Claude Code.
O humano (@denylsonfreitas) é o **stakeholder**: define a visão do produto e a escala do time,
e testa o MVP quando o time entra de férias.

## Produto
Money Waste é um app de controle de gastos pessoais. Visão completa em `docs/product-vision.md`.

## Stack
- `api/` — .NET 8, Minimal APIs, testes com xUnit + WebApplicationFactory.
- `web/` — Angular 20 (standalone components, signals), testes com Jasmine/Karma.

## O time
| Agente | Arquivo | Responsabilidade |
|---|---|---|
| Scrum Master (sessão principal) | `.claude/commands/sprint.md` | Orquestra o turno, escreve a daily |
| PO — Marina | `.claude/agents/po.md` | Backlog, histórias, critérios de aceite |
| Dev — Caio | `.claude/agents/dev.md` | Implementa a história com testes |
| QA — Bia | `.claude/agents/qa.md` | Verifica critérios de aceite, aprova ou reprova |
| Tech Writer — Leo | `.claude/agents/tech-writer.md` | README, CHANGELOG, ADRs, docs da API |
| Revisor — Rafa | `.claude/agents/reviewer.md` | Revisa o PR, aprova e faz o merge, ou reprova |
| DevOps — Duda | `.claude/agents/devops.md` | Deploy (Vercel + Render) e pipeline; ver `docs/deploy.md` |

Os agentes se comunicam **só por artefatos no repositório**: backlog, arquivos de história,
relatório do QA, daily, revisão no PR. Nada de contexto "por fora" — se não está escrito,
não aconteceu.

Se os tipos de subagente `po`, `dev` etc. não estiverem disponíveis na sessão, use o agente
`general-purpose` e mande-o ler e assumir o arquivo da persona em `.claude/agents/`.

## Escala
Turno das 18h à meia-noite (`America/Bahia`), sem limite fixo de histórias (uma por vez, até
acabar o turno ou o limite de uso do plano), até o MVP
(MW-001 a MW-007) ficar pronto. Depois, férias. Detalhes em **`docs/team/escala.md`**.

## Fluxo de um turno (`/sprint`)
1. **Scrum Master** confere escala, férias, trava de turno e trabalho pela metade.
2. **PO** escolhe a próxima história do MVP e a refina. O Scrum Master cria a branch
   `feat/<id>-<slug>` e abre o PR rascunho na hora.
3. **Dev** implementa e escreve testes.
4. **QA** roda `scripts/check.sh`, confere o CI e cada critério de aceite, e escreve o relatório.
   Se reprovar, o Dev corrige (no máximo 2 voltas; depois a história volta para o PO).
5. **Tech Writer** atualiza a documentação.
6. **Scrum Master** escreve a daily e tira o PR do rascunho.
7. **Revisor** revisa o PR inteiro. Se aprovar, faz o merge (squash). Se reprovar, volta ao Dev.

## Regras
- Uma história por rodada. Pequena o bastante para um PR revisável no celular.
- Todo comportamento novo vem com teste.
- Código e identificadores em inglês; documentação e mensagens para o usuário em português.
- `scripts/check.sh` precisa passar antes de abrir o PR.
- Só o revisor faz merge, e só com o CI verde e a QA aprovada. Exceção: PRs de processo ou
  de férias (`chore/*`) não têm QA; o gate é CI verde + revisor.

## Git
- Commits no padrão Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- Autor dos commits: o stakeholder. Committer: Claude. Configure assim antes de commitar:
  ```bash
  git config user.name "Claude" && git config user.email "noreply@anthropic.com"
  git commit --author="Denylson Freitas <denylsonfeitosa@gmail.com>" -m "..."
  ```
- **Sem assinatura do Claude** em commits e PRs: nada de `Co-Authored-By`, "Generated with
  Claude Code" ou links de sessão (`claude.ai/code/...`). Só o nome do stakeholder.
- Não reescreva histórico já enviado (sem force push).

## Ambiente
- O ambiente das sessões **não acessa o nuget.org**: `dotnet test` não roda localmente; os
  testes .NET rodam no CI do PR. O `scripts/check.sh` já trata isso.
- Para subir a API localmente depois do `check.sh`:
  `dotnet run --project api/src/MoneyWaste.Api --no-restore --no-build --urls http://localhost:5215`.
- GitHub: use a API REST (`gh api repos/denylsonfreitas/money-waste/...`). GraphQL não
  funciona. Para tirar um PR do rascunho: `POST .../pulls/<N>/ccr/ready_for_review`.
