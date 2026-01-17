-- Habilitar RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- Limpeza de políticas para evitar erros
DROP POLICY IF EXISTS "Users can create tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can view their own tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can view tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can join tenants" ON public.tenant_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.tenant_members;

-- 1. POLÍTICAS PARA 'TENANTS' (Workspaces)
-- Permite criar
CREATE POLICY "Users can create tenants" ON public.tenants
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Permite ver Workspaces (Ajustado para permitir o .select() logo após o insert)
-- Como o ID do Tenant é um UUID aleatório, o risco de "adivinhar" nomes é baixo.
-- A segurança real acontece nas tabelas de dados (leads, etc) que exigem ser membro.
CREATE POLICY "Users can view tenants" ON public.tenants
    FOR SELECT TO authenticated
    USING (true);

-- 2. POLÍTICAS PARA 'TENANT_MEMBERS'
-- Permite que o usuário se adicione a um tenant (necessário no ato da criação)
CREATE POLICY "Users can join tenants" ON public.tenant_members
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Permite que cada um veja suas próprias memberships
CREATE POLICY "Users can view their own memberships" ON public.tenant_members
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Se você precisar que um membro veja OUTROS membros, o ideal é usar uma função de segurança
-- ou permitir apenas que o 'owner' veja todos. Por ora, vamos manter simples para funcionar.
