namespace MoneyWaste.Api.Features.Expenses;

public static class ListCurrentMonthExpenses
{
    public static IEndpointRouteBuilder MapListCurrentMonthExpenses(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/expenses", Handle);
        return app;
    }

    private static IResult Handle(ExpenseStore store, TimeProvider clock)
    {
        var today = DateOnly.FromDateTime(clock.GetLocalNow().DateTime);
        var firstDay = new DateOnly(today.Year, today.Month, 1);
        var lastDay = firstDay.AddMonths(1).AddDays(-1);

        return Results.Ok(store.ListBetween(firstDay, lastDay));
    }
}
