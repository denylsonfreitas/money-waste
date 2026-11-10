namespace MoneyWaste.Api.Features.Expenses;

/// <summary>
/// Lista fixa de categorias (MW-001). O contrato usa códigos em inglês;
/// o front é quem exibe os rótulos em português.
/// </summary>
public static class ExpenseCategories
{
    /// <summary>Na ordem da lista fixa; é o critério de desempate dos totais por categoria (MW-004).</summary>
    public static readonly IReadOnlyList<string> Ordered =
    [
        "food",       // Alimentação
        "transport",  // Transporte
        "housing",    // Moradia
        "health",     // Saúde
        "leisure",    // Lazer
        "education",  // Educação
        "shopping",   // Compras
        "other",      // Outros
    ];

    public static readonly IReadOnlySet<string> All = new HashSet<string>(Ordered, StringComparer.Ordinal);
}
