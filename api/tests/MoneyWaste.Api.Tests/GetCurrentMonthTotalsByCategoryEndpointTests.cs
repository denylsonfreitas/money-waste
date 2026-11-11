using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using MoneyWaste.Api.Features.Expenses;

namespace MoneyWaste.Api.Tests;

public sealed class GetCurrentMonthTotalsByCategoryEndpointTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private const string Url = "/api/expenses/totals-by-category";

    // "Hoje" é 15/11/2026 em todos os cenários da história.
    private static readonly DateTimeOffset FixedNow = new(2026, 11, 15, 12, 0, 0, TimeSpan.Zero);

    private readonly WebApplicationFactory<Program> _factory;
    private readonly TempDataFile _data = new();
    private readonly HttpClient _client;

    public GetCurrentMonthTotalsByCategoryEndpointTests(WebApplicationFactory<Program> factory)
    {
        // Cada teste ganha seu próprio host (e, portanto, seu próprio ExpenseStore vazio).
        _factory = factory.WithWebHostBuilder(builder =>
            builder.UseSetting(ExpenseStore.DataFileSetting, _data.FilePath).ConfigureTestServices(services =>
                services.AddSingleton<TimeProvider>(new FixedTimeProvider(FixedNow))));
        _client = _factory.CreateClient();
    }

    public void Dispose()
    {
        _factory.Dispose();
        _data.Dispose();
    }

    // Critério 1
    [Fact]
    public async Task Get_ExpensesInSeveralCategories_Returns200WithTotalsFromHighestToLowest()
    {
        await CreateExpense(45.90m, "food", "2026-11-01");
        await CreateExpense(12.50m, "food", "2026-11-15");
        await CreateExpense(100.00m, "housing", "2026-11-05");
        await CreateExpense(8.00m, "transport", "2026-11-30");

        var response = await _client.GetAsync(Url);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var totals = await response.Content.ReadFromJsonAsync<List<CategoryTotal>>();
        Assert.Equal(
            new CategoryTotal[] { new("housing", 100.00m), new("food", 58.40m), new("transport", 8.00m) },
            totals!);
    }

    // Critério 2
    [Fact]
    public async Task Get_ExpensesFromOtherMonthsAndSameMonthOfOtherYear_AreNotCounted()
    {
        await CreateExpense(10.00m, "leisure", "2026-11-15");
        await CreateExpense(999.00m, "leisure", "2026-10-31");
        await CreateExpense(999.00m, "leisure", "2026-12-01");
        await CreateExpense(999.00m, "leisure", "2025-11-15");

        Assert.Equal(new CategoryTotal[] { new("leisure", 10.00m) }, await GetTotals());
    }

    // Critério 3
    [Fact]
    public async Task Get_NoExpensesInCurrentMonth_Returns200WithEmptyList()
    {
        await CreateExpense(50.00m, "food", "2026-10-20");

        var response = await _client.GetAsync(Url);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("[]", await response.Content.ReadAsStringAsync());
    }

    // Critério 3 (nenhum gasto registrado)
    [Fact]
    public async Task Get_EmptyStore_Returns200WithEmptyList()
    {
        var response = await _client.GetAsync(Url);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("[]", await response.Content.ReadAsStringAsync());
    }

    // Critério 4
    [Fact]
    public async Task Get_TiedTotals_FollowFixedCategoryOrder()
    {
        await CreateExpense(20.00m, "shopping", "2026-11-01");
        await CreateExpense(20.00m, "health", "2026-11-02");
        await CreateExpense(20.00m, "transport", "2026-11-03");

        var categories = (await GetTotals()).Select(t => t.Category);

        Assert.Equal(new[] { "transport", "health", "shopping" }, categories);
    }

    // Critério 5
    [Fact]
    public async Task Get_SumIsExactInCents()
    {
        await CreateExpense(0.10m, "food", "2026-11-03");
        await CreateExpense(0.20m, "food", "2026-11-04");

        var response = await _client.GetAsync(Url);

        // Sem resíduo de ponto flutuante (ex.: 0.30000000000000004).
        Assert.Equal("[{\"category\":\"food\",\"total\":0.30}]", await response.Content.ReadAsStringAsync());
    }

    // Critério 6
    [Fact]
    public async Task Get_SumOfCategoryTotalsMatchesMonthTotal()
    {
        await CreateExpense(45.90m, "food", "2026-11-01");
        await CreateExpense(12.50m, "transport", "2026-11-30");
        await CreateExpense(100.00m, "housing", "2026-11-10");
        await CreateExpense(999.00m, "food", "2026-10-31");
        var withoutDate = await _client.PostAsJsonAsync("/api/expenses",
            new { amount = 7.35m, description = "Sem data", category = "other" });
        Assert.Equal(HttpStatusCode.Created, withoutDate.StatusCode);

        var monthTotal = await _client.GetFromJsonAsync<CurrentMonthTotalResponse>("/api/expenses/total");
        var totals = await GetTotals();

        Assert.Equal(monthTotal!.Total, totals.Sum(t => t.Total));
        Assert.Equal(165.75m, totals.Sum(t => t.Total));
        Assert.Contains(new CategoryTotal("other", 7.35m), totals);
    }

    private async Task CreateExpense(decimal amount, string category, string date)
    {
        var response = await _client.PostAsJsonAsync("/api/expenses",
            new { amount, description = $"Gasto de {date}", category, date });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    private async Task<List<CategoryTotal>> GetTotals()
    {
        var body = await _client.GetFromJsonAsync<List<CategoryTotal>>(Url);
        Assert.NotNull(body);
        return body!;
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;

        public override TimeZoneInfo LocalTimeZone => TimeZoneInfo.Utc;
    }
}
