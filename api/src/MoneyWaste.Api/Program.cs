using MoneyWaste.Api.Features.Expenses;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:4200").AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<ExpenseStore>();

var app = builder.Build();

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
