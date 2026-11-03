-- Baseline schema for the Value Cards Study.
--
-- The original tables, role setup and researcher allowlist were created in the
-- Lovable project this repo was remixed from, so they were never in this repo's
-- migrations. This file recreates them so a fresh backend (e.g. a new Lovable
-- project) works. Every statement is idempotent, so running it against the
-- existing backend is harmless.
--
-- Runs before 20260820155855_*.sql, which attaches the allowlist trigger to
-- auth.users, and 20260820155911_*.sql, which revokes direct execute rights.

-- Roles ---------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.app_role AS ENUM ('researcher');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

-- Researchers' reads of sessions go through has_role. 20260820155911_*.sql
-- revokes it from anon and PUBLIC, so signed-in users need an explicit grant.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Signed-in users can read their own roles (the researcher view checks this).
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
CREATE POLICY "Users can read their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT ON public.user_roles TO authenticated;

-- Study sessions --------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  condition text NOT NULL,
  deck_version text,
  dealt_hand jsonb,
  final_hand jsonb,
  top_selection jsonb,
  total_offers integer,
  successful_trades integer,
  trades jsonb,
  timing jsonb,
  partner_rankings jsonb,
  raw jsonb
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Participants are anonymous: anyone may add a session, nobody else's rows are readable.
DROP POLICY IF EXISTS "Anyone can insert a session" ON public.sessions;
CREATE POLICY "Anyone can insert a session"
  ON public.sessions FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only researchers can read session data.
DROP POLICY IF EXISTS "Researchers can read sessions" ON public.sessions;
CREATE POLICY "Researchers can read sessions"
  ON public.sessions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'researcher'));

GRANT INSERT ON public.sessions TO anon, authenticated;
GRANT SELECT ON public.sessions TO authenticated;

-- Researcher allowlist ----------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.researcher_allowlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS on with no policies: only the service role and SECURITY DEFINER functions can read it.
ALTER TABLE public.researcher_allowlist ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.researcher_allowlist TO service_role;

INSERT INTO public.researcher_allowlist (email) VALUES
  ('maxinegill@g.harvard.edu'),
  ('tperry@fas.harvard.edu'),
  ('tperry@g.harvard.edu'),
  ('david_kidd@gse.harvard.edu'),
  ('ksiegelstechler@fas.harvard.edu'),
  ('arushisaxena@fas.harvard.edu'),
  ('arushisaxena@g.harvard.edu'),
  ('mlopes@fas.harvard.edu'),
  ('jminer@fas.harvard.edu'),
  ('palmiter@g.harvard.edu'),
  ('brian_palmiter@fas.harvard.edu'),
  ('amelia.bertaska@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Grants the researcher role when an allowlisted email is confirmed.
-- The trigger on auth.users is created in 20260820155855_*.sql.
CREATE OR REPLACE FUNCTION public.grant_researcher_for_allowlist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.researcher_allowlist a
       WHERE lower(a.email) = lower(NEW.email)
     ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'researcher')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
