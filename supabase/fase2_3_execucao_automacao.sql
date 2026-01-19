-- ==========================================
-- FASE 2 & 3: MOTOR DE EXECUÇÃO E ORQUESTRAÇÃO N8N
-- IMPLEMENTAÇÃO DE INFRAESTRUTURA DE MENSAGERIA, CAL E AUTOMAÇÃO
-- ==========================================

-- 1. INFRAESTRUTURA DE MENSAGERIA (WhatsApp Cloud API)
CREATE TABLE IF NOT EXISTS public.whatsapp_accounts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name text NOT NULL,
    phone_number text,
    whatsapp_business_id text,
    access_token text, -- Criptografar em produção
    status text DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'blocked', 'warning')),
    health_score int DEFAULT 100 CHECK (health_score BETWEEN 0 AND 100),
    operation_mode text DEFAULT 'balanced' CHECK (operation_mode IN ('conservative', 'balanced', 'aggressive')),
    daily_limit int DEFAULT 50,
    created_at timestamptz DEFAULT now()
);

-- 2. MONITORAMENTO DE GRUPOS & RADAR
CREATE TABLE IF NOT EXISTS public.whatsapp_groups (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
    account_id uuid REFERENCES public.whatsapp_accounts(id) ON DELETE CASCADE,
    group_name text NOT NULL,
    external_id text, -- ID real do WP
    monitored_keywords text[], -- Array de palavras-chave
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 3. ESTADOS DO LEADS & SCORING (CAL ENGINE)
-- Evoluindo a tabela de Leads existente
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS warm_score int DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS cal_state text DEFAULT 'latent' CHECK (cal_state IN ('latent', 'candidate', 'warming_active', 'opt_in_confirmed', 'opted_out_locked'));
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_interaction_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS interaction_history jsonb DEFAULT '[]'::jsonb;

-- 4. LOGS DE MENSAGENS E INTENSÕES
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
    account_id uuid REFERENCES public.whatsapp_accounts(id) ON DELETE CASCADE,
    direction text CHECK (direction IN ('inbound', 'outbound')),
    content text,
    intention text, -- Detectada por IA (ex: 'duvida', 'interesse', 'rejeicao')
    sentiment_score numeric,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- 5. ORQUESTRAÇÃO N8N & HUB
CREATE TABLE IF NOT EXISTS public.automation_workflows (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
    n8n_id text, -- ID do workflow no n8n
    name text NOT NULL,
    trigger_type text, -- 'event', 'schedule', 'manual'
    status text DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
    last_execution_at timestamptz,
    blueprint_id uuid REFERENCES public.execution_blueprints(id),
    created_at timestamptz DEFAULT now()
);

-- 6. LOGS DE EXECUÇÃO PARA OBSERVABILIDADE
CREATE TABLE IF NOT EXISTS public.automation_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id uuid REFERENCES public.automation_workflows(id) ON DELETE CASCADE,
    status text CHECK (status IN ('success', 'failed', 'running')),
    payload_input jsonb,
    payload_output jsonb,
    error_message text,
    duration_ms int,
    created_at timestamptz DEFAULT now()
);

-- 7. EVENTOS DE COMPLIANCE (LGPD)
CREATE TABLE IF NOT EXISTS public.compliance_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
    action text CHECK (action IN ('opt_in', 'opt_out', 'data_export', 'data_deletion')),
    consent_source text, -- 'whatsapp_msg', 'lp_checkbox', 'manual'
    proof_metadata jsonb, -- Conteúdo da mensagem que provou o consentimento
    created_at timestamptz DEFAULT now()
);

-- 8. POLÍTICAS DE RLS
ALTER TABLE public.whatsapp_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_logs ENABLE ROW LEVEL SECURITY;

-- Políticas Simples baseadas em Workspace Member (placeholder para expansão)
DROP POLICY IF EXISTS "Workspace access for WA accounts" ON public.whatsapp_accounts;
CREATE POLICY "Workspace access for WA accounts" ON public.whatsapp_accounts FOR ALL USING (workspace_id IN (SELECT workspace_id FROM public.user_roles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Workspace access for WA groups" ON public.whatsapp_groups;
CREATE POLICY "Workspace access for WA groups" ON public.whatsapp_groups FOR ALL USING (workspace_id IN (SELECT workspace_id FROM public.user_roles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Workspace access for workflows" ON public.automation_workflows;
CREATE POLICY "Workspace access for workflows" ON public.automation_workflows FOR ALL USING (workspace_id IN (SELECT workspace_id FROM public.user_roles WHERE user_id = auth.uid()));

-- 9. GRANTS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
