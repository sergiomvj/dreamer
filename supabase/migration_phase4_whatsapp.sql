-- FASE 4.3: Módulo de WhatsApp
-- Run this in Supabase SQL Editor

-- Templates de WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    content TEXT NOT NULL, -- Texto da mensagem
    category TEXT DEFAULT 'marketing', -- 'marketing', 'utility', 'authentication'
    status TEXT DEFAULT 'approved', -- 'approved', 'rejected', 'pending'
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Conversas
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL, -- Número do lead
    status TEXT DEFAULT 'open', -- 'open', 'closed', 'expired'
    last_message_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Mensagens
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
    direction TEXT NOT NULL, -- 'inbound' (Do Lead), 'outbound' (Da Empresa)
    content TEXT NOT NULL,
    status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS Policies
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow tenant members to manage whatsapp_templates"
    ON public.whatsapp_templates FOR ALL
    USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_members.tenant_id = whatsapp_templates.tenant_id AND tenant_members.user_id = auth.uid()));

CREATE POLICY "Allow tenant members to manage whatsapp_conversations"
    ON public.whatsapp_conversations FOR ALL
    USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_members.tenant_id = whatsapp_conversations.tenant_id AND tenant_members.user_id = auth.uid()));

CREATE POLICY "Allow tenant members to manage whatsapp_messages"
    ON public.whatsapp_messages FOR ALL
    USING (EXISTS (SELECT 1 FROM public.whatsapp_conversations JOIN public.tenant_members ON whatsapp_conversations.tenant_id = tenant_members.tenant_id WHERE whatsapp_conversations.id = whatsapp_messages.conversation_id AND tenant_members.user_id = auth.uid()));
