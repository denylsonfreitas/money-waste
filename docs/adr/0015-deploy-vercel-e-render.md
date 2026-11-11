# ADR 0015 — Deploy do MVP: web no Vercel, API no Render

**Status:** Aceita · **Data:** 2026-11-10 · Complementa a [ADR 0005](0005-url-da-api-no-front.md) e a [ADR 0014](0014-gastos-em-arquivo-json-local.md)

## Contexto
Com o MVP pronto e o time de férias, o stakeholder precisa testar o app pelo celular, sem
custo. A API é .NET 8, que nem o Vercel nem o Supabase executam.

## Decisão
- **Web (Angular)** no Vercel, projeto `money-waste` com raiz `web/` e `web/vercel.json`.
- **API (.NET)** no Render, plano free, em container Docker (`api/Dockerfile`), descrita em
  `render.yaml` (Blueprint).
- **Configuração por ambiente**, mantendo os padrões de desenvolvimento:
  - URL da API no front via `src/environments/` e `fileReplacements` da configuração
    `production`.
  - Origens de CORS em `Cors:AllowedOrigins`.
  - Arquivo de dados em `Storage__DataFile` e fuso `TZ=America/Bahia` no Render.
- Nova agente **DevOps (Duda)** mantém o deploy e o `docs/deploy.md`.

## Consequências
- O stakeholder testa em https://money-waste.vercel.app sem instalar nada.
- No plano free a API dorme depois de 15 minutos sem uso, e o disco é efêmero: os gastos
  somem quando o serviço reinicia, faz deploy ou dorme. A persistência da MW-007 só vale
  de verdade localmente ou com um disco pago no Render.
- O Render exige um passo manual do stakeholder (conta e Blueprint), descrito em
  `docs/deploy.md`.
- URLs de preview do Vercel não estão no CORS; só o domínio de produção fala com a API.
