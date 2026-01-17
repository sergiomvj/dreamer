-- Habilitar RLS em tudo (caso não esteja)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- Política para permitir que qualquer usuário autenticado crie um Tenant
CREATE POLICY "Users can create tenants" ON public.tenants
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Política para permitir que usuários vejam os Tenants dos quais são membros
CREATE POLICY "Users can view their own tenants" ON public.tenants
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_members
            WHERE tenant_members.tenant_id = tenants.id
            AND tenant_members.user_id = auth.uid()
        )
    );

-- Política para permitir inserção em tenant_members para o próprio usuário
CREATE POLICY "Users can join tenants" ON public.tenant_members
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Política para visualizar membros do mesmo tenant
CREATE POLICY "Users can view members of their tenants" ON public.tenant_members
    FOR SELECT TO authenticated
    USING (
        tenant_id IN (
            SELECT tm.tenant_id FROM public.tenant_members tm
            WHERE tm.user_id = auth.uid()
        )
    );
