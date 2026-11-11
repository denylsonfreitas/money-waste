using System.Text.Json;

namespace MoneyWaste.Api.Features.Expenses;

/// <summary>
/// Gastos guardados num arquivo JSON local (MW-007), na ordem em que foram registrados (ADR 0007).
/// Os dados ficam em memória e cada mudança aceita regrava o arquivo inteiro antes de valer.
/// </summary>
public sealed class ExpenseStore
{
    /// <summary>Chave de configuração com o caminho do arquivo de dados.</summary>
    public const string DataFileSetting = "Storage:DataFile";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web) { WriteIndented = true };

    private readonly string _dataFile;
    private readonly object _lock = new();
    private List<Expense> _expenses;

    public ExpenseStore(IConfiguration configuration, ILogger<ExpenseStore> logger)
    {
        _dataFile = Path.GetFullPath(configuration[DataFileSetting] ?? DefaultDataFile());
        _expenses = Load(_dataFile, logger);
    }

    /// <summary>Padrão sem configuração: pasta de dados locais do usuário (ex.: ~/.local/share/MoneyWaste).</summary>
    public static string DefaultDataFile() => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "MoneyWaste", "expenses.json");

    public int Count
    {
        get { lock (_lock) return _expenses.Count; }
    }

    public Expense Add(decimal amount, string description, string category, DateOnly date)
    {
        var expense = new Expense(Guid.NewGuid(), amount, description, category, date);
        lock (_lock) Commit([.. _expenses, expense]);
        return expense;
    }

    /// <summary>
    /// Troca os dados do gasto mantendo o identificador e a posição de registro (MW-005).
    /// Devolve <c>null</c> se o gasto não existe.
    /// </summary>
    public Expense? Update(Guid id, decimal amount, string description, string category, DateOnly date)
    {
        lock (_lock)
        {
            var index = _expenses.FindIndex(e => e.Id == id);
            if (index < 0) return null;

            var updated = new Expense(id, amount, description, category, date);
            var next = new List<Expense>(_expenses) { [index] = updated };
            Commit(next);
            return updated;
        }
    }

    /// <summary>Apaga o gasto de vez. Devolve <c>false</c> se ele não existe.</summary>
    public bool Remove(Guid id)
    {
        lock (_lock)
        {
            if (!_expenses.Exists(e => e.Id == id)) return false;

            Commit(_expenses.Where(e => e.Id != id).ToList());
            return true;
        }
    }

    /// <summary>
    /// Gastos com data entre <paramref name="from"/> e <paramref name="to"/> (inclusive),
    /// da data mais recente para a mais antiga; na mesma data, do registrado por último para o primeiro.
    /// </summary>
    public IReadOnlyList<Expense> ListBetween(DateOnly from, DateOnly to)
    {
        lock (_lock)
        {
            return _expenses
                .Select((expense, order) => (expense, order))
                .Where(x => x.expense.Date >= from && x.expense.Date <= to)
                .OrderByDescending(x => x.expense.Date)
                .ThenByDescending(x => x.order)
                .Select(x => x.expense)
                .ToList();
        }
    }

    // Grava primeiro e só depois troca a lista: se a gravação falhar, nada muda.
    // Arquivo temporário + Move: um arquivo gravado pela metade nunca substitui o anterior.
    private void Commit(List<Expense> next)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(_dataFile)!);
        var temporary = _dataFile + ".tmp";
        File.WriteAllText(temporary, JsonSerializer.Serialize(next, JsonOptions));
        File.Move(temporary, _dataFile, overwrite: true);
        _expenses = next;
    }

    // Sem arquivo é a primeira execução (lista vazia). Arquivo ilegível não é apagado nem
    // sobrescrito: a API não sobe e o log diz qual arquivo não pôde ser lido.
    private static List<Expense> Load(string dataFile, ILogger logger)
    {
        if (!File.Exists(dataFile)) return [];

        try
        {
            var expenses = JsonSerializer.Deserialize<List<Expense>>(File.ReadAllText(dataFile), JsonOptions);
            if (expenses is null || expenses.Any(e => e is null || e.Description is null || e.Category is null))
                throw new JsonException("Conteúdo inesperado.");
            return expenses;
        }
        catch (Exception ex) when (ex is JsonException or NotSupportedException)
        {
            var message = $"Não foi possível ler os dados dos gastos em '{dataFile}'. " +
                "O arquivo não foi alterado; corrija-o, mova-o ou aponte outro local em " + DataFileSetting + ".";
            logger.LogCritical(ex, "{Message}", message);
            throw new InvalidOperationException(message, ex);
        }
    }
}
