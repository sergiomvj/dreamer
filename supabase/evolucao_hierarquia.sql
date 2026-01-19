-- ==========================================
-- EVOLUÇÃO DA HIERARQUIA: CLIENTES > PROJETOS > PRODUTOS
-- ==========================================

-- 1. CRIAR TABELA DE PROJETOS (SUB-ENTIDADE DE CLIENTES / ANTIGOS PROJECTS)
CREATE TABLE IF NOT EXISTS public.client_projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    blueprint_id uuid REFERENCES public.execution_blueprints(id),
    created_at timestamptz DEFAULT now()
);

-- 2. ADICIONAR REFERÊNCIA EM PRODUCTS PARA O NOVO PROJETO
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS client_project_id uuid REFERENCES public.client_projects(id) ON DELETE CASCADE;

-- 3. HABILITAR RLS NO NOVO NÍVEL
ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso por Workspace em Projetos de Clientes" ON public.client_projects;
CREATE POLICY "Acesso por Workspace em Projetos de Clientes" ON public.client_projects
    FOR ALL USING (
        client_id IN (SELECT id FROM public.projects)
    );

-- 4. GRANTS
GRANT ALL ON public.client_projects TO authenticated;
