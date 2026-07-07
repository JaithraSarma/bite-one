# Bite One: The AI SPA Producer (SOW-KH-002 v1.5)

Pipeline: a team member writes a spec in **Open WebUI** → **Dyad** generates a
SPA wired to **self-hosted Supabase** → the app ships to **CloudFront** only
through a protected branch, a passing CI check, and one human approval.

All pipeline and deployed components are open source. The only exceptions are
the model credential (Anthropic, routed through LiteLLM with per-key budgets)
and the authoring tool (Dyad).

- **[SETUP.md](SETUP.md)** — every cloud resource with exact rebuild + teardown steps
- **[RUNBOOK.md](RUNBOOK.md)** — day-2 operations (added at the end of the bite)
- `docker-compose.yml` — local LiteLLM + Open WebUI stack (pinned images)
- `litellm/config.yaml` — model routing; API key via env only
- `scripts/` — key creation, RLS probe, verification scripts

No secrets live in this repo. `.env` is gitignored; AWS access from CI is
GitHub OIDC only.
