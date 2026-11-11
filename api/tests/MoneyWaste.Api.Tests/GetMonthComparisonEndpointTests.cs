using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using MoneyWaste.Api.Features.Expenses;

namespace MoneyWaste.Api.Tests;

public sealed class GetMonthComparisonEndpointTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    // "Hoje" é 15/11/2026, salvo no cenário de janeiro (critério 3).
    private static readonly DateTimeOffset November15 = new(2026, 11, 15, 12, 0, 0, TimeSpan.Zero);

    private readonly WebApplicationFactory<Program> _baseFactory;
    private WebApplicationFactory<Program>? _factory;
    private readonly TempDataFile _data = new();
    private HttpClient _client = null!;

    public GetMonthComparisonEndpointTests(WebApplicationFactory<Program> factory)
    {
        _baseFactory = factory;
        StartHost(November15);
    }

    public void Dispose()
    {
        _factory?.Dispose();
        _data.Dispose();
    }

    // Cada teste ganha seu próprio host (e, portanto, seu próprio ExpenseStore vazio).
    private void StartHost(DateTimeOffset now)
    {
        _factory?.Dispose();
        _factory = _baseFactory.WithWebHostBuilder(builder =>
            builder.UseSetting(ExpenseStore.DataFileSetting, _data.FilePath).ConfigureTestServices(services =>
                services.AddSingleton<TimeProvider>(new FixedTimeProvider(now))));
        _client = _factory.CreateClient();
    }

    // Critério 1
    [Fact]
    public async Task Get_ExpensesInBothMonths_Returns200WithTotalsAndDifference()
    {
        await CreateExpense(100.00m, "2026-11-01");
        await CreateExpense(50.00m, "2026-11-15");
        await CreateExpense(80.00m, "2026-10-05");
        await CreateExpense(20.00m, "2026-10-25");

        var response = await _client.GetAsync("/api/expenses/month-comparison");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<MonthComparisonResponse>();
        Assert.Equal(new MonthComparisonResponse(150.00m, 100.00m, 50.00m), body);
    }

    // Critério 2
    [Fact]
    public async Task Get_PreviousMonthIsTheWholeCalendarMonthOnly()
    {
        await CreateExpense(10.00m, "2026-10-01");
        await CreateExpense(10.00m, "2026-10-31");
        await CreateExpense(999.00m, "2026-09-30");
        await CreateExpense(999.00m, "2025-10-15");
        await CreateExpense(999.00m, "2026-12-01");

        Assert.Equal(20.00m, (await GetComparison()).PreviousMonthTotal);
    }

    // Critério 3
    [Fact]
    public async Task Get_InJanuary_PreviousMonthIsDecemberOfPreviousYear()
    {
        StartHost(new DateTimeOffset(2027, 1, 10, 12, 0, 0, TimeSpan.Zero));
        await CreateExpense(40.00m, "2026-12-20");

        Assert.Equal(new MonthComparisonResponse(0m, 40.00m, -40.00m), await GetComparison());
    }

    // Critério 4
    [Fact]
    public async Task Get_NoExpenses_Returns200WithZeros()
    {
        var response = await _client.GetAsync("/api/expenses/month-comparison");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("{\"currentMonthTotal\":0,\"previousMonthTotal\":0,\"difference\":0}",
            await response.Content.ReadAsStringAsync());
    }

    // Critério 5
    [Fact]
    public async Task Get_PreviousMonthSumIsExactInCents()
    {
        await CreateExpense(0.10m, "2026-10-03");
        await CreateExpense(0.20m, "2026-10-04");

        var response = await _client.GetAsync("/api/expenses/month-comparison");

        // Sem resíduo de ponto flutuante (ex.: 0.30000000000000004).
        Assert.Equal("{\"currentMonthTotal\":0,\"previousMonthTotal\":0.30,\"difference\":-0.30}",
            await response.Content.ReadAsStringAsync());
    }

    // Critério 6
    [Fact]
    public async Task Get_CurrentMonthTotalMatchesMonthTotalEndpoint()
    {
        await CreateExpense(45.90m, "2026-11-01");
        await CreateExpense(12.50m, "2026-11-30");
        await _client.PostAsJsonAsync("/api/expenses", new { amount = 7.35m, description = "Sem data", category = "other" });

        var total = await _client.GetFromJsonAsync<CurrentMonthTotalResponse>("/api/expenses/total");

        Assert.Equal(65.75m, total!.Total);
        Assert.Equal(total.Total, (await GetComparison()).CurrentMonthTotal);
    }

    // Regra de produto: editar a data de um gasto do mês atual para o anterior o move de total.
    [Fact]
    public async Task Get_AfterMovingExpenseToPreviousMonth_ItLeavesCurrentAndEntersPrevious()
    {
        var created = await CreateExpense(30.00m, "2026-11-10");

        var update = await _client.PutAsJsonAsync($"/api/expenses/{created.Id}",
            new { amount = 30.00m, description = "Movido", category = "other", date = "2026-10-10" });
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);

        Assert.Equal(new MonthComparisonResponse(0m, 30.00m, -30.00m), await GetComparison());
    }

    private async Task<Expense> CreateExpense(decimal amount, string date)
    {
        var response = await _client.PostAsJsonAsync("/api/expenses",
            new { amount, description = $"Gasto de {date}", category = "other", date });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<Expense>())!;
    }

    private async Task<MonthComparisonResponse> GetComparison()
    {
        var body = await _client.GetFromJsonAsync<MonthComparisonResponse>("/api/expenses/month-comparison");
        Assert.NotNull(body);
        return body!;
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;

        public override TimeZoneInfo LocalTimeZone => TimeZoneInfo.Utc;
    }
}
