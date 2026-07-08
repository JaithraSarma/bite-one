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

**Model record (SOW §6):** the developer's own Anthropic API key, routed
through LiteLLM. Models exposed: `claude-sonnet-4-6` (used for both spec and
generation), `claude-haiku-4-5`, `claude-opus-4-8`. Authoring tool: Dyad
(LiteLLM-routed on the `gen` key — no D-S2 deviation needed).

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
   - `gen`  — $5 budget (used by Dyad; raised to $15 during the build)
   The amounts are our own cost-control choice — the SOW requires budget
   *enforcement* (AC 8), not specific numbers. Raise anytime via
   `POST /key/update` with the master key (see RUNBOOK "Check LLM spend").
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
   (display name anything), context window 200000, **max output 64000**.
   Do not use a small max-output value: a generated file larger than the
   cap truncates mid-file and Dyad retries the whole generation in a loop —
   at ~45K prompt tokens per retry that burns ~$4/minute for zero code.
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

## 4. EC2 host (T4)

**Resources (region ap-south-1):**

| Resource | Value in this build | Notes |
|---|---|---|
| Key pair | `bite-one` (ed25519) | private key at `~/.ssh/bite-one.pem`, never committed |
| Security group | `bite-one-sg` | ingress: tcp/443 from 0.0.0.0/0, tcp/22 from `<MY_IP>/32` only. Nothing else. |
| Instance | `t3.large`, Ubuntu 24.04 LTS, 30 GB gp3 | tags: Name=bite-one, Project=bite-one, CostCenter=SOW-KH-002, Owner=JaithraSarma |

Cost: ~$0.10/hr while running (+ ~$2.70/mo for the 30 GB volume). The billing
budget (section 1) must exist before this step.

### Rebuild

```
# your public IP (for the SSH rule)
$MYIP = (Invoke-RestMethod https://checkip.amazonaws.com).Trim()

# current Ubuntu 24.04 AMI for the region
$AMI = aws ssm get-parameter --name /aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id --query Parameter.Value --output text

# key pair
aws ec2 create-key-pair --key-name bite-one --key-type ed25519 --query KeyMaterial --output text | Out-File -Encoding ascii "$env:USERPROFILE\.ssh\bite-one.pem"
icacls "$env:USERPROFILE\.ssh\bite-one.pem" /inheritance:r /grant:r "${env:USERNAME}:R"

# security group in the default VPC
$VPC = aws ec2 describe-vpcs --filters Name=is-default,Values=true --query 'Vpcs[0].VpcId' --output text
$SG = aws ec2 create-security-group --group-name bite-one-sg --description "Bite One: 443 world, 22 from owner IP only" --vpc-id $VPC --query GroupId --output text
aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port 22 --cidr "$MYIP/32"

# user-data installs Docker Engine + compose plugin
@'
#!/bin/bash
set -e
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu
systemctl enable --now docker
'@ | Out-File -Encoding ascii user-data.sh

# 30 GB gp3 root volume (Supabase images need > the 8 GB default)
'[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":30,"VolumeType":"gp3","DeleteOnTermination":true}}]' | Out-File -Encoding ascii bdm.json

$SUBNET = aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC" --query 'Subnets[0].SubnetId' --output text
$IID = aws ec2 run-instances --image-id $AMI --instance-type t3.large --key-name bite-one `
  --security-group-ids $SG --subnet-id $SUBNET --user-data file://user-data.sh `
  --block-device-mappings file://bdm.json `
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=bite-one},{Key=Project,Value=bite-one},{Key=CostCenter,Value=SOW-KH-002}]' `
  --query 'Instances[0].InstanceId' --output text
aws ec2 wait instance-running --instance-ids $IID
aws ec2 describe-instances --instance-ids $IID --query 'Reservations[0].Instances[0].PublicIpAddress' --output text
```

### Verify

```
ssh -i ~/.ssh/bite-one.pem ubuntu@<PUBLIC_IP> "docker --version && sudo docker compose version"
# SG has exactly two ingress rules:
aws ec2 describe-security-groups --group-names bite-one-sg --query "SecurityGroups[0].IpPermissions"
```

SSH from any IP other than `<MY_IP>` times out (no rule matches). Postgres and
Studio are never exposed: only 443 (Caddy) and 22 (owner IP) are reachable.

### Teardown

```
$IID = aws ec2 describe-instances --filters "Name=tag:Name,Values=bite-one" "Name=instance-state-name,Values=running,stopped" --query 'Reservations[0].Instances[0].InstanceId' --output text
aws ec2 terminate-instances --instance-ids $IID
aws ec2 wait instance-terminated --instance-ids $IID   # volume auto-deletes (DeleteOnTermination)
aws ec2 delete-security-group --group-name bite-one-sg
aws ec2 delete-key-pair --key-name bite-one
Remove-Item "$env:USERPROFILE\.ssh\bite-one.pem"
```

**This build:** instance `i-07c435d2dea9ad23f`, SG `sg-01a0b3df69d6a2da3`,
public IP `65.0.169.23` (changes on stop/start — sslip.io hostname changes with it).

---

## 5. Self-hosted Supabase on the EC2 host (T5)

**Component:** official Supabase Docker stack, vendored into this repo at
`supabase/` (upstream `supabase/supabase` `docker/` dir @ commit `8f5ba52`,
all 11 images version-pinned) plus two Bite One modifications:

- `supabase/docker-compose.bite-one.yml` — Studio and Supavisor bound to the
  host **loopback only** (Studio reachable exclusively via SSH tunnel)
- `supabase/volumes/proxy/caddy/Caddyfile` — API paths only; anything else
  (including Studio) returns 404 at the proxy (see T6)

All secrets are generated on the server into `supabase/.env` (gitignored by
the vendored `supabase/.gitignore`) — JWT secret, anon/service-role JWTs,
Postgres and dashboard passwords, encryption keys. Nothing is a default value.

### Rebuild (on the EC2 host from T4)

```
ssh -i ~/.ssh/bite-one.pem ubuntu@<EC2_IP>
git clone https://github.com/JaithraSarma/bite-one.git
cd bite-one/supabase
cp .env.example .env
sh utils/generate-keys.sh --update-env     # generates ALL secrets, no defaults
sed -i \
  -e "s|^COMPOSE_FILE=.*$|COMPOSE_FILE=docker-compose.yml:docker-compose.bite-one.yml|" \
  -e "s|^PROXY_DOMAIN=.*$|PROXY_DOMAIN=api.<EC2_IP>.sslip.io|" \
  -e "s|^SUPABASE_PUBLIC_URL=.*$|SUPABASE_PUBLIC_URL=https://api.<EC2_IP>.sslip.io|" \
  -e "s|^API_EXTERNAL_URL=.*$|API_EXTERNAL_URL=https://api.<EC2_IP>.sslip.io/auth/v1|" \
  -e "s|^ENABLE_EMAIL_AUTOCONFIRM=.*$|ENABLE_EMAIL_AUTOCONFIRM=true|" \
  .env
sudo docker compose pull
sudo docker compose up -d
```

`ENABLE_EMAIL_AUTOCONFIRM=true` because no SMTP is configured (test users
only; a real deployment would configure SMTP and leave this false).

### Verify

```
sudo docker compose ps          # every service "(healthy)"
# REST through Kong (anon key reaches PostgREST; note /rest/v1/ root is
# admin-only in this Kong config — use the service key for the OpenAPI root):
ANON=$(grep '^ANON_KEY=' .env | cut -d= -f2)
curl "http://localhost:8000/rest/v1/some_table" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
# Studio ONLY via SSH tunnel (from workstation):
ssh -i ~/.ssh/bite-one.pem -L 3000:localhost:3000 ubuntu@<EC2_IP>
# then open http://localhost:3000 — and confirm http://<EC2_IP>:3000 times out
```

### Notes

- The instance public IP changes on stop/start; after a restart run
  `sed -i "s|<OLD_IP>|<NEW_IP>|g" .env && sudo docker compose up -d`.
- Postgres is never exposed: Supavisor binds to loopback and the security
  group only opens 443/22 anyway.

### Teardown

```
cd bite-one/supabase && sudo docker compose down -v   # removes db volumes
```

(Terminating the EC2 instance — T4 teardown — removes everything as well.)

---

## 6. Caddy TLS via sslip.io (T6)

**Component:** Caddy `2.10.2` (pinned; upstream overlay
`supabase/docker-compose.caddy.yml`) terminating TLS on 443 for
`api.<EC2_IP>.sslip.io` and proxying Supabase API paths to Kong. The
certificate comes from Let's Encrypt via the **TLS-ALPN-01** challenge, which
works with only port 443 open (no port 80 needed). sslip.io resolves the
IP-embedded hostname with no DNS setup.

Our Caddyfile (`supabase/volumes/proxy/caddy/Caddyfile`) proxies only
`/auth/v1/*, /rest/v1/*, /graphql/v1, /realtime/v1/*, /storage/v1/*,
/functions/v1/*, /mcp, /sso/*` — every other path (including Studio) is 404.

### Rebuild

On the EC2 host (after section 5):

```
cd bite-one/supabase
sed -i "s|^COMPOSE_FILE=.*$|COMPOSE_FILE=docker-compose.yml:docker-compose.bite-one.yml:docker-compose.caddy.yml|" .env
sudo docker compose up -d
sudo docker logs supabase-caddy 2>&1 | grep -i "certificate obtained"
```

(`PROXY_DOMAIN` was already set to `api.<EC2_IP>.sslip.io` in section 5.)

### Verify

From any machine:

```
curl -sS -o /dev/null -w "%{http_code} verify=%{ssl_verify_result}\n" https://api.<EC2_IP>.sslip.io/rest/v1/
# expect: 401 verify=0  (valid chain; 401 = Kong wants an API key)
curl https://api.<EC2_IP>.sslip.io/          # expect: 404 (Studio not served)
```

### Teardown

Remove `docker-compose.caddy.yml` from `COMPOSE_FILE` in `.env`, then
`sudo docker compose up -d --remove-orphans`. The cert is ephemeral — nothing
to clean up (Let's Encrypt certs expire on their own).

---

## 7. Schema + RLS + two-user probe (T7 / D4)

**Components (no new cloud resources):**

- `sql/001_notes_rls.sql` — `public.notes` table (id, user_id → auth.users,
  content, created_at) with owner-only RLS on all four verbs; `anon` revoked
  entirely; `user_id` defaults to `auth.uid()`.
- `scripts/seed-test-users.sh` — creates test users
  `usera@biteone.test` / `userb@biteone.test` (GoTrue admin API) and seeds two
  rows for userA. Test-only credentials; this backend never holds real data.
- `scripts/rls-probe.mjs` — the two-user isolation probe (Node 18+).
- `docs/rls-probe-run.txt` — committed output of a passing run (AC 4).
- `scripts/apply-migrations.sh` — idempotent migration runner: applies unapplied
  `sql/*.sql` in filename order, each in one transaction, tracked in
  `public._migrations` (revoked from `anon`/`authenticated`). A cron on the EC2
  host pulls `master` every 2 minutes and runs it, so SQL merged through the
  normal PR gate reaches the database automatically — no manual psql step.

### Rebuild + Verify

```
# on the EC2 host
cd ~/bite-one
bash scripts/apply-migrations.sh          # applies everything in sql/, in order
cd supabase && sh ../scripts/seed-test-users.sh

# install the auto-migration cron (ubuntu user):
( crontab -l 2>/dev/null | grep -v apply-migrations ; \
  echo '*/2 * * * * cd /home/ubuntu/bite-one && git pull --ff-only -q origin master && bash scripts/apply-migrations.sh >> /home/ubuntu/migrate.log 2>&1' ) | crontab -

# from any machine (Node 18+)
node scripts/rls-probe.mjs https://api.<EC2_IP>.sslip.io <ANON_KEY>
# expect: all assertions PASS
```

### Teardown

```
sudo docker exec -i supabase-db psql -U postgres -d postgres -c "drop table if exists public.notes cascade; drop table if exists public._migrations;"
# remove the auto-migration cron:
crontab -l | grep -v apply-migrations | crontab -
# test users can be deleted in Studio (Auth) or via the GoTrue admin API
```

---

## 8. GitHub repo + protected branch (T8)

**Resources (GitHub, free):** repo `JaithraSarma/bite-one` (public — branch
protection requires a public repo on the Free plan), branch protection on
`master`, and two Actions **variables** (not secrets):
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. The anon key is public by
design — it ships inside the client JS bundle; RLS is the security boundary.

### Rebuild

```
gh repo create <owner>/bite-one --public --source . --push
gh variable set VITE_SUPABASE_URL --body "https://api.<EC2_IP>.sslip.io"
gh variable set VITE_SUPABASE_ANON_KEY --body "<ANON_KEY>"
# branch protection (after the first commit containing .github/workflows):
gh api -X PUT repos/<owner>/bite-one/branches/master/protection --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["build-and-smoke"] },
  "enforce_admins": true,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

### Deviation (D-S1) from SOW v1.5

The SOW assumes a client-provided GitHub org with a bot account and a named
human approver. This build runs under a single personal account
(`JaithraSarma`) at the owner's instruction, so:

- `required_approving_review_count` is **0** (GitHub forbids self-approval,
  and no second account exists). Direct pushes are still rejected for
  everyone including admins, CI is still a required check, and every merge is
  a deliberate human action through a PR.
- "Bot cannot approve or merge" is not demonstrable — no bot account exists.
  In a client org, set `required_approving_review_count: 1` and do NOT grant
  the bot the ability to approve (it's a non-collaborator or has no review
  permission), which restores full AC 5.

### Verify

```
git commit --allow-empty -m test && git push   # -> GH006 rejected
gh secret list                                  # -> empty (AC 9)
```

### Teardown

`gh repo delete <owner>/bite-one` (variables and protection go with it).

---

## 9–10. CI + OIDC deploy to S3/CloudFront (T9, T10)

**Resources:**

| Resource | Value in this build | Cost |
|---|---|---|
| S3 bucket | `bite-one-spa-578257747901` (private; BlockPublicAccess all-on) | pennies |
| CloudFront OAC | `bite-one-oac` (`EWEORB3XKBKL0`) | free |
| CloudFront distribution | `E2K8F419SW31FK` → `d13x7u80swb2x7.cloudfront.net` (PriceClass_200, default domain) | pennies |
| IAM OIDC provider | `token.actions.githubusercontent.com` | free |
| IAM role | `bite-one-deploy` | free |

**OIDC role trust policy (D5)** — locked to this repo AND branch, no wildcard:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:JaithraSarma/bite-one:ref:refs/heads/master"
      }
    }
  }]
}
```

**Role permissions (inline `bite-one-deploy-perms`):** `s3:PutObject` +
`s3:DeleteObject` on `arn:aws:s3:::<bucket>/*`, `s3:ListBucket` on the bucket,
`cloudfront:CreateInvalidation` on the one distribution. Nothing else.

### Rebuild

```
# bucket (private)
aws s3api create-bucket --bucket bite-one-spa-<ACCOUNT_ID> --region ap-south-1 \
  --create-bucket-configuration LocationConstraint=ap-south-1
aws s3api put-public-access-block --bucket bite-one-spa-<ACCOUNT_ID> \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# OIDC provider + role
aws iam create-open-id-connect-provider --url https://token.actions.githubusercontent.com --client-id-list sts.amazonaws.com
aws iam create-role --role-name bite-one-deploy --assume-role-policy-document file://trust-policy.json
aws iam put-role-policy --role-name bite-one-deploy --policy-name bite-one-deploy-perms --policy-document file://deploy-perms.json

# CloudFront: OAC + distribution (default domain, OAC to the bucket,
# 403/404 -> /index.html for SPA routing), then bucket policy allowing
# principal cloudfront.amazonaws.com with AWS:SourceArn = distribution ARN.
aws cloudfront create-origin-access-control --origin-access-control-config \
  Name=bite-one-oac,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3
aws cloudfront create-distribution --distribution-config file://distconfig.json
aws s3api put-bucket-policy --bucket bite-one-spa-<ACCOUNT_ID> --policy file://bucket-policy.json
```

The exact JSON files used by this build are reproduced in the repo history
(commit `2aa07f0` context) and in `.github/workflows/deploy.yml`, which
contains the account-specific ARNs.

### Verify (AC 6, 7, 9)

1. PR with a failing test → `build-and-smoke` red → merge blocked.
2. Fix commit → green. Merge → `deploy` workflow runs (OIDC, no secrets) →
   CloudFront URL serves the new build well within 5 minutes.
3. `gh secret list` is empty; bucket rejects direct public access
   (only CloudFront's OAC may `GetObject`).

### Teardown

```
aws s3 rm s3://bite-one-spa-<ACCOUNT_ID> --recursive
aws s3api delete-bucket --bucket bite-one-spa-<ACCOUNT_ID>
# CloudFront: disable first, wait Deployed, then delete
aws cloudfront get-distribution-config --id <DIST_ID>   # take ETag, set Enabled=false
aws cloudfront update-distribution --id <DIST_ID> --if-match <ETAG> --distribution-config file://disabled.json
aws cloudfront wait distribution-deployed --id <DIST_ID>
aws cloudfront delete-distribution --id <DIST_ID> --if-match <NEW_ETAG>
aws cloudfront delete-origin-access-control --id <OAC_ID> --if-match <OAC_ETAG>
aws iam delete-role-policy --role-name bite-one-deploy --policy-name bite-one-deploy-perms
aws iam delete-role --role-name bite-one-deploy
aws iam delete-open-id-connect-provider --open-id-connect-provider-arn arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com
```

---

## Full-account teardown order

1. Section 9–10 teardown (CloudFront, S3, IAM role, OIDC provider)
2. Section 4 teardown (EC2 instance, security group, key pair) — removes
   Supabase and Caddy with it
3. Section 8 teardown (GitHub repo) — optional; the repo is the deliverable
4. Section 1 teardown (budget) — last, after billing settles
