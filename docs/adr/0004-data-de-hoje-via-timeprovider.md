# ADR 0004 — "Hoje" vem de um `TimeProvider` injetado

**Status:** Aceita · **Data:** 2026-11-09 · **História:** MW-001

## Contexto
Quando o gasto chega sem data, a API usa a data de hoje. Os testes precisam conferir isso
sem depender do relógio real.

## Decisão
- A API recebe `TimeProvider` por injeção (`TimeProvider.System` no `Program.cs`) e calcula
  hoje com `clock.GetLocalNow()`: a **data local do servidor**.
- Os testes trocam o serviço por um `FixedTimeProvider` com data fixa.
- O front **sempre envia a data** do formulário, preenchida com a data local do navegador
  (`todayIso()` em `web/src/app/expenses/format.ts`).

## Consequências
- O teste de "sem data → hoje" é determinístico.
- Pelo app, o gasto fica com a data do fuso do usuário.
- Um cliente que omita `date` recebe a data do fuso do servidor, que pode ser outro dia
  perto da meia-noite.
