# MW-007 — Persistir os gastos entre reinícios da API

**Status:** Entregue (PR #9, commit `2403c48`)
**Sprint:** 1
**Prioridade:** 7 (última do MVP)

## História
**Como** pessoa que registra os gastos do mês para entender para onde o dinheiro vai,
**quero** que os gastos que registrei continuem lá depois que a API for desligada e ligada de novo,
**para** não perder o histórico do mês (nem o do mês anterior, que a comparação usa) e poder
confiar no app no dia a dia.

## Regras de produto
- Tudo o que a API aceita (registro, edição, exclusão) continua valendo depois de reiniciar a
  API: os mesmos gastos, com o mesmo **id**, valor, descrição, categoria e data.
- O que a API recusa (400, 404) **não** muda os dados guardados.
- A **ordem de registro** é guardada (ADR 0007): depois de reiniciar, gastos da mesma data
  continuam aparecendo do registrado por último para o primeiro, e um gasto editado mantém a
  posição de registro.
- Os valores voltam **exatos em centavos** (BRL, sem resíduo de ponto flutuante).
- Os dados ficam **na máquina do usuário**, num arquivo/banco local. Nada de serviço externo,
  servidor de banco ou conta em nuvem (um único usuário local, visão do produto).
- O local dos dados tem um **padrão** que funciona sem configurar nada e pode ser **trocado por
  configuração** (os testes e quem quiser guardar em outro lugar usam isso).
- O arquivo de dados **nunca vai para o Git** (fica no `.gitignore`).
- Na primeira vez, sem dados guardados, a API sobe normalmente com a lista vazia.
- Se os dados guardados estiverem **ilegíveis** (arquivo corrompido, por exemplo), a API **não
  apaga nem sobrescreve** esses dados: ela não sobe e registra no log uma mensagem em português
  dizendo qual arquivo/banco não pôde ser lido. Perder dados calado é pior que não subir.
- Os endpoints e o contrato da API **não mudam**. O front não muda.

## Critérios de aceite
"Reiniciar a API" nos critérios abaixo = parar a API e subir uma instância nova apontando para
o **mesmo** local de dados (nos testes, um segundo host do `WebApplicationFactory` com a mesma
configuração).

1. **Dado** que registrei um gasto de R$ 45,90, "Almoço", categoria Alimentação, em 10/11/2026,
   **quando** reinicio a API e listo os gastos do mês,
   **então** o gasto aparece com o **mesmo id**, valor 45,90, descrição, categoria e data.
2. **Dado** que registrei um gasto e depois o editei para R$ 30,00, "Uber", Transporte, 09/11/2026,
   **quando** reinicio a API,
   **então** a lista mostra os dados editados (não os originais), com o mesmo id.
3. **Dado** que registrei dois gastos e excluí um deles,
   **quando** reinicio a API,
   **então** só o gasto não excluído aparece, e um `DELETE` do excluído responde **404**.
4. **Dado** que registrei, na mesma data, os gastos A, B e C, nessa ordem, e depois editei o A,
   **quando** reinicio a API e listo os gastos,
   **então** a ordem é C, B, A (a do registro, como antes de reiniciar).
5. **Dado** gastos de R$ 0,10 e R$ 0,20 no mês atual,
   **quando** reinicio a API e consulto o total do mês,
   **então** o total é exatamente **0,30** (o JSON cru não traz `0.30000000000000004`).
6. **Dado** que hoje é 15/11/2026 e registrei R$ 100,00 em Alimentação em 05/11/2026 e
   R$ 80,00 em Transporte em 20/10/2026,
   **quando** reinicio a API,
   **então** o total do mês é 100,00, o total por categoria tem Alimentação 100,00 e a comparação
   mostra mês anterior 80,00 e diferença 20,00.
7. **Dado** que não existe nenhum dado guardado no local configurado (primeira execução),
   **quando** subo a API e listo os gastos,
   **então** a API responde **200** com a lista vazia, e depois de registrar um gasto e reiniciar,
   ele está lá.
8. **Dado** um registro recusado (ex.: valor negativo, 400) e uma edição de id inexistente (404),
   **quando** reinicio a API,
   **então** nenhum gasto novo ou alterado aparece por causa desses pedidos.
9. **Dado** que 20 gastos são registrados ao mesmo tempo (pedidos em paralelo),
   **quando** reinicio a API,
   **então** os 20 gastos estão lá, sem nenhum perdido ou duplicado.
10. **Dado** que o local de dados configurado tem conteúdo ilegível,
    **quando** tento subir a API,
    **então** ela não sobe, o log tem uma mensagem em português com o caminho dos dados que não
    puderam ser lidos, e o conteúdo original continua **intacto** (byte a byte).
11. **Dado** duas configurações com locais de dados diferentes,
    **quando** registro um gasto numa delas,
    **então** ele não aparece na outra (os testes não se misturam entre si nem com os dados
    reais do usuário).
12. **Dado** que a persistência existe,
    **quando** leio o `README.md`,
    **então** ele diz onde os dados ficam por padrão, como trocar o local e como começar do zero
    (apagar os dados), e há uma ADR registrando a escolha e substituindo a ADR 0002.

## Fora de escopo
- Qualquer mudança no front, nos endpoints ou no formato das respostas (2 casas fixas é a MW-009).
- Backup, exportar/importar (CSV, planilha), sincronizar entre aparelhos, nuvem.
- Vários usuários, login, criptografia dos dados.
- Migração de esquema/versões do arquivo além da primeira versão.
- Recuperar ou consertar dados corrompidos (a regra é só não destruir e avisar).
- Guardar "data/hora de registro" visível ao usuário ou auditoria de edições.
- Banco de dados em servidor (PostgreSQL, SQL Server, Supabase etc.) ou qualquer serviço externo.
- Fuso horário servidor x navegador (pendência antes de qualquer deploy).
- Débitos técnicos do backlog e as histórias de acabamento (MW-009, MW-010, MW-011).

## Notas de produto
- Valores sempre em BRL, exatos em centavos, como nas MW-001 a MW-006.
- **Restrição do ambiente:** a sessão do time não acessa o nuget.org e os testes .NET só rodam no
  CI. Uma solução **sem pacote novo** (por exemplo, arquivo JSON com `System.Text.Json`) evita
  esse risco; se o Dev preferir um pacote (por exemplo, SQLite), ele precisa ser restaurável no
  CI do GitHub e a decisão vai para a ADR. A escolha técnica é do Dev.
- **Tamanho do PR:** ~300 linhas de produção no máximo (testes à parte). Se o Dev perceber que não
  cabe, avisa na daily antes da QA, e a PO divide (por exemplo, MW-007a: registrar/editar/excluir
  persistidos; MW-007b: arquivo ilegível e concorrência).
- Esta é a **última história do MVP**: depois do merge, o time entra de férias (`docs/team/escala.md`).

## Decisões do Dev
- Persistência num arquivo JSON local com `System.Text.Json` (sem pacote novo), substituindo a ADR 0002: o `ExpenseStore` continua com a lista em memória (ordem de registro da ADR 0007) e cada mudança aceita grava o arquivo inteiro (temporário + `File.Move`, sob o mesmo lock) **antes** de trocar a lista, então pedidos recusados ou gravação com falha não mudam nada. Local padrão `<LocalApplicationData>/MoneyWaste/expenses.json` (no Linux `~/.local/share/MoneyWaste/expenses.json`; no Windows `%LOCALAPPDATA%\MoneyWaste\expenses.json`), trocável pela configuração `Storage:DataFile` (ex.: variável de ambiente `Storage__DataFile`); começar do zero = apagar o arquivo. O arquivo é lido na subida (`Program.cs` resolve o store após o `Build`); se estiver ilegível, a API não sobe, loga em português (Critical) o caminho e não toca no arquivo. `expenses.json`/`expenses.json.tmp` no `.gitignore`. Nos testes, cada host aponta para um `TempDataFile` próprio (pasta temporária única, apagada no `Dispose`).
