Perfeito — vou seguir com **(1) DDL completo**, depois **(2) funções helper + RLS**, e por fim **(3) contratos de Webhook (eventos + payloads)**, tudo **copiar/colar** no Supabase.

> **Nota importante (Supabase):** as tabelas ficam no schema `public`. Vamos usar `auth.uid()` e **RLS ativo** em tudo que é multi-tenant.

---

## 1) SQL DDL — Tabelas, enums “leves”, índices e triggers de eventos

> Cole tudo no **SQL Editor** do Supabase (em blocos, se preferir).

```sql
-- =========================================
-- EXTENSIONS (geralmente já vem habilitado)
-- =========================================
create extension if not exists pgcrypto;

-- =========================================
-- BASIC HELPERS
-- =========================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================
-- 1) TENANCY + ACCESS
-- =========================================
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'free',
  created_at timestamptz not null default now()
);

create table if not exists public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','manager','analyst','viewer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index if not exists idx_tenant_members_user on public.tenant_members(user_id);
create index if not exists idx_tenant_members_tenant on public.tenant_members(tenant_id);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  niche text,
  status text not null default 'active' check (status in ('active','paused','archived')),
  monthly_budget numeric(14,2) not null default 0,
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now()
);

create index if not exists idx_projects_tenant on public.projects(tenant_id);

-- =========================================
-- 2) STRATEGY / BRIEFING
-- =========================================
create table if not exists public.project_briefings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  product text,
  offer text,
  value_prop text,
  audience jsonb not null default '{}'::jsonb,
  constraints jsonb not null default '{}'::jsonb,
  notes text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (project_id)
);

create trigger trg_project_briefings_updated
before update on public.project_briefings
for each row execute function public.set_updated_at();

create table if not exists public.strategy_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  version int not null,
  strategy jsonb not null default '{}'::jsonb,
  hypotheses jsonb not null default '[]'::jsonb,
  status text not null default 'draft'
    check (status in ('draft','awaiting_approval','approved','rejected')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (project_id, version)
);

create index if not exists idx_strategy_versions_project on public.strategy_versions(project_id);
create index if not exists idx_strategy_versions_tenant on public.strategy_versions(tenant_id);
create index if not exists idx_strategy_versions_status on public.strategy_versions(status);

-- =========================================
-- 3) EXPERIMENTS
-- =========================================
create table if not exists public.experiments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  strategy_version_id uuid references public.strategy_versions(id) on delete set null,
  name text not null,
  hypothesis text,
  variables jsonb not null default '{}'::jsonb,
  success_criteria jsonb not null default '{}'::jsonb,
  budget_cap numeric(14,2) not null default 0,
  start_at timestamptz,
  end_at timestamptz,
  status text not null default 'planned'
    check (status in ('planned','running','passed','failed','killed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_experiments_project on public.experiments(project_id);
create index if not exists idx_experiments_status on public.experiments(status);

create table if not exists public.experiment_variants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  experiment_id uuid not null references public.experiments(id) on delete cascade,
  variant_key text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'planned'
    check (status in ('planned','running','passed','failed','killed')),
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (experiment_id, variant_key)
);

create index if not exists idx_experiment_variants_experiment on public.experiment_variants(experiment_id);

-- =========================================
-- 4) CHANNELS / CAMPAIGNS / ACTIONS
-- =========================================
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  status text not null default 'active' check (status in ('active','disabled')),
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  channel_id uuid references public.channels(id) on delete set null,
  external_id text,
  objective text,
  status text not null default 'active' check (status in ('active','paused','ended')),
  budget_daily numeric(14,2) not null default 0,
  budget_lifetime numeric(14,2) not null default 0,
  targeting jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_campaigns_project on public.campaigns(project_id);
create index if not exists idx_campaigns_tenant on public.campaigns(tenant_id);

create table if not exists public.campaign_actions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  action_type text not null,
  requested_by text not null check (requested_by in ('agent','human')),
  requires_approval boolean not null default true,
  approval_status text not null default 'pending'
    check (approval_status in ('pending','approved','rejected')),
  payload jsonb not null default '{}'::jsonb,
  executed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_campaign_actions_campaign on public.campaign_actions(campaign_id);
create index if not exists idx_campaign_actions_approval on public.campaign_actions(approval_status);

-- =========================================
-- 5) METRICS
-- =========================================
create table if not exists public.metrics_daily (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  experiment_id uuid references public.experiments(id) on delete set null,
  date date not null,
  spend numeric(14,2) not null default 0,
  clicks int not null default 0,
  impressions int not null default 0,
  conversions int not null default 0,
  revenue numeric(14,2) not null default 0,
  cpa numeric(14,2),
  roas numeric(14,4),
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (tenant_id, project_id, date, campaign_id, experiment_id)
);

create index if not exists idx_metrics_daily_project_date on public.metrics_daily(project_id, date);

-- =========================================
-- 6) AGENTS / RUNS / WEBHOOK EVENTS
-- =========================================
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  stage text not null check (stage in ('planning','testing','execution','analysis','learning')),
  autonomy_level text not null default 'medium' check (autonomy_level in ('low','medium','high')),
  is_enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  agent_id uuid references public.agents(id) on delete set null,
  trigger_event text not null,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued','running','completed','failed')),
  started_at timestamptz,
  finished_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_runs_project on public.agent_runs(project_id);
create index if not exists idx_agent_runs_status on public.agent_runs(status);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new','sent','acked','failed')),
  sent_at timestamptz,
  acked_at timestamptz,
  retry_count int not null default 0,
  last_error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_webhook_events_status on public.webhook_events(status);
create index if not exists idx_webhook_events_type on public.webhook_events(event_type);

-- =========================================
-- 7) INSIGHTS / PLAYBOOKS
-- =========================================
create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  source text not null check (source in ('analysis_agent','human','import')),
  summary text not null,
  tags text[] not null default '{}'::text[],
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_insights_project on public.insights(project_id);

create table if not exists public.playbooks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  niche text,
  channel text,
  objective text,
  rules jsonb not null default '{}'::jsonb,
  confidence numeric(6,4) not null default 0.5,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create trigger trg_playbooks_updated
before update on public.playbooks
for each row execute function public.set_updated_at();

create index if not exists idx_playbooks_tenant on public.playbooks(tenant_id);

-- =========================================
-- 8) NOTIFICATIONS / AUDIT
-- =========================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  meta jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_tenant on public.notifications(tenant_id);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_agent_id uuid references public.agents(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  before jsonb not null default '{}'::jsonb,
  after jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_tenant on public.audit_logs(tenant_id);

-- =========================================
-- 9) EVENT FACTORY: helper to create webhook_events
-- =========================================
create or replace function public.emit_event(
  p_tenant_id uuid,
  p_project_id uuid,
  p_event_type text,
  p_payload jsonb
) returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  insert into public.webhook_events(tenant_id, project_id, event_type, payload)
  values (p_tenant_id, p_project_id, p_event_type, coalesce(p_payload, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

-- =========================================
-- 10) TRIGGERS TO EMIT EVENTS (mínimo útil)
-- =========================================

-- project.created
create or replace function public.trg_projects_emit()
returns trigger language plpgsql as $$
begin
  perform public.emit_event(new.tenant_id, new.id, 'project.created',
    jsonb_build_object('project_id', new.id, 'name', new.name, 'niche', new.niche, 'status', new.status)
  );
  return new;
end;
$$;

drop trigger if exists trg_projects_emit on public.projects;
create trigger trg_projects_emit
after insert on public.projects
for each row execute function public.trg_projects_emit();

-- briefing.updated
create or replace function public.trg_briefings_emit()
returns trigger language plpgsql as $$
begin
  perform public.emit_event(new.tenant_id, new.project_id, 'briefing.updated',
    jsonb_build_object('project_id', new.project_id, 'briefing_id', new.id)
  );
  return new;
end;
$$;

drop trigger if exists trg_briefings_emit on public.project_briefings;
create trigger trg_briefings_emit
after insert or update on public.project_briefings
for each row execute function public.trg_briefings_emit();

-- strategy.awaiting_approval / strategy.approved
create or replace function public.trg_strategy_versions_emit()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    if new.status = 'awaiting_approval' then
      perform public.emit_event(new.tenant_id, new.project_id, 'strategy.awaiting_approval',
        jsonb_build_object('project_id', new.project_id, 'strategy_version_id', new.id, 'version', new.version)
      );
    end if;
  end if;

  if (tg_op = 'UPDATE') then
    if (old.status is distinct from new.status) then
      if new.status = 'awaiting_approval' then
        perform public.emit_event(new.tenant_id, new.project_id, 'strategy.awaiting_approval',
          jsonb_build_object('project_id', new.project_id, 'strategy_version_id', new.id, 'version', new.version)
        );
      elsif new.status = 'approved' then
        perform public.emit_event(new.tenant_id, new.project_id, 'strategy.approved',
          jsonb_build_object('project_id', new.project_id, 'strategy_version_id', new.id, 'version', new.version)
        );
      elsif new.status = 'rejected' then
        perform public.emit_event(new.tenant_id, new.project_id, 'strategy.rejected',
          jsonb_build_object('project_id', new.project_id, 'strategy_version_id', new.id, 'version', new.version)
        );
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_strategy_versions_emit on public.strategy_versions;
create trigger trg_strategy_versions_emit
after insert or update on public.strategy_versions
for each row execute function public.trg_strategy_versions_emit();

-- experiment.created
create or replace function public.trg_experiments_emit()
returns trigger language plpgsql as $$
begin
  perform public.emit_event(new.tenant_id, new.project_id, 'experiment.created',
    jsonb_build_object('project_id', new.project_id, 'experiment_id', new.id, 'name', new.name, 'status', new.status)
  );
  return new;
end;
$$;

drop trigger if exists trg_experiments_emit on public.experiments;
create trigger trg_experiments_emit
after insert on public.experiments
for each row execute function public.trg_experiments_emit();

-- action.pending_approval / action.approved
create or replace function public.trg_campaign_actions_emit()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    if new.approval_status = 'pending' and new.requires_approval = true then
      perform public.emit_event(new.tenant_id, new.project_id, 'action.pending_approval',
        jsonb_build_object('project_id', new.project_id, 'campaign_action_id', new.id, 'campaign_id', new.campaign_id, 'action_type', new.action_type)
      );
    end if;
  end if;

  if (tg_op = 'UPDATE') then
    if old.approval_status is distinct from new.approval_status then
      if new.approval_status = 'approved' then
        perform public.emit_event(new.tenant_id, new.project_id, 'action.approved',
          jsonb_build_object('project_id', new.project_id, 'campaign_action_id', new.id, 'campaign_id', new.campaign_id, 'action_type', new.action_type)
        );
      elsif new.approval_status = 'rejected' then
        perform public.emit_event(new.tenant_id, new.project_id, 'action.rejected',
          jsonb_build_object('project_id', new.project_id, 'campaign_action_id', new.id, 'campaign_id', new.campaign_id, 'action_type', new.action_type)
        );
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_campaign_actions_emit on public.campaign_actions;
create trigger trg_campaign_actions_emit
after insert or update on public.campaign_actions
for each row execute function public.trg_campaign_actions_emit();

-- insight.created
create or replace function public.trg_insights_emit()
returns trigger language plpgsql as $$
begin
  perform public.emit_event(new.tenant_id, new.project_id, 'insight.created',
    jsonb_build_object('project_id', new.project_id, 'insight_id', new.id, 'source', new.source)
  );
  return new;
end;
$$;

drop trigger if exists trg_insights_emit on public.insights;
create trigger trg_insights_emit
after insert on public.insights
for each row execute function public.trg_insights_emit();
```

---

## 2) Funções helper + RLS (multi-tenant “de verdade”)

### 2.1 Funções (membership/role) — usadas em policies

```sql
-- =========================================
-- MEMBERSHIP HELPERS (RLS)
-- =========================================
create or replace function public.is_tenant_member(p_tenant_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = p_tenant_id
      and tm.user_id = auth.uid()
      and tm.is_active = true
  );
$$;

create or replace function public.tenant_role(p_tenant_id uuid)
returns text
language sql
stable
as $$
  select tm.role
  from public.tenant_members tm
  where tm.tenant_id = p_tenant_id
    and tm.user_id = auth.uid()
    and tm.is_active = true
  limit 1;
$$;

create or replace function public.has_tenant_role(p_tenant_id uuid, p_roles text[])
returns boolean
language sql
stable
as $$
  select public.tenant_role(p_tenant_id) = any(p_roles);
$$;
```

### 2.2 Ativar RLS + policies (padrão por tabela)

> Regra: **viewer/analyst** = leitura; **manager/admin/owner** = escrita.
> Para tabelas “sensíveis” (ex: `campaign_actions`), manager+ aprova, mas criação pode ser `agent` via service role (edge function) ou manager+.

#### Tenants / Members

```sql
alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;

-- tenants: membros podem ler
drop policy if exists tenants_select on public.tenants;
create policy tenants_select on public.tenants
for select using (public.is_tenant_member(id));

-- tenants: apenas owner/admin pode atualizar (opcional)
drop policy if exists tenants_update on public.tenants;
create policy tenants_update on public.tenants
for update using (public.has_tenant_role(id, array['owner','admin']))
with check (public.has_tenant_role(id, array['owner','admin']));

-- tenant_members: ler membros do seu tenant
drop policy if exists tenant_members_select on public.tenant_members;
create policy tenant_members_select on public.tenant_members
for select using (public.is_tenant_member(tenant_id));

-- tenant_members: owner/admin gerencia membros
drop policy if exists tenant_members_insert on public.tenant_members;
create policy tenant_members_insert on public.tenant_members
for insert with check (public.has_tenant_role(tenant_id, array['owner','admin']));

drop policy if exists tenant_members_update on public.tenant_members;
create policy tenant_members_update on public.tenant_members
for update using (public.has_tenant_role(tenant_id, array['owner','admin']))
with check (public.has_tenant_role(tenant_id, array['owner','admin']));
```

#### Projects

```sql
alter table public.projects enable row level security;

drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects
for select using (public.is_tenant_member(tenant_id));

drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects
for insert with check (public.has_tenant_role(tenant_id, array['owner','admin','manager']));

drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects
for update using (public.has_tenant_role(tenant_id, array['owner','admin','manager']))
with check (public.has_tenant_role(tenant_id, array['owner','admin','manager']));
```

#### Briefings / Strategy

```sql
alter table public.project_briefings enable row level security;
alter table public.strategy_versions enable row level security;

-- briefings
drop policy if exists briefings_select on public.project_briefings;
create policy briefings_select on public.project_briefings
for select using (public.is_tenant_member(tenant_id));

drop policy if exists briefings_upsert on public.project_briefings;
create policy briefings_upsert on public.project_briefings
for all using (public.has_tenant_role(tenant_id, array['owner','admin','manager']))
with check (public.has_tenant_role(tenant_id, array['owner','admin','manager']));

-- strategy_versions
drop policy if exists strategy_select on public.strategy_versions;
create policy strategy_select on public.strategy_versions
for select using (public.is_tenant_member(tenant_id));

drop policy if exists strategy_insert on public.strategy_versions;
create policy strategy_insert on public.strategy_versions
for insert with check (public.has_tenant_role(tenant_id, array['owner','admin','manager']));

drop policy if exists strategy_update on public.strategy_versions;
create policy strategy_update on public.strategy_versions
for update using (public.has_tenant_role(tenant_id, array['owner','admin','manager']))
with check (public.has_tenant_role(tenant_id, array['owner','admin','manager']));
```

#### Experiments / Variants

```sql
alter table public.experiments enable row level security;
alter table public.experiment_variants enable row level security;

drop policy if exists experiments_select on public.experiments;
create policy experiments_select on public.experiments
for select using (public.is_tenant_member(tenant_id));

drop policy if exists experiments_write on public.experiments;
create policy experiments_write on public.experiments
for all using (public.has_tenant_role(tenant_id, array['owner','admin','manager']))
with check (public.has_tenant_role(tenant_id, array['owner','admin','manager']));

drop policy if exists variants_select on public.experiment_variants;
create policy variants_select on public.experiment_variants
for select using (public.is_tenant_member(tenant_id));

drop policy if exists variants_write on public.experiment_variants;
create policy variants_write on public.experiment_variants
for all using (public.has_tenant_role(tenant_id, array['owner','admin','manager']))
with check (public.has_tenant_role(tenant_id, array['owner','admin','manager']));
```

#### Channels / Campaigns / Actions

```sql
alter table public.channels enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_actions enable row level security;

-- channels
drop policy if exists channels_select on public.channels;
create policy channels_select on public.channels
for select using (public.is_tenant_member(tenant_id));

drop policy if exists channels_write on public.channels;
create policy channels_write on public.channels
for all using (public.has_tenant_role(tenant_id, array['owner','admin','manager']))
with check (public.has_tenant_role(tenant_id, array['owner','admin','manager']));

-- campaigns
drop policy if exists campaigns_select on public.campaigns;
create policy campaigns_select on public.campaigns
for select using (public.is_tenant_member(tenant_id));

drop policy if exists campaigns_write on public.campaigns;
create policy campaigns_write on public.campaigns
for all using (public.has_tenant_role(tenant_id, array['owner','admin','manager']))
with check (public.has_tenant_role(tenant_id, array['owner','admin','manager']));

-- campaign_actions: leitura para membros; escrita para manager+
drop policy if exists actions_select on public.campaign_actions;
create policy actions_select on public.campaign_actions
for select using (public.is_tenant_member(tenant_id));

drop policy if exists actions_write on public.campaign_actions;
create policy actions_write on public.campaign_actions
for all using (public.has_tenant_role(tenant_id, array['owner','admin','manager']))
with check (public.has_tenant_role(tenant_id, array['owner','admin','manager']));
```

#### Metrics / Agents / Runs / Events / Insights / Playbooks / Notifications / Audit

```sql
alter table public.metrics_daily enable row level security;
alter table public.agents enable row level security;
alter table public.agent_runs enable row level security;
alter table public.webhook_events enable row level security;
alter table public.insights enable row level security;
alter table public.playbooks enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- metrics
drop policy if exists metrics_select on public.metrics_daily;
create policy metrics_select on public.metrics_daily
for select using (public.is_tenant_member(tenant_id));

drop policy if exists metrics_write on public.metrics_daily;
create policy metrics_write on public.metrics_daily
for all using (public.has_tenant_role(tenant_id, array['owner','admin','manager']))
with check (public.has_tenant_role(tenant_id, array['owner','admin','manager']));

-- agents
drop policy if exists agents_select on public.agents;
create policy agents_select on public.agents
for select using (public.is_tenant_member(tenant_id));

drop policy if exists agents_write on public.agents;
create policy agents_write on public.agents
for all using (public.has_tenant_role(tenant_id, array['owner','admin']))
with check (public.has_tenant_role(tenant_id, array['owner','admin']));

-- agent_runs
drop policy if exists agent_runs_select on public.agent_runs;
create policy agent_runs_select on public.agent_runs
for select using (public.is_tenant_member(tenant_id));

drop policy if exists agent_runs_write on public.agent_runs;
create policy agent_runs_write on public.agent_runs
for all using (public.has_tenant_role(tenant_id, array['owner','admin','manager']))
with check (public.has_tenant_role(tenant_id, array['owner','admin','manager']));

-- webhook_events (normalmente só service role escreve; mas leitura ok p/ manager+)
drop policy if exists webhook_events_select on public.webhook_events;
create policy webhook_events_select on public.webhook_events
for select using (public.has_tenant_role(tenant_id, array['owner','admin','manager']));

-- Evite inserts diretos via client. (Edge Functions fazem com service role)
-- Se você quiser permitir insert via app, descomente abaixo:
-- create policy webhook_events_insert on public.webhook_events
-- for insert with check (public.has_tenant_role(tenant_id, array['owner','admin','manager']));

-- insights
drop policy if exists insights_select on public.insights;
create policy insights_select on public.insights
for select using (public.is_tenant_member(tenant_id));

drop policy if exists insights_write on public.insights;
create policy insights_write on public.insights
for all using (public.has_tenant_role(tenant_id, array['owner','admin','manager']))
with check (public.has_tenant_role(tenant_id, array['owner','admin','manager']));

-- playbooks (admin+ mantém; leitura para membros)
drop policy if exists playbooks_select on public.playbooks;
create policy playbooks_select on public.playbooks
for select using (public.is_tenant_member(tenant_id));

drop policy if exists playbooks_write on public.playbooks;
create policy playbooks_write on public.playbooks
for all using (public.has_tenant_role(tenant_id, array['owner','admin']))
with check (public.has_tenant_role(tenant_id, array['owner','admin']));

-- notifications: usuário só vê as próprias
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
for select using (user_id = auth.uid());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
for update using (user_id = auth.uid())
with check (user_id = auth.uid());

-- audit_logs: manager+ lê
drop policy if exists audit_select on public.audit_logs;
create policy audit_select on public.audit_logs
for select using (public.has_tenant_role(tenant_id, array['owner','admin','manager']));
```

### Como os agentes (n8n/Edge Functions) escrevem com RLS ativo?

* **Edge Functions** e jobs server-side devem usar a **Service Role Key** (bypass RLS).
* No client (frontend), você mantém o app seguro com RLS.
* No n8n, ou você chama **Edge Function** (recomendado), ou usa diretamente o REST do Supabase com Service Key (menos recomendado).

---

## 3) Contratos de Webhook (Supabase → n8n)

### 3.1 Envelope padrão (sempre igual)

Todo evento enviado ao n8n deve seguir este envelope:

```json
{
  "event_id": "uuid",
  "event_type": "strategy.approved",
  "tenant_id": "uuid",
  "project_id": "uuid|null",
  "created_at": "2026-01-17T00:00:00Z",
  "payload": {}
}
```

### 3.2 Eventos principais (MVP operacional)

#### `project.created`

```json
{
  "project_id": "uuid",
  "name": "Cliente X",
  "niche": "advocacia",
  "status": "active"
}
```

#### `briefing.updated`

```json
{
  "project_id": "uuid",
  "briefing_id": "uuid"
}
```

#### `strategy.awaiting_approval`

```json
{
  "project_id": "uuid",
  "strategy_version_id": "uuid",
  "version": 3
}
```

#### `strategy.approved`

```json
{
  "project_id": "uuid",
  "strategy_version_id": "uuid",
  "version": 3
}
```

#### `experiment.created`

```json
{
  "project_id": "uuid",
  "experiment_id": "uuid",
  "name": "Teste Criativo A vs B",
  "status": "planned"
}
```

#### `action.pending_approval`

```json
{
  "project_id": "uuid",
  "campaign_action_id": "uuid",
  "campaign_id": "uuid",
  "action_type": "scale_budget"
}
```

#### `action.approved`

```json
{
  "project_id": "uuid",
  "campaign_action_id": "uuid",
  "campaign_id": "uuid",
  "action_type": "scale_budget"
}
```

#### `insight.created`

```json
{
  "project_id": "uuid",
  "insight_id": "uuid",
  "source": "analysis_agent"
}
```

---

