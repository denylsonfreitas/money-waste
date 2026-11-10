namespace MoneyWaste.Api.Features.Expenses;

/// <summary>
/// Lista fixa de categorias (MW-001). O contrato usa códigos em inglês;
/// o front é quem exibe os rótulos em português.
/// </summary>
public static class ExpenseCategories
{
    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        "food",       // Alimentação
        "transport",  // Transporte
        "housing",    // Moradia
        "health",     // Saúde
        "leisure",    // Lazer
        "education",  // Educação
        "shopping",   // Compras
        "other",      // Outros
    };
}
