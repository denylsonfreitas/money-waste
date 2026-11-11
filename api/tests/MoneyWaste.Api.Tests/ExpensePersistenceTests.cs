using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MoneyWaste.Api.Features.Expenses;

namespace MoneyWaste.Api.Tests;

/// <summary>
/// MW-007: "reiniciar a API" = descartar o host e subir outro apontando para o mesmo arquivo de dados.
/// </summary>
public sealed class ExpensePersistenceTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    // "Hoje" é 15/11/2026 em todos os cenários.
    private static readonly DateTimeOffset FixedNow = new(2026, 11, 15, 12, 0, 0, TimeSpan.Zero);

    private readonly WebApplicationFactory<Program> _baseFactory;
    private readonly TempDataFile _data = new();
    private readonly List<WebApplicationFactory<Program>> _hosts = [];

    public ExpensePersistenceTests(WebApplicationFactory<Program> factory) => _baseFactory = factory;

    public void Dispose()
    {
        foreach (var host in _hosts) host.Dispose();
        _data.Dispose();
    }

    // Critério 1
    [Fact]
    public async Task Created_ExpenseSurvivesRestartWithSameData()
    {
        var created = await Create(StartApi(), 45.90m, "Almoço", "food", "2026-11-10");

        var expenses = await List(Restart());

        Assert.Equal(new[] { new Expense(created.Id, 45.90m, "Almoço", "food", new DateOnly(2026, 11, 10)) }, expenses);
    }

    // Critério 2
    [Fact]
    public async Task Updated_ExpenseSurvivesRestartWithEditedData()
    {
        var api = StartApi();
        var created = await Create(api, 45.90m, "Almoço", "food", "2026-11-10");
        var update = await api.PutAsJsonAsync($"/api/expenses/{created.Id}",
            new { amount = 30.00m, description = "Uber", category = "transport", date = "2026-11-09" });
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);

        var expenses = await List(Restart());

        Assert.Equal(new[] { new Expense(created.Id, 30.00m, "Uber", "transport", new DateOnly(2026, 11, 9)) }, expenses);
    }

    // Critério 3
    [Fact]
    public async Task Deleted_ExpenseStaysDeletedAfterRestart()
    {
        var api = StartApi();
        var kept = await Create(api, 10.00m, "Fica", "food", "2026-11-10");
        var deleted = await Create(api, 20.00m, "Sai", "food", "2026-11-11");
        Assert.Equal(HttpStatusCode.NoContent, (await api.DeleteAsync($"/api/expenses/{deleted.Id}")).StatusCode);

        var restarted = Restart();

        Assert.Equal(new[] { kept }, await List(restarted));
        Assert.Equal(HttpStatusCode.NotFound, (await restarted.DeleteAsync($"/api/expenses/{deleted.Id}")).StatusCode);
    }

    // Critério 4
    [Fact]
    public async Task RegistrationOrderSurvivesRestart_EvenAfterEditingTheFirst()
    {
        var api = StartApi();
        var a = await Create(api, 10.00m, "A", "food", "2026-11-10");
        await Create(api, 20.00m, "B", "food", "2026-11-10");
        await Create(api, 30.00m, "C", "food", "2026-11-10");
        var update = await api.PutAsJsonAsync($"/api/expenses/{a.Id}",
            new { amount = 11.00m, description = "A", category = "food", date = "2026-11-10" });
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);

        var expenses = await List(Restart());

        Assert.Equal(new[] { "C", "B", "A" }, expenses.Select(e => e.Description));
    }

    // Critério 5
    [Fact]
    public async Task AmountsSurviveRestartExactInCents()
    {
        var api = StartApi();
        await Create(api, 0.10m, "Bala", "food", "2026-11-10");
        await Create(api, 0.20m, "Chiclete", "food", "2026-11-11");

        var raw = await Restart().GetStringAsync("/api/expenses/total");

        Assert.Equal("{\"total\":0.30}", raw);
    }

    // Critério 6
    [Fact]
    public async Task TotalsByCategoryAndComparisonSurviveRestart()
    {
        var api = StartApi();
        await Create(api, 100.00m, "Mercado", "food", "2026-11-05");
        await Create(api, 80.00m, "Ônibus", "transport", "2026-10-20");

        var restarted = Restart();

        var total = await restarted.GetFromJsonAsync<CurrentMonthTotalResponse>("/api/expenses/total");
        Assert.Equal(100.00m, total!.Total);
        var byCategory = await restarted.GetFromJsonAsync<List<CategoryTotal>>("/api/expenses/totals-by-category");
        Assert.Equal(new[] { new CategoryTotal("food", 100.00m) }, byCategory!);
        var comparison = await restarted.GetFromJsonAsync<MonthComparisonResponse>("/api/expenses/month-comparison");
        Assert.Equal(new MonthComparisonResponse(100.00m, 80.00m, 20.00m), comparison);
    }

    // Critério 7
    [Fact]
    public async Task FirstRun_WithoutStoredData_StartsEmptyAndThenPersists()
    {
        Assert.False(File.Exists(_data.FilePath));
        var api = StartApi();

        var response = await api.GetAsync("/api/expenses");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("[]", await response.Content.ReadAsStringAsync());

        var created = await Create(api, 45.90m, "Almoço", "food", "2026-11-10");
        Assert.Equal(new[] { created }, await List(Restart()));
    }

    // Critério 8
    [Fact]
    public async Task RejectedRequests_DoNotChangeStoredData()
    {
        var api = StartApi();
        var lunch = await Create(api, 45.90m, "Almoço", "food", "2026-11-10");

        var invalidCreate = await api.PostAsJsonAsync("/api/expenses",
            new { amount = -5.00m, description = "Negativo", category = "food", date = "2026-11-10" });
        var invalidEdit = await api.PutAsJsonAsync($"/api/expenses/{lunch.Id}",
            new { amount = 0m, description = "Zero", category = "food", date = "2026-11-10" });
        var unknownEdit = await api.PutAsJsonAsync($"/api/expenses/{Guid.NewGuid()}",
            new { amount = 30.00m, description = "Fantasma", category = "food", date = "2026-11-10" });

        Assert.Equal(HttpStatusCode.BadRequest, invalidCreate.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, invalidEdit.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, unknownEdit.StatusCode);
        Assert.Equal(new[] { lunch }, await List(Restart()));
    }

    // Critério 9
    [Fact]
    public async Task ParallelRegistrations_AllSurviveRestartWithoutLossOrDuplicates()
    {
        var api = StartApi();

        var created = await Task.WhenAll(Enumerable.Range(1, 20)
            .Select(i => Create(api, i, $"Gasto {i}", "other", "2026-11-10")));

        var expenses = await List(Restart());

        Assert.Equal(20, expenses.Count);
        Assert.Equal(created.Select(e => e.Id).OrderBy(id => id), expenses.Select(e => e.Id).OrderBy(id => id));
    }

    // Critério 10
    [Fact]
    public void UnreadableData_ApiDoesNotStart_LogsPathInPortuguese_AndKeepsFileIntact()
    {
        Directory.CreateDirectory(Path.GetDirectoryName(_data.FilePath)!);
        var original = "[{\"id\": isto não é json"u8.ToArray();
        File.WriteAllBytes(_data.FilePath, original);
        var logs = new LogCollector();

        var host = Host(_data.FilePath, services => services.AddSingleton<ILoggerProvider>(logs));

        Assert.ThrowsAny<Exception>(() => host.CreateClient());
        Assert.Contains(logs.Messages, m =>
            m.Contains("Não foi possível ler os dados dos gastos") && m.Contains(Path.GetFullPath(_data.FilePath)));
        Assert.Equal(original, File.ReadAllBytes(_data.FilePath));
    }

    // Critério 11
    [Fact]
    public async Task DifferentDataLocations_DoNotShareExpenses()
    {
        using var otherData = new TempDataFile();
        await Create(StartApi(), 45.90m, "Almoço", "food", "2026-11-10");

        var other = Host(otherData.FilePath).CreateClient();

        Assert.Empty(await List(other));
    }

    // Regra de produto: o local padrão (sem configuração) fica na pasta de dados do usuário, fora do repositório.
    [Fact]
    public void DefaultDataFile_IsInUserLocalApplicationData()
    {
        var expected = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "MoneyWaste", "expenses.json");

        Assert.Equal(expected, ExpenseStore.DefaultDataFile());
    }

    private HttpClient StartApi() => Host(_data.FilePath).CreateClient();

    private HttpClient Restart()
    {
        foreach (var host in _hosts) host.Dispose();
        _hosts.Clear();
        return StartApi();
    }

    private WebApplicationFactory<Program> Host(string dataFile, Action<IServiceCollection>? configure = null)
    {
        var host = _baseFactory.WithWebHostBuilder(builder =>
            builder.UseSetting(ExpenseStore.DataFileSetting, dataFile).ConfigureTestServices(services =>
            {
                services.AddSingleton<TimeProvider>(new FixedTimeProvider(FixedNow));
                configure?.Invoke(services);
            }));
        _hosts.Add(host);
        return host;
    }

    private static async Task<Expense> Create(HttpClient api, decimal amount, string description, string category, string date)
    {
        var response = await api.PostAsJsonAsync("/api/expenses", new { amount, description, category, date });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<Expense>())!;
    }

    private static async Task<List<Expense>> List(HttpClient api) =>
        (await api.GetFromJsonAsync<List<Expense>>("/api/expenses"))!;

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;

        public override TimeZoneInfo LocalTimeZone => TimeZoneInfo.Utc;
    }

    private sealed class LogCollector : ILoggerProvider
    {
        public ConcurrentQueue<string> Messages { get; } = new();

        public ILogger CreateLogger(string categoryName) => new Collector(Messages);

        public void Dispose() { }

        private sealed class Collector(ConcurrentQueue<string> messages) : ILogger
        {
            public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

            public bool IsEnabled(LogLevel logLevel) => true;

            public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception,
                Func<TState, Exception?, string> formatter) => messages.Enqueue(formatter(state, exception));
        }
    }
}
