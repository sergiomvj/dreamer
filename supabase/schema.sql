-- ========================================================
-- GETLEADS CORE SCHEMA (Execution-Ready Order)
-- ========================================================

-- 1. BASE TABLES (No dependencies)
CREATE TABLE public.tenants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  plan text NOT NULL DEFAULT 'free'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tenants_pkey PRIMARY KEY (id)
);

CREATE TABLE public.workspaces (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  owner_id uuid,
  CONSTRAINT workspaces_pkey PRIMARY KEY (id),
  CONSTRAINT workspaces_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);

-- 2. PRIMARY ENTITIES (Dependency: tenants)
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  niche text,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'archived'::text])),
  monthly_budget numeric NOT NULL DEFAULT 0,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  mission text,
  global_objectives jsonb DEFAULT '[]'::jsonb,
  philosophical_goals jsonb DEFAULT '[]'::jsonb,
  constraints jsonb DEFAULT '{"text": ""}'::jsonb,
  automation_policy jsonb DEFAULT '{"autonomy": 50}'::jsonb,
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
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

-- 3. INTERMEDIATE ENTITIES (Dependency: projects)
CREATE TABLE public.client_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text])),
  blueprint_id uuid, -- Reference to execution_blueprints created later
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT client_projects_pkey PRIMARY KEY (id)
);

CREATE TABLE public.strategies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  name text NOT NULL,
  strategy_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT strategies_pkey PRIMARY KEY (id),
  CONSTRAINT strategies_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT strategies_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

-- 4. OFFERS & PRODUCTS (Dependency: client_projects)
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_project_id uuid REFERENCES public.client_projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  awareness_level text DEFAULT 'unaware'::text,
  product_role text DEFAULT 'core'::text,
  created_at timestamp with time zone DEFAULT now(),
  icp jsonb DEFAULT '{"text": ""}'::jsonb,
  pain_map jsonb DEFAULT '{"text": ""}'::jsonb,
  decision_type text DEFAULT 'considered'::text,
  cost_structure jsonb DEFAULT '{"margin": 0, "cpa_max": 0}'::jsonb,
  friction_level text CHECK (friction_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
  offer_type text CHECK (offer_type = ANY (ARRAY['entry'::text, 'core'::text, 'upsell'::text, 'cross-sell'::text])),
  validation_status text DEFAULT 'pending'::text CHECK (validation_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'force_approved'::text])),
  lion_report jsonb DEFAULT '{}'::jsonb,
  validation_at timestamp with time zone,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

-- 5. CAMPAIGNS (Dependency: products, strategies)
CREATE TABLE public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_project_id uuid REFERENCES public.client_projects(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active'::text,
  budget_daily numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_pkey PRIMARY KEY (id)
);

CREATE TABLE public.campaign_strategies (
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  strategy_id uuid NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  CONSTRAINT campaign_strategies_pkey PRIMARY KEY (campaign_id, strategy_id)
);

CREATE TABLE public.campaign_channels (
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  CONSTRAINT campaign_channels_pkey PRIMARY KEY (campaign_id, channel_id)
);

-- 6. CONTENT & EXECUTION (Dependency: campaigns, strategies)
CREATE TABLE public.content_ideas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  idea_text text NOT NULL,
  status text NOT NULL DEFAULT 'ideia'::text CHECK (status = ANY (ARRAY['ideia'::text, 'draft'::text, 'published'::text])),
  content_draft text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT content_ideas_pkey PRIMARY KEY (id),
  CONSTRAINT content_ideas_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);

CREATE TABLE public.strategy_blueprints (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  strategy_id uuid NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  copy_assets jsonb NOT NULL DEFAULT '{}'::jsonb,
  kickoff_plan jsonb NOT NULL DEFAULT '[]'::jsonb,
  decision_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT strategy_blueprints_pkey PRIMARY KEY (id)
);

-- 7. MINING & CONTACTS
CREATE TABLE public.scraping_targets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  platform text CHECK (platform = ANY (ARRAY['linkedin'::text, 'google'::text, 'instagram'::text, 'amazon'::text, 'other'::text])),
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])),
  last_run_at timestamp with time zone,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT scraping_targets_pkey PRIMARY KEY (id)
);

CREATE TABLE public.raw_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  scraping_target_id uuid REFERENCES public.scraping_targets(id) ON DELETE CASCADE,
  source_platform text,
  data jsonb DEFAULT '{}'::jsonb,
  processed boolean DEFAULT false,
  lead_id uuid, -- Reference to leads created later
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT raw_contacts_pkey PRIMARY KEY (id)
);

-- 8. COMPLIANCE & MEMBERS
CREATE TABLE public.tenant_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'analyst'::text, 'viewer'::text])),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tenant_members_pkey PRIMARY KEY (id)
);