namespace MoneyWaste.Api.Features.Expenses;

public static class DeleteExpense
{
    public static IEndpointRouteBuilder MapDeleteExpense(this IEndpointRouteBuilder app)
    {
        app.MapDelete("/api/expenses/{id:guid}", Handle);
        return app;
    }

    // Exclusão definitiva (sem lixeira). Excluir de novo o mesmo gasto dá 404.
    private static IResult Handle(Guid id, ExpenseStore store) =>
        store.Remove(id) ? Results.NoContent() : Results.NotFound();
}
