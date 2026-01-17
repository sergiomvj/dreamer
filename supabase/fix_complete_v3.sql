-- ==========================================
-- 1. ESTRUTURA DE BASE (TABELAS FALTANTES)
-- ==========================================

-- Tabela de Produtos (Necessária para a aba de Produtos e Briefing)
CREATE TABLE IF NOT EXISTS public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name text NOT NULL,
    awareness_level text DEFAULT 'unaware',
    product_role text DEFAULT 'core',
    created_at timestamptz DEFAULT now()
);

-- Tabela de Ofertas
CREATE TABLE IF NOT EXISTS public.offers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name text NOT NULL,
    price numeric DEFAULT 0,
    currency text DEFAULT 'BRL',
    is_active boolean DEFAULT true,
    external_link text,
    created_at timestamptz DEFAULT now()
);

-- Tabelas de Ligação para Campanhas (M2M)
CREATE TABLE IF NOT EXISTS public.campaign_strategies (
    campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    strategy_id uuid NOT NULL REFERENCES public.strategy_versions(id) ON DELETE CASCADE,
    PRIMARY KEY (campaign_id, strategy_id)
);

CREATE TABLE IF NOT EXISTS public.campaign_channels (
    campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    PRIMARY KEY (campaign_id, channel_id)
);

-- ==========================================
-- 2. COMPATIBILIDADE DE CÓDIGO (VIEWS)
-- ==========================================

-- View 'strategies' para alinhar o frontend com 'strategy_versions'
DROP VIEW IF EXISTS public.strategies CASCADE;
CREATE OR REPLACE VIEW public.strategies WITH (security_invoker = on) AS 
SELECT 
    id, 
    tenant_id, 
    project_id, 
    strategy->>'name' as name, 
    strategy->>'description' as description,
    created_at 
FROM public.strategy_versions;

-- ==========================================
-- 3. SEGURANÇA (RLS) - CORREÇÃO DEFINITIVA
-- ==========================================

-- Habilitar RLS em tudo
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Política Genérica (Tenant Isolation)
DO $$ 
DECLARE 
    t text;
BEGIN
    -- Lista de tabelas que possuem a coluna 'tenant_id' diretamente
    FOR t IN SELECT table_name FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name IN ('products', 'offers', 'campaigns', 'ad_accounts', 'leads', 'channels', 'projects', 'strategy_versions', 'metrics_daily')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I_iso ON public.%I', t, t);
        EXECUTE format('CREATE POLICY %I_iso ON public.%I FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()))', t, t);
    END LOOP;
END $$;

-- Políticas Especiais (Tabelas sem tenant_id direto)

-- Whatsapp Messages (via Conversations)
DROP POLICY IF EXISTS whatsapp_msg_iso ON public.whatsapp_messages;
CREATE POLICY whatsapp_msg_iso ON public.whatsapp_messages FOR ALL 
USING (
    conversation_id IN (
        SELECT id FROM public.whatsapp_conversations 
        WHERE tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid())
    )
);

-- Ad Metrics (via Ad Accounts)
DROP POLICY IF EXISTS ad_metrics_iso ON public.ad_metrics;
CREATE POLICY ad_metrics_iso ON public.ad_metrics FOR ALL 
USING (
    ad_account_id IN (
        SELECT id FROM public.ad_accounts 
        WHERE tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid())
    )
);

-- Campaign Junctions
DROP POLICY IF EXISTS camp_strat_iso ON public.campaign_strategies;
CREATE POLICY camp_strat_iso ON public.campaign_strategies FOR ALL 
USING (campaign_id IN (SELECT id FROM public.campaigns));

DROP POLICY IF EXISTS camp_chan_iso ON public.campaign_channels;
CREATE POLICY camp_chan_iso ON public.campaign_channels FOR ALL 
USING (campaign_id IN (SELECT id FROM public.campaigns));

-- ==========================================
-- 4. VÍNCULO DE USUÁRIO (Obrigatório para ver dados)
-- ==========================================

-- No SQL Editor, auth.uid() é nulo. Este bloco garante que seu usuário 
-- seja dono de todos os tenants existentes.
INSERT INTO public.tenant_members (tenant_id, user_id, role, is_active)
SELECT t.id, u.id, 'owner', true
FROM public.tenants t, (SELECT id FROM auth.users LIMIT 1) u
ON CONFLICT DO NOTHING;
