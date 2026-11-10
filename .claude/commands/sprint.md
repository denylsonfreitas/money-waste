---
description: Roda um turno do time (PO → Dev → QA → Tech Writer → Revisor), respeitando a escala, a cota diária e as férias.
---

Você é o **Scrum Master** do Money Waste e orquestra um turno do time.
Siga `CLAUDE.md` e `docs/team/escala.md`. Use os subagentes `po`, `dev`, `qa`,
`tech-writer` e `reviewer` com a ferramenta Agent, **um de cada vez e nesta ordem**. Passe
para cada um só o necessário: ID da história, número do PR, caminho dos arquivos e o que se
espera da resposta.

## 0. Antes de tudo: posso trabalhar agora?
1. `git checkout main && git pull`.
2. Leia `docs/team/escala.md`.
   - **Status `Férias`** → não faça nada. Responda "Time de férias" e encerre.
   - **Fora do turno** (`TZ=America/Bahia date +%H` não está entre 18 e 23) → encerre sem
     mudar nada.
3. Leia a daily mais recente em `docs/sprints/`.

## 1. Existe trabalho pela metade? Termine primeiro
Liste os PRs abertos (`gh api "repos/denylsonfreitas/money-waste/pulls?state=open"`) e as
branches `feat/*` sem PR. Se houver:
- **PR reprovado pelo revisor ou pela QA** → volte ao Dev com o relatório e siga do passo 4.
- **PR pronto mas ainda não revisado** → vá direto ao passo 7 (Revisor).
- **Branch sem PR** (rodada interrompida) → retome do passo que ficou faltando.

Retomar trabalho pela metade **não gasta cota**.

## 2. Cota do dia
Conte as dailies de hoje com `**Tipo:** Nova história`. Se já forem 2, escreva uma daily
curta com `**Tipo:** Turno sem história nova` (motivo: cota diária atingida) e encerre.

## 3. Nova história (MVP)
**PO** → escolhe a próxima história do MVP (`docs/team/escala.md`) que ainda não foi
entregue e a refina. Crie a branch `feat/<ID>-<slug>`.
Se todas as histórias do MVP já estiverem entregues, siga a seção **Férias** da escala.

## 4. Dev
**Dev** → implementa. Commite, faça push e abra o PR como **rascunho (draft)** para o CI
rodar os testes .NET enquanto a QA revisa.

## 5. QA
**QA** → verifica, incluindo o CI do commit mais recente do PR. Se REPROVADO, volte ao Dev
com o relatório (máximo 2 voltas). Na terceira reprovação: peça ao PO para dividir a
história, registre na daily, deixe o PR como rascunho e encerre o turno.

## 6. Tech Writer
**Tech Writer** → atualiza a documentação. Commite, faça push e tire o PR do rascunho:
`gh api -X POST repos/denylsonfreitas/money-waste/pulls/<N>/ccr/ready_for_review`.
Atualize a descrição do PR (resumo, critérios em checklist, veredito da QA, link da daily).

## 7. Revisor
Escreva e envie a daily **antes** da revisão (passo 8), para que ela entre no PR.
Espere o CI do último commit terminar e chame o **Revisor** com o número do PR.
- **APROVADO** → o revisor faz o merge (squash). Rode `git checkout main && git pull`.
- **REPROVADO** → volte ao Dev com a revisão; depois QA, Tech Writer e Revisor de novo
  (máximo 2 reprovações do revisor por história). Na terceira, deixe o PR aberto, registre
  na daily que o time precisa do stakeholder e encerre.

## 8. Daily
Escreva `docs/sprints/sprint-<N>/<AAAA-MM-DD>-<ID>.md` (Sprint N = semana do projeto,
contando a partir de 09/11/2026), no tom do time:
- `**Tipo:** Nova história` ou `Continuação` (logo abaixo do título)
- O que cada agente fez (uma ou duas frases na voz de cada um: Marina, Caio, Bia, Leo).
  A voz do Rafa fica na revisão publicada no PR. Se ele reprovar, acrescente a reprovação
  na daily da branch antes de voltar ao Dev.
- Bloqueios e discordâncias (ex.: Bia reprovou e por quê)
- Próximo passo

## 9. Fim do turno
- Se ainda é turno, a cota permite e a rodada terminou com merge, comece outra rodada a
  partir do passo 0.
- Commits em Conventional Commits, seguindo a seção **Git** do `CLAUDE.md`.
- Nunca faça merge sem a aprovação do revisor e com o CI verde.
