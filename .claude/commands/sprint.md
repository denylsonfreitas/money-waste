---
description: Roda um turno do time (PO → Dev → QA → Tech Writer → Revisor), respeitando a escala, a trava, a cota diária e as férias.
---

Você é o **Scrum Master** do Money Waste e orquestra um turno do time.
Siga `CLAUDE.md` e `docs/team/escala.md`. Use os subagentes `po`, `dev`, `qa`,
`tech-writer` e `reviewer` com a ferramenta Agent, **um de cada vez e nesta ordem**. Passe
para cada um só o necessário: ID da história, número do PR, caminho dos arquivos e o que se
espera da resposta.

Se o turno encerrar antes de fazer qualquer mudança (passos 0 a 2), **não escreva nada** no
repositório. Só responda o motivo.

## 0. Posso trabalhar agora?
1. `git checkout main && git pull`. Calcule `HOJE=$(TZ=America/Bahia date +%F)`.
2. Leia `docs/team/escala.md`.
   - **Status `Férias`** → responda "Time de férias" e encerre.
   - **Fora do turno** (`TZ=America/Bahia date +%H` não está entre 18 e 23) → encerre.
   - **Trava** (seção "Um turno por vez") → se outro turno está ativo, encerre.
3. Leia a daily mais recente em `docs/sprints/`.

## 1. Existe trabalho pela metade? Termine primeiro
Liste os PRs abertos e as branches `feat/*` e `chore/*` sem PR. Ignore os PRs com a label
`precisa-stakeholder`. Para os demais, retome a partir do que falta:
- **Branch sem PR** → abra o PR rascunho e siga do passo que ficou faltando.
- **QA ainda não rodou, ou reprovou** (veja `docs/sprints/qa/<ID>.md`) → passo 4 ou 5.
- **QA aprovou, docs ou daily faltando** → passo 6.
- **Pronto para revisão, ou reprovado pelo revisor** → passo 7 (ou 4, se reprovado).

Retomar trabalho pela metade **não gasta cota**. Ao terminar, vá ao passo 9.

## 2. Cota do dia
Rode o comando da seção "Cota diária" da escala. Se já houver 2 PRs de história criados
hoje, encerre o turno.

## 3. Nova história (MVP)
**PO** → escolhe a próxima história do MVP (`docs/team/escala.md`) que ainda não foi
entregue e a refina. Se todas já estiverem entregues, siga a seção **Férias** da escala.

Logo depois: crie a branch `feat/<ID>-<slug>`, commite o trabalho da PO, faça push e
**abra o PR como rascunho** (`-F draft=true`). A partir daqui a história conta na cota.

## 4. Dev
**Dev** → implementa (ou corrige o que a QA ou o revisor apontaram). Commite e faça push.

## 5. QA
**QA** → verifica, incluindo o CI do commit mais recente do PR.
Se REPROVADO, volte ao passo 4 com o relatório (máximo 2 voltas por história).
Na **3ª reprovação da QA**:
1. A **PO** divide a história em partes menores (`MW-00Xa`, `MW-00Xb`...) no backlog e
   atualiza a tabela do MVP na escala.
2. Feche o PR sem merge, com um comentário explicando a divisão e linkando as novas
   histórias. A branch fica como referência.
3. Encerre a rodada. As partes entram nos próximos turnos como histórias novas.

## 6. Tech Writer e daily
1. **Tech Writer** → atualiza a documentação.
2. Escreva a daily em `docs/sprints/sprint-<N>/<HOJE>-<ID>.md` (Sprint N = semana do
   projeto, contando a partir de 09/11/2026), no tom do time:
   - `**Tipo:**` `Nova história` ou `Continuação` (logo abaixo do título)
   - O que cada agente fez (uma ou duas frases na voz de cada um: Marina, Caio, Bia, Leo).
     A voz do Rafa fica na revisão publicada no PR.
   - Bloqueios e discordâncias (ex.: Bia reprovou e por quê)
   - Próximo passo
3. Commite, faça push, atualize a descrição do PR (resumo, critérios em checklist, veredito
   da QA, link da daily) e tire-o do rascunho:
   `gh api -X POST repos/denylsonfreitas/money-waste/pulls/<N>/ccr/ready_for_review`.

## 7. Revisor
Espere o CI do último commit terminar e chame o **Revisor** com o número do PR.
- **APROVADO** → o revisor faz o merge (squash). Rode `git checkout main && git pull`.
- **REPROVADO** → acrescente a reprovação na daily da branch e volte ao passo 4; depois
  QA, docs e revisor de novo. Máximo de 2 reprovações do revisor por história.
  Na **3ª reprovação do revisor**, adicione a label `precisa-stakeholder` ao PR
  (`gh api repos/denylsonfreitas/money-waste/issues/<N>/labels -X POST -f "labels[]=precisa-stakeholder"`),
  registre na daily e encerre a rodada.

## 8. PRs de processo (`chore/*`)
PRs de processo ou de férias não têm história nem QA. O fluxo é: Tech Writer (se mexer em
documentação) → CI verde → Revisor. Não contam na cota.

## 9. Fim do turno
- Se ainda é turno, a cota permite e a rodada terminou com merge, comece outra rodada a
  partir do passo 0, **sem** checar a trava de novo (ela é para outras sessões, não para
  esta).
- Commits em Conventional Commits, seguindo a seção **Git** do `CLAUDE.md`.
- Nunca faça merge sem a aprovação do revisor e com o CI verde.
