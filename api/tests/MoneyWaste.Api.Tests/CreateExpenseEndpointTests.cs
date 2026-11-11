using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using MoneyWaste.Api.Features.Expenses;

namespace MoneyWaste.Api.Tests;

public sealed class CreateExpenseEndpointTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private static readonly DateTimeOffset FixedNow = new(2026, 11, 9, 15, 30, 0, TimeSpan.Zero);

    private readonly WebApplicationFactory<Program> _factory;
    private readonly TempDataFile _data = new();

    public CreateExpenseEndpointTests(WebApplicationFactory<Program> factory)
    {
        // Relógio fixo para o critério "sem data vale hoje" não depender do horário do CI.
        _factory = factory.WithWebHostBuilder(builder =>
            builder.UseSetting(ExpenseStore.DataFileSetting, _data.FilePath).ConfigureTestServices(services =>
                services.AddSingleton<TimeProvider>(new FixedTimeProvider(FixedNow))));
    }

    public void Dispose()
    {
        _factory.Dispose();
        _data.Dispose();
    }

    private int StoredCount => _factory.Services.GetRequiredService<ExpenseStore>().Count;

    // Critério 1
    [Fact]
    public async Task Post_ValidExpense_Returns201WithCreatedExpense()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/expenses", new
        {
            amount = 45.90m,
            description = "Almoço",
            category = "food",
            date = "2026-11-05",
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var expense = await response.Content.ReadFromJsonAsync<Expense>();
        Assert.NotNull(expense);
        Assert.NotEqual(Guid.Empty, expense!.Id);
        Assert.Equal(45.90m, expense.Amount);
        Assert.Equal("Almoço", expense.Description);
        Assert.Equal("food", expense.Category);
        Assert.Equal(new DateOnly(2026, 11, 5), expense.Date);
        Assert.Equal($"/api/expenses/{expense.Id}", response.Headers.Location?.OriginalString);
    }

    // Critério 2
    [Fact]
    public async Task Post_ExpenseWithoutDate_UsesToday()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/expenses", new
        {
            amount = 12.50m,
            description = "Ônibus",
            category = "transport",
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var expense = await response.Content.ReadFromJsonAsync<Expense>();
        Assert.NotNull(expense);
        Assert.Equal(new DateOnly(2026, 11, 9), expense!.Date);
    }

    // Critério 3
    [Theory]
    [InlineData("0")]
    [InlineData("-10.50")]
    public async Task Post_AmountZeroOrNegative_Returns400AndCreatesNothing(string amount)
    {
        var error = await PostInvalidAndGetError(new
        {
            amount = decimal.Parse(amount, System.Globalization.CultureInfo.InvariantCulture),
            description = "Almoço",
            category = "food",
        }, field: "amount");

        Assert.Equal("O valor deve ser maior que zero.", error);
    }

    // Critério 3 (valor ausente também não é maior que zero)
    [Fact]
    public async Task Post_AmountMissing_Returns400()
    {
        var error = await PostInvalidAndGetError(new { description = "Almoço", category = "food" }, field: "amount");

        Assert.Equal("O valor deve ser maior que zero.", error);
    }

    // Critério 4
    [Fact]
    public async Task Post_AmountWithMoreThanTwoDecimals_Returns400AndCreatesNothing()
    {
        var error = await PostInvalidAndGetError(new
        {
            amount = 10.999m,
            description = "Almoço",
            category = "food",
        }, field: "amount");

        Assert.Equal("O valor deve ter no máximo 2 casas decimais.", error);
    }

    // Critério 5
    [Fact]
    public async Task Post_DescriptionMissing_Returns400()
    {
        var error = await PostInvalidAndGetError(new { amount = 45.90m, category = "food" }, field: "description");

        Assert.Equal("A descrição é obrigatória.", error);
    }

    // Critério 5
    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Post_DescriptionEmptyOrBlank_Returns400(string description)
    {
        var error = await PostInvalidAndGetError(new
        {
            amount = 45.90m,
            description,
            category = "food",
        }, field: "description");

        Assert.Equal("A descrição é obrigatória.", error);
    }

    // Critério 6
    [Fact]
    public async Task Post_CategoryMissing_Returns400()
    {
        var error = await PostInvalidAndGetError(new { amount = 45.90m, description = "Almoço" }, field: "category");

        Assert.Equal("A categoria é inválida.", error);
    }

    // Critério 6
    [Theory]
    [InlineData("")]
    [InlineData("Alimentação")]
    [InlineData("pets")]
    public async Task Post_CategoryEmptyOrOutsideList_Returns400(string category)
    {
        var error = await PostInvalidAndGetError(new
        {
            amount = 45.90m,
            description = "Almoço",
            category,
        }, field: "category");

        Assert.Equal("A categoria é inválida.", error);
    }

    // Critério 6 (todas as categorias da lista fixa são aceitas)
    [Theory]
    [InlineData("food")]
    [InlineData("transport")]
    [InlineData("housing")]
    [InlineData("health")]
    [InlineData("leisure")]
    [InlineData("education")]
    [InlineData("shopping")]
    [InlineData("other")]
    public async Task Post_EachFixedCategory_Returns201(string category)
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/expenses", new
        {
            amount = 1m,
            description = "Teste",
            category,
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    // Critério 7
    [Fact]
    public async Task Post_TwoValidExpenses_GetDifferentIds()
    {
        var client = _factory.CreateClient();
        var payload = new { amount = 45.90m, description = "Almoço", category = "food" };

        var first = await (await client.PostAsJsonAsync("/api/expenses", payload)).Content.ReadFromJsonAsync<Expense>();
        var second = await (await client.PostAsJsonAsync("/api/expenses", payload)).Content.ReadFromJsonAsync<Expense>();

        Assert.NotNull(first);
        Assert.NotNull(second);
        Assert.NotEqual(first!.Id, second!.Id);
    }

    /// <summary>
    /// Envia um gasto inválido, garante 400 sem nada criado e devolve a mensagem do campo.
    /// </summary>
    private async Task<string?> PostInvalidAndGetError(object payload, string field)
    {
        var client = _factory.CreateClient();
        var countBefore = StoredCount;

        var response = await client.PostAsJsonAsync("/api/expenses", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(countBefore, StoredCount);

        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var messages = body.RootElement.GetProperty("errors").GetProperty(field);
        return messages[0].GetString();
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;

        public override TimeZoneInfo LocalTimeZone => TimeZoneInfo.Utc;
    }
}
