using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using MoneyWaste.Api.Features.Expenses;

namespace MoneyWaste.Api.Tests;

public sealed class GetCurrentMonthTotalEndpointTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    // "Hoje" é 15/11/2026 em todos os cenários da história.
    private static readonly DateTimeOffset FixedNow = new(2026, 11, 15, 12, 0, 0, TimeSpan.Zero);

    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public GetCurrentMonthTotalEndpointTests(WebApplicationFactory<Program> factory)
    {
        // Cada teste ganha seu próprio host (e, portanto, seu próprio ExpenseStore vazio).
        _factory = factory.WithWebHostBuilder(builder =>
            builder.ConfigureTestServices(services =>
                services.AddSingleton<TimeProvider>(new FixedTimeProvider(FixedNow))));
        _client = _factory.CreateClient();
    }

    public void Dispose() => _factory.Dispose();

    // Critério 1
    [Fact]
    public async Task Get_ExpensesFromFirstToLastDayOfMonth_Returns200WithTheirSum()
    {
        await CreateExpense(45.90m, "2026-11-01");
        await CreateExpense(12.50m, "2026-11-15");
        await CreateExpense(100.00m, "2026-11-30");

        var response = await _client.GetAsync("/api/expenses/total");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<CurrentMonthTotalResponse>();
        Assert.Equal(158.40m, body!.Total);
    }

    // Critério 2
    [Fact]
    public async Task Get_ExpensesFromOtherMonthsAndSameMonthOfOtherYear_AreNotSummed()
    {
        await CreateExpense(10.00m, "2026-11-15");
        await CreateExpense(999.00m, "2026-10-31");
        await CreateExpense(999.00m, "2026-12-01");
        await CreateExpense(999.00m, "2025-11-15");

        Assert.Equal(10.00m, await GetTotal());
    }

    // Critério 3
    [Fact]
    public async Task Get_NoExpensesInCurrentMonth_Returns200WithZero()
    {
        await CreateExpense(50.00m, "2026-10-20");

        var response = await _client.GetAsync("/api/expenses/total");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("{\"total\":0}", await response.Content.ReadAsStringAsync());
    }

    // Critério 3 (nenhum gasto registrado)
    [Fact]
    public async Task Get_EmptyStore_Returns200WithZero()
    {
        var response = await _client.GetAsync("/api/expenses/total");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("{\"total\":0}", await response.Content.ReadAsStringAsync());
    }

    // Critério 4
    [Fact]
    public async Task Get_SumIsExactInCents()
    {
        await CreateExpense(0.10m, "2026-11-03");
        await CreateExpense(0.20m, "2026-11-04");

        var response = await _client.GetAsync("/api/expenses/total");

        // Sem resíduo de ponto flutuante (ex.: 0.30000000000000004).
        Assert.Equal("{\"total\":0.30}", await response.Content.ReadAsStringAsync());
    }

    // Critério 5
    [Fact]
    public async Task Get_AfterCreatingExpenseInCurrentMonth_TotalIncludesIt()
    {
        await CreateExpense(45.90m, "2026-11-01");
        await CreateExpense(12.50m, "2026-11-15");
        await CreateExpense(100.00m, "2026-11-30");
        Assert.Equal(158.40m, await GetTotal());

        await CreateExpense(25.00m, "2026-11-20");

        Assert.Equal(183.40m, await GetTotal());
    }

    // Regra de produto: o total soma exatamente os gastos que a lista do mês mostra.
    [Fact]
    public async Task Get_TotalMatchesSumOfCurrentMonthList()
    {
        await CreateExpense(45.90m, "2026-11-01");
        await CreateExpense(999.00m, "2026-10-31");
        await CreateExpense(12.50m, "2026-11-30");
        await _client.PostAsJsonAsync("/api/expenses", new { amount = 7.35m, description = "Sem data", category = "other" });

        var list = await _client.GetFromJsonAsync<List<Expense>>("/api/expenses");

        Assert.Equal(list!.Sum(e => e.Amount), await GetTotal());
        Assert.Equal(65.75m, await GetTotal());
    }

    private async Task CreateExpense(decimal amount, string date)
    {
        var response = await _client.PostAsJsonAsync("/api/expenses",
            new { amount, description = $"Gasto de {date}", category = "other", date });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    private async Task<decimal> GetTotal()
    {
        var body = await _client.GetFromJsonAsync<CurrentMonthTotalResponse>("/api/expenses/total");
        Assert.NotNull(body);
        return body!.Total;
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;

        public override TimeZoneInfo LocalTimeZone => TimeZoneInfo.Utc;
    }
}
