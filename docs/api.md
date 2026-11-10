# API — Money Waste

Base local: `http://localhost:5215`

## `GET /api/health`
Verifica se a API está no ar.

**200 OK**
```json
{ "status": "ok" }
```

## `GET /api/expenses`
Lista os gastos do **mês atual**: do dia 1 ao último dia do mês da data de hoje (do servidor).
O que conta é a **data do gasto** (`date`), não o momento em que ele foi registrado. Gastos de
outros meses não aparecem. Não há parâmetros nem paginação.

**Ordem:** data mais recente primeiro. Gastos com a mesma data vêm do registrado por último
para o registrado primeiro.

Cada item tem o mesmo formato da resposta `201` do `POST /api/expenses`.

> **Atenção:** `amount` não sai com 2 casas fixas: um gasto criado com `"amount": 5` volta
> como `5`, não `5.00` (igual ao `POST`). Valor sempre com 2 casas é a MW-009.

### **200 OK** (com gastos)
```json
[
  {
    "id": "c1d7e0b2-5f4a-4c39-9a51-2b8e6f0d3a17",
    "amount": 12.50,
    "description": "Ônibus",
    "category": "transport",
    "date": "2026-11-10"
  },
  {
    "id": "7a257d49-3872-47b0-8662-a63d58df8a27",
    "amount": 45.90,
    "description": "Almoço",
    "category": "food",
    "date": "2026-11-05"
  }
]
```

### **200 OK** (nenhum gasto no mês)
Sem gastos no mês atual, a resposta é uma lista vazia (nunca `404`).
```json
[]
```

## `POST /api/expenses`
Registra um gasto. Nesta versão os gastos ficam **em memória** (somem ao reiniciar a API).

### Corpo da requisição
| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `amount` | número | sim | Em BRL, maior que zero, no máximo 2 casas decimais. |
| `description` | texto | sim | Não pode ser vazio nem só espaços (espaços nas pontas são removidos). |
| `category` | texto | sim | Um dos códigos da tabela abaixo. |
| `date` | texto (`aaaa-mm-dd`) | não | Quando omitido, vazio ou só espaços, vale a data de hoje (do servidor). |

| Código (`category`) | Rótulo exibido |
|---|---|
| `food` | Alimentação |
| `transport` | Transporte |
| `housing` | Moradia |
| `health` | Saúde |
| `leisure` | Lazer |
| `education` | Educação |
| `shopping` | Compras |
| `other` | Outros |

### Exemplo de requisição
```http
POST /api/expenses
Content-Type: application/json

{
  "amount": 45.90,
  "description": "Almoço",
  "category": "food",
  "date": "2026-11-05"
}
```

### **201 Created**
Cabeçalho `Location: /api/expenses/{id}`.
```json
{
  "id": "7a257d49-3872-47b0-8662-a63d58df8a27",
  "amount": 45.90,
  "description": "Almoço",
  "category": "food",
  "date": "2026-11-05"
}
```

### **400 Bad Request**
Formato *problem details* (RFC 9110). `errors` traz, por campo, as mensagens em português.
Nada é criado.
```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "Dados do gasto inválidos.",
  "status": 400,
  "errors": {
    "amount": ["O valor deve ser maior que zero."],
    "description": ["A descrição é obrigatória."],
    "category": ["A categoria é inválida."]
  }
}
```

Mensagens possíveis:
| Campo | Mensagem |
|---|---|
| `amount` | `O valor deve ser maior que zero.` (ausente, zero ou negativo) |
| `amount` | `O valor deve ter no máximo 2 casas decimais.` |
| `description` | `A descrição é obrigatória.` |
| `category` | `A categoria é inválida.` (ausente ou fora da lista) |
| `date` | `A data é inválida. Use o formato aaaa-mm-dd.` |

> **Atenção:** se o corpo não for um JSON válido ou um campo vier com tipo errado
> (ex.: `"amount": "abc"`), a API responde **400 sem *problem details*** (corpo vazio em
> Production). Isso acontece antes da validação acima.
