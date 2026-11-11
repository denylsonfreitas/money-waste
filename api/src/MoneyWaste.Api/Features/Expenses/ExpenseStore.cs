namespace MoneyWaste.Api.Features.Expenses;

/// <summary>
/// Armazenamento em memória. Persistência real fica para a MW-007.
/// A lista guarda os gastos na ordem em que foram registrados.
/// </summary>
public sealed class ExpenseStore
{
    private readonly List<Expense> _expenses = [];
    private readonly object _lock = new();

    public int Count
    {
        get { lock (_lock) return _expenses.Count; }
    }

    public Expense Add(decimal amount, string description, string category, DateOnly date)
    {
        var expense = new Expense(Guid.NewGuid(), amount, description, category, date);
        lock (_lock) _expenses.Add(expense);
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
            _expenses[index] = updated;
            return updated;
        }
    }

    /// <summary>Apaga o gasto de vez. Devolve <c>false</c> se ele não existe.</summary>
    public bool Remove(Guid id)
    {
        lock (_lock) return _expenses.RemoveAll(e => e.Id == id) > 0;
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
}
