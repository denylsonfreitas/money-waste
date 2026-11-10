# Escala do time — Money Waste

Regras de trabalho definidas pelo stakeholder (@denylsonfreitas). O Scrum Master lê este
arquivo no início de **todo** turno, antes de qualquer outra coisa.

## Status do time
**Status: Trabalhando**

Valores possíveis: `Trabalhando` ou `Férias`. Em `Férias`, nenhuma rodada começa.

## Horário
- O turno vai das **18:00 às 23:59**, no horário de Brasília/Bahia (`America/Bahia`, UTC-3).
- A tarefa agendada dispara três vezes por noite (por volta de 18h, 20h e 22h).
- Uma rodada que já começou dentro do turno pode terminar depois da meia-noite. Uma rodada
  nova só começa dentro do turno.

## Cota diária
- **No máximo 2 histórias iniciadas por dia.** Conta como iniciada toda história cuja branch
  `feat/<ID>-...` foi criada naquele dia; corrigir um PR reprovado não gasta cota.
- Para contar, o Scrum Master vê as dailies do dia em `docs/sprints/` cujo campo
  `**Tipo:**` é `Nova história`.
- Se o limite de uso do plano do Claude acabar no meio de uma rodada, a sessão para. O
  próximo turno encontra a branch ou o PR pela metade e continua de onde parou.

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

Histórias fora dessa lista (como MW-008 e MW-009) ficam para depois do MVP. A PO pode
reordenar as histórias do MVP entre si, mas não adiciona nem remove histórias da lista.

## Férias
Quando a última história do MVP for mergeada, o Scrum Master:
1. Pede ao Tech Writer as notas de versão `v0.1.0` (MVP) no `CHANGELOG.md` e uma seção
   "Como testar o MVP" no `README.md`.
2. Escreve `docs/sprints/ferias.md`: o que foi entregue, números do projeto (histórias,
   PRs, reprovações da QA e do revisor) e o que o time sugere melhorar no processo.
3. Muda o **Status** acima para `Férias`.
4. Abre o PR dessas mudanças; o revisor revisa e faz o merge.

A partir daí os turnos só confirmam que o time está de férias e encerram. Quem tira o time
de férias é o stakeholder.
