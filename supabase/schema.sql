-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.ad_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  ad_platform_id uuid NOT NULL,
  external_account_id text NOT NULL,
  account_name text NOT NULL,
  access_token text,
  token_expires_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ad_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT ad_accounts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT ad_accounts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT ad_accounts_ad_platform_id_fkey FOREIGN KEY (ad_platform_id) REFERENCES public.ad_platforms(id)
);
CREATE TABLE public.ad_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ad_account_id uuid NOT NULL,
  external_campaign_id text NOT NULL UNIQUE,
  name text NOT NULL,
  status text,
  objective text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ad_campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT ad_campaigns_ad_account_id_fkey FOREIGN KEY (ad_account_id) REFERENCES public.ad_accounts(id)
);
CREATE TABLE public.ad_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  metric_date date NOT NULL,
  ad_account_id uuid NOT NULL,
  ad_campaign_id uuid,
  ad_set_id uuid,
  ad_id uuid,
  spend numeric,
  impressions integer,
  clicks integer,
  conversions integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ad_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT ad_metrics_ad_account_id_fkey FOREIGN KEY (ad_account_id) REFERENCES public.ad_accounts(id),
  CONSTRAINT ad_metrics_ad_campaign_id_fkey FOREIGN KEY (ad_campaign_id) REFERENCES public.ad_campaigns(id),
  CONSTRAINT ad_metrics_ad_set_id_fkey FOREIGN KEY (ad_set_id) REFERENCES public.ad_sets(id),
  CONSTRAINT ad_metrics_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads(id)
);
CREATE TABLE public.ad_platforms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ad_platforms_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ad_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  ad_account_id uuid,
  name text NOT NULL,
  metric text NOT NULL,
  operator text NOT NULL,
  value numeric NOT NULL,
  action text NOT NULL,
  scope text NOT NULL DEFAULT 'campaign'::text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ad_rules_pkey PRIMARY KEY (id),
  CONSTRAINT ad_rules_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT ad_rules_ad_account_id_fkey FOREIGN KEY (ad_account_id) REFERENCES public.ad_accounts(id)
);
CREATE TABLE public.ad_sets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ad_campaign_id uuid NOT NULL,
  external_ad_set_id text NOT NULL UNIQUE,
  name text NOT NULL,
  status text,
  daily_budget numeric,
  lifetime_budget numeric,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ad_sets_pkey PRIMARY KEY (id),
  CONSTRAINT ad_sets_ad_campaign_id_fkey FOREIGN KEY (ad_campaign_id) REFERENCES public.ad_campaigns(id)
);
CREATE TABLE public.ads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ad_set_id uuid NOT NULL,
  external_ad_id text NOT NULL UNIQUE,
  name text NOT NULL,
  status text,
  creative_preview_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ads_pkey PRIMARY KEY (id),
  CONSTRAINT ads_ad_set_id_fkey FOREIGN KEY (ad_set_id) REFERENCES public.ad_sets(id)
);
CREATE TABLE public.approaches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  strategy_id uuid NOT NULL,
  project_account_id uuid,
  channel text NOT NULL,
  format text NOT NULL,
  allowed boolean NOT NULL DEFAULT true,
  rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT approaches_pkey PRIMARY KEY (id),
  CONSTRAINT approaches_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT approaches_strategy_id_fkey FOREIGN KEY (strategy_id) REFERENCES public.strategies(id),
  CONSTRAINT approaches_project_account_id_fkey FOREIGN KEY (project_account_id) REFERENCES public.project_accounts(id)
);
CREATE TABLE public.audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  actor_user_id uuid,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT audit_log_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT audit_log_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.campaign_channels (
  campaign_id uuid NOT NULL,
  channel_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  CONSTRAINT campaign_channels_pkey PRIMARY KEY (campaign_id, channel_id),
  CONSTRAINT campaign_channels_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id),
  CONSTRAINT campaign_channels_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.channels(id)
);
CREATE TABLE public.campaign_strategies (
  campaign_id uuid NOT NULL,
  strategy_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  CONSTRAINT campaign_strategies_pkey PRIMARY KEY (campaign_id, strategy_id),
  CONSTRAINT campaign_strategies_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id),
  CONSTRAINT campaign_strategies_strategy_id_fkey FOREIGN KEY (strategy_id) REFERENCES public.strategies(id)
);
CREATE TABLE public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT campaigns_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.channels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT channels_pkey PRIMARY KEY (id)
);
CREATE TABLE public.content_ideas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  campaign_id uuid NOT NULL,
  idea_text text NOT NULL,
  status text NOT NULL DEFAULT 'ideia'::text,
  content_draft text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT content_ideas_pkey PRIMARY KEY (id),
  CONSTRAINT content_ideas_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id)
);
CREATE TABLE public.email_sequence_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL,
  template_id uuid,
  step_order integer NOT NULL,
  delay_hours integer DEFAULT 0,
  step_type text NOT NULL DEFAULT 'email'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT email_sequence_steps_pkey PRIMARY KEY (id),
  CONSTRAINT email_sequence_steps_sequence_id_fkey FOREIGN KEY (sequence_id) REFERENCES public.email_sequences(id),
  CONSTRAINT email_sequence_steps_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.email_templates(id)
);
CREATE TABLE public.email_sequences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  status text DEFAULT 'draft'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT email_sequences_pkey PRIMARY KEY (id),
  CONSTRAINT email_sequences_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.email_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  body_content text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT email_templates_pkey PRIMARY KEY (id),
  CONSTRAINT email_templates_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.event_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  flow_id uuid,
  code text NOT NULL,
  description text,
  weight integer NOT NULL DEFAULT 0,
  schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT event_types_pkey PRIMARY KEY (id),
  CONSTRAINT event_types_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT event_types_flow_id_fkey FOREIGN KEY (flow_id) REFERENCES public.flows(id)
);
CREATE TABLE public.flow_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  flow_id uuid NOT NULL,
  step_order integer NOT NULL,
  step_type text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT flow_steps_pkey PRIMARY KEY (id),
  CONSTRAINT flow_steps_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT flow_steps_flow_id_fkey FOREIGN KEY (flow_id) REFERENCES public.flows(id)
);
CREATE TABLE public.flows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  approach_id uuid NOT NULL,
  name text NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::flow_status,
  version integer NOT NULL DEFAULT 1,
  parent_flow_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT flows_pkey PRIMARY KEY (id),
  CONSTRAINT flows_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT flows_approach_id_fkey FOREIGN KEY (approach_id) REFERENCES public.approaches(id),
  CONSTRAINT flows_parent_flow_id_fkey FOREIGN KEY (parent_flow_id) REFERENCES public.flows(id)
);
CREATE TABLE public.lead_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  lead_id uuid NOT NULL,
  flow_id uuid,
  event_code text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  happened_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lead_events_pkey PRIMARY KEY (id),
  CONSTRAINT lead_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT lead_events_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id),
  CONSTRAINT lead_events_flow_id_fkey FOREIGN KEY (flow_id) REFERENCES public.flows(id)
);
CREATE TABLE public.lead_sequence_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  lead_id uuid NOT NULL,
  sequence_id uuid NOT NULL,
  current_step_order integer DEFAULT 1,
  status text DEFAULT 'active'::text,
  enrolled_at timestamp with time zone NOT NULL DEFAULT now(),
  last_action_at timestamp with time zone,
  CONSTRAINT lead_sequence_enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT lead_sequence_enrollments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT lead_sequence_enrollments_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id),
  CONSTRAINT lead_sequence_enrollments_sequence_id_fkey FOREIGN KEY (sequence_id) REFERENCES public.email_sequences(id)
);
CREATE TABLE public.lead_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  lead_id uuid NOT NULL,
  assigned_to uuid,
  title text NOT NULL,
  task_type text NOT NULL,
  due_at timestamp with time zone,
  status text NOT NULL DEFAULT 'open'::text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lead_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT lead_tasks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT lead_tasks_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id),
  CONSTRAINT lead_tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id)
);
CREATE TABLE public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  product_id uuid,
  strategy_id uuid,
  approach_id uuid,
  flow_id uuid,
  project_account_id uuid,
  full_name text,
  email text,
  phone text,
  external_id text,
  source jsonb NOT NULL DEFAULT '{}'::jsonb,
  intent USER-DEFINED NOT NULL DEFAULT 'cold'::lead_intent,
  score numeric NOT NULL DEFAULT 0,
  status USER-DEFINED NOT NULL DEFAULT 'new'::lead_status,
  next_best_action jsonb NOT NULL DEFAULT '{}'::jsonb,
  requires_human boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT leads_pkey PRIMARY KEY (id),
  CONSTRAINT leads_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT leads_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT leads_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT leads_strategy_id_fkey FOREIGN KEY (strategy_id) REFERENCES public.strategies(id),
  CONSTRAINT leads_approach_id_fkey FOREIGN KEY (approach_id) REFERENCES public.approaches(id),
  CONSTRAINT leads_flow_id_fkey FOREIGN KEY (flow_id) REFERENCES public.flows(id),
  CONSTRAINT leads_project_account_id_fkey FOREIGN KEY (project_account_id) REFERENCES public.project_accounts(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  name text NOT NULL,
  icp jsonb NOT NULL DEFAULT '{}'::jsonb,
  pain_map jsonb NOT NULL DEFAULT '{}'::jsonb,
  awareness_level text,
  decision_type text,
  product_role text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT products_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.profiles (
  user_id uuid NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.project_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  channel text NOT NULL,
  account_label text NOT NULL,
  external_account_id text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT project_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT project_accounts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT project_accounts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  mission text,
  global_objectives jsonb NOT NULL DEFAULT '[]'::jsonb,
  philosophical_goals jsonb NOT NULL DEFAULT '[]'::jsonb,
  constraints jsonb NOT NULL DEFAULT '{}'::jsonb,
  automation_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active'::text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.raw_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  scraping_target_id uuid,
  source_platform text NOT NULL,
  data jsonb NOT NULL,
  processed boolean DEFAULT false,
  lead_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT raw_contacts_pkey PRIMARY KEY (id),
  CONSTRAINT raw_contacts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT raw_contacts_scraping_target_id_fkey FOREIGN KEY (scraping_target_id) REFERENCES public.scraping_targets(id),
  CONSTRAINT raw_contacts_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id)
);
CREATE TABLE public.scraping_targets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  url text NOT NULL,
  platform text NOT NULL,
  status text DEFAULT 'pending'::text,
  schedule_cron text,
  last_run_at timestamp with time zone,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT scraping_targets_pkey PRIMARY KEY (id),
  CONSTRAINT scraping_targets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.social_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  platform text NOT NULL,
  account_name text NOT NULL,
  access_token_encrypted text,
  status text DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT social_channels_pkey PRIMARY KEY (id),
  CONSTRAINT social_channels_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.social_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  content_id uuid,
  channel_id uuid,
  body_text text,
  media_urls jsonb DEFAULT '[]'::jsonb,
  scheduled_at timestamp with time zone NOT NULL,
  status text DEFAULT 'scheduled'::text,
  published_at timestamp with time zone,
  metrics jsonb DEFAULT '{"likes": 0, "shares": 0, "comments": 0}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT social_posts_pkey PRIMARY KEY (id),
  CONSTRAINT social_posts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT social_posts_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.content_ideas(id),
  CONSTRAINT social_posts_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.social_channels(id)
);
CREATE TABLE public.strategies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  product_id uuid,
  name text NOT NULL,
  strategy_type text NOT NULL,
  hypothesis text,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::strategy_status,
  version integer NOT NULL DEFAULT 1,
  parent_strategy_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT strategies_pkey PRIMARY KEY (id),
  CONSTRAINT strategies_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT strategies_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT strategies_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT strategies_parent_strategy_id_fkey FOREIGN KEY (parent_strategy_id) REFERENCES public.strategies(id)
);
CREATE TABLE public.strategy_blueprints (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  strategy_id uuid NOT NULL,
  copy_assets jsonb NOT NULL DEFAULT '{}'::jsonb,
  kickoff_plan jsonb NOT NULL DEFAULT '[]'::jsonb,
  decision_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT strategy_blueprints_pkey PRIMARY KEY (id),
  CONSTRAINT strategy_blueprints_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT strategy_blueprints_strategy_id_fkey FOREIGN KEY (strategy_id) REFERENCES public.strategies(id)
);
CREATE TABLE public.tenant_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'viewer'::member_role,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tenant_members_pkey PRIMARY KEY (id),
  CONSTRAINT tenant_members_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT tenant_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.tenants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tenants_pkey PRIMARY KEY (id)
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
CREATE TABLE public.whatsapp_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'marketing'::text,
  status text DEFAULT 'approved'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_templates_pkey PRIMARY KEY (id),
  CONSTRAINT whatsapp_templates_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);