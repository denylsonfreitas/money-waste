# Escala do time — Money Waste

Regras de trabalho definidas pelo stakeholder (@denylsonfreitas). O Scrum Master lê este
arquivo no início de **todo** turno, antes de qualquer outra coisa.

## Status do time
**Status: Férias**

Valores possíveis: `Trabalhando` ou `Férias`. Em `Férias`, nenhuma rodada começa.

## Fuso e "hoje"
Todas as datas e horas do time são de `America/Bahia` (UTC-3, sem horário de verão), mesmo
que a sessão rode em UTC. "Hoje" é sempre `TZ=America/Bahia date +%F`, calculado no início
do turno. A data no nome da daily usa esse mesmo valor.

## Horário
- O turno vai das **18:00 às 23:59** (`America/Bahia`).
- A tarefa agendada dispara três vezes por noite (por volta de 18h, 20h e 22h).
- Uma rodada que já começou dentro do turno pode terminar depois da meia-noite. Uma rodada
  nova só começa dentro do turno.

## Um turno por vez (trava)
Antes de fazer qualquer coisa, o Scrum Master verifica se outro turno ainda está rodando.
Como todo trabalho vive num PR aberto desde o primeiro commit (o PR rascunho abre logo
depois da PO), considera-se que **há um turno ativo** se algum PR aberto foi atualizado há
menos de **90 minutos** (push, comentário, revisão ou label atualizam o PR). PRs com a
label `precisa-stakeholder` não contam, porque estão parados esperando o stakeholder:

Também conta como turno ativo o **intervalo entre uma história e a próxima** (ADR 0011):
um PR de história (`feat/*`) fechado ou mergeado há menos de 90 minutos, ou um PR que
recebeu a label `precisa-stakeholder` há menos de 90 minutos. Nesses momentos não há PR
aberto, mas o turno que acabou de fechar a história já está indo para a próxima.

```bash
# 1. PR aberto atualizado há menos de 90 min
gh api "repos/denylsonfreitas/money-waste/pulls?state=open" \
  --jq '.[] | select(any(.labels[]; .name == "precisa-stakeholder") | not)
             | select((now - (.updated_at | fromdate)) < 5400) | .number'
# 2. PR de história fechado ou mergeado há menos de 90 min
gh api "repos/denylsonfreitas/money-waste/pulls?state=closed&sort=updated&direction=desc&per_page=20" \
  --jq '.[] | select(.head.ref | startswith("feat/"))
             | select((now - (.closed_at | fromdate)) < 5400) | .number'
# 3. Label precisa-stakeholder aplicada há menos de 90 min
gh api "repos/denylsonfreitas/money-waste/issues/events?per_page=50" \
  --jq '.[] | select(.event == "labeled" and .label.name == "precisa-stakeholder")
             | select((now - (.created_at | fromdate)) < 5400) | .issue.number'
```

Se algum dos comandos imprimir algo, encerre o turno sem mudar nada. A trava vale só no início de
uma sessão: o turno que já está trabalhando não se trava com os próprios commits.

## Ritmo
- **Sem limite fixo de histórias por dia** (decisão do stakeholder em 10/11/2026, ADR 0011). O time
  emenda uma história na outra enquanto for horário de turno. O limite real é o **limite de
  uso do plano do Claude**: quando ele acaba, a sessão para.
- Continua valendo **uma história por vez**: a próxima só começa depois que a anterior foi
  mergeada (ou fechada, ou marcada com `precisa-stakeholder`).
- O PR rascunho continua sendo aberto **logo depois do commit da PO**. É ele que faz a trava
  funcionar e que deixa o trabalho visível se a sessão parar no meio.
- Se a sessão parar no meio de uma rodada (limite de uso do plano, erro, timeout), depois
  que a trava de 90 minutos expira o próximo turno retoma de onde parou.

Para saber quantas histórias o time começou num dia (usado só na daily e nas férias):

```bash
HOJE=$(TZ=America/Bahia date +%F)
gh api "repos/denylsonfreitas/money-waste/pulls?state=all&per_page=100" \
  --jq "[.[] | select(.head.ref | startswith(\"feat/\"))
             | select((.created_at | fromdate) - 10800 | strftime(\"%Y-%m-%d\") == \"$HOJE\")]
        | length"
```

## Escopo do MVP
O MVP está pronto quando estas histórias estiverem **Entregues** (mergeadas na `main`):

| ID | História |
|---|---|
| MW-001 | Registrar um gasto |
| MW-002 | Listar os gastos do mês atual |
| MW-003 | Ver o total gasto no mês |
| MW-004 | Ver o total por categoria |
| MW-005 | Editar e excluir um gasto |
| MW-006 | Comparar o mês atual com o anterior |
| MW-007 | Persistir os gastos entre reinícios da API |

- Histórias fora dessa lista (como MW-008 e MW-009) ficam para depois do MVP.
- A PO pode reordenar as histórias do MVP entre si, mas não adiciona nem remove histórias.
- **Divisão:** se uma história do MVP for dividida (depois da 3ª reprovação da QA), as partes
  (`MW-00Xa`, `MW-00Xb`...) a substituem no MVP. A PO atualiza esta tabela.

## Quando o time precisa do stakeholder
Um PR com a label **`precisa-stakeholder`** está parado esperando o stakeholder. Os turnos
não mexem nele: seguem com a próxima história do MVP que não dependa dele. Se todas as
histórias restantes dependerem dele, o turno encerra.

## Férias
Quando a última história do MVP for mergeada, o Scrum Master abre a branch
`chore/ferias-mvp` a partir da `main` e:
1. Pede à PO que marque a última história como **Entregue** no backlog.
2. Pede ao Tech Writer as notas de versão `v0.1.0` (MVP) no `CHANGELOG.md` e uma seção
   "Como testar o MVP" no `README.md`.
3. Escreve `docs/sprints/ferias.md`: o que foi entregue, números do projeto (histórias,
   PRs, reprovações da QA e do revisor) e o que o time sugere melhorar no processo.
4. Muda o **Status** acima para `Férias`.
5. Abre o PR; o revisor revisa e faz o merge (regra de PR de processo, no `CLAUDE.md`).

A partir daí os turnos só confirmam que o time está de férias e encerram. Quem tira o time
de férias é o stakeholder. Recomendação: pausar a tarefa agendada durante as férias.
