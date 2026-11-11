using Microsoft.AspNetCore.Mvc.Testing;
using MoneyWaste.Api.Features.Expenses;

namespace MoneyWaste.Api.Tests;

/// <summary>Deploy: as origens do CORS vêm de "Cors:AllowedOrigins", com o front local como padrão.</summary>
public sealed class CorsConfigurationTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private const string AllowOriginHeader = "Access-Control-Allow-Origin";

    private readonly TempDataFile _data = new();

    public void Dispose() => _data.Dispose();

    [Fact]
    public async Task WithoutConfiguration_AllowsLocalFrontOnly()
    {
        var client = CreateClient();

        Assert.Equal("http://localhost:4200", await AllowedOrigin(client, "http://localhost:4200"));
        Assert.Null(await AllowedOrigin(client, "https://money-waste.vercel.app"));
    }

    [Fact]
    public async Task WithConfiguredOrigins_AllowsThemInsteadOfDefault()
    {
        var client = CreateClient(("Cors:AllowedOrigins:0", "https://money-waste.vercel.app"));

        Assert.Equal("https://money-waste.vercel.app", await AllowedOrigin(client, "https://money-waste.vercel.app"));
        Assert.Null(await AllowedOrigin(client, "http://localhost:4200"));
    }

    private HttpClient CreateClient(params (string Key, string Value)[] settings) =>
        factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting(ExpenseStore.DataFileSetting, _data.FilePath);
            foreach (var (key, value) in settings) builder.UseSetting(key, value);
        }).CreateClient();

    private static async Task<string?> AllowedOrigin(HttpClient client, string origin)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/health");
        request.Headers.Add("Origin", origin);
        using var response = await client.SendAsync(request);
        return response.Headers.TryGetValues(AllowOriginHeader, out var values) ? values.Single() : null;
    }
}
