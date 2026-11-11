namespace MoneyWaste.Api.Features.Expenses;

public static class CreateExpense
{
    public static IEndpointRouteBuilder MapCreateExpense(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/expenses", Handle);
        return app;
    }

    private static IResult Handle(ExpenseRequest request, ExpenseStore store, TimeProvider clock)
    {
        var (errors, date) = request.Validate(clock);
        if (errors.Count > 0)
            return ExpenseRequest.ValidationProblem(errors);

        var expense = store.Add(request.Amount!.Value, request.Description!.Trim(), request.Category!, date);
        return Results.Created($"/api/expenses/{expense.Id}", expense);
    }
}
