-- FASE 4.2: Módulo de Email Marketing
-- Run this in Supabase SQL Editor

-- Templates de Email
CREATE TABLE IF NOT EXISTS public.email_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_content TEXT NOT NULL, -- HTML ou Texto
    variables JSONB DEFAULT '[]'::jsonb, -- Ex: ['first_name', 'company_name']
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Sequências (Cadências)
CREATE TABLE IF NOT EXISTS public.email_sequences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft', -- 'draft', 'active', 'paused'
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Passos da Sequência
CREATE TABLE IF NOT EXISTS public.email_sequence_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id uuid NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
    template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
    step_order INTEGER NOT NULL,
    delay_hours INTEGER DEFAULT 0, -- Tempo de espera antes deste passo (após o anterior)
    step_type TEXT NOT NULL DEFAULT 'email', -- 'email', 'wait', 'task'
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Inscrições de Leads em Sequências
CREATE TABLE IF NOT EXISTS public.lead_sequence_enrollments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    sequence_id uuid NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
    current_step_order INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'paused', 'failed'
    enrolled_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    last_action_at TIMESTAMPTZ,
    UNIQUE(lead_id, sequence_id)
);

-- RLS Policies
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_sequence_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow tenant members to manage email_templates"
    ON public.email_templates FOR ALL
    USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_members.tenant_id = email_templates.tenant_id AND tenant_members.user_id = auth.uid()));

CREATE POLICY "Allow tenant members to manage email_sequences"
    ON public.email_sequences FOR ALL
    USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_members.tenant_id = email_sequences.tenant_id AND tenant_members.user_id = auth.uid()));

CREATE POLICY "Allow tenant members to manage email_sequence_steps"
    ON public.email_sequence_steps FOR ALL
    USING (EXISTS (SELECT 1 FROM public.email_sequences JOIN public.tenant_members ON email_sequences.tenant_id = tenant_members.tenant_id WHERE email_sequences.id = email_sequence_steps.sequence_id AND tenant_members.user_id = auth.uid()));

CREATE POLICY "Allow tenant members to manage lead_sequence_enrollments"
    ON public.lead_sequence_enrollments FOR ALL
    USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_members.tenant_id = lead_sequence_enrollments.tenant_id AND tenant_members.user_id = auth.uid()));
