# MW-001 — Registrar um gasto

**Status:** Entregue
**Sprint:** 1
**Prioridade:** 1

## História
**Como** pessoa que recebe salário e quer entender para onde o dinheiro vai,
**quero** registrar um gasto informando valor, descrição, categoria e data,
**para** começar a ter o histórico dos meus gastos sem depender de planilha.

## Regras de produto
- **Valor:** obrigatório, em BRL, maior que zero, no máximo 2 casas decimais.
- **Descrição:** obrigatória; texto só com espaços conta como vazio.
- **Categoria:** obrigatória, de uma lista fixa (abaixo). Qualquer outro valor é inválido.
- **Data:** opcional; quando não informada, vale a data de hoje.

### Categorias (lista fixa desta história)
| Rótulo exibido ao usuário |
|---|
| Alimentação |
| Transporte |
| Moradia |
| Saúde |
| Lazer |
| Educação |
| Compras |
| Outros |

O Dev decide como cada categoria é representada no código e no contrato da API
(identificadores em inglês, conforme o CLAUDE.md). O usuário sempre vê os rótulos acima.

## Critérios de aceite

### API (criação de gasto)
1. **Dado** um gasto válido (valor 45,90, descrição "Almoço", categoria Alimentação, data 05/11/2026),
   **quando** ele é enviado ao endpoint de criação,
   **então** a API responde **201 Created** e devolve o gasto criado com um identificador único,
   o mesmo valor, descrição, categoria e data enviados.
2. **Dado** um gasto válido sem data,
   **quando** ele é enviado ao endpoint de criação,
   **então** a API responde 201 e o gasto devolvido tem a data de hoje.
3. **Dado** um gasto com valor 0 ou negativo,
   **quando** ele é enviado,
   **então** a API responde **400 Bad Request** com mensagem em português indicando que o valor deve ser maior que zero, e nada é criado.
4. **Dado** um gasto com valor com mais de 2 casas decimais (ex.: 10,999),
   **quando** ele é enviado,
   **então** a API responde 400 com mensagem em português sobre o valor, e nada é criado.
5. **Dado** um gasto sem descrição, com descrição vazia ou só com espaços,
   **quando** ele é enviado,
   **então** a API responde 400 com mensagem em português indicando que a descrição é obrigatória.
6. **Dado** um gasto sem categoria ou com uma categoria fora da lista fixa,
   **quando** ele é enviado,
   **então** a API responde 400 com mensagem em português indicando que a categoria é inválida.
7. **Dado** dois gastos válidos enviados em sequência,
   **quando** ambos são criados,
   **então** cada um recebe um identificador diferente.
8. **Dado** que um gasto foi criado,
   **quando** consulto a documentação em `docs/api.md`,
   **então** o endpoint de criação está descrito com exemplo de requisição, resposta 201 e resposta 400.

### Front (formulário)
9. **Dado** que abro o app,
   **quando** a tela carrega,
   **então** vejo um formulário com os campos Valor, Descrição, Categoria (lista com as 8 categorias acima) e Data,
   e o campo Data já vem preenchido com a data de hoje.
10. **Dado** o formulário preenchido com dados válidos,
    **quando** clico em "Registrar",
    **então** o gasto é enviado à API e vejo a confirmação
    "Gasto registrado: <descrição> — R$ <valor>" (valor no formato brasileiro, ex.: "R$ 45,90"),
    e o formulário é limpo, com a Data voltando para hoje.
11. **Dado** o formulário com valor vazio, zero ou negativo, ou descrição vazia, ou sem categoria,
    **quando** tento registrar,
    **então** vejo a mensagem de erro em português no campo correspondente e nada é enviado à API.
12. **Dado** que a API responde com erro (400 ou falha de conexão),
    **quando** tento registrar,
    **então** vejo uma mensagem de erro em português e os dados digitados continuam no formulário.

## Fora de escopo
- **Persistência real** entre reinícios da API — é a **MW-007**. Nesta história, guardar em memória é aceitável.
- **Listagem** dos gastos — é a **MW-002**. (O endpoint de criação devolve o gasto criado, mas não há endpoint nem tela de listagem.)
- Totais, total por categoria e comparação entre meses (MW-003, MW-004, MW-006).
- Editar e excluir gasto (MW-005).
- Categorias personalizadas ou cadastráveis pelo usuário.
- Regras sobre datas futuras ou muito antigas (qualquer data válida é aceita).
- Login, múltiplos usuários, outras moedas.

## Notas de produto
- Valores sempre em BRL, exibidos com 2 casas decimais e vírgula (ex.: R$ 1.234,56).
- Datas exibidas no formato brasileiro (dd/mm/aaaa).
- Mensagens ao usuário em português.
- Poucos campos e bons padrões: registrar tem que ser mais rápido que esquecer.

## Decisões do Dev
- Persistência em memória (`ExpenseStore` singleton com `ConcurrentDictionary`) até a MW-007; nenhuma dependência nova.
- Categorias no contrato da API como códigos em inglês minúsculos (`food`, `transport`, `housing`, `health`, `leisure`, `education`, `shopping`, `other`); rótulos em português só no front.
- Erros de validação da API no formato *problem details* (`Results.ValidationProblem`), com mensagens em português por campo em `errors`.
- "Hoje" na API vem de `TimeProvider` injetado (data local do servidor), para os testes fixarem o relógio; o front envia sempre a data do formulário (data local do navegador).
- URL base da API no front centralizada no token `API_BASE_URL` (`web/src/app/api.config.ts`).
