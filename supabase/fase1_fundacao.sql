-- ==========================================
-- FASE 1: FUNDAÇÃO & PLANEJAMENTO ESTRATÉGICO
-- IMPLEMENTAÇÃO DE SCHEMAS E RBAC
-- ==========================================

-- 1. WORKSPACES (Evolução de Tenants)
CREATE TABLE IF NOT EXISTS public.workspaces (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text UNIQUE,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    owner_id uuid REFERENCES auth.users(id)
);

-- 2. RBAC (Role Based Access Control)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
    role text CHECK (role IN ('admin', 'gestor', 'operador', 'auditor')),
    UNIQUE(user_id, workspace_id)
);

-- 3. ARQUITETURA DE PRODUTOS & OFERTAS (Extensão de Products)
-- Adicionando colunas de controle estratégico à tabela existente ou nova
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_structure jsonb DEFAULT '{"cpa_max": 0, "margin": 0}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS friction_level text CHECK (friction_level IN ('low', 'medium', 'high'));
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS offer_type text CHECK (offer_type IN ('entry', 'core', 'upsell', 'cross-sell'));

-- 4. MAPEAMENTO DE PÚBLICO & CONSCIÊNCIA
CREATE TABLE IF NOT EXISTS public.audience_mapping (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    name text NOT NULL,
    awareness_level text CHECK (awareness_level IN ('unaware', 'problem_aware', 'solution_aware', 'product_aware', 'most_aware')),
    pains jsonb DEFAULT '[]'::jsonb,
    desires jsonb DEFAULT '[]'::jsonb,
    urgency_level int CHECK (urgency_level BETWEEN 1 AND 10),
    created_at timestamptz DEFAULT now()
);

-- 5. EXECUTION BLUEPRINTS (O Contrato Final)
CREATE TABLE IF NOT EXISTS public.execution_blueprints (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    strategy_id uuid REFERENCES public.strategy_versions(id) ON DELETE CASCADE,
    version text NOT NULL,
    payload jsonb NOT NULL, -- O JSON estruturado para o N8N
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at timestamptz DEFAULT now(),
    published_at timestamptz
);

-- 6. MATURIDADE DO NEGÓCIO (Onboarding Data)
CREATE TABLE IF NOT EXISTS public.business_maturity (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
    stage text CHECK (stage IN ('validation', 'growth', 'scale')),
    sales_model text CHECK (sales_model IN ('lp_direct', 'vsl', 'consultive', 'low_touch')),
    avg_ticket numeric,
    operational_capacity int,
    marketing_history jsonb DEFAULT '{}'::jsonb,
    updated_at timestamptz DEFAULT now()
);

-- 7. REGRAS DE RLS GRANULARES (Enforcement por Role)

-- Habilitar RLS em tudo
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audience_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_maturity ENABLE ROW LEVEL SECURITY;

-- Exemplo de Política: Somente membros do workspace podem ver
DROP POLICY IF EXISTS "Membros acessam seus workspaces" ON public.workspaces;
CREATE POLICY "Membros acessam seus workspaces" ON public.workspaces
    FOR ALL USING (
        id IN (SELECT workspace_id FROM public.user_roles WHERE user_id = auth.uid())
        OR owner_id = auth.uid()
    );

DROP POLICY IF EXISTS "Acesso por Role em Projetos" ON public.projects;
CREATE POLICY "Acesso por Role em Projetos" ON public.projects
    FOR ALL USING (
        tenant_id = auth.uid() -- Backwards compatibility
        OR EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND workspace_id IS NOT NULL -- Precisamos vincular projects a workspace_id no futuro
        )
    );

-- 8. GRANTS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
