-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- default auth.uid() so clients never need to supply it
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  event_date date NOT NULL,
  location text,
  description text,
  status text NOT NULL DEFAULT 'Planning' CHECK (status IN ('Planning', 'Confirmed', 'Completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policies for events (using optimized caching subquery format)
DROP POLICY IF EXISTS "Users can manage their own events" ON public.events;
DROP POLICY IF EXISTS events_select_own ON public.events;
CREATE POLICY events_select_own ON public.events FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS events_insert_own ON public.events;
CREATE POLICY events_insert_own ON public.events FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS events_update_own ON public.events;
CREATE POLICY events_update_own ON public.events FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS events_delete_own ON public.events;
CREATE POLICY events_delete_own ON public.events FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- Restrict events table permissions
REVOKE ALL ON public.events FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;


-- Create contact_inquiries table
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on contact_inquiries
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Policies for contact_inquiries
DROP POLICY IF EXISTS "Anyone can insert contact inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Users can manage their own contact inquiries" ON public.contact_inquiries;

DROP POLICY IF EXISTS inquiries_insert ON public.contact_inquiries;
CREATE POLICY inquiries_insert ON public.contact_inquiries FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS inquiries_manage_own ON public.contact_inquiries;
CREATE POLICY inquiries_manage_own ON public.contact_inquiries FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
