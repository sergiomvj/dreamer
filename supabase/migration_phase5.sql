-- FASE 5: Gestão de Redes Sociais
-- Run this in Supabase SQL Editor

-- Canais Sociais (Conexões)
CREATE TABLE IF NOT EXISTS public.social_channels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'linkedin', 'instagram', 'facebook', 'twitter'
    account_name TEXT NOT NULL,
    access_token_encrypted TEXT, -- Em produção, criptografar!
    status TEXT DEFAULT 'active', -- 'active', 'disconnected'
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Posts Sociais (Agendados/Publicados)
CREATE TABLE IF NOT EXISTS public.social_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    content_id uuid REFERENCES public.content_ideas(id) ON DELETE SET NULL, -- Link com Fase 1
    channel_id uuid REFERENCES public.social_channels(id) ON DELETE SET NULL,
    body_text TEXT, -- Pode sobrescrever o do content_id
    media_urls JSONB DEFAULT '[]'::jsonb,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'published', 'failed'
    published_at TIMESTAMPTZ,
    metrics JSONB DEFAULT '{"likes": 0, "comments": 0, "shares": 0}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS Policies
ALTER TABLE public.social_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow tenant members to manage social_channels"
    ON public.social_channels FOR ALL
    USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_members.tenant_id = social_channels.tenant_id AND tenant_members.user_id = auth.uid()));

CREATE POLICY "Allow tenant members to manage social_posts"
    ON public.social_posts FOR ALL
    USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_members.tenant_id = social_posts.tenant_id AND tenant_members.user_id = auth.uid()));
