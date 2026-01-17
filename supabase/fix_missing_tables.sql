-- 1. TIPOS BÁSICOS
DO $$ BEGIN
    CREATE TYPE lead_intent AS ENUM ('cold', 'warm', 'hot');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('new', 'open', 'qualified', 'disqualified', 'customer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. TABELA LEADS (Essencial para o Dashboard)
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  project_id uuid NOT NULL REFERENCES public.projects(id),
  product_id uuid REFERENCES public.products(id),
  full_name text,
  email text,
  phone text,
  external_id text,
  source jsonb NOT NULL DEFAULT '{}'::jsonb,
  intent lead_intent NOT NULL DEFAULT 'cold',
  score numeric NOT NULL DEFAULT 0,
  status lead_status NOT NULL DEFAULT 'new',
  requires_human boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. TABELA PROJECT_BRIEFINGS (Exigida pelo script de Massa de Dados)
CREATE TABLE IF NOT EXISTS public.project_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  target_audience text,
  core_offer text,
  budget_monthly numeric,
  goals text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. ATIVAR RLS E POLÍTICAS DE ISOLAMENTO
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_briefings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_iso" ON public.leads;
CREATE POLICY "leads_iso" ON public.leads FOR ALL 
USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "briefings_iso" ON public.project_briefings;
CREATE POLICY "briefings_iso" ON public.project_briefings FOR ALL 
USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()));

-- Garantir que as tabelas base de Workspace também funcionem
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenants_open_select" ON public.tenants;
CREATE POLICY "tenants_open_select" ON public.tenants FOR SELECT USING (true);
