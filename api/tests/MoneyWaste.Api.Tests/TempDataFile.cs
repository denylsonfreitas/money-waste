namespace MoneyWaste.Api.Tests;

/// <summary>
/// Local de dados temporário e exclusivo (MW-007): cada teste aponta a API para o seu,
/// sem se misturar com outros testes (nem em paralelo) nem com os dados reais do usuário.
/// O Dispose apaga a pasta inteira.
/// </summary>
public sealed class TempDataFile : IDisposable
{
    private readonly string _directory =
        Path.Combine(Path.GetTempPath(), "money-waste-tests", Guid.NewGuid().ToString("N"));

    public string FilePath => Path.Combine(_directory, "expenses.json");

    public void Dispose()
    {
        if (Directory.Exists(_directory)) Directory.Delete(_directory, recursive: true);
    }
}
