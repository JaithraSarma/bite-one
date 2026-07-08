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
4. **PR** — push the branch, open a PR. The `build-and-smoke` check must go
   green; direct pushes to `master` are rejected for everyone.
5. **Merge** — a human merges. GitHub Actions assumes the OIDC role, builds,
   syncs to S3, invalidates CloudFront. Live at the CloudFront URL in ~1 min.

**Live URL:** https://d13x7u80swb2x7.cloudfront.net

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
fresh certificate for the new sslip.io name automatically.

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
