using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using MoneyWaste.Api.Features.Expenses;

namespace MoneyWaste.Api.Tests;

public sealed class HealthEndpointTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly TempDataFile _data = new();

    public void Dispose() => _data.Dispose();

    [Fact]
    public async Task Get_Health_ReturnsOk()
    {
        using var host = factory.WithWebHostBuilder(builder =>
            builder.UseSetting(ExpenseStore.DataFileSetting, _data.FilePath));
        var client = host.CreateClient();

        var response = await client.GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
