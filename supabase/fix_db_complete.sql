-- 1. CRIAR TIPOS CASO NÃO EXISTAM (Necessário para a tabela leads)
DO $$ BEGIN
    CREATE TYPE lead_intent AS ENUM ('cold', 'warm', 'hot');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('new', 'open', 'qualified', 'disqualified', 'customer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. CRIAR TABELA LEADS (Caso esteja faltando)
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  project_id uuid NOT NULL REFERENCES public.projects(id),
  product_id uuid REFERENCES public.products(id),
  strategy_id uuid REFERENCES public.strategies(id),
  full_name text,
  email text,
  phone text,
  external_id text,
  source jsonb NOT NULL DEFAULT '{}'::jsonb,
  intent lead_intent NOT NULL DEFAULT 'cold',
  score numeric NOT NULL DEFAULT 0,
  status lead_status NOT NULL DEFAULT 'new',
  next_best_action jsonb NOT NULL DEFAULT '{}'::jsonb,
  requires_human boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. RESET E CONFIGURAÇÃO DE SEGURANÇA (RLS)
-- Workspace & Membresia
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenants_select" ON public.tenants;
CREATE POLICY "tenants_select" ON public.tenants FOR SELECT USING (true);
DROP POLICY IF EXISTS "tenants_insert" ON public.tenants;
CREATE POLICY "tenants_insert" ON public.tenants FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "members_select" ON public.tenant_members;
CREATE POLICY "members_select" ON public.tenant_members FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "members_insert" ON public.tenant_members;
CREATE POLICY "members_insert" ON public.tenant_members FOR INSERT WITH CHECK (user_id = auth.uid());

-- Segurança de Dados (Isolamento por Tenant)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leads_tenant_isolation" ON public.leads;
CREATE POLICY "leads_tenant_isolation" ON public.leads FOR SELECT 
USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()));

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects_tenant_isolation" ON public.projects;
CREATE POLICY "projects_tenant_isolation" ON public.projects FOR SELECT 
USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()));

ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "accounts_tenant_isolation" ON public.ad_accounts;
CREATE POLICY "accounts_tenant_isolation" ON public.ad_accounts FOR SELECT 
USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()));
