# Client Demo Guide — Bite One (SOW-KH-002 v1.5)

What to present, in what order, with the exact commands and links.

## The two links

| What | Link | Who uses it |
|---|---|---|
| **The product** (proof the pipeline works) | https://d13x7u80swb2x7.cloudfront.net | Client — no setup: sign up with any email + password, add notes, reload |
| **The deliverable of record** | https://github.com/JaithraSarma/bite-one | Client — the repo IS the deliverable (SOW §7); everything rebuilds from it |

There is deliberately **no public link to the factory itself**: Open WebUI and
Dyad run on the developer workstation (that's the design — the model key never
leaves the local LiteLLM). "Build any website" is demonstrated live by
screen-share (see the 15-minute script below), and any team member can stand
up their own factory from SETUP.md §2–3 in ~20 minutes.

## 15-minute live demo script

1. **The product first (2 min).** Open the CloudFront URL. Sign up as a fresh
   user, add two notes, hard-reload — data persists. Open a private window,
   sign up as a second user — the first user's notes are invisible (RLS).
2. **The factory (5 min).** Screen-share the workstation:
   - Open WebUI (localhost:3000) → "SPA Spec" model → type a one-line idea →
     one-page spec appears. Show `specs/quicknotes-spec.md` in the repo.
   - Dyad → show the generated app; show `app/src/lib/supabase.ts` (env vars
     only, no keys in code).
   - LiteLLM spend log: `/key/info` for spec + gen keys — every model call is
     on a budgeted, named key.
3. **The backend is real (4 min).** See "Verifying the backend" below — run
   the probe live, then the Studio tunnel.
4. **The gate (4 min).** Show PR #1 in GitHub: red CI on the broken commit,
   merge blocked, green after the fix, merge → Actions deploy run (OIDC, no
   secrets) → CloudFront updated. Try `git push` to master live — rejected.

## Verifying the backend (and showing it)

**1. It answers over TLS from anywhere:**

```
curl -s -o /dev/null -w "%{http_code} tls_ok=%{ssl_verify_result}\n" https://api.13.201.34.229.sslip.io/rest/v1/
# 401 tls_ok=0  -> valid Let's Encrypt cert; Kong wants an API key
```

**2. RLS proof, live (Node 18+, from any machine):**

```
node scripts/rls-probe.mjs https://api.13.201.34.229.sslip.io <ANON_KEY>
# 5/5 PASS — userB gets zero of userA's rows, forged insert -> 403
```

**3. Show the actual database (Supabase Studio, SSH tunnel only):**

```
ssh -i ~/.ssh/bite-one.pem -L 3001:localhost:3000 ubuntu@13.201.34.229
# open http://localhost:3001 -> Table Editor -> notes (rows with user_id),
# Authentication -> Users (the signed-up accounts)
```

**4. Show it is NOT publicly reachable (the security constraint):**

```
curl -m 5 http://13.201.34.229:3000   # Studio: times out
curl -m 5 telnet://13.201.34.229:5432 # Postgres: times out
curl https://api.13.201.34.229.sslip.io/            # 404 — API paths only
```

**5. Data really lives on the EC2 Postgres:**

```
ssh -i ~/.ssh/bite-one.pem ubuntu@13.201.34.229 \
  "sudo docker exec supabase-db psql -U postgres -c 'select user_id, content, created_at from public.notes order by created_at desc limit 5;'"
```

## Component map (what to say each piece is)

| Component | One-liner for the client | Where to show it |
|---|---|---|
| LiteLLM | The single, budgeted door to the model — keys `spec` ($2) and `gen` ($5), spend logged per key | `docker-compose.yml`, `/key/info` output |
| Open WebUI | The spec room — one saved prompt turns an idea into a buildable one-page spec | localhost:3000 + `prompts/spa-spec-system-prompt.md` |
| Dyad | The generator — writes the whole SPA against the existing backend | Dyad UI + `app/` |
| Supabase (self-hosted) | The real backend: Postgres, auth, REST, RLS — on our EC2, not a SaaS | Studio tunnel + probe script |
| Caddy | The padlock: free auto-renewing TLS on the API with zero DNS setup | browser padlock on the sslip.io URL |
| GitHub Actions + protection | The gate: no code reaches users without a PR, a green check, and a human merge | PR #1 history |
| OIDC → S3 → CloudFront | The road: merge deploys in ~1 minute with zero stored cloud secrets | Actions run + `gh secret list` (empty) |

## Known deviations to state up front

- **D-S1** (SETUP.md §8): built in a personal GitHub account at the owner's
  direction — required approvals set to 0 because GitHub forbids
  self-approval and no bot/org was provided (SOW §6 makes the org+bot a
  Client-provided prerequisite). Every other protection is active and
  admin-enforced. Restoring approvals=1 + bot test is a 1-minute change once
  the client org exists.
- **sslip.io hostname** is the SOW's own explicitly temporary measure —
  replaced by a real domain in Bite Two.

## After acceptance (SOW obligations)

- Environment stays up 14 days for evaluation (EC2 ≈ $2.40/day while
  running; RUNBOOK has stop/start if you want to pause the meter — note the
  IP-change procedure).
- Then: teardown per SETUP.md, confirm by chat, including destruction of the
  local LiteLLM config holding the developer's model key.
