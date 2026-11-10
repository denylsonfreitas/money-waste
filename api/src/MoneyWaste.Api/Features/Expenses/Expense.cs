namespace MoneyWaste.Api.Features.Expenses;

public sealed record Expense(Guid Id, decimal Amount, string Description, string Category, DateOnly Date);
