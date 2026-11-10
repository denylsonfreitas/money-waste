namespace MoneyWaste.Api.Features.Expenses;

public sealed record CurrentMonthTotalResponse(decimal Total);

public static class GetCurrentMonthTotal
{
    public static IEndpointRouteBuilder MapGetCurrentMonthTotal(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/expenses/total", Handle);
        return app;
    }

    // decimal soma em centavos exatos (0,10 + 0,20 = 0,30), sem resíduo de ponto flutuante.
    private static IResult Handle(ExpenseStore store, TimeProvider clock) =>
        Results.Ok(new CurrentMonthTotalResponse(CurrentMonth.Expenses(store, clock).Sum(e => e.Amount)));
}
