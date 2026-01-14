Backlog técnico (Épicos → Stories)
EPIC A — Fundação e Multi-Tenant

Objetivo: garantir multi-projeto/multi-conta nativo, base de usuários, permissões, auditoria.

Stories

A1. Criar modelo de Tenancy: tenants, projects, memberships (roles).

A2. Implementar autenticação (Supabase Auth) + perfis de usuário.

A3. Implementar RLS por tenant + “current_tenant()”.

A4. Implementar logs/auditoria: audit_log (evento, ator, payload).

A5. Implementar “limites filosóficos” por projeto (policy rules engine v0).

Critérios de aceite

Usuário só acessa dados do(s) tenant(s) que pertence.

Toda mutação relevante grava em audit_log.

EPIC B — Foundation Flow (Onboarding Estratégico)

Objetivo: criar o fluxo base (empresa → produtos → avaliação → escopo).

Stories

B1. Tela “Criar Projeto” com DNA estratégico (missão, objetivos, metas filosóficas, limites).

B2. CRUD de Produtos Estratégicos (ICP, dores, consciência, tipo de decisão, papel do produto).

B3. “Diagnóstico Inicial” (gerar score, tensões, riscos, oportunidades).

B4. “Escolha de Ritmo/Escopo” (conservador/híbrido/agressivo) + regras iniciais.

B5. Persistir “Strategy Blueprint v0” gerado (copy + kickoff + desdobramentos).

Critérios de aceite

Projeto “pronto para operar” só quando completar os 4 passos.

Diagnóstico e blueprint ficam versionados.

EPIC C — Strategy Layer (Blueprints e Versionamento)

Objetivo: estratégia como entidade governante (não execução).

Stories

C1. CRUD Estratégias (tipo, hipótese, status, versão).

C2. CRUD Abordagens (canal, formato, permitido/bloqueado, regras).

C3. CRUD Fluxos (journey) + versionamento.

C4. Taxonomia de eventos por fluxo (event schema v0).

C5. Comparação de versões (estratégia/fluxo) com métricas acionáveis.

EPIC D — Orquestração e Ingestão de Leads (Control Plane v0)

Objetivo: centralizar entradas (forms/ads/webhooks/WA/IG) e normalizar.

Stories

D1. Endpoint de ingestão (webhook) por tenant/projeto/conta.

D2. Normalização do payload → leads + lead_events.

D3. Dedupe (email/phone/external_id) com estratégia configurável.

D4. Mapeamento de origem (channel/account/campaign/creative).

D5. Criação automática de “next_best_action” inicial.

EPIC E — Lead Intelligence (Qualificação + Score Vivo)

Objetivo: classificar intenção e atualizar score por eventos e comportamento.

Stories

E1. Engine de scoring (regras + pesos) por projeto/produto.

E2. Reclassificação por eventos (frio/morno/quente) em tempo real.

E3. Enriquecimento (integrações: Clearbit/Apollo/Hunter) — stub.

E4. Behavioral signals (page views, CTA clicks) — via eventos.

E5. Tela de explicabilidade: “por que esse lead está com esse score”.

EPIC F — CRM Estratégico (Camada Operacional Subordinada)

Objetivo: lista de leads com contexto total + filtros estratégicos.

Stories

F1. Pipeline (stages) customizável por projeto/produto.

F2. Lead Profile 360 (contexto: estratégia, abordagem, fluxo, eventos, mensagens).

F3. Filtros avançados (conta, estratégia, fluxo, intenção, “humano necessário”).

F4. Task queue (fila de follow-up) + SLA.

F5. Automations handoff (quando chamar humano vs automação).

EPIC G — Observabilidade e BI Acionável

Objetivo: dashboards que respondem “o que fazer agora”.

Stories

G1. Executive Dashboard (volume, qualidade, ROI por canal).

G2. Strategic Dashboard (estratégias vencedoras, gargalos, drop points).

G3. Operational Dashboard (fila, follow-ups, SLAs estourando).

G4. Funnel/Journey visual (Ad→LP→Bot→SDR→Venda).

G5. Relatórios comparativos (período vs período, versão vs versão).

EPIC H — SDR Virtual + Nutrição Multicanal (Fase avançada)

Objetivo: conversa guiada + qualificação + agendamento + follow-up.

Stories

H1. Modelar “Conversation Sessions” + mensagens.

H2. Regras de “handoff para humano”.

H3. Cadências (email/WA/push) com gatilhos por evento.

H4. Agendamento (integração calendário) — opcional.

H5. Playbooks inteligentes por nicho/estratégia.

2) Modelagem SQL (Supabase / Postgres) — DDL + RLS (base)

Abaixo um MVP robusto (multi-tenant, versionamento, eventos, CRM, auditoria).
Você pode colar em uma migration no Supabase.

Observação: Auth via auth.users. Usamos profiles como espelho.

begin;

-- =========================
-- EXTENSIONS
-- =========================
create extension if not exists "pgcrypto";

-- =========================
-- ENUMS
-- =========================
do $$ begin
  create type public.member_role as enum ('owner','admin','editor','operator','viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lead_intent as enum ('cold','warm','hot');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lead_status as enum ('new','working','qualified','won','lost','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.strategy_status as enum ('draft','active','paused','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.flow_status as enum ('draft','active','paused','archived');
exception when duplicate_object then null; end $$;

-- =========================
-- CORE: TENANTS & MEMBERS (CRIE PRIMEIRO)
-- =========================
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'viewer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

-- =========================
-- HELPERS (AGORA SIM, TABELA JÁ EXISTE)
-- =========================
create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid()
$$;

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.tenant_id', true), '')::uuid
$$;

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
  )
$$;

create or replace function public.has_tenant_role(p_tenant_id uuid, p_role public.member_role)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = p_tenant_id
      and tm.user_id = auth.uid()
      and tm.role = p_role
      and tm.is_active = true
  )
$$;

-- =========================
-- PROJECTS + DNA STRATEGY
-- =========================
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  mission text,
  global_objectives jsonb not null default '[]'::jsonb,
  philosophical_goals jsonb not null default '[]'::jsonb,
  constraints jsonb not null default '{}'::jsonb,
  automation_policy jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.project_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  channel text not null,
  account_label text not null,
  external_account_id text,
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- =========================
-- PRODUCTS
-- =========================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  icp jsonb not null default '{}'::jsonb,
  pain_map jsonb not null default '{}'::jsonb,
  awareness_level text,
  decision_type text,
  product_role text,
  created_at timestamptz not null default now()
);

-- =========================
-- STRATEGIES / BLUEPRINTS / APPROACHES / FLOWS
-- =========================
create table if not exists public.strategies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  strategy_type text not null,
  hypothesis text,
  status public.strategy_status not null default 'draft',
  version int not null default 1,
  parent_strategy_id uuid references public.strategies(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.strategy_blueprints (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  strategy_id uuid not null references public.strategies(id) on delete cascade,
  copy_assets jsonb not null default '{}'::jsonb,
  kickoff_plan jsonb not null default '[]'::jsonb,
  decision_rules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.approaches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  strategy_id uuid not null references public.strategies(id) on delete cascade,
  project_account_id uuid references public.project_accounts(id) on delete set null,
  channel text not null,
  format text not null,
  allowed boolean not null default true,
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.flows (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  approach_id uuid not null references public.approaches(id) on delete cascade,
  name text not null,
  status public.flow_status not null default 'draft',
  version int not null default 1,
  parent_flow_id uuid references public.flows(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.flow_steps (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  flow_id uuid not null references public.flows(id) on delete cascade,
  step_order int not null,
  step_type text not null,
  config jsonb not null default '{}'::jsonb,
  unique (flow_id, step_order)
);

create table if not exists public.event_types (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  flow_id uuid references public.flows(id) on delete cascade,
  code text not null,
  description text,
  weight int not null default 0,
  schema jsonb not null default '{}'::jsonb,
  unique (tenant_id, flow_id, code)
);

-- =========================
-- LEADS + EVENTS
-- =========================
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  strategy_id uuid references public.strategies(id) on delete set null,
  approach_id uuid references public.approaches(id) on delete set null,
  flow_id uuid references public.flows(id) on delete set null,
  project_account_id uuid references public.project_accounts(id) on delete set null,

  full_name text,
  email text,
  phone text,

  external_id text,
  source jsonb not null default '{}'::jsonb,
  intent public.lead_intent not null default 'cold',
  score numeric(10,2) not null default 0,
  status public.lead_status not null default 'new',
  next_best_action jsonb not null default '{}'::jsonb,
  requires_human boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_leads_tenant_project on public.leads(tenant_id, project_id);
create index if not exists idx_leads_email on public.leads(email);
create index if not exists idx_leads_phone on public.leads(phone);
create index if not exists idx_leads_external on public.leads(external_id);

create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  flow_id uuid references public.flows(id) on delete set null,
  event_code text not null,
  payload jsonb not null default '{}'::jsonb,
  happened_at timestamptz not null default now()
);

create index if not exists idx_lead_events_lead_time on public.lead_events(lead_id, happened_at desc);

-- =========================
-- TASKS / SLA
-- =========================
create table if not exists public.lead_tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  assigned_to uuid references auth.users(id) on delete set null,
  title text not null,
  task_type text not null,
  due_at timestamptz,
  status text not null default 'open',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =========================
-- AUDIT LOG
-- =========================
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =========================
-- updated_at trigger for leads
-- =========================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_leads_updated_at on public.leads;
create trigger trg_leads_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

commit;


Notas práticas (Supabase)

Para ingestão segura de webhooks externos, normalmente você usa Edge Function com service role (fora do RLS) e depois escreve nas tabelas.

Se quiser, eu gero também:

rpc_ingest_lead_event(...)

rpc_recompute_lead_score(lead_id)

views materializadas para dashboards

3) PRD específico para Stitch (UI + telas + copy)

Objetivo: o Stitch gerar todas as telas com microcopy e componentização alinhadas ao conceito (não CRM).

Diretrizes visuais

Estética: Control Tower / Ops Console (limpo, moderno, “BI operacional”)

Layout: estilo VS Code / Linear (sidebar + topbar + main canvas + right inspector)

Tom de texto: direto, “governança e decisão”

UX: “wizard” para Foundation Flow (passo a passo com sensação de progresso)

Mapa de navegação (Sidebar)

Overview

Projects

Strategy Control

Flows

Leads (CRM Estratégico)

Tasks / SLA

Intelligence (BI)

Playbooks

Integrations

Settings

Telas obrigatórias (com objetivos e componentes)
Tela 0 — Landing Page (Marketing)

Objetivo: posicionar como Acquisition OS, capturar cadastro.

Seções

Hero

Headline: “Govern your acquisition. Don’t just collect leads.”

Sub: “Strategy-first. Event-driven. Multi-account. Decision-grade dashboards.”

CTAs: “Start your Control Plane” + “See a Demo”

Problem → Solution blocks (3 cards)

“What you get” (Strategy Blueprint, Cold Lead Profile by Account, Strategic CRM)

Social proof placeholders

Pricing teaser (opcional no MVP)

Footer com páginas padrão

Componentes

Hero + CTA

Feature cards

Screenshot placeholders (console mock)

FAQ accordion

Tela 1 — Auth (Login/Sign up)

Login

Criar conta

Esqueci senha

Tela 2 — Create Tenant / Workspace

Copy

Título: “Create your workspace”

Sub: “A workspace can host multiple projects, accounts, and strategies.”

Tela 3 — Foundation Flow Wizard (4 passos)
3.1 Step 1: Project DNA

Campos:

Project name

Mission (texto)

Global objectives (lista)

Philosophical goals (tags)

Constraints (checkboxes + textarea)

Automation policy (slider + checkboxes)

Microcopy exemplo:

“Automation is powerful. Governance is mandatory.”

“Define what must never happen even if performance improves.”

3.2 Step 2: Products

CRUD inline (cards):

ICP (who is / who is not)

Awareness level

Pain map

Decision type

Product role

3.3 Step 3: Initial Assessment (Auto)

UI:

Score gauge

“Tensions detected” (chips)

“Risks” (list)

“Opportunities” (list)

CTA: “Generate first strategy blueprint”

3.4 Step 4: Scope & Pace

Cards:

Conservative / Hybrid / Aggressive
Inputs:

Desired pace

Human intervention points

Allowed channels (multi-select)
Output:

“Project is now operational”

Tela 4 — Overview (Control Tower)

Widgets:

Leads today by channel

Hot leads now

Bottlenecks

SLA breaches

“Next best actions” feed

Tela 5 — Strategy Control

Lista de estratégias (table + status pills)

Create Strategy

Strategy details

hypothesis

versioning

blueprint panel (copy assets / kickoff / rules)

Tela 6 — Flows (Journey Visual)

Flow list

Flow builder view (read-only no MVP, edit via form)

Journey map: “Ad → LP → Bot → SDR → Sale”

Tela 7 — Leads (CRM Estratégico)

Table com colunas:

Lead

Intent

Score

Strategy / Approach / Flow

Source (channel/account/campaign)

Next action

Requires human

Lead Profile 360 (drawer right):

timeline de eventos

mensagens

tasks

explicabilidade do score

Tela 8 — Tasks / SLA

fila de tarefas

por usuário

por SLA estourando

Tela 9 — Intelligence (BI)

Dashboards:

Executive

Strategic

Operational

Tela 10 — Integrations

Cards:

Webhooks

Meta

Google

WhatsApp

Email

CRM external

Status:

connected / pending / error

Entregáveis do Stitch

Component library (buttons, cards, badges, drawers, tables)

Todas as telas acima

Estados: empty/loading/error/success

Dark mode opcional

4) Arquitetura técnica detalhada (opinião técnica + módulos)
4.1 Stack recomendada (prática, baixa fricção)

Frontend: Next.js (App Router) + Tailwind + shadcn/ui

Auth + DB: Supabase (Postgres + Auth + Storage + Realtime)

Edge: Supabase Edge Functions (ingestão segura + service role)

Automação: n8n (cadências, integrações, enrichment)

Mensageria: WhatsApp (Evolution API) + Email provider

Observabilidade: PostHog ou OpenTelemetry (opcional)

LLM: OpenAI / fallback (via n8n ou API)

4.2 Componentes (serviços / módulos)
A) Web App (Console)

Responsável por:

Foundation Flow

Strategy Control

CRM Estratégico

Dashboards

Configurações

B) API Layer (Edge Functions + RPC)

Responsável por:

ingest_lead / ingest_event

normalização / dedupe

criação de tasks

recompute scoring

validações e auditoria

C) Event Store (Postgres)

lead_events como fonte de verdade

leads como estado atual (materializado)

D) Scoring Engine

Modo MVP: regras no DB (event_types.weight + config por projeto)
Modo avançado: função RPC + features + modelo.

E) Automation Orchestrator (n8n)

Fluxos típicos:

Enriquecimento (Hunter/Apollo/Clearbit)

Cadência (email/WA)

Follow-up SLA

Alertas (hot lead, SLA breach)

Handoff para humano (Chatwoot/CRM/Slack)

F) Connectors (Integrações)

Webhooks genéricos

Meta Lead Ads

Google Ads/Analytics events

WhatsApp inbound/outbound

Instagram DM (quando aplicável)

CRM externo (HubSpot/Pipedrive etc.)

4.3 Fluxos críticos (dataflow)
Fluxo 1 — Lead Ingestion (Ads/Form/WhatsApp)

Fonte envia payload → Edge Function /ingest

Edge Function:

resolve tenant_id/project_id/project_account_id

normaliza campos

dedupe

cria/atualiza leads

grava lead_events

gera next_best_action

cria lead_tasks se necessário

grava audit_log

Realtime atualiza console (opcional)

Fluxo 2 — Behavioral Tracking (Site)

Front registra eventos (page_view, cta_click, time_on_page) → /ingest_event

Eventos alimentam scoring e gargalos de fluxo

Fluxo 3 — Reclassificação / Score Vivo

Trigger (cron/n8n) ou evento real-time

rpc_recompute_lead_score atualiza:

score

intent

requires_human

next_best_action

Fluxo 4 — SDR Virtual (fase avançada)

Conversa entra via WhatsApp → webhook → event store

IA decide:

perguntas

diagnóstico

agendamento

handoff humano

4.4 Decisões de design importantes

Event-driven: dashboards e decisões nascem de eventos.

Strategy-first: lead sempre “carrega contexto” (strategy/approach/flow).

Multi-tenant real: tudo tem tenant_id.

Edge Functions para segurança: webhooks externos não batem direto no DB.

Parametrização total: regras ficam em jsonb (com validação).

4.5 Roadmap técnico (arquitetura)

MVP (4–6 semanas)

Foundation Flow + Strategies/Approaches/Flows

Ingestão + dedupe

CRM Estratégico + Tasks/SLA

Dashboards básicos

V1 (6–10 semanas)

Score vivo + explicabilidade

BI avançado (journey drop points)

Integrações Meta/WA

Playbooks v0

V2

SDR Virtual

Cadências multicanal completas

Recomendações “next best action” por IA

Se você quiser que eu já deixe pronto para execução, eu consigo entregar na sequência imediata:

RPCs essenciais (ingest_event, recompute_score, create_task_from_rule)

Views para dashboards (Executive/Strategic/Operational)

Fluxos n8n (em JSON) para: enrichment, SLA, hot lead alert, cadência WA/email


