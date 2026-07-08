## EventFlow
A single-page event management app where users can plan events, view pricing tiers, and contact the team.

### Users
Event organizers and individuals who want to plan and manage their events online. They browse pricing, reach out via a contact form, and once signed in, create and track their own events from a personal dashboard.

### Screens

1. **Home / Landing Screen** – Public-facing page showing a hero section, a pricing table with three tiers (Basic, Pro, Enterprise) displaying features and monthly costs, and a Contact section with a form (name, email, message) that submits an inquiry saved to the database. Includes a Sign Up / Log In button in the nav.

2. **Auth Screen** – Email + password form toggling between Sign In and Sign Up modes via Supabase Auth. On success, redirects to the Dashboard. Includes a "Back to Home" link.

3. **Dashboard Screen** – Protected screen showing the signed-in users events in a card grid. Each card displays event name, date, location, and status (Planning / Confirmed / Completed). Actions: **Create Event** (opens an inline modal form with fields: name, date, location, description, status), **Edit** an existing event (pre-fills the modal), and **Delete** an event (with a confirmation prompt). No content is visible unless authenticated.

### Data model

**Table: events**
| Column | Type | Notes |
|---|---|---|
| id | uuid PRIMARY KEY DEFAULT gen_random_uuid() | |
| user_id | uuid NOT NULL REFERENCES auth.users(id) | owner |
| name | text NOT NULL | |
| event_date | date NOT NULL | |
| location | text | |
| description | text | |
| status | text NOT NULL DEFAULT 'Planning' | Planning / Confirmed / Completed |
| created_at | timestamptz NOT NULL DEFAULT now() | |

RLS: Users can SELECT, INSERT, UPDATE, and DELETE only rows where `user_id = auth.uid()`.

---

**Table: contact_inquiries**
| Column | Type | Notes |
|---|---|---|
| id | uuid PRIMARY KEY DEFAULT gen_random_uuid() | |
| user_id | uuid REFERENCES auth.users(id) | nullable; set when sender is signed in |
| name | text NOT NULL | |
| email | text NOT NULL | |
| message | text NOT NULL | |
| created_at | timestamptz NOT NULL DEFAULT now() | |

RLS: INSERT is allowed for all (including anonymous); SELECT, UPDATE, DELETE restricted to rows where `user_id = auth.uid()`.

### Out of scope
- Password reset / forgot-password flow
- Team accounts, roles, or shared event access
- File or image uploads (e.g. event banners)
- Calendar or map integrations
- Payment processing for pricing tiers
- Admin panel or inquiry management dashboard
- Email notifications or confirmations
- Guest RSVP or ticketing features
- Offline mode or PWA support
