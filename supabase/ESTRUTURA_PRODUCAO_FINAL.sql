-- ==========================================
-- BACKUP DE ESTRUTURA - GETLEADS
-- DATA: 17/01/2026
-- VERSÃO: 1.0 (ESTÁVEL)
-- ==========================================

-- 1. TABELAS BASE (Caso precise recriar do zero)
CREATE TABLE IF NOT EXISTS public.projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES auth.users(id),
    name text NOT NULL,
    niche text,
    mission text,
    global_objectives text,
    philosophical_goals text,
    constraints text,
    automation_policy text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES auth.users(id),
    project_id uuid REFERENCES public.projects(id),
    name text NOT NULL,
    description text,
    icp jsonb DEFAULT '{"text": ""}'::jsonb,
    pain_map jsonb DEFAULT '{"text": ""}'::jsonb,
    decision_type text DEFAULT 'considered',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.strategy_versions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES auth.users(id),
    project_id uuid REFERENCES public.projects(id),
    strategy jsonb NOT NULL,
    version int DEFAULT 1,
    status text DEFAULT 'draft',
    created_at timestamptz DEFAULT now()
);

-- 2. VIEWS (Ajustadas para o Frontend)
DROP VIEW IF EXISTS public.strategies CASCADE;
CREATE OR REPLACE VIEW public.strategies WITH (security_invoker = on) AS 
SELECT 
    id, 
    tenant_id, 
    project_id, 
    (strategy->>'name') as name, 
    (strategy->>'description') as description,
    (strategy->>'type') as strategy_type,
    (strategy->>'hypothesis') as hypothesis,
    status, 
    version, 
    created_at 
FROM public.strategy_versions;

-- 3. PERMISSÕES E RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_versions ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Total (Simplificadas para Desenvolvimento)
DROP POLICY IF EXISTS "Acesso Total Projetos" ON public.projects;
CREATE POLICY "Acesso Total Projetos" ON public.projects FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso Total Produtos" ON public.products;
CREATE POLICY "Acesso Total Produtos" ON public.products FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso Total Estrategias" ON public.strategy_versions;
CREATE POLICY "Acesso Total Estrategias" ON public.strategy_versions FOR ALL USING (true);

-- 4. GRANTS
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.strategy_versions TO authenticated;
GRANT ALL ON public.strategies TO authenticated;
