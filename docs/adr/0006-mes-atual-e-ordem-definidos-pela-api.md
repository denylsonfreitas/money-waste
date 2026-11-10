# ADR 0006 — Mês atual e ordem da lista definidos pela API

**Status:** Aceita · **Data:** 2026-11-09 · **História:** MW-002

## Contexto
A MW-002 mostra os gastos do mês atual, em ordem: data mais recente primeiro e, na mesma data,
o registrado por último primeiro. Filtro e ordem poderiam ficar na API, no front ou nos dois.
Depois de registrar um gasto, a lista precisa se atualizar sem recarregar a página.

## Decisão
- `GET /api/expenses` devolve a lista **já filtrada e ordenada**. O mês atual é calculado com o
  mesmo `TimeProvider` da ADR 0004 (`clock.GetLocalNow()`, data local do servidor): do dia 1 ao
  último dia do mês (`ListCurrentMonthExpenses.cs`).
- O front (`ExpenseList`) só exibe. Não filtra nem ordena.
- Depois de um registro bem-sucedido, o `ExpenseForm` emite `created` e a tela chama
  `list.reload()`, que busca a lista de novo na API. O item criado não é inserido localmente.
- `reload()` cancela a requisição anterior, para uma resposta antiga não sobrescrever a nova.

## Consequências
- Uma única fonte de verdade para "mês atual" e ordem. Um gasto de outro mês some da tela
  sozinho, porque a API não o devolve.
- Cada registro custa uma requisição `GET` a mais.
- Os testes de API fixam "hoje" com `FixedTimeProvider`; os do front só conferem a exibição.
- O mês vem da data do servidor e a data do formulário vem do navegador. Com fusos
  diferentes, perto da virada do mês, um gasto de "hoje" pode não aparecer na lista.
  Em uso local (mesma máquina) isso não acontece.
- Quando houver escolha de mês (fora de escopo hoje), o endpoint precisará de parâmetro.
