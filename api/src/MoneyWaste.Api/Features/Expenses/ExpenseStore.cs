using System.Collections.Concurrent;

namespace MoneyWaste.Api.Features.Expenses;

/// <summary>
/// Armazenamento em memória. Persistência real fica para a MW-007.
/// </summary>
public sealed class ExpenseStore
{
    private readonly ConcurrentDictionary<Guid, Expense> _expenses = new();

    public int Count => _expenses.Count;

    public Expense Add(decimal amount, string description, string category, DateOnly date)
    {
        var expense = new Expense(Guid.NewGuid(), amount, description, category, date);
        _expenses[expense.Id] = expense;
        return expense;
    }
}
