# ADR 0010 — Totais por categoria em endpoint próprio, com desempate pela ordem fixa

**Status:** Aceita · **Data:** 2026-11-10 · **História:** MW-004

## Contexto
A MW-004 mostra quanto foi gasto em cada categoria no mês atual, do maior para o menor total.
A soma das categorias precisa bater com o total do mês (MW-003) e com a lista (MW-002). Em
empate, vale a ordem da lista fixa de categorias da MW-001. Até aqui, `ExpenseCategories.All`
era um `HashSet`, sem ordem. O front já repete o padrão carregando/erro/`reload()` em dois
componentes, e o revisor sugeriu avaliar extraí-lo (PR #4).

## Decisão
- Endpoint próprio: `GET /api/expenses/totals-by-category` devolve
  `[{ "category": "<código>", "total": <decimal> }]` (`GetCurrentMonthTotalsByCategory.cs`).
  O `GET /api/expenses/total` não mudou.
- O cálculo parte de `CurrentMonth.Expenses`, o mesmo método da lista e do total (ADR 0009).
  Soma em `decimal`.
- `ExpenseCategories.Ordered` guarda a lista fixa na ordem da MW-001. `All` passou a ser
  derivado dela. O desempate usa a posição em `Ordered`.
- O front (`CategoryTotals`) só exibe, na ordem recebida.
- O padrão carregando/erro/`reload()` **não** foi extraído, para manter o PR pequeno.
- Sem dependência nova.

## Consequências
- Lista, total e totais por categoria usam a mesma regra de mês atual. Há teste que compara a
  soma das categorias com o `GET /api/expenses/total`.
- A ordem das categorias existe em um lugar só na API. Mudar `Ordered` muda o desempate.
- Depois de cada registro, a tela faz três `GET` (total, categorias e lista).
- O padrão carregando/erro/`reload()` agora se repete em três componentes. Fica como candidato
  a refatoração em PR próprio.
- O `total` de cada categoria preserva a escala do `decimal` (`58.40`, `100`). Formato com 2
  casas fixas fica para a MW-009.
- Se a API devolvesse um código fora da lista, o front mostraria o código cru. Hoje é
  inalcançável: o `POST` só aceita as 8 categorias fixas.
