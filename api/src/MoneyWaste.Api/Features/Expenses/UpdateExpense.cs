namespace MoneyWaste.Api.Features.Expenses;

public static class UpdateExpense
{
    public static IEndpointRouteBuilder MapUpdateExpense(this IEndpointRouteBuilder app)
    {
        // Identificador que não é Guid não casa com a rota e também vira 404.
        app.MapPut("/api/expenses/{id:guid}", Handle);
        return app;
    }

    private static IResult Handle(Guid id, ExpenseRequest request, ExpenseStore store, TimeProvider clock)
    {
        var (errors, date) = request.Validate(clock);
        if (errors.Count > 0)
            return ExpenseRequest.ValidationProblem(errors);

        var expense = store.Update(id, request.Amount!.Value, request.Description!.Trim(), request.Category!, date);
        return expense is null ? Results.NotFound() : Results.Ok(expense);
    }
}
