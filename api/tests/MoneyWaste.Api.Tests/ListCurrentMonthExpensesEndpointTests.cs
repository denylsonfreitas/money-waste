using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using MoneyWaste.Api.Features.Expenses;

namespace MoneyWaste.Api.Tests;

public sealed class ListCurrentMonthExpensesEndpointTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    // "Hoje" é 15/11/2026 em todos os cenários da história.
    private static readonly DateTimeOffset FixedNow = new(2026, 11, 15, 12, 0, 0, TimeSpan.Zero);

    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public ListCurrentMonthExpensesEndpointTests(WebApplicationFactory<Program> factory)
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
    public async Task Get_ExpensesFromFirstToLastDayOfMonth_Returns200WithAllOfThem()
    {
        await CreateExpense("Começo do mês", "2026-11-01", amount: 10m, category: "food");
        await CreateExpense("Hoje", "2026-11-15", amount: 20.50m, category: "transport");
        await CreateExpense("Fim do mês", "2026-11-30", amount: 1234.56m, category: "housing");

        var response = await _client.GetAsync("/api/expenses");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var expenses = await response.Content.ReadFromJsonAsync<List<Expense>>();
        Assert.NotNull(expenses);
        Assert.Equal(3, expenses!.Count);

        var endOfMonth = expenses.Single(e => e.Description == "Fim do mês");
        Assert.NotEqual(Guid.Empty, endOfMonth.Id);
        Assert.Equal(1234.56m, endOfMonth.Amount);
        Assert.Equal("housing", endOfMonth.Category);
        Assert.Equal(new DateOnly(2026, 11, 30), endOfMonth.Date);
    }

    // Critério 2
    [Fact]
    public async Task Get_ExpensesFromPreviousAndNextMonth_AreNotReturned()
    {
        await CreateExpense("Último dia de outubro", "2026-10-31");
        await CreateExpense("Primeiro dia de dezembro", "2026-12-01");
        await CreateExpense("Novembro", "2026-11-15");

        var descriptions = await ListDescriptions();

        Assert.Equal(new[] { "Novembro" }, descriptions);
    }

    // Critério 3
    [Fact]
    public async Task Get_ReturnsMostRecentDateFirst()
    {
        await CreateExpense("Dia 03", "2026-11-03");
        await CreateExpense("Dia 10", "2026-11-10");
        await CreateExpense("Dia 07", "2026-11-07");

        var descriptions = await ListDescriptions();

        Assert.Equal(new[] { "Dia 10", "Dia 07", "Dia 03" }, descriptions);
    }

    // Critério 4
    [Fact]
    public async Task Get_SameDate_LastRegisteredComesFirst()
    {
        await CreateExpense("Primeiro", "2026-11-05");
        await CreateExpense("Segundo", "2026-11-05");

        var descriptions = await ListDescriptions();

        Assert.Equal(new[] { "Segundo", "Primeiro" }, descriptions);
    }

    // Critério 5
    [Fact]
    public async Task Get_NoExpensesInCurrentMonth_Returns200WithEmptyList()
    {
        await CreateExpense("Outubro", "2026-10-20");

        var response = await _client.GetAsync("/api/expenses");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("[]", await response.Content.ReadAsStringAsync());
    }

    // Critério 5 (nenhum gasto registrado)
    [Fact]
    public async Task Get_EmptyStore_Returns200WithEmptyList()
    {
        var response = await _client.GetAsync("/api/expenses");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("[]", await response.Content.ReadAsStringAsync());
    }

    // Critério 6
    [Fact]
    public async Task Get_AfterCreatingExpense_ReturnsSameDataAsCreation()
    {
        var created = await CreateExpense("Almoço", "2026-11-09", amount: 45.90m, category: "food");

        var expenses = await _client.GetFromJsonAsync<List<Expense>>("/api/expenses");

        Assert.NotNull(expenses);
        Assert.Equal(new[] { created }, expenses!);
    }

    // Critério 6 (gasto sem data vale hoje e, portanto, entra na lista)
    [Fact]
    public async Task Get_AfterCreatingExpenseWithoutDate_ReturnsIt()
    {
        var response = await _client.PostAsJsonAsync("/api/expenses", new
        {
            amount = 12.50m,
            description = "Ônibus",
            category = "transport",
        });
        var created = await response.Content.ReadFromJsonAsync<Expense>();

        var expenses = await _client.GetFromJsonAsync<List<Expense>>("/api/expenses");

        Assert.NotNull(created);
        Assert.NotNull(expenses);
        Assert.Equal(new[] { created! }, expenses!);
    }

    private async Task<Expense> CreateExpense(string description, string date, decimal amount = 1m, string category = "other")
    {
        var response = await _client.PostAsJsonAsync("/api/expenses", new { amount, description, category, date });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var expense = await response.Content.ReadFromJsonAsync<Expense>();
        Assert.NotNull(expense);
        return expense!;
    }

    private async Task<string[]> ListDescriptions()
    {
        var expenses = await _client.GetFromJsonAsync<List<Expense>>("/api/expenses");
        Assert.NotNull(expenses);
        return expenses!.Select(e => e.Description).ToArray();
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;

        public override TimeZoneInfo LocalTimeZone => TimeZoneInfo.Utc;
    }
}
