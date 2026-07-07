# SETUP — Bite One: The AI SPA Producer (SOW-KH-002 v1.5)

This document records **every cloud resource and local component** with exact
rebuild and teardown steps. It assumes a fresh AWS account, a fresh workstation
with Docker Desktop + Node LTS, and nothing else. Region for all AWS resources:
**ap-south-1** (Mumbai), except where a service is global.

Conventions used below:

- `<ACCOUNT_ID>` — your 12-digit AWS account ID (`aws sts get-caller-identity`)
- `<ALERT_EMAIL>` — email address for billing alerts
- All commands are PowerShell-compatible unless noted; bash equivalents are the
  same commands unless a note says otherwise.

---

## 0. Prerequisites

- AWS CLI v2 authenticated as an IAM user/role that can create: Budgets, EC2,
  IAM roles, S3, CloudFront. Configure the default region:

  ```
  aws configure set region ap-south-1
  ```

- GitHub CLI (`gh`) authenticated: `gh auth login`
- Docker Desktop running; `docker compose version` ≥ v2.20
- Node LTS (`node --version` ≥ v20)

---

## 1. AWS Budget (billing alarm) — created FIRST, before any billable resource

**Resource:** AWS Budgets budget `bite-one-monthly-20usd` (global service, not
regional). $20/month cost budget with email alerts at 50% actual, 80% actual,
and 100% forecasted spend. AWS Budgets email notifications do not require a
subscription-confirmation click. The first two budgets per account are free.

### Rebuild

Create `budget.json`:

```json
{
  "BudgetName": "bite-one-monthly-20usd",
  "BudgetLimit": { "Amount": "20", "Unit": "USD" },
  "BudgetType": "COST",
  "TimeUnit": "MONTHLY"
}
```

Create `notifications.json` (replace `<ALERT_EMAIL>`):

```json
[
  {
    "Notification": { "NotificationType": "ACTUAL", "ComparisonOperator": "GREATER_THAN", "Threshold": 50, "ThresholdType": "PERCENTAGE" },
    "Subscribers": [ { "SubscriptionType": "EMAIL", "Address": "<ALERT_EMAIL>" } ]
  },
  {
    "Notification": { "NotificationType": "ACTUAL", "ComparisonOperator": "GREATER_THAN", "Threshold": 80, "ThresholdType": "PERCENTAGE" },
    "Subscribers": [ { "SubscriptionType": "EMAIL", "Address": "<ALERT_EMAIL>" } ]
  },
  {
    "Notification": { "NotificationType": "FORECASTED", "ComparisonOperator": "GREATER_THAN", "Threshold": 100, "ThresholdType": "PERCENTAGE" },
    "Subscribers": [ { "SubscriptionType": "EMAIL", "Address": "<ALERT_EMAIL>" } ]
  }
]
```

Then:

```
aws budgets create-budget --account-id <ACCOUNT_ID> `
  --budget file://budget.json `
  --notifications-with-subscribers file://notifications.json
```

### Verify

```
aws budgets describe-budget --account-id <ACCOUNT_ID> --budget-name bite-one-monthly-20usd
aws budgets describe-notifications-for-budget --account-id <ACCOUNT_ID> --budget-name bite-one-monthly-20usd
```

Expect `HealthStatus.Status: HEALTHY` and three notifications in state `OK`.

### Teardown

```
aws budgets delete-budget --account-id <ACCOUNT_ID> --budget-name bite-one-monthly-20usd
```

(Deleting the budget also deletes its notifications and subscribers.)

---

## 2. Local workstation stack — LiteLLM + Open WebUI (T1/T2)

**Components (all local Docker, no cloud cost):**

| Service    | Image (pinned)                                | Port |
|------------|-----------------------------------------------|------|
| litellm-db | `postgres:16.6-alpine`                        | —    |
| litellm    | `ghcr.io/berriai/litellm:main-v1.77.3-stable` | 4000 |
| open-webui | `ghcr.io/open-webui/open-webui:v0.6.26`       | 3000 |

The Anthropic API key lives ONLY in the local `.env` file (gitignored). It is
never committed, never placed in GitHub secrets, and never leaves this machine.

### Rebuild

1. Clone this repo and enter it.
2. `Copy-Item .env.example .env` and fill in:
   - `ANTHROPIC_API_KEY` — your personal Anthropic key
   - `LITELLM_MASTER_KEY`, `LITELLM_SALT_KEY`, `LITELLM_DB_PASSWORD`,
     `WEBUI_SECRET_KEY` — long random strings (e.g.
     `-join ((1..32) | % { '{0:x}' -f (Get-Random -Max 16) })`)
   - leave `LITELLM_SPEC_KEY` empty for now
3. `docker compose up -d litellm-db litellm`
4. Create the two budgeted virtual keys:
   `pwsh ./scripts/create-virtual-keys.ps1`
   - `spec` — $2 budget (used by Open WebUI)
   - `gen`  — $5 budget (used by Dyad)
   Record both keys somewhere safe; paste the `spec` key into `.env` as
   `LITELLM_SPEC_KEY`.
5. `docker compose up -d open-webui`
6. Open http://localhost:3000 and create the local admin account (first
   signup becomes admin). Note: `ENABLE_SIGNUP: "True"` must be present in
   the compose env **on first boot** — Open WebUI persists config in its DB
   after first launch and ignores later env changes. If signup is stuck
   disabled, wipe the volume (`docker compose rm -sf open-webui;`
   `docker volume rm biteone_open-webui-data`) and start again.
7. Create the "SPA Spec" model preset: Workspace → Models → New. Base model
   `claude-sonnet-4-6`, name `SPA Spec`, system prompt = the text below the
   `---` line in `prompts/spa-spec-system-prompt.md`. (Or via API:
   `POST /api/v1/models/create` with `{id, base_model_id, name, params.system}`.)

### Verify

```
# proxy alive
curl http://localhost:4000/health/liveliness
# call through a virtual key (replace sk-...)
curl http://localhost:4000/v1/chat/completions -H "Authorization: Bearer sk-..." -H "Content-Type: application/json" -d '{"model":"claude-haiku-4-5","max_tokens":32,"messages":[{"role":"user","content":"ping"}]}'
# spend shows on the correct key
curl "http://localhost:4000/key/info" -H "Authorization: Bearer <LITELLM_MASTER_KEY>"
```

### Teardown

```
docker compose down -v   # -v removes the named volumes (key DB, WebUI data)
```

---

## 3. Dyad → LiteLLM on the gen key (T3)

**Component:** Dyad desktop app (local, no cloud cost). Dyad is one of the two
allowed non-open-source exceptions (authoring tool).

### Rebuild

1. Install Dyad from https://dyad.sh and launch it once.
2. In Dyad: Settings → AI Providers → Add custom provider:
   - Name: `LiteLLM (local)`
   - API base URL: `http://localhost:4000/v1`
   - API key: the `gen` virtual key ($5 budget) from
     `scripts/create-virtual-keys.ps1`
3. Add a model under that provider: API name `claude-sonnet-4-6`
   (display name anything), context window 200000, max output 8192.
4. Select that model as the active model.

Dyad stores this in `%APPDATA%\dyad\sqlite.db` (tables
`language_model_providers`, `language_models`) and the key in
`%APPDATA%\dyad\user-settings.json` — both local files, outside this repo.

### Verify

Send any short prompt in a Dyad chat, then confirm the spend increment on the
gen key:

```
curl "http://localhost:4000/key/info?key=<GEN_KEY>" -H "Authorization: Bearer <LITELLM_MASTER_KEY>"
```

### Teardown

Remove the provider in Dyad's settings UI (or delete the rows from the two
tables above), and delete the `litellm` entry from `providerSettings` in
`user-settings.json`.

---

*(Sections for EC2, Supabase, Caddy, OIDC role, S3, CloudFront are appended as
those tasks (T4–T10) are completed.)*
