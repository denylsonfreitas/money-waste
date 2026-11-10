# ADR 0008 — Escala noturna, revisor com poder de merge e férias no MVP

**Status:** Aceita · **Data:** 2026-11-09 · Atualiza a [ADR 0001](0001-time-de-agentes-no-claude-code.md)

## Contexto
Nas duas primeiras histórias (MW-001 e MW-002), o processo funcionou de ponta a ponta, mas
dependia do stakeholder para cada merge e de alguém disparar cada rodada. O stakeholder quer
que o time trabalhe sozinho até o MVP, num horário fixo e sem consumir toda a cota do plano
do Claude, para então testar o MVP e repensar o processo.

## Decisão
- **Escala:** os turnos rodam por tarefa agendada das 18h à meia-noite (`America/Bahia`).
- **Cota:** no máximo 2 histórias novas por dia. Retomar trabalho pela metade não gasta cota.
- **Revisor (Rafa):** um novo agente revisa o PR inteiro depois da QA e da documentação.
  Se aprovar, ele faz o merge com squash; se reprovar, a história volta ao Dev.
- **MVP e férias:** quando MW-001 a MW-007 estiverem na `main`, o time publica as notas
  da versão `v0.1.0` e muda o status para `Férias` em `docs/team/escala.md`.

- **Um turno por vez:** uma sessão nova encerra se algum PR aberto foi atualizado há menos
  de 90 minutos, para dois turnos não trabalharem na mesma branch.
- **Datas no fuso `America/Bahia`**, inclusive para a cota, mesmo com a sessão em UTC.
- **Fonte única da cota:** PRs `feat/*` criados no dia. O PR rascunho abre logo depois do
  commit da PO, então uma história interrompida também conta.
- **Exceções:** PR travado depois de 3 reprovações do revisor recebe a label
  `precisa-stakeholder` e os turnos não mexem nele; PRs de processo e de férias (`chore/*`)
  passam só por CI e revisor.

As regras ficam em `docs/team/escala.md`, que o Scrum Master lê no início de todo turno.

## Consequências
- O stakeholder deixa de ser o gate de cada merge. O gate passa a ser CI verde, QA aprovada
  e revisor aprovado.
- Como o token do GitHub é do dono do repositório, o revisor não consegue registrar um
  `APPROVE` formal; a revisão é publicada como comentário e o merge é feito pela API.
- O ritmo do time fica previsível e limitado: no máximo 2 PRs de história por noite.
- Se o limite de uso do plano acabar no meio de uma rodada, o próximo turno retoma.
