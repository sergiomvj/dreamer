-- FASE 4: Módulo de Automação (Scraping)
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.scraping_targets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    platform TEXT NOT NULL, -- 'linkedin', 'google', 'instagram', etc.
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    schedule_cron TEXT, -- Opcional: para agendamento
    last_run_at TIMESTAMPTZ,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.raw_contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    scraping_target_id uuid REFERENCES public.scraping_targets(id) ON DELETE SET NULL,
    source_platform TEXT NOT NULL,
    data JSONB NOT NULL, -- Dados brutos extraídos
    processed BOOLEAN DEFAULT false,
    lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL, -- Se convertido em lead
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.scraping_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_contacts ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow tenant members to manage scraping_targets" ON public.scraping_targets;
CREATE POLICY "Allow tenant members to manage scraping_targets"
    ON public.scraping_targets
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_members
            WHERE tenant_members.tenant_id = scraping_targets.tenant_id
            AND tenant_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Allow tenant members to manage raw_contacts" ON public.raw_contacts;
CREATE POLICY "Allow tenant members to manage raw_contacts"
    ON public.raw_contacts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_members
            WHERE tenant_members.tenant_id = raw_contacts.tenant_id
            AND tenant_members.user_id = auth.uid()
        )
    );
