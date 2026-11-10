# API — Money Waste

Base local: `http://localhost:5215`

## `GET /api/health`
Verifica se a API está no ar.

**200 OK**
```json
{ "status": "ok" }
```

## `POST /api/expenses`
Registra um gasto. Nesta versão os gastos ficam **em memória** (somem ao reiniciar a API).

### Corpo da requisição
| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `amount` | número | sim | Em BRL, maior que zero, no máximo 2 casas decimais. |
| `description` | texto | sim | Não pode ser vazio nem só espaços (espaços nas pontas são removidos). |
| `category` | texto | sim | Um dos códigos da tabela abaixo. |
| `date` | texto (`aaaa-mm-dd`) | não | Quando omitido, vale a data de hoje (do servidor). |

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
