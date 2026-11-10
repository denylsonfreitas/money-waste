# ADR 0005 — URL base da API no token `API_BASE_URL`

**Status:** Aceita · **Data:** 2026-11-09 · **História:** MW-001

## Contexto
O front passa a chamar a API. A URL não pode ficar espalhada pelos serviços.

## Decisão
A URL base fica no `InjectionToken` `API_BASE_URL` (`web/src/app/api.config.ts`), com padrão
`http://localhost:5215`. Os serviços (hoje, `ExpenseService`) injetam o token e montam as rotas.

## Consequências
- Um único lugar para mudar a URL.
- Os testes podem fornecer outro valor para o token.
- Ainda não há configuração por ambiente: para apontar para outra API, é preciso mudar o
  padrão ou prover o token no `app.config.ts`.
