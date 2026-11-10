# ADR 0002 — Gastos em memória até a MW-007

**Status:** Aceita, estrutura do store alterada pela [ADR 0007](0007-store-em-lista-com-ordem-de-registro.md) · **Data:** 2026-11-09 · **História:** MW-001

## Contexto
A MW-001 precisa criar gastos, mas persistência real entre reinícios é a MW-007.
A história aceita guardar em memória.

## Decisão
Os gastos ficam no `ExpenseStore` (`api/src/MoneyWaste.Api/Features/Expenses/ExpenseStore.cs`),
registrado como **singleton**, com um `ConcurrentDictionary<Guid, Expense>`. O id é um
`Guid.NewGuid()`. Nenhuma dependência nova (sem banco, sem ORM).

## Consequências
- Os gastos **somem ao reiniciar a API**.
- Requisições simultâneas são seguras: o dicionário é thread-safe.
- Os testes de integração conferem "nada foi criado" pelo `Count` do store.
- A MW-007 troca o store por persistência real; os endpoints dependem só do `ExpenseStore`.
