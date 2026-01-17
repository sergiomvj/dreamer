-- MIGRATION PHASE 2: Paid Traffic Module
-- This script creates the tables and policies for the Paid Traffic module.
-- Run this in Supabase SQL Editor.

-- Enable pgcrypto for UUID generation (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create Tables

CREATE TABLE IF NOT EXISTS public.ad_platforms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- 'Meta', 'Google'
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ad_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    ad_platform_id uuid NOT NULL REFERENCES public.ad_platforms(id),
    external_account_id TEXT NOT NULL, -- ID da conta na plataforma (ex: 'act_12345')
    account_name TEXT NOT NULL,
    access_token TEXT, -- Token de acesso criptografado
    token_expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(tenant_id, project_id, external_account_id, ad_platform_id)
);

CREATE TABLE IF NOT EXISTS public.ad_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_account_id uuid NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
    external_campaign_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    status TEXT,
    objective TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ad_sets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
    external_ad_set_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    status TEXT,
    daily_budget NUMERIC,
    lifetime_budget NUMERIC,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_set_id uuid NOT NULL REFERENCES public.ad_sets(id) ON DELETE CASCADE,
    external_ad_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    status TEXT,
    creative_preview_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ad_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL,
    ad_account_id uuid NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
    ad_campaign_id uuid REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
    ad_set_id uuid REFERENCES public.ad_sets(id) ON DELETE CASCADE,
    ad_id uuid REFERENCES public.ads(id) ON DELETE CASCADE,
    
    spend NUMERIC(10, 2),
    impressions INTEGER,
    clicks INTEGER,
    conversions INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(metric_date, ad_account_id, ad_campaign_id, ad_set_id, ad_id)
);

-- 2. Seed Data

INSERT INTO public.ad_platforms (name) 
VALUES ('Meta'), ('Google') 
ON CONFLICT (name) DO NOTHING;

-- 3. Apply Policies (RLS)

-- ad_platforms
ALTER TABLE public.ad_platforms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to view ad_platforms" ON public.ad_platforms;
CREATE POLICY "Allow authenticated users to view ad_platforms"
    ON public.ad_platforms
    FOR SELECT
    TO authenticated
    USING (true);

-- ad_accounts
ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow tenant members to manage ad_accounts" ON public.ad_accounts;
CREATE POLICY "Allow tenant members to manage ad_accounts"
    ON public.ad_accounts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_members
            WHERE tenant_members.tenant_id = ad_accounts.tenant_id
            AND tenant_members.user_id = auth.uid()
        )
    );

-- ad_campaigns
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow tenant members to view ad_campaigns" ON public.ad_campaigns;
CREATE POLICY "Allow tenant members to view ad_campaigns"
    ON public.ad_campaigns
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.ad_accounts
            JOIN public.tenant_members ON ad_accounts.tenant_id = tenant_members.tenant_id
            WHERE ad_accounts.id = ad_campaigns.ad_account_id
            AND tenant_members.user_id = auth.uid()
        )
    );

-- ad_sets
ALTER TABLE public.ad_sets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow tenant members to view ad_sets" ON public.ad_sets;
CREATE POLICY "Allow tenant members to view ad_sets"
    ON public.ad_sets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.ad_campaigns
            JOIN public.ad_accounts ON ad_campaigns.ad_account_id = ad_accounts.id
            JOIN public.tenant_members ON ad_accounts.tenant_id = tenant_members.tenant_id
            WHERE ad_campaigns.id = ad_sets.ad_campaign_id
            AND tenant_members.user_id = auth.uid()
        )
    );

-- ads
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow tenant members to view ads" ON public.ads;
CREATE POLICY "Allow tenant members to view ads"
    ON public.ads
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.ad_sets
            JOIN public.ad_campaigns ON ad_sets.ad_campaign_id = ad_campaigns.id
            JOIN public.ad_accounts ON ad_campaigns.ad_account_id = ad_accounts.id
            JOIN public.tenant_members ON ad_accounts.tenant_id = tenant_members.tenant_id
            WHERE ad_sets.id = ads.ad_set_id
            AND tenant_members.user_id = auth.uid()
        )
    );

-- ad_metrics
ALTER TABLE public.ad_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow tenant members to view ad_metrics" ON public.ad_metrics;
CREATE POLICY "Allow tenant members to view ad_metrics"
    ON public.ad_metrics
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.ad_accounts
            JOIN public.tenant_members ON ad_accounts.tenant_id = tenant_members.tenant_id
            WHERE ad_accounts.id = ad_metrics.ad_account_id
            AND tenant_members.user_id = auth.uid()
        )
    );
