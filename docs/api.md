# API — Money Waste

Base local: `http://localhost:5215`

## Dados e subida da API
Desde a MW-007 os gastos ficam num arquivo JSON local (local padrão e como trocar no
[README](../README.md#-onde-ficam-os-dados); decisão na [ADR 0014](adr/0014-gastos-em-arquivo-json-local.md)).
Rotas, corpos e respostas não mudaram.

- **Na subida**, a API lê o arquivo. Sem arquivo, começa com a lista vazia.
- **Arquivo ilegível:** a API **não sobe** (nenhum endpoint responde, nem o `/api/health`). O
  log traz, em nível `Critical`:
  ```
  Não foi possível ler os dados dos gastos em '/home/eu/.local/share/MoneyWaste/expenses.json'. O arquivo não foi alterado; corrija-o, mova-o ou aponte outro local em Storage:DataFile.
  ```
  Arquivo sem permissão de leitura, caminho que é uma pasta ou `Storage:DataFile` vazio também
  impedem a subida, mas com a mensagem padrão do .NET, em inglês.
- `POST`, `PUT` e `DELETE` aceitos gravam o arquivo **antes** de responder. Se a gravação falhar
  (disco cheio, sem permissão), a resposta é **500** e nada muda. Pedidos recusados (`400`,
  `404`) não gravam.

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

## `GET /api/expenses/total`
Devolve o **total gasto no mês atual**: a soma de `amount` dos **mesmos gastos** que o
`GET /api/expenses` lista (mesma regra de mês atual, pela data do gasto, no código em
`CurrentMonth.cs`). Não há parâmetros.

A soma é feita em `decimal`, então é exata em centavos: `0.10 + 0.20` dá `0.30`, sem resíduo
de ponto flutuante.

> **Atenção:** o número não sai com 2 casas fixas. Sem gastos vem `0`; com gastos, as casas
> acompanham os valores somados (ex.: `158.40`, `0.30`). Valor sempre com 2 casas é a MW-009.

### **200 OK** (com gastos)
Gastos de R$ 45,90, R$ 12,50 e R$ 100,00 no mês atual:
```json
{"total":158.40}
```

### **200 OK** (nenhum gasto no mês)
Sem gastos no mês atual, o total é `0` (nunca `404` nem erro).
```json
{"total":0}
```

## `GET /api/expenses/totals-by-category`
Devolve o **total gasto em cada categoria no mês atual**. Usa os **mesmos gastos** do
`GET /api/expenses` e do `GET /api/expenses/total` (`CurrentMonth.Expenses`), então a soma dos
itens é igual ao total do mês. Não há parâmetros.

- Só aparecem categorias **com gasto** no mês. Nenhum item vem com `0`.
- `category` é o código da categoria (tabela em `POST /api/expenses`), não o rótulo.
- **Ordem:** maior `total` primeiro. Empate: ordem da lista fixa de categorias
  (`food`, `transport`, `housing`, `health`, `leisure`, `education`, `shopping`, `other`).
- Soma em `decimal`, exata em centavos (`0.10 + 0.20` dá `0.30`).

> **Atenção:** `total` não sai com 2 casas fixas; as casas acompanham os valores somados
> (ex.: `58.40`, mas pode vir `100` se o gasto foi criado com `"amount": 100`). Valor sempre
> com 2 casas é a MW-009.

### **200 OK** (com gastos)
Gastos no mês atual de R$ 45,90 e R$ 12,50 (`food`), R$ 100,00 (`housing`) e R$ 8,00
(`transport`):
```json
[
  { "category": "housing", "total": 100.00 },
  { "category": "food", "total": 58.40 },
  { "category": "transport", "total": 8.00 }
]
```

### **200 OK** (nenhum gasto no mês)
Sem gastos no mês atual, a resposta é uma lista vazia (nunca `404` nem erro).
```json
[]
```

## `GET /api/expenses/month-comparison`
Compara o **total do mês atual** com o **total do mês anterior** (MW-006). Não há parâmetros.

- **Mês anterior:** o mês de calendário antes do mês de hoje (do servidor), do dia 1 ao último
  dia, pela data do gasto. Em janeiro, é dezembro do ano anterior.
- `currentMonthTotal` usa os **mesmos gastos** do `GET /api/expenses/total`
  (`CurrentMonth.Expenses`), então os dois valores são sempre iguais.
- `previousMonthTotal` soma todos os gastos do mês anterior (`CurrentMonth.PreviousMonthExpenses`).
- `difference` = `currentMonthTotal` − `previousMonthTotal`. Negativo quando o mês atual gastou
  menos.
- Soma em `decimal`, exata em centavos (`0.10 + 0.20` dá `0.30`).

| Campo | Tipo | O que é |
|---|---|---|
| `currentMonthTotal` | número | Total do mês atual |
| `previousMonthTotal` | número | Total do mês anterior |
| `difference` | número | Atual − anterior (pode ser negativo) |

> **Atenção:** os números não saem com 2 casas fixas. Mês sem gasto vem `0`; com gastos, as
> casas acompanham os valores somados (ex.: `150.00`, `-40.00`). Valor sempre com 2 casas é a
> MW-009.

### **200 OK** (gastos nos dois meses)
Hoje é 15/11/2026. Gastos de R$ 100,00 e R$ 50,00 em novembro e de R$ 80,00 e R$ 20,00 em
outubro:
```json
{"currentMonthTotal":150.00,"previousMonthTotal":100.00,"difference":50.00}
```

Hoje é 10/01/2027. Um gasto de R$ 40,00 em 20/12/2026 e nenhum em janeiro:
```json
{"currentMonthTotal":0,"previousMonthTotal":40.00,"difference":-40.00}
```

### **200 OK** (nenhum gasto)
Sem gastos no mês atual nem no anterior, tudo vale `0` (nunca `404` nem erro).
```json
{"currentMonthTotal":0,"previousMonthTotal":0,"difference":0}
```

## `POST /api/expenses`
Registra um gasto. O gasto fica guardado no arquivo de dados e continua lá depois de reiniciar
a API (MW-007).

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

## `PUT /api/expenses/{id}`
Edita um gasto existente (MW-005). O corpo tem **os mesmos campos, regras e mensagens** do
`POST /api/expenses` (a validação é a mesma, em `ExpenseRequest.Validate`). Todos os campos são
substituídos; não há edição parcial.

- O `id` não muda.
- A **ordem de registro** não muda: no desempate por data do `GET /api/expenses`, o gasto
  continua na posição em que foi criado.
- Sem `date` (omitido, vazio ou só espaços), vale a **data de hoje** (do servidor), como na
  criação. Ou seja: mandar a edição sem `date` muda a data do gasto para hoje.
- Se a nova data cair em outro mês, o gasto sai do `GET /api/expenses`, do `/total` e do
  `/totals-by-category` do mês atual. Ele não é apagado. Se cair no mês anterior, passa a
  contar no `previousMonthTotal` do `/month-comparison`.
- A validação vem antes da busca: corpo inválido dá `400` mesmo que o `id` não exista.

### Exemplo de requisição
```http
PUT /api/expenses/7a257d49-3872-47b0-8662-a63d58df8a27
Content-Type: application/json

{
  "amount": 50.00,
  "description": "Almoço de domingo",
  "category": "leisure",
  "date": "2026-11-06"
}
```

### **200 OK**
O gasto já atualizado, com o mesmo `id`.
```json
{
  "id": "7a257d49-3872-47b0-8662-a63d58df8a27",
  "amount": 50.00,
  "description": "Almoço de domingo",
  "category": "leisure",
  "date": "2026-11-06"
}
```

### **400 Bad Request**
Mesmo formato e mesmas mensagens do `400` do `POST /api/expenses`. O gasto continua
**exatamente** como estava.
```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "Dados do gasto inválidos.",
  "status": 400,
  "errors": {
    "amount": ["O valor deve ter no máximo 2 casas decimais."],
    "date": ["A data é inválida. Use o formato aaaa-mm-dd."]
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

JSON malformado ou campo com tipo errado: **400 sem *problem details***, como no `POST`.

### **404 Not Found**
Corpo vazio. Nenhum gasto é criado nem alterado. Acontece quando:
- nenhum gasto tem esse `id` (inclusive um já excluído);
- o `id` não é um Guid (ex.: `/api/expenses/abc`): a rota não casa.

## `DELETE /api/expenses/{id}`
Exclui um gasto **de vez** (MW-005). Não há lixeira nem desfazer. Sem corpo na requisição.

### Exemplo de requisição
```http
DELETE /api/expenses/7a257d49-3872-47b0-8662-a63d58df8a27
```

### **204 No Content**
Gasto excluído. Corpo vazio. Ele some do `GET /api/expenses`, do `/total`, do
`/totals-by-category` e do `/month-comparison`.

### **404 Not Found**
Corpo vazio. Os outros gastos não são afetados. Acontece quando:
- nenhum gasto tem esse `id`, inclusive quando ele **já foi excluído** (excluir duas vezes dá
  `204` e depois `404`);
- o `id` não é um Guid: a rota não casa.
