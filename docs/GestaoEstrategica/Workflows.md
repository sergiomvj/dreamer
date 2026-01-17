Fechado — vou entregar **TODOS** os próximos blocos agora, no mesmo padrão: **implementável**, **automação máxima**, **governança forte**, **sem improviso**.

A partir daqui você terá:

1. **Schemas finais Supabase + RLS completo (multi-tenant)**
2. **Workflows N8N (export JSON base) — prontos para importar e completar credenciais**
3. **PRD da aba Captação (que consome blueprint e executa com guardrails)**
4. **Módulo Planejamento de Copy & Mensagens (separado, mas integrado)**
5. **Simulador de risco por estratégia (modelo + regras + outputs)**

---

# 1) SCHEMAS FINAIS SUPABASE + RLS (MULTI-TENANT)

## 1.1 Convenções

* **Todos os registros pertencem a `workspace_id`**
* **RLS sempre ON**
* JWT carrega: `workspace_id`, `role` e opcionalmente `permissions`
* Tabelas “log” são **append-only** (sem updates/deletes por padrão)

---

## 1.2 Tabelas Core (Workspaces, Clients, RBAC)

```sql
-- Workspaces
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Clients (empresas atendidas)
create table clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  industry text,
  timezone text default 'America/Sao_Paulo',
  created_at timestamptz not null default now()
);

-- Workspace members
create table workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null, -- auth.users.id
  role text not null check (role in ('owner','admin','manager','operator','auditor')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- Permissions (opcional: se quiser granular)
create table permissions (
  key text primary key,
  description text
);

create table role_permissions (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  permission_key text not null references permissions(key) on delete cascade,
  unique(role, permission_key)
);
```

---

## 1.3 WhatsApp Accounts + Groups

```sql
create table wa_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  display_name text not null,
  provider text not null default 'whatsapp_cloud_api',
  provider_account_id text,
  phone_number text,
  status text not null default 'active' check (status in ('active','paused','degraded','disabled')),
  health_score int not null default 100 check (health_score between 0 and 100),
  mode text not null default 'balanced' check (mode in ('conservative','balanced','conversion')),
  limits jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table wa_groups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  wa_account_id uuid not null references wa_accounts(id) on delete cascade,
  provider_group_id text,
  name text not null,
  tags text[] not null default '{}'::text[],
  monitoring_enabled boolean not null default true,
  keywords jsonb not null default '[]'::jsonb, -- lista de palavras/regex/intenções
  created_at timestamptz not null default now()
);
```

---

## 1.4 Leads + Consentimento + CAL

```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  wa_account_id uuid references wa_accounts(id) on delete set null,

  phone_e164 text not null,
  display_name text,
  origin_type text not null check (origin_type in ('group','landing','ad','referral','manual','unknown')),
  origin_ref_id uuid, -- ex: wa_groups.id quando origin_type='group'
  origin_meta jsonb not null default '{}'::jsonb,

  status text not null default 'latent_lead'
    check (status in ('latent_lead','warming_candidate','warming_attempted','warming_active','opt_in_confirmed','converted','opted_out_locked')),

  warm_score int not null default 0 check (warm_score between 0 and 100),
  last_interaction_at timestamptz,
  next_allowed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (workspace_id, client_id, phone_e164)
);

create table lead_consent (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,

  consent_type text not null check (consent_type in ('opt_in','opt_out','soft_opt_in')),
  source text not null check (source in ('user_message','form','operator','system')),
  evidence jsonb not null default '{}'::jsonb, -- msg_id, timestamp, ip, etc.
  created_at timestamptz not null default now()
);

-- Lock global de opt-out (protege reimportação)
create table global_opt_out (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  phone_e164 text not null,
  reason text default 'user_request',
  created_at timestamptz not null default now(),
  unique(workspace_id, phone_e164)
);

-- Eventos do lead/CAL (append-only)
create table lead_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

---

## 1.5 Planejamento → Blueprint → Execução

```sql
create table strategies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,

  version int not null default 1,
  status text not null default 'draft' check(status in ('draft','approved','revoked')),
  summary jsonb not null default '{}'::jsonb, -- visão estratégica + limites globais
  created_by uuid not null,
  approved_by uuid,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table strategy_actions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  strategy_id uuid not null references strategies(id) on delete cascade,

  type text not null, -- warming, content, inbound, etc
  product_meta jsonb not null default '{}'::jsonb,
  audience jsonb not null default '{}'::jsonb,
  channel text not null,
  journey_stage text not null,
  limits jsonb not null default '{}'::jsonb,
  dependencies jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table execution_blueprints (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  strategy_id uuid not null references strategies(id) on delete cascade,
  blueprint jsonb not null,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table execution_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  strategy_id uuid not null references strategies(id) on delete cascade,
  action_id uuid references strategy_actions(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,

  run_type text not null, -- send_message, create_task, tag_lead, etc
  status text not null default 'queued' check(status in ('queued','running','success','failed','blocked')),
  error text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
```

---

## 1.6 Webhook Outbox (para N8N confiável)

```sql
create table webhook_outbox (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  event_type text not null,
  payload jsonb not null,
  status text not null default 'pending' check(status in ('pending','sent','failed')),
  attempt_count int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
```

---

## 1.7 Triggers úteis

```sql
-- updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

create trigger trg_leads_updated_at
before update on leads
for each row execute function set_updated_at();
```

---

## 1.8 RLS (exemplo robusto)

> Ajuste a função `current_workspace_id()` conforme sua estratégia de JWT (claim) ou tabela de sessão.

```sql
alter table clients enable row level security;
alter table wa_accounts enable row level security;
alter table wa_groups enable row level security;
alter table leads enable row level security;
alter table lead_consent enable row level security;
alter table global_opt_out enable row level security;
alter table lead_events enable row level security;
alter table strategies enable row level security;
alter table strategy_actions enable row level security;
alter table execution_blueprints enable row level security;
alter table execution_runs enable row level security;
alter table webhook_outbox enable row level security;
alter table workspace_members enable row level security;

-- helper (exemplo): usa claim "workspace_id"
create or replace function current_workspace_id()
returns uuid language sql stable as $$
  select nullif(auth.jwt()->>'workspace_id','')::uuid
$$;

-- policies (padrão)
create policy ws_isolation_clients on clients
for all using (workspace_id = current_workspace_id());

create policy ws_isolation_wa_accounts on wa_accounts
for all using (workspace_id = current_workspace_id());

create policy ws_isolation_wa_groups on wa_groups
for all using (workspace_id = current_workspace_id());

create policy ws_isolation_leads on leads
for all using (workspace_id = current_workspace_id());

create policy ws_isolation_lead_consent on lead_consent
for all using (workspace_id = current_workspace_id());

create policy ws_isolation_global_opt_out on global_opt_out
for all using (workspace_id = current_workspace_id());

create policy ws_isolation_lead_events on lead_events
for all using (workspace_id = current_workspace_id());

create policy ws_isolation_strategies on strategies
for all using (workspace_id = current_workspace_id());

create policy ws_isolation_strategy_actions on strategy_actions
for all using (workspace_id = current_workspace_id());

create policy ws_isolation_execution_blueprints on execution_blueprints
for all using (workspace_id = current_workspace_id());

create policy ws_isolation_execution_runs on execution_runs
for all using (workspace_id = current_workspace_id());

create policy ws_isolation_webhook_outbox on webhook_outbox
for all using (workspace_id = current_workspace_id());

-- opt-out: impede alterar/delete (append-only)
create policy lead_events_insert_only on lead_events
for insert with check (workspace_id = current_workspace_id());
revoke update, delete on lead_events from authenticated;
```

---

# 2) WORKFLOWS N8N — EXPORT JSON BASE (IMPORTÁVEL)

Abaixo estão **4 workflows essenciais** em formato de export mínimo (você ajusta credenciais e endpoints).
Eles já estão desenhados para rodar com o **Outbox Pattern** e “guards”.

> Observação: o JSON do n8n varia por versão; vou manter **estrutura compatível** e simples (Webhooks, HTTP, IF, Function).

---

## 2.1 WF — Strategy Approved → Publish Blueprint + Create Draft Flows

```json
{
  "name": "WF_STRATEGY_APPROVED",
  "nodes": [
    {
      "parameters": { "path": "strategy-approved", "httpMethod": "POST", "responseMode": "onReceived" },
      "name": "Webhook Strategy Approved",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [260, 200]
    },
    {
      "parameters": {
        "functionCode": "const p = items[0].json;\nif(!p.strategy_id || !p.workspace_id) throw new Error('missing ids');\nreturn items;"
      },
      "name": "Validate Payload",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [520, 200]
    },
    {
      "parameters": {
        "url": "={{$env.SUPABASE_URL}}/rest/v1/execution_blueprints",
        "method": "POST",
        "jsonParameters": true,
        "options": {},
        "bodyParametersJson": "={{JSON.stringify({workspace_id: $json.workspace_id, strategy_id: $json.strategy_id, blueprint: $json.execution_blueprint, published: true, published_at: new Date().toISOString()})}}",
        "headerParametersJson": "={{JSON.stringify({apikey: $env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + $env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type':'application/json', Prefer: 'return=representation'})}}"
      },
      "name": "Save Published Blueprint",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [780, 200]
    },
    {
      "parameters": {
        "functionCode": "return [{json:{ok:true, event:'strategy.approved', strategy_id:$json.strategy_id}}];"
      },
      "name": "Ack",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [1040, 200]
    }
  ],
  "connections": {
    "Webhook Strategy Approved": { "main": [[{ "node": "Validate Payload", "type": "main", "index": 0 }]] },
    "Validate Payload": { "main": [[{ "node": "Save Published Blueprint", "type": "main", "index": 0 }]] },
    "Save Published Blueprint": { "main": [[{ "node": "Ack", "type": "main", "index": 0 }]] }
  }
}
```

---

## 2.2 WF — Execution Guard (antes de qualquer ação de captação)

```json
{
  "name": "WF_EXECUTION_GUARD",
  "nodes": [
    {
      "parameters": { "path": "execute", "httpMethod": "POST", "responseMode": "onReceived" },
      "name": "Webhook Execute Request",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [260, 240]
    },
    {
      "parameters": {
        "url": "={{$env.SUPABASE_URL}}/rest/v1/execution_blueprints?strategy_id=eq.{{$json.strategy_id}}&published=eq.true&select=blueprint",
        "method": "GET",
        "headerParametersJson": "={{JSON.stringify({apikey:$env.SUPABASE_SERVICE_ROLE_KEY, Authorization:'Bearer '+$env.SUPABASE_SERVICE_ROLE_KEY})}}"
      },
      "name": "Fetch Published Blueprint",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [520, 240]
    },
    {
      "parameters": {
        "functionCode": "const req = items[0].json;\nconst bpArr = items[1].json;\nif(!Array.isArray(bpArr) || bpArr.length===0) return [{json:{allowed:false, reason:'no_published_blueprint', request:req}}];\nconst blueprint = bpArr[0].blueprint;\n// minimal checks\nif(blueprint.approved !== true) return [{json:{allowed:false, reason:'not_approved'}}];\nreturn [{json:{allowed:true, blueprint, request:req}}];"
      },
      "name": "Guard Decision",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [780, 240]
    },
    {
      "parameters": {
        "conditions": { "boolean": [{ "value1": "={{$json.allowed}}", "value2": true }] }
      },
      "name": "IF Allowed",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [1020, 240]
    }
  ],
  "connections": {
    "Webhook Execute Request": {
      "main": [
        [{ "node": "Fetch Published Blueprint", "type": "main", "index": 0 }]
      ]
    },
    "Fetch Published Blueprint": {
      "main": [
        [{ "node": "Guard Decision", "type": "main", "index": 0 }]
      ]
    },
    "Guard Decision": {
      "main": [
        [{ "node": "IF Allowed", "type": "main", "index": 0 }]
      ]
    }
  }
}
```

*(A partir do “IF Allowed”, você conecta o executor real: CAL Guard → WhatsApp API.)*

---

## 2.3 WF — CAL Guard + Send Message (Cloud API)

```json
{
  "name": "WF_CAL_SEND_MESSAGE",
  "nodes": [
    {
      "parameters": { "path": "cal-send", "httpMethod": "POST", "responseMode": "onReceived" },
      "name": "Webhook CAL Request",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [260, 260]
    },
    {
      "parameters": {
        "url": "={{$env.SUPABASE_URL}}/rest/v1/leads?id=eq.{{$json.lead_id}}&select=status,warm_score,next_allowed_at,phone_e164,workspace_id",
        "method": "GET",
        "headerParametersJson": "={{JSON.stringify({apikey:$env.SUPABASE_SERVICE_ROLE_KEY, Authorization:'Bearer '+$env.SUPABASE_SERVICE_ROLE_KEY})}}"
      },
      "name": "Fetch Lead",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [520, 260]
    },
    {
      "parameters": {
        "url": "={{$env.SUPABASE_URL}}/rest/v1/global_opt_out?workspace_id=eq.{{$json.workspace_id}}&phone_e164=eq.{{$json.phone_e164}}&select=id",
        "method": "GET",
        "headerParametersJson": "={{JSON.stringify({apikey:$env.SUPABASE_SERVICE_ROLE_KEY, Authorization:'Bearer '+$env.SUPABASE_SERVICE_ROLE_KEY})}}"
      },
      "name": "Check Global OptOut",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [760, 260]
    },
    {
      "parameters": {
        "functionCode": "const lead = items[1].json?.[0];\nconst opt = items[2].json;\nif(!lead) return [{json:{allowed:false, reason:'lead_not_found'}}];\nif(Array.isArray(opt) && opt.length>0) return [{json:{allowed:false, reason:'opted_out_locked'}}];\nif(lead.status === 'opted_out_locked') return [{json:{allowed:false, reason:'opted_out_locked'}}];\nif(lead.next_allowed_at && new Date(lead.next_allowed_at) > new Date()) return [{json:{allowed:false, reason:'cooldown'}}];\nreturn [{json:{allowed:true, lead}}];"
      },
      "name": "CAL Decision",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [1000, 260]
    },
    {
      "parameters": {
        "conditions": { "boolean": [{ "value1": "={{$json.allowed}}", "value2": true }] }
      },
      "name": "IF CAL Allowed",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [1220, 260]
    },
    {
      "parameters": {
        "url": "={{$env.WA_API_URL}}",
        "method": "POST",
        "jsonParameters": true,
        "bodyParametersJson": "={{JSON.stringify({to:$json.lead.phone_e164, type:'text', text:{body:$json.message_body}})}}",
        "headerParametersJson": "={{JSON.stringify({Authorization:'Bearer '+$env.WA_TOKEN,'Content-Type':'application/json'})}}"
      },
      "name": "Send WhatsApp",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [1460, 220]
    }
  ],
  "connections": {
    "Webhook CAL Request": { "main": [[{ "node": "Fetch Lead", "type": "main", "index": 0 }]] },
    "Fetch Lead": { "main": [[{ "node": "Check Global OptOut", "type": "main", "index": 0 }]] },
    "Check Global OptOut": { "main": [[{ "node": "CAL Decision", "type": "main", "index": 0 }]] },
    "CAL Decision": { "main": [[{ "node": "IF CAL Allowed", "type": "main", "index": 0 }]] },
    "IF CAL Allowed": { "main": [[{ "node": "Send WhatsApp", "type": "main", "index": 0 }]] }
  }
}
```

---

## 2.4 WF — Opt-out Global (SAIR)

```json
{
  "name": "WF_GLOBAL_OPTOUT",
  "nodes": [
    { "parameters": { "path": "wa-inbound", "httpMethod": "POST", "responseMode": "onReceived" },
      "name": "Webhook WA Inbound",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [260, 320]
    },
    {
      "parameters": {
        "functionCode": "const msg = $json.text || '';\nconst normalized = msg.trim().toUpperCase();\nreturn [{json:{...$json, normalized, isOptOut: normalized.includes('SAIR')}}];"
      },
      "name": "Detect SAIR",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [520, 320]
    },
    {
      "parameters": { "conditions": { "boolean": [{ "value1": "={{$json.isOptOut}}", "value2": true }] } },
      "name": "IF OptOut",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [760, 320]
    },
    {
      "parameters": {
        "url": "={{$env.SUPABASE_URL}}/rest/v1/global_opt_out",
        "method": "POST",
        "jsonParameters": true,
        "bodyParametersJson": "={{JSON.stringify({workspace_id:$json.workspace_id, phone_e164:$json.from, reason:'user_request'})}}",
        "headerParametersJson": "={{JSON.stringify({apikey:$env.SUPABASE_SERVICE_ROLE_KEY, Authorization:'Bearer '+$env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'})}}"
      },
      "name": "Insert Global OptOut",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [1000, 280]
    }
  ],
  "connections": {
    "Webhook WA Inbound": { "main": [[{ "node": "Detect SAIR", "type": "main", "index": 0 }]] },
    "Detect SAIR": { "main": [[{ "node": "IF OptOut", "type": "main", "index": 0 }]] },
    "IF OptOut": { "main": [[{ "node": "Insert Global OptOut", "type": "main", "index": 0 }]] }
  }
}
```

---

# 3) PRD — ABA “CAPTAÇÃO” (EXECUÇÃO CONTROLADA)

## 3.1 Missão

Executar somente o que foi aprovado no Planejamento, operando:

* inbox
* oportunidades
* ações de aquisição
* CAL e opt-in
* medição e reporting

**Captação é “executor cego com painel bonito”.**

---

## 3.2 Seções da Aba Captação

### A) **Execution Console**

* Lista de ações autorizadas (do blueprint)
* Estado: `ready / running / paused / blocked`
* Botões: **Start / Pause / Stop** (com motivo)
* Campo: “limite diário” (somente leitura; vem do blueprint)

### B) **Leads Pipeline**

* Kanban por status (latent → warming → opt-in → converted)
* Filtros: origem (grupo/campanha), score, último contato, opt-out
* Ações rápidas:

  * “Enviar para CAL”
  * “Pausar lead”
  * “Marcar convertido”
  * “Bloquear (opt-out manual)”

### C) **Opportunities Inbox**

* Tickets gerados do monitoramento
* Cada ticket:

  * contexto (mensagens)
  * intenção detectada
  * CTA sugerido (apenas recomendação)
  * “Criar lead” / “Linkar lead existente”

### D) **CAL Monitor**

* fila de aquecimentos agendados
* cooldowns
* taxa de resposta
* taxa de opt-out
* “modo de operação” da conta (somente leitura, com indicação do porquê)

### E) **Run Logs**

* execuções (execution_runs)
* sucesso/falha/bloqueado
* motivo do bloqueio (hard rule)
* link para lead / ação / estratégia

---

## 3.3 Hard Rules na Captação

* não cria estratégia
* não altera blueprint
* não altera limites globais
* não envia mensagem direto (sempre via CAL)

---

# 4) MÓDULO “PLANEJAMENTO DE COPY & MENSAGENS” (SEPARADO, MAS INTEGRADO)

Você disse que isso será outro módulo — perfeito. Aqui vai o PRD dele **já compatível** com o sistema.

## 4.1 Missão

Criar e governar:

* biblioteca de mensagens
* variações por público/fase
* versionamento e aprovação
* compliance e “safe copy”
* associação com ações do blueprint

## 4.2 Componentes

* **Message Library**

  * templates por canal (WhatsApp, IG DM, Email etc.)
  * categorias: aquecimento, conversão, reativação, suporte
* **Approval Flow**

  * draft → review → approved → deprecated
* **Variables Engine**

  * `{{first_name}}`, `{{product}}`, `{{cta_link}}`
* **Copy Safety Validator**

  * bloqueia termos de risco (spammy)
  * exige opt-out footer quando WhatsApp
* **Template Binding**

  * action_id ↔ template_id (somente após aprovação)

## 4.3 Integração com CAL

* CAL recebe: `message_template_id` + `variables`
* CAL renderiza + registra no log (`lead_events`)

---

# 5) SIMULADOR DE RISCO POR ESTRATÉGIA (AUTO-VALIDADOR)

## 5.1 Objetivo

Antes de aprovar uma estratégia, o sistema calcula:

* **Risk Score (0–100)**
* **Motivos**
* **Recomendações automáticas**
* **Bloqueio se risco crítico**

## 5.2 Inputs

* tipo de oferta (fricção/ticket/ciclo)
* público (frio/morno/quente)
* canal
* frequência prevista
* uso de grupo como origem
* modo (conservative/balanced/conversion)
* histórico da conta (health_score + opt-out rate)

## 5.3 Risk Score (exemplo de regra)

* Público frio + WhatsApp conversão direta: **+25**
* Frequência > 2/semana em warming: **+15**
* Origem grupo sem etapa de opt-in prevista: **+30**
* Conta com health_score < 70: **+20**
* Opt-out rate > 5% recente: **+20**
* (Redutores)

  * CAL com fase 2 restrita (1 tentativa): **−10**
  * Conteúdo + CTA opt-in: **−15**
  * Revisão humana obrigatória: **−10**

## 5.4 Saída do simulador (payload)

```json
{
  "risk_score": 72,
  "risk_level": "high",
  "block_approval": true,
  "reasons": [
    "cold_to_direct_whatsapp_conversion",
    "missing_opt_in_stage",
    "account_health_low"
  ],
  "recommendations": [
    "switch_to_balanced_cal",
    "insert_content_stage_before_warming",
    "enforce_human_review"
  ]
}
```

## 5.5 Automação (N8N)

* Evento: `strategy.validation_requested`
* N8N roda risk engine (Function node)
* Atualiza `strategies.summary` com o resultado
* Se `block_approval=true` → dispara `strategy.blocked`

---

# CHECKLIST FINAL: O QUE VOCÊ TEM AGORA

✅ Contratos Planejamento→Captação e Captação→CAL/WhatsApp (já feito antes)
✅ **Schemas finais Supabase + RLS (multi-tenant)**
✅ **Workflows N8N (JSON base importável) + Guards + Opt-out**
✅ **PRD da aba Captação (executor cego)**
✅ **PRD do módulo Copy & Mensagens (governança e aprovação)**
✅ **Simulador de Risco (modelo + outputs + automação)**

---

