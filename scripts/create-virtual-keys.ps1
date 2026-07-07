# Creates the two named LiteLLM virtual keys required by SOW-KH-002 T1:
#   spec — $2 budget (Open WebUI spec conversations)
#   gen  — $5 budget (Dyad SPA generation)
# Requires the stack to be running (docker compose up -d) and .env populated.
# Usage: pwsh ./scripts/create-virtual-keys.ps1

$ErrorActionPreference = "Stop"

$envFile = Join-Path $PSScriptRoot "..\.env"
$master = (Get-Content $envFile | Where-Object { $_ -match '^LITELLM_MASTER_KEY=' }) -replace '^LITELLM_MASTER_KEY=', ''
if (-not $master) { throw "LITELLM_MASTER_KEY not found in .env" }

$headers = @{ Authorization = "Bearer $master"; "Content-Type" = "application/json" }
$base = "http://localhost:4000"

foreach ($spec in @(
    @{ alias = "spec"; budget = 2.0 },
    @{ alias = "gen";  budget = 5.0 }
)) {
    $body = @{
        key_alias  = $spec.alias
        max_budget = $spec.budget
    } | ConvertTo-Json
    $resp = Invoke-RestMethod -Method Post -Uri "$base/key/generate" -Headers $headers -Body $body
    Write-Host "$($spec.alias) (budget `$$($spec.budget)): $($resp.key)"
}

Write-Host ""
Write-Host "Paste the spec key into .env as LITELLM_SPEC_KEY, then run:"
Write-Host "  docker compose up -d open-webui"
