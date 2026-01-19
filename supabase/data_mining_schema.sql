-- ==========================================
-- DATA MINING INFRASTRUCTURE: SCRAPING & ENRICHMENT
-- ==========================================

-- 1. TABELA DE ALVOS DE EXTRAÇÃO (TARGETS)
CREATE TABLE IF NOT EXISTS public.scraping_targets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    url text NOT NULL,
    platform text CHECK (platform IN ('linkedin', 'google', 'instagram', 'other')),
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    last_run_at timestamptz,
    config jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- 2. TABELA DE CONTATOS BRUTOS EXTRÁIDOS (RAW DATA)
CREATE TABLE IF NOT EXISTS public.raw_contacts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    scraping_target_id uuid REFERENCES public.scraping_targets(id) ON DELETE CASCADE,
    source_platform text,
    data jsonb DEFAULT '{}'::jsonb,
    processed boolean DEFAULT false,
    lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

-- 3. HABILITAR RLS
ALTER TABLE public.scraping_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_contacts ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE ACESSO
DROP POLICY IF EXISTS "Acesso por Tenant em Alvos" ON public.scraping_targets;
CREATE POLICY "Acesso por Tenant em Alvos" ON public.scraping_targets
    FOR ALL USING (tenant_id = auth.uid() OR EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = scraping_targets.tenant_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Acesso por Tenant em Contatos Brutos" ON public.raw_contacts;
CREATE POLICY "Acesso por Tenant em Contatos Brutos" ON public.raw_contacts
    FOR ALL USING (tenant_id = auth.uid() OR EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = raw_contacts.tenant_id AND user_id = auth.uid()));

-- 5. GRANTS
GRANT ALL ON public.scraping_targets TO authenticated;
GRANT ALL ON public.raw_contacts TO authenticated;
