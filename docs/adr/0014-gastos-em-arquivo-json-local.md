# ADR 0014 — Gastos guardados num arquivo JSON local

**Status:** Aceita · **Data:** 2026-11-11 · **História:** MW-007 · **Substitui:** [ADR 0002](0002-gastos-em-memoria-ate-mw-007.md)

## Contexto
Até a MW-006 os gastos ficavam só em memória (ADR 0002) e sumiam quando a API reiniciava. A
MW-007 pede que tudo o que a API aceita (registro, edição, exclusão) continue lá depois de
reiniciar, com o mesmo `id`, valores exatos em centavos e a ordem de registro (ADR 0007).

Restrições da história:
- Dados na máquina do usuário. Nada de serviço externo, servidor de banco ou nuvem.
- Local padrão que funciona sem configurar nada, trocável por configuração.
- Dados ilegíveis não podem ser apagados nem sobrescritos: a API não sobe e avisa no log.
- Endpoints e front não mudam.
- O ambiente do time não acessa o nuget.org. Pacote novo (ex.: SQLite) seria um risco.

## Decisão
- **Arquivo JSON com `System.Text.Json`**, sem pacote novo. Ele guarda a lista de gastos na
  ordem de registro, em camelCase, indentado. Valores em `decimal`.
- O `ExpenseStore` continua **singleton com a lista em memória** e um único `lock` (ADR 0007).
  As leituras usam só a memória.
- **Cada mudança aceita grava o arquivo inteiro antes de trocar a lista** (`Commit`): grava em
  `<arquivo>.tmp` e faz `File.Move(..., overwrite: true)`, tudo sob o mesmo `lock`. Se a
  gravação falhar, a memória não muda. Pedidos recusados (400, 404) retornam antes do `Commit`.
- **Local padrão:** `<LocalApplicationData>/MoneyWaste/expenses.json`
  (Linux: `~/.local/share/MoneyWaste/expenses.json`; Windows:
  `%LOCALAPPDATA%\MoneyWaste\expenses.json`). Fora do repositório. A pasta é criada na primeira
  gravação.
- **Trocar o local:** configuração `Storage:DataFile` (ex.: variável de ambiente
  `Storage__DataFile`). O caminho passa por `Path.GetFullPath`; relativo vale a partir do
  diretório de trabalho do processo.
- **Leitura na subida:** o `Program.cs` resolve o `ExpenseStore` logo após o `Build`. Sem
  arquivo, a lista começa vazia. Arquivo com conteúdo ilegível (`JsonException` ou
  `NotSupportedException`, lista `null`, item `null`, descrição ou categoria ausente): log
  `Critical` em português com o caminho, `InvalidOperationException`, e a API não sobe. O
  arquivo não é tocado.
- **Começar do zero:** apagar o arquivo com a API parada.
- `expenses.json` e `expenses.json.tmp` entram no `.gitignore`.
- **Testes:** cada host do `WebApplicationFactory` aponta `Storage:DataFile` para um
  `TempDataFile` próprio (pasta temporária única, apagada no `Dispose`). Nenhum teste grava no
  local padrão.

## Consequências
- Os gastos sobrevivem ao reinício. Nenhuma dependência nova; o CI restaura igual a antes.
- Cada mudança regrava o arquivo inteiro. Bom para o volume de uma pessoa; não escala para
  muitos milhares de gastos.
- **Uma instância por arquivo.** Duas APIs no mesmo arquivo: a última que grava vence e apaga as
  mudanças da outra. Não há trava entre processos.
- Falha de gravação (disco cheio, sem permissão) vira erro 500 no pedido, sem mudar os dados.
- Só erros de **conteúdo** têm a mensagem em português. Arquivo sem permissão de leitura, ou
  caminho que é uma pasta, também impede a subida sem tocar no arquivo, mas com a mensagem
  padrão do .NET, em inglês. O mesmo vale para `Storage:DataFile` definido vazio.
- JSON válido mas incompleto (sem `id`, `amount` ou `date`, ou ids repetidos) é carregado com
  valores padrão. Só acontece com edição manual; validar o arquivo está fora de escopo.
- Um `.tmp` que sobrou de uma queda não é lido e é sobrescrito na próxima gravação.
- O `System.Text.Json` escapa acentos no arquivo (`"Almoço"`). A ida e volta é exata.
- Um nome diferente de `expenses.json` dentro do repositório não fica protegido pelo
  `.gitignore`.
- Migração de formato do arquivo, backup e exportação ficam fora (pós-MVP).
