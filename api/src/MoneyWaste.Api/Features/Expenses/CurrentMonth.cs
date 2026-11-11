namespace MoneyWaste.Api.Features.Expenses;

/// <summary>
/// Regra única de "mês atual" (MW-002): do dia 1 ao último dia do mês de hoje (do servidor),
/// pela data do gasto. Usada pela lista e pelo total para que os dois vejam os mesmos gastos.
/// O mês anterior (MW-006) é o mês de calendário antes do atual (em janeiro, dezembro do ano anterior).
/// </summary>
public static class CurrentMonth
{
    public static IReadOnlyList<Expense> Expenses(ExpenseStore store, TimeProvider clock) =>
        InMonthOf(store, Today(clock));

    public static IReadOnlyList<Expense> PreviousMonthExpenses(ExpenseStore store, TimeProvider clock) =>
        InMonthOf(store, Today(clock).AddMonths(-1));

    private static DateOnly Today(TimeProvider clock) => DateOnly.FromDateTime(clock.GetLocalNow().DateTime);

    private static IReadOnlyList<Expense> InMonthOf(ExpenseStore store, DateOnly day)
    {
        var firstDay = new DateOnly(day.Year, day.Month, 1);
        var lastDay = firstDay.AddMonths(1).AddDays(-1);

        return store.ListBetween(firstDay, lastDay);
    }
}
