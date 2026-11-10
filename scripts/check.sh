#!/usr/bin/env bash
# Verificação local usada por Dev e QA antes de abrir PR.
# Uso: scripts/check.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> API: build"
if dotnet restore api/MoneyWaste.sln >/dev/null 2>&1; then
  dotnet build api/MoneyWaste.sln --no-restore -warnaserror
  echo "==> API: testes"
  dotnet test api/MoneyWaste.sln --no-build
else
  # Sem acesso ao nuget.org (ex.: sandbox da sessão): compila só a API, que não
  # depende de pacotes externos. Os testes .NET rodam no CI do PR.
  echo "   (nuget.org indisponível — compilando só a API; testes .NET rodam no CI)"
  EMPTY_FEED="$(mktemp -d)"
  dotnet build api/src/MoneyWaste.Api --source "$EMPTY_FEED" -warnaserror
fi

echo "==> Web: dependências"
(cd web && { [ -d node_modules ] || npm ci; })

echo "==> Web: testes"
(cd web && CHROME_BIN="${CHROME_BIN:-$(command -v google-chrome || command -v chromium || true)}" \
  npx ng test --watch=false --browsers=ChromeHeadless)

echo "==> Web: build"
(cd web && npx ng build)

echo "✅ check.sh passou"
