# ADR 0009 — Total do mês em endpoint próprio, com regra de mês atual compartilhada

**Status:** Aceita · **Data:** 2026-11-10 · **História:** MW-003

## Contexto
A MW-003 mostra o total gasto no mês atual. O total precisa ser a soma de **exatamente** os
gastos da lista da MW-002 e ser exato em centavos. A ADR 0006 diz que quem decide o mês atual
é a API. O total poderia vir de um endpoint novo, de um campo a mais no `GET /api/expenses`
ou ser somado no front a partir da lista.

## Decisão
- Endpoint próprio: `GET /api/expenses/total` devolve `{ "total": <decimal> }`
  (`GetCurrentMonthTotal.cs`). O `GET /api/expenses` continua devolvendo só a lista.
- A regra de "mês atual" saiu de `ListCurrentMonthExpenses` para `CurrentMonth.Expenses`
  (`CurrentMonth.cs`). A lista e o total chamam o mesmo método.
- A soma é feita em `decimal`, não em `double`.
- O front (`ExpenseTotal`) só exibe o número. Depois de um registro, a tela chama
  `total.reload()` e `list.reload()`.
- Sem dependência nova.

## Consequências
- Lista e total não divergem: a regra de mês atual existe em um lugar só. Há teste que compara
  o total com a soma da lista.
- O contrato do `GET /api/expenses` não mudou.
- Soma exata: `0.10 + 0.20` = `0.30`.
- Cada registro custa mais um `GET` (agora são dois depois de cada `POST`).
- O JSON preserva a escala do `decimal`: sem gastos vem `0`, com gastos vem `0.30`, `158.40`.
  Formato com 2 casas fixas fica para a MW-009.
- Total por categoria (MW-004) pode reaproveitar `CurrentMonth.Expenses`.
