namespace MoneyWaste.Api.Features.Expenses;

/// <summary>Diferença = total do mês atual − total do mês anterior (MW-006).</summary>
public sealed record MonthComparisonResponse(decimal CurrentMonthTotal, decimal PreviousMonthTotal, decimal Difference);

public static class GetMonthComparison
{
    public static IEndpointRouteBuilder MapGetMonthComparison(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/expenses/month-comparison", Handle);
        return app;
    }

    // Mesma soma em decimal do total do mês (MW-003): centavos exatos.
    private static IResult Handle(ExpenseStore store, TimeProvider clock)
    {
        var current = CurrentMonth.Expenses(store, clock).Sum(e => e.Amount);
        var previous = CurrentMonth.PreviousMonthExpenses(store, clock).Sum(e => e.Amount);
        return Results.Ok(new MonthComparisonResponse(current, previous, current - previous));
    }
}
