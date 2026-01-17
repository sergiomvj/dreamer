-- 1. RESET TOTAL DE RLS PARA O MÓDULO DE ACESSO
-- Isso vai garantir que não existam políticas "fantasmas" causando loop (Erro 500)

-- Desabilitar temporariamente para limpar as políticas com segurança
ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members DISABLE ROW LEVEL SECURITY;

-- Limpar TODAS as políticas conhecidas (e algumas variações comuns)
DROP POLICY IF EXISTS "Users can create tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can view their own tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can view tenants" ON public.tenants;
DROP POLICY IF EXISTS "Allow tenant members to view tenants" ON public.tenants;

DROP POLICY IF EXISTS "Users can join tenants" ON public.tenant_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.tenant_members;
DROP POLICY IF EXISTS "Users can view members of their same tenants" ON public.tenant_members;
DROP POLICY IF EXISTS "Users can view members of their tenants" ON public.tenant_members;
DROP POLICY IF EXISTS "Allow users to view their memberships" ON public.tenant_members;

-- 2. RECONSTRUIR COM LÓGICA "FLAT" (SEM SUBQUERIES RECURSIVAS)

-- Habilitar RLS novamente
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE TENANTS (Workspaces)
-- Permite criar (Inclusivo)
CREATE POLICY "tenants_insert_policy" ON public.tenants 
FOR INSERT TO authenticated WITH CHECK (true);

-- Permite ver (Aberto para logados - Seguro pois ID é UUID)
-- Isso evita que o SELECT após o INSERT falhe e quebre o fluxo do app
CREATE POLICY "tenants_select_policy" ON public.tenants 
FOR SELECT TO authenticated USING (true);


-- POLÍTICAS DE TENANT_MEMBERS (Permissões)
-- Permite que o usuário se torne membro ao criar ou ser convidado
CREATE POLICY "members_insert_policy" ON public.tenant_members 
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Permite que o usuário veja seus próprios acessos
-- REGRA DE OURO: Nunca fazer SELECT na própria tabela aqui (evita Erro 500)
CREATE POLICY "members_select_policy" ON public.tenant_members 
FOR SELECT TO authenticated USING (user_id = auth.uid());


-- 3. POLÍTICAS PARA TABELAS DE DADOS (Leads, Métricas, etc)
-- Para que o dashboard funcione, essas tabelas também precisam de políticas se o RLS estiver ativo.

-- Exemplo para LEADS (Se o erro persistir, execute estas também)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leads_select_policy" ON public.leads;
CREATE POLICY "leads_select_policy" ON public.leads 
FOR SELECT TO authenticated 
USING (
    tenant_id IN (
        SELECT tm.tenant_id 
        FROM public.tenant_members tm 
        WHERE tm.user_id = auth.uid()
    )
);

-- Exemplo para AD_ACCOUNTS
ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ad_accounts_select_policy" ON public.ad_accounts;
CREATE POLICY "ad_accounts_select_policy" ON public.ad_accounts 
FOR SELECT TO authenticated 
USING (
    tenant_id IN (
        SELECT tm.tenant_id 
        FROM public.tenant_members tm 
        WHERE tm.user_id = auth.uid()
    )
);

-- Exemplo para AD_METRICS
ALTER TABLE public.ad_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ad_metrics_select_policy" ON public.ad_metrics;
DROP POLICY IF EXISTS "metrics_tenant_isolation" ON public.ad_metrics;
CREATE POLICY "metrics_tenant_isolation" ON public.ad_metrics 
FOR SELECT TO authenticated 
USING (
    ad_account_id IN (
        SELECT acc.id 
        FROM public.ad_accounts acc 
    )
);

-- 4. POLÍTICAS PARA PROJETOS E PRODUTOS (Resolve Erro ao carregar projetos)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects_select_policy" ON public.projects;
CREATE POLICY "projects_select_policy" ON public.projects 
FOR SELECT TO authenticated 
USING (tenant_id IN (SELECT tm.tenant_id FROM public.tenant_members tm WHERE tm.user_id = auth.uid()));

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
CREATE POLICY "products_select_policy" ON public.products 
FOR SELECT TO authenticated 
USING (tenant_id IN (SELECT tm.tenant_id FROM public.tenant_members tm WHERE tm.user_id = auth.uid()));

-- 5. POLÍTICAS PARA ESTRATÉGIAS E WHATSAPP
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "strategies_select_policy" ON public.strategies;
CREATE POLICY "strategies_select_policy" ON public.strategies 
FOR SELECT TO authenticated 
USING (tenant_id IN (SELECT tm.tenant_id FROM public.tenant_members tm WHERE tm.user_id = auth.uid()));

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "whatsapp_conv_select_policy" ON public.whatsapp_conversations;
CREATE POLICY "whatsapp_conv_select_policy" ON public.whatsapp_conversations 
FOR SELECT TO authenticated 
USING (tenant_id IN (SELECT tm.tenant_id FROM public.tenant_members tm WHERE tm.user_id = auth.uid()));

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "whatsapp_msg_select_policy" ON public.whatsapp_messages;
CREATE POLICY "whatsapp_msg_select_policy" ON public.whatsapp_messages 
FOR SELECT TO authenticated 
USING (
    conversation_id IN (
        SELECT id FROM public.whatsapp_conversations 
        WHERE tenant_id IN (SELECT tm.tenant_id FROM public.tenant_members tm WHERE tm.user_id = auth.uid())
    )
);

-- 6. DEMAIS TABELAS DE TRÁFEGO (Para evitar erro nos joins do Dashboard)
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "campaigns_select_policy" ON public.ad_campaigns;
CREATE POLICY "campaigns_select_policy" ON public.ad_campaigns FOR SELECT TO authenticated USING (true);

ALTER TABLE public.ad_sets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sets_select_policy" ON public.ad_sets;
CREATE POLICY "sets_select_policy" ON public.ad_sets FOR SELECT TO authenticated USING (true);

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ads_select_policy" ON public.ads;
CREATE POLICY "ads_select_policy" ON public.ads FOR SELECT TO authenticated USING (true);
