using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using MoneyWaste.Api.Features.Expenses;

namespace MoneyWaste.Api.Tests;

public sealed class UpdateExpenseEndpointTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    // "Hoje" é 15/11/2026 em todos os cenários da história.
    private static readonly DateTimeOffset FixedNow = new(2026, 11, 15, 12, 0, 0, TimeSpan.Zero);

    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public UpdateExpenseEndpointTests(WebApplicationFactory<Program> factory)
    {
        // Cada teste ganha seu próprio host (e, portanto, seu próprio ExpenseStore vazio).
        _factory = factory.WithWebHostBuilder(builder =>
            builder.ConfigureTestServices(services =>
                services.AddSingleton<TimeProvider>(new FixedTimeProvider(FixedNow))));
        _client = _factory.CreateClient();
    }

    public void Dispose() => _factory.Dispose();

    private static readonly object ValidEdit = new
    {
        amount = 50.00m,
        description = "Almoço de domingo",
        category = "leisure",
        date = "2026-11-06",
    };

    // Critério 1
    [Fact]
    public async Task Put_ValidEdit_Returns200WithUpdatedExpenseAndSameId()
    {
        var lunch = await Create(45.90m, "Almoço", "food", "2026-11-05");

        var response = await _client.PutAsJsonAsync($"/api/expenses/{lunch.Id}", ValidEdit);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var expected = new Expense(lunch.Id, 50.00m, "Almoço de domingo", "leisure", new DateOnly(2026, 11, 6));
        Assert.Equal(expected, await response.Content.ReadFromJsonAsync<Expense>());
        Assert.Equal(new[] { expected }, await List());
    }

    // Critério 2
    [Theory]
    [InlineData("amount", "0", "Almoço", "food", "2026-11-06", "O valor deve ser maior que zero.")]
    [InlineData("amount", "10.999", "Almoço", "food", "2026-11-06", "O valor deve ter no máximo 2 casas decimais.")]
    [InlineData("description", "50", "   ", "food", "2026-11-06", "A descrição é obrigatória.")]
    [InlineData("category", "50", "Almoço", "pets", "2026-11-06", "A categoria é inválida.")]
    [InlineData("date", "50", "Almoço", "food", "06/11/2026", "A data é inválida. Use o formato aaaa-mm-dd.")]
    public async Task Put_InvalidEdit_Returns400WithCreationMessageAndKeepsExpense(
        string field, string amount, string description, string category, string date, string message)
    {
        var lunch = await Create(45.90m, "Almoço", "food", "2026-11-05");

        var response = await _client.PutAsJsonAsync($"/api/expenses/{lunch.Id}", new
        {
            amount = decimal.Parse(amount, CultureInfo.InvariantCulture),
            description,
            category,
            date,
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(message, body.RootElement.GetProperty("errors").GetProperty(field)[0].GetString());
        Assert.Equal(new[] { lunch }, await List());
    }

    // Critério 3
    [Fact]
    public async Task Put_UnknownId_Returns404AndCreatesNothing()
    {
        var lunch = await Create(45.90m, "Almoço", "food", "2026-11-05");

        var response = await _client.PutAsJsonAsync($"/api/expenses/{Guid.NewGuid()}", ValidEdit);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(new[] { lunch }, await List());
        Assert.Equal(1, _factory.Services.GetRequiredService<ExpenseStore>().Count);
    }

    // Critério 3 (identificador que nem é um Guid)
    [Fact]
    public async Task Put_MalformedId_Returns404()
    {
        var response = await _client.PutAsJsonAsync("/api/expenses/nao-existe", ValidEdit);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // Critério 4
    [Fact]
    public async Task Put_DateMovedToAnotherMonth_RemovesExpenseFromCurrentMonthViews()
    {
        var rent = await Create(100.00m, "Aluguel", "housing", "2026-11-10");
        var cinema = await Create(10.00m, "Cinema", "leisure", "2026-11-12");

        var response = await _client.PutAsJsonAsync($"/api/expenses/{rent.Id}",
            new { amount = 100.00m, description = "Aluguel", category = "housing", date = "2026-10-31" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(new[] { cinema }, await List());
        var total = await _client.GetFromJsonAsync<CurrentMonthTotalResponse>("/api/expenses/total");
        Assert.Equal(10.00m, total!.Total);
        var byCategory = await _client.GetFromJsonAsync<List<CategoryTotal>>("/api/expenses/totals-by-category");
        Assert.Equal(new[] { new CategoryTotal("leisure", 10.00m) }, byCategory!);
    }

    // Critério 5
    [Fact]
    public async Task Put_KeepsOriginalRegistrationOrder()
    {
        var first = await Create(10.00m, "Primeiro", "food", "2026-11-05");
        await Create(20.00m, "Segundo", "food", "2026-11-05");

        var response = await _client.PutAsJsonAsync($"/api/expenses/{first.Id}",
            new { amount = 10.00m, description = "Primeiro corrigido", category = "food", date = "2026-11-05" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(new[] { "Segundo", "Primeiro corrigido" }, (await List()).Select(e => e.Description));
    }

    private async Task<Expense> Create(decimal amount, string description, string category, string date)
    {
        var response = await _client.PostAsJsonAsync("/api/expenses", new { amount, description, category, date });
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
