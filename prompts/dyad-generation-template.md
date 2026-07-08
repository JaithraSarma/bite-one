# Dyad generation template

Paste into Dyad: **the spec from Open WebUI first**, then this block verbatim
(replace `<AppTitle>` with the app name from the spec). The spec says WHAT to
build; this block says HOW to wire it to our stack.

---

Build the app exactly to the spec above, with these wiring rules:

- React + Vite SPA. Use @supabase/supabase-js (pin the version) against an
  EXISTING Supabase backend. Do not create any backend, server code, or SQL —
  the database tables in the spec will already exist, with owner-only
  row-level security enforced server-side.
- Create the Supabase client from environment variables ONLY:
  import.meta.env.VITE_SUPABASE_URL and import.meta.env.VITE_SUPABASE_ANON_KEY.
  Never hardcode the URL or key anywhere.
- Auth: email + password via Supabase Auth (signup, login, logout), exactly
  the screens listed in the spec.
- When inserting rows into user-owned tables, do NOT set user_id — the
  database fills it from the session automatically.
- Set the HTML document title to exactly "<AppTitle>".
- Respect the spec's "Out of scope" list strictly — do not add anything from it.
