-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.ad_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  account_name text NOT NULL,
  external_account_id text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ad_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT ad_accounts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT ad_accounts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.ad_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  metric_date date NOT NULL,
  ad_account_id uuid NOT NULL,
  spend numeric DEFAULT 0,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ad_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT ad_metrics_ad_account_id_fkey FOREIGN KEY (ad_account_id) REFERENCES public.ad_accounts(id)
);
CREATE TABLE public.agent_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid,
  agent_id uuid,
  input jsonb DEFAULT '{}'::jsonb,
  output jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'queued'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT agent_runs_pkey PRIMARY KEY (id),
  CONSTRAINT agent_runs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT agent_runs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT agent_runs_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id)
);
CREATE TABLE public.agents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  stage text NOT NULL CHECK (stage = ANY (ARRAY['planning'::text, 'testing'::text, 'execution'::text, 'analysis'::text, 'learning'::text])),
  autonomy_level text DEFAULT 'medium'::text,
  is_enabled boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT agents_pkey PRIMARY KEY (id),
  CONSTRAINT agents_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.campaign_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  campaign_id uuid,
  action_type text NOT NULL,
  requested_by text CHECK (requested_by = ANY (ARRAY['agent'::text, 'human'::text])),
  approval_status text NOT NULL DEFAULT 'pending'::text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT campaign_actions_pkey PRIMARY KEY (id),
  CONSTRAINT campaign_actions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT campaign_actions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT campaign_actions_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id)
);
CREATE TABLE public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  channel_id uuid,
  external_id text,
  status text NOT NULL DEFAULT 'active'::text,
  budget_daily numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  budget_lifetime numeric DEFAULT 0,
  targeting jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT campaigns_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT campaigns_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT campaigns_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.channels(id)
);
CREATE TABLE public.channels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT channels_pkey PRIMARY KEY (id),
  CONSTRAINT channels_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.experiment_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  experiment_id uuid NOT NULL,
  variant_key text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT experiment_variants_pkey PRIMARY KEY (id),
  CONSTRAINT experiment_variants_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT experiment_variants_experiment_id_fkey FOREIGN KEY (experiment_id) REFERENCES public.experiments(id)
);
CREATE TABLE public.experiments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  strategy_version_id uuid,
  name text NOT NULL,
  hypothesis text,
  variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  success_criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  budget_cap numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'planned'::text CHECK (status = ANY (ARRAY['planned'::text, 'running'::text, 'passed'::text, 'failed'::text, 'killed'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT experiments_pkey PRIMARY KEY (id),
  CONSTRAINT experiments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT experiments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT experiments_strategy_version_id_fkey FOREIGN KEY (strategy_version_id) REFERENCES public.strategy_versions(id)
);
CREATE TABLE public.insights (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid,
  summary text NOT NULL,
  evidence jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT insights_pkey PRIMARY KEY (id),
  CONSTRAINT insights_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT insights_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  provider text NOT NULL,
  secrets jsonb NOT NULL DEFAULT '{}'::jsonb,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT integrations_pkey PRIMARY KEY (id),
  CONSTRAINT integrations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  strategy_version_id uuid,
  full_name text,
  email text,
  phone text,
  source jsonb NOT NULL DEFAULT '{}'::jsonb,
  intent USER-DEFINED NOT NULL DEFAULT 'cold'::lead_intent,
  score numeric NOT NULL DEFAULT 0,
  status USER-DEFINED NOT NULL DEFAULT 'new'::lead_status,
  requires_human boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT leads_pkey PRIMARY KEY (id),
  CONSTRAINT leads_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT leads_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT leads_strategy_version_id_fkey FOREIGN KEY (strategy_version_id) REFERENCES public.strategy_versions(id)
);
CREATE TABLE public.metrics_daily (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  campaign_id uuid,
  date date NOT NULL,
  spend numeric DEFAULT 0,
  conversions integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT metrics_daily_pkey PRIMARY KEY (id),
  CONSTRAINT metrics_daily_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT metrics_daily_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT metrics_daily_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id)
);
CREATE TABLE public.playbooks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  niche text,
  rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT playbooks_pkey PRIMARY KEY (id),
  CONSTRAINT playbooks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.project_briefings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL UNIQUE,
  product text,
  offer text,
  value_prop text,
  audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  constraints jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT project_briefings_pkey PRIMARY KEY (id),
  CONSTRAINT project_briefings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT project_briefings_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  niche text,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'archived'::text])),
  monthly_budget numeric NOT NULL DEFAULT 0,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.strategy_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  version integer NOT NULL,
  strategy jsonb NOT NULL DEFAULT '{}'::jsonb,
  hypotheses jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'awaiting_approval'::text, 'approved'::text, 'rejected'::text])),
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT strategy_versions_pkey PRIMARY KEY (id),
  CONSTRAINT strategy_versions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT strategy_versions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT strategy_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.tenant_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'analyst'::text, 'viewer'::text])),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tenant_members_pkey PRIMARY KEY (id),
  CONSTRAINT tenant_members_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT tenant_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.tenants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  plan text NOT NULL DEFAULT 'free'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tenants_pkey PRIMARY KEY (id)
);
CREATE TABLE public.webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'new'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT webhook_events_pkey PRIMARY KEY (id),
  CONSTRAINT webhook_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT webhook_events_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.whatsapp_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  lead_id uuid,
  phone_number text NOT NULL,
  status text DEFAULT 'open'::text,
  last_message_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_conversations_pkey PRIMARY KEY (id),
  CONSTRAINT whatsapp_conversations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT whatsapp_conversations_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id)
);
CREATE TABLE public.whatsapp_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  direction text NOT NULL,
  content text NOT NULL,
  status text DEFAULT 'sent'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_messages_pkey PRIMARY KEY (id),
  CONSTRAINT whatsapp_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.whatsapp_conversations(id)
);