namespace MoneyWaste.Api.Features.Expenses;

/// <summary>
/// Regra única de "mês atual" (MW-002): do dia 1 ao último dia do mês de hoje (do servidor),
/// pela data do gasto. Usada pela lista e pelo total para que os dois vejam os mesmos gastos.
/// </summary>
public static class CurrentMonth
{
    public static IReadOnlyList<Expense> Expenses(ExpenseStore store, TimeProvider clock)
    {
        var today = DateOnly.FromDateTime(clock.GetLocalNow().DateTime);
        var firstDay = new DateOnly(today.Year, today.Month, 1);
        var lastDay = firstDay.AddMonths(1).AddDays(-1);

        return store.ListBetween(firstDay, lastDay);
    }
}
