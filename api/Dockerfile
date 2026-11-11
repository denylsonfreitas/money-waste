# Imagem da API do Money Waste (deploy no Render, ver docs/deploy.md).
# Contexto do build: a pasta api/  ->  docker build -f api/Dockerfile api

# --- build: restaura e publica a API ---
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Só o .csproj primeiro, para o restore ficar em cache enquanto as dependências não mudam.
COPY src/MoneyWaste.Api/MoneyWaste.Api.csproj src/MoneyWaste.Api/
RUN dotnet restore src/MoneyWaste.Api/MoneyWaste.Api.csproj

COPY src/MoneyWaste.Api/ src/MoneyWaste.Api/
RUN dotnet publish src/MoneyWaste.Api/MoneyWaste.Api.csproj \
    -c Release -o /app/publish --no-restore /p:UseAppHost=false

# --- runtime: só o ASP.NET Core, rodando como usuário não-root ---
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Pasta gravável para o arquivo de gastos (MW-007). O usuário "app" já vem na imagem do .NET 8.
RUN mkdir -p /app/data && chown app:app /app/data

ENV Storage__DataFile=/app/data/expenses.json \
    ASPNETCORE_HTTP_PORTS=

USER $APP_UID

# O Render informa a porta em PORT; fora dele, 8080.
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "ASPNETCORE_URLS=http://0.0.0.0:${PORT:-8080} exec dotnet MoneyWaste.Api.dll"]
