using System.Globalization;

namespace MoneyWaste.Api.Features.Expenses;

/// <summary>
/// Corpo de criação (MW-001) e de edição (MW-005): mesmos campos, mesmas regras e mensagens.
/// </summary>
public sealed record ExpenseRequest(decimal? Amount, string? Description, string? Category, string? Date)
{
    public const string AmountMustBePositive = "O valor deve ser maior que zero.";
    public const string AmountTooManyDecimals = "O valor deve ter no máximo 2 casas decimais.";
    public const string DescriptionRequired = "A descrição é obrigatória.";
    public const string CategoryInvalid = "A categoria é inválida.";
    public const string DateInvalid = "A data é inválida. Use o formato aaaa-mm-dd.";

    /// <summary>Erros por campo (vazio quando válido) e a data efetiva (sem data vale hoje).</summary>
    public (Dictionary<string, string[]> Errors, DateOnly Date) Validate(TimeProvider clock)
    {
        var errors = new Dictionary<string, string[]>();

        if (Amount is not { } amount || amount <= 0)
            errors["amount"] = [AmountMustBePositive];
        else if (decimal.Round(amount, 2) != amount)
            errors["amount"] = [AmountTooManyDecimals];

        if (string.IsNullOrWhiteSpace(Description))
            errors["description"] = [DescriptionRequired];

        if (Category is null || !ExpenseCategories.All.Contains(Category))
            errors["category"] = [CategoryInvalid];

        var date = DateOnly.FromDateTime(clock.GetLocalNow().DateTime);
        if (!string.IsNullOrWhiteSpace(Date) &&
            !DateOnly.TryParseExact(Date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out date))
            errors["date"] = [DateInvalid];

        return (errors, date);
    }

    public static IResult ValidationProblem(Dictionary<string, string[]> errors) =>
        Results.ValidationProblem(errors, title: "Dados do gasto inválidos.");
}
