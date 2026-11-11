using Microsoft.AspNetCore.Cors.Infrastructure;
using MoneyWaste.Api.Features.Expenses;

var builder = WebApplication.CreateBuilder(args);

// Origens liberadas no CORS: config "Cors:AllowedOrigins" (env Cors__AllowedOrigins__0, __1...).
// Sem configuração, vale o front local (ng serve). Lido na resolução das opções, não na subida
// do builder, para valer qualquer fonte de configuração (inclusive a dos testes).
builder.Services.AddCors();
builder.Services.AddOptions<CorsOptions>().Configure<IConfiguration>((options, configuration) =>
{
    var origins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() is { Length: > 0 } configured
        ? configured
        : ["http://localhost:4200"];
    options.AddDefaultPolicy(policy => policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod());
});

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<ExpenseStore>();

var app = builder.Build();

// Carrega os gastos guardados já na subida (MW-007): com dados ilegíveis, a API nem sobe.
app.Services.GetRequiredService<ExpenseStore>();

app.UseCors();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));
app.MapCreateExpense();
app.MapUpdateExpense();
app.MapDeleteExpense();
app.MapListCurrentMonthExpenses();
app.MapGetCurrentMonthTotal();
app.MapGetCurrentMonthTotalsByCategory();
app.MapGetMonthComparison();

app.Run();

// Exposto para os testes de integração (WebApplicationFactory).
public partial class Program;
