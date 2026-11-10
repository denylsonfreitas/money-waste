namespace MoneyWaste.Api.Features.Expenses;

public static class ListCurrentMonthExpenses
{
    public static IEndpointRouteBuilder MapListCurrentMonthExpenses(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/expenses", Handle);
        return app;
    }

    private static IResult Handle(ExpenseStore store, TimeProvider clock) =>
        Results.Ok(CurrentMonth.Expenses(store, clock));
}
