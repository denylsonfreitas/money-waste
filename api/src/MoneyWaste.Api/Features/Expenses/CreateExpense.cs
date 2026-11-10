using System.Globalization;

namespace MoneyWaste.Api.Features.Expenses;

public sealed record CreateExpenseRequest(decimal? Amount, string? Description, string? Category, string? Date);

public static class CreateExpense
{
    public const string AmountMustBePositive = "O valor deve ser maior que zero.";
    public const string AmountTooManyDecimals = "O valor deve ter no máximo 2 casas decimais.";
    public const string DescriptionRequired = "A descrição é obrigatória.";
    public const string CategoryInvalid = "A categoria é inválida.";
    public const string DateInvalid = "A data é inválida. Use o formato aaaa-mm-dd.";

    public static IEndpointRouteBuilder MapCreateExpense(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/expenses", Handle);
        return app;
    }

    private static IResult Handle(CreateExpenseRequest request, ExpenseStore store, TimeProvider clock)
    {
        var errors = new Dictionary<string, string[]>();

        if (request.Amount is not { } amount || amount <= 0)
            errors["amount"] = [AmountMustBePositive];
        else if (decimal.Round(amount, 2) != amount)
            errors["amount"] = [AmountTooManyDecimals];

        if (string.IsNullOrWhiteSpace(request.Description))
            errors["description"] = [DescriptionRequired];

        if (request.Category is null || !ExpenseCategories.All.Contains(request.Category))
            errors["category"] = [CategoryInvalid];

        var date = DateOnly.FromDateTime(clock.GetLocalNow().DateTime);
        if (!string.IsNullOrWhiteSpace(request.Date) &&
            !DateOnly.TryParseExact(request.Date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out date))
            errors["date"] = [DateInvalid];

        if (errors.Count > 0)
            return Results.ValidationProblem(errors, title: "Dados do gasto inválidos.");

        var expense = store.Add(request.Amount!.Value, request.Description!.Trim(), request.Category!, date);
        return Results.Created($"/api/expenses/{expense.Id}", expense);
    }
}
