# ADR 0007 — `ExpenseStore` em lista com `lock`, guardando a ordem de registro

**Status:** Aceita · **Data:** 2026-11-09 · **História:** MW-002 · **Altera:** ADR 0002 · Persistência em arquivo: [ADR 0014](0014-gastos-em-arquivo-json-local.md)

## Contexto
Na MW-002, gastos com a mesma data aparecem do registrado por último para o primeiro.
O `ConcurrentDictionary<Guid, Expense>` da ADR 0002 não guarda a ordem de inserção. O contrato
de `Expense` não tem campo de data/hora de registro, e a história não pede um.

## Decisão
O `ExpenseStore` passa a usar uma `List<Expense>` protegida por `lock`. A posição na lista é a
ordem de registro. `ListBetween(from, to)` filtra por data (inclusive) e ordena por data
decrescente e, em seguida, por posição decrescente. Nenhum campo novo no contrato.

## Consequências
- O desempate na mesma data não depende de relógio nem de campo extra.
- Leituras e escritas passam por um único `lock`. Basta para o uso atual, em memória.
- O contrato do `POST /api/expenses` não muda.
- Na MW-007, a persistência precisa guardar a ordem de registro (ex.: coluna sequencial ou
  data/hora de criação) para manter essa regra.
