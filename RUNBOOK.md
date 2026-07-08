# RUNBOOK — Bite One (SOW-KH-002)

One page. For rebuild-from-scratch or teardown, see [SETUP.md](SETUP.md).

## The pipeline in five steps

1. **Spec** — Open WebUI (http://localhost:3000 on the workstation) → model
   "SPA Spec" → type a one-line app idea → get a one-page spec. Commit it to
   `specs/`.
2. **Generate** — Dyad → model "Claude Sonnet 4.6 (gen key)" → paste the spec
   with the wiring rules from `prompts/` → app appears in `~/dyad-apps/<name>`.
3. **Import** — copy the app into `app/` on a branch (convert to npm:
   `npm install` for the lockfile), keep the Playwright smoke test passing.
   If the app needs new tables/policies, add them as `sql/NNN_name.sql` in the
   same branch — schema rides the same PR as the code.
4. **PR** — push the branch, open a PR. The `build-and-smoke` check must go
   green; direct pushes to `master` are rejected for everyone.
5. **Merge** — a human merges. GitHub Actions assumes the OIDC role, builds,
   syncs to S3, invalidates CloudFront. Live at the CloudFront URL in ~1 min.
   Any new `sql/*.sql` is applied to the database automatically within ~2 min
   (see "Database migrations" below) — nothing to run by hand.

**Live URL:** https://d13x7u80swb2x7.cloudfront.net

## Database migrations (automatic)

A cron on the EC2 host (user `ubuntu`) pulls `master` every 2 minutes and runs
`scripts/apply-migrations.sh`, which applies any not-yet-applied `sql/*.sql`
in filename order — each file in a single transaction, recorded in
`public._migrations` so it runs exactly once.

- **Add a migration:** commit `sql/NNN_descriptive_name.sql` (next number) in
  your PR. Write it idempotent (`IF NOT EXISTS` / `DROP POLICY IF EXISTS`)
  as a second line of defense. Merged → live in ≤2 minutes.
- **Check what's applied:** on the host,
  `docker exec supabase-db psql -U postgres -tAc 'select * from public._migrations'`
- **Logs:** `/home/ubuntu/migrate.log` on the host.
- **Never edit an applied file** — it won't re-run; add a new numbered file.

## Start / stop the EC2 host (save money when idle)

```
aws ec2 stop-instances  --instance-ids i-07c435d2dea9ad23f          # ~$0.10/hr -> $0
aws ec2 start-instances --instance-ids i-07c435d2dea9ad23f
aws ec2 describe-instances --instance-ids i-07c435d2dea9ad23f \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text
```

⚠️ The public IP changes on restart. After starting:

```
ssh -i ~/.ssh/bite-one.pem ubuntu@<NEW_IP> \
  'cd bite-one/supabase && sed -i "s|<OLD_IP>|<NEW_IP>|g" .env && sudo docker compose up -d'
gh variable set VITE_SUPABASE_URL --body "https://api.<NEW_IP>.sslip.io" --repo JaithraSarma/bite-one
```

then re-deploy (any merge to master, or `gh workflow run` is not configured —
push a trivial PR) so the SPA points at the new API hostname. Caddy fetches a
fresh certificate for the new sslip.io name automatically. The auto-migration
cron survives stop/start unchanged (it references the repo path, not the IP).

If you also disabled the CloudFront distribution while pausing, re-enable it
(takes ~5 min to propagate; while disabled the URL doesn't resolve):

```
$out = aws cloudfront get-distribution-config --id E2K8F419SW31FK | ConvertFrom-Json
$cfg = $out.DistributionConfig; $cfg.Enabled = $true
$cfg | ConvertTo-Json -Depth 32 | Set-Content cf.json -Encoding utf8
aws cloudfront update-distribution --id E2K8F419SW31FK --distribution-config file://cf.json --if-match $out.ETag
Remove-Item cf.json
```

(Disabling it while paused is optional — an enabled but idle distribution
costs $0; only requests/transfer are billed.)

## Check LLM spend (LiteLLM)

Budgets: `spec` = $2, `gen` = $5. Master key is in the workstation `.env`.

```
curl "http://localhost:4000/key/info?key=<KEY>" -H "Authorization: Bearer <LITELLM_MASTER_KEY>"
```

or open the dashboard: http://localhost:4000/ui (login with the master key).
A key over budget returns `budget_exceeded` — other keys are unaffected.

## Supabase Studio (SSH tunnel only — never public)

```
ssh -i ~/.ssh/bite-one.pem -L 3000:localhost:3000 ubuntu@<EC2_IP>
# then open http://localhost:3000  (conflicts with local Open WebUI? use -L 3001:localhost:3000)
```

## Health checks

```
# EC2 stack
ssh -i ~/.ssh/bite-one.pem ubuntu@<EC2_IP> 'cd bite-one/supabase && sudo docker compose ps'
# API over TLS
curl -s -o /dev/null -w "%{http_code} verify=%{ssl_verify_result}\n" https://api.<EC2_IP>.sslip.io/rest/v1/
# RLS still holds (run from anywhere with Node 18+)
node scripts/rls-probe.mjs https://api.<EC2_IP>.sslip.io <ANON_KEY>
# workstation stack
docker compose ps
```
