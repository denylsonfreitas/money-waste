# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Mantido pelo Tech Writer (Leo).

## [Não lançado]

### Adicionado
- Estrutura inicial: API .NET 8 com `GET /api/health` e front-end Angular 20.
- Time de agentes (PO, Dev, QA, Tech Writer) e comando `/sprint`.
- CI com build e testes para API e web.
- Registrar um gasto (MW-001): `POST /api/expenses` com valor, descrição, categoria e data
  (opcional; sem data, vale hoje). Validação com mensagens em português no formato *problem details*.
- Formulário "Registrar" no front, com as 8 categorias fixas, Data preenchida com hoje,
  confirmação "Gasto registrado: <descrição> — R$ <valor>" e erros em português.
- ADRs 0002 a 0005: armazenamento em memória, contrato da API de gastos, data de hoje via
  `TimeProvider` e URL da API no front.

### Observações
- Os gastos ficam em memória e somem ao reiniciar a API (persistência é a MW-007).
