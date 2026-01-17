-- MIGRATION PHASE 2.1: Ad Rules (Automation)
-- Run this in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.ad_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    ad_account_id uuid REFERENCES public.ad_accounts(id) ON DELETE CASCADE, -- Optional: Rule specific to an account
    name TEXT NOT NULL,
    metric TEXT NOT NULL, -- e.g., 'cpa', 'spend', 'roas'
    operator TEXT NOT NULL, -- e.g., '>', '<'
    value NUMERIC NOT NULL,
    action TEXT NOT NULL, -- e.g., 'pause_campaign', 'notify_manager'
    scope TEXT NOT NULL DEFAULT 'campaign', -- 'campaign', 'adset', 'ad'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Apply RLS
ALTER TABLE public.ad_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow tenant members to manage ad_rules" ON public.ad_rules;
CREATE POLICY "Allow tenant members to manage ad_rules"
    ON public.ad_rules
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_members
            WHERE tenant_members.tenant_id = ad_rules.tenant_id
            AND tenant_members.user_id = auth.uid()
        )
    );
