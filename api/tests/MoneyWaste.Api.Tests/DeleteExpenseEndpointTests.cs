using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using MoneyWaste.Api.Features.Expenses;

namespace MoneyWaste.Api.Tests;

public sealed class DeleteExpenseEndpointTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private static readonly DateTimeOffset FixedNow = new(2026, 11, 15, 12, 0, 0, TimeSpan.Zero);

    private readonly WebApplicationFactory<Program> _factory;
    private readonly TempDataFile _data = new();
    private readonly HttpClient _client;

    public DeleteExpenseEndpointTests(WebApplicationFactory<Program> factory)
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

    // Critério 6
    [Fact]
    public async Task Delete_ExistingExpense_Returns204AndRemovesItFromListAndTotal()
    {
        var lunch = await Create(45.90m, "Almoço", "2026-11-05");
        var bus = await Create(12.50m, "Ônibus", "2026-11-06");

        var response = await _client.DeleteAsync($"/api/expenses/{lunch.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(new[] { bus }, await List());
        var total = await _client.GetFromJsonAsync<CurrentMonthTotalResponse>("/api/expenses/total");
        Assert.Equal(12.50m, total!.Total);
    }

    // Critério 7
    [Fact]
    public async Task Delete_UnknownId_Returns404AndKeepsOtherExpenses()
    {
        var lunch = await Create(45.90m, "Almoço", "2026-11-05");

        var response = await _client.DeleteAsync($"/api/expenses/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(new[] { lunch }, await List());
    }

    // Critério 7 (gasto que já foi excluído)
    [Fact]
    public async Task Delete_AlreadyDeletedExpense_Returns404AndKeepsOtherExpenses()
    {
        var lunch = await Create(45.90m, "Almoço", "2026-11-05");
        var bus = await Create(12.50m, "Ônibus", "2026-11-06");
        Assert.Equal(HttpStatusCode.NoContent, (await _client.DeleteAsync($"/api/expenses/{lunch.Id}")).StatusCode);

        var response = await _client.DeleteAsync($"/api/expenses/{lunch.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(new[] { bus }, await List());
    }

    // Critério 7 (identificador que nem é um Guid)
    [Fact]
    public async Task Delete_MalformedId_Returns404()
    {
        var response = await _client.DeleteAsync("/api/expenses/nao-existe");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private async Task<Expense> Create(decimal amount, string description, string date)
    {
        var response = await _client.PostAsJsonAsync("/api/expenses",
            new { amount, description, category = "food", date });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<Expense>())!;
    }

    private async Task<List<Expense>> List() =>
        (await _client.GetFromJsonAsync<List<Expense>>("/api/expenses"))!;

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;

        public override TimeZoneInfo LocalTimeZone => TimeZoneInfo.Utc;
    }
}
