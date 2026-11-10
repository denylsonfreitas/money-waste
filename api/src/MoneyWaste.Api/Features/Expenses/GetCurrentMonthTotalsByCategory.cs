namespace MoneyWaste.Api.Features.Expenses;

public sealed record CategoryTotal(string Category, decimal Total);

public static class GetCurrentMonthTotalsByCategory
{
    public static IEndpointRouteBuilder MapGetCurrentMonthTotalsByCategory(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/expenses/totals-by-category", Handle);
        return app;
    }

    // Mesmos gastos da lista e do total (CurrentMonth). Só categorias com gasto;
    // maior total primeiro e, no empate, a ordem da lista fixa de categorias.
    private static IResult Handle(ExpenseStore store, TimeProvider clock) =>
        Results.Ok(CurrentMonth.Expenses(store, clock)
            .GroupBy(e => e.Category)
            .Select(g => new CategoryTotal(g.Key, g.Sum(e => e.Amount)))
            .OrderByDescending(t => t.Total)
            .ThenBy(t => IndexOf(t.Category))
            .ToList());

    private static int IndexOf(string category)
    {
        for (var i = 0; i < ExpenseCategories.Ordered.Count; i++)
            if (ExpenseCategories.Ordered[i] == category) return i;
        return int.MaxValue;
    }
}
