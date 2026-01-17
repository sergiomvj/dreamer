Fechado. Vou te entregar agora:

1. **RPC `next_strategy_version(project_id)`** (+ helper opcional)
2. **Tabela `integrations` (tokens/credenciais por tenant + canal)** (+ índices + RLS)
3. **Export JSON do n8n (importável)** com **3 workflows MVP**:

   * `CRON Dispatcher`
   * `Event Ingest (Router)`
   * `Agent Planner (Planning)`

> Depois disso, você já consegue “fechar o loop” Supabase → n8n → Supabase.

---

## 1) RPC: `next_strategy_version(project_id)` (auto versionamento)

### SQL (copiar/colar)

```sql
create or replace function public.next_strategy_version(p_project_id uuid)
returns int
language plpgsql
stable
as $$
declare
  v_next int;
begin
  select coalesce(max(version), 0) + 1
    into v_next
  from public.strategy_versions
  where project_id = p_project_id;

  return v_next;
end;
$$;

-- Opcional: helper para criar strategy_version já com version correto (server-side)
create or replace function public.create_strategy_version(
  p_tenant_id uuid,
  p_project_id uuid,
  p_strategy jsonb,
  p_hypotheses jsonb,
  p_status text default 'awaiting_approval'
)
returns uuid
language plpgsql
as $$
declare
  v_version int;
  v_id uuid;
begin
  v_version := public.next_strategy_version(p_project_id);

  insert into public.strategy_versions(tenant_id, project_id, version, strategy, hypotheses, status, created_by)
  values (p_tenant_id, p_project_id, v_version, coalesce(p_strategy,'{}'::jsonb), coalesce(p_hypotheses,'[]'::jsonb), p_status, auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;
```

---

## 2) Tabela `integrations` (tokens por tenant/canal) + RLS

### Objetivo

Guardar as integrações (Meta/Google/etc.) por tenant **de forma segura** e padronizada para o Operator/Analyst.

### SQL (DDL + índices)

```sql
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider text not null,  -- 'meta_ads', 'google_ads', 'ga4', 'gsc', etc.
  name text not null default 'default',
  status text not null default 'active' check (status in ('active','disabled')),
  secrets jsonb not null default '{}'::jsonb,    -- tokens/keys (ideal: guardar criptografado fora; MVP ok)
  config jsonb not null default '{}'::jsonb,     -- conta, ad_account_id, customer_id, etc.
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, provider, name)
);

create index if not exists idx_integrations_tenant on public.integrations(tenant_id);
create index if not exists idx_integrations_provider on public.integrations(provider);

drop trigger if exists trg_integrations_updated on public.integrations;
create trigger trg_integrations_updated
before update on public.integrations
for each row execute function public.set_updated_at();
```

### RLS (recomendado)

* **Select**: apenas `owner/admin` (porque contém `secrets`)
* **Write**: apenas `owner/admin`
* Se você quiser permitir que `manager` veja “config sem secrets”, a gente cria uma `view` pública depois.

```sql
alter table public.integrations enable row level security;

drop policy if exists integrations_select on public.integrations;
create policy integrations_select on public.integrations
for select using (public.has_tenant_role(tenant_id, array['owner','admin']));

drop policy if exists integrations_write on public.integrations;
create policy integrations_write on public.integrations
for all using (public.has_tenant_role(tenant_id, array['owner','admin']))
with check (public.has_tenant_role(tenant_id, array['owner','admin']));
```

> MVP ok. Em produção “hard”, o ideal é mover tokens para um vault/secret manager e manter no banco só referências.

---

## 3) n8n — Export JSON (importável)

### Antes de importar

Crie estas env vars no n8n (Settings → Variables / Environment):

* `SUPABASE_FUNCTIONS_BASE` = `https://<PROJECT_REF>.supabase.co/functions/v1`
* `N8N_WEBHOOK_SECRET` = `mesmo_valor_do_supabase`
* `SUPABASE_URL` = `https://<PROJECT_REF>.supabase.co`
* `SUPABASE_SERVICE_KEY` (se você for chamar REST direto — **não recomendado**; prefira Edge Functions)

**Importante:** neste MVP, o n8n só chama **Edge Functions** (mais seguro).

---

### 3.1 Workflow: `CRON Dispatcher` (chama `dispatch-webhook`)

```json
{
  "name": "CRON Dispatcher",
  "nodes": [
    {
      "parameters": {
        "rule": { "interval": [{ "field": "minutes", "minutesInterval": 2 }] }
      },
      "id": "cron_dispatcher",
      "name": "Cron",
      "type": "n8n-nodes-base.cron",
      "typeVersion": 1,
      "position": [300, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_FUNCTIONS_BASE + '/dispatch-webhook' }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "x-webhook-secret", "value": "={{ $env.N8N_WEBHOOK_SECRET }}" }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "jsonBody": "{\n  \"ping\": true\n}"
      },
      "id": "http_dispatch",
      "name": "Dispatch Webhooks",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [560, 300]
    }
  ],
  "connections": {
    "Cron": { "main": [[{ "node": "Dispatch Webhooks", "type": "main", "index": 0 }]] }
  },
  "active": true,
  "versionId": "1"
}
```

---

### 3.2 Workflow: `Event Ingest (Router)` (Webhook `/events`)

```json
{
  "name": "Event Ingest (Router)",
  "nodes": [
    {
      "parameters": {
        "path": "events",
        "httpMethod": "POST",
        "responseMode": "onReceived",
        "options": {}
      },
      "id": "webhook_events",
      "name": "Webhook /events",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [280, 300]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.headers['x-webhook-secret'] || $json.headers['X-Webhook-Secret'] }}",
              "operation": "equal",
              "value2": "={{ $env.N8N_WEBHOOK_SECRET }}"
            }
          ]
        }
      },
      "id": "if_secret",
      "name": "IF Secret OK",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [520, 300]
    },
    {
      "parameters": {
        "value": "Unauthorized",
        "responseCode": 401
      },
      "id": "respond_401",
      "name": "Respond 401",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [780, 430]
    },
    {
      "parameters": {
        "propertyName": "event_type",
        "rules": [
          { "value": "briefing.updated", "output": "planner" },
          { "value": "project.created", "output": "planner" },
          { "value": "strategy.approved", "output": "tester" },
          { "value": "action.approved", "output": "operator" },
          { "value": "insight.created", "output": "learner" }
        ],
        "fallbackOutput": "ignore"
      },
      "id": "switch_event",
      "name": "Switch event_type",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 2,
      "position": [780, 300]
    },
    {
      "parameters": {
        "workflowId": "={{ $env.WF_AGENT_PLANNER_ID }}",
        "additionalFields": { "input": "={{ $json }}" }
      },
      "id": "exec_planner",
      "name": "Execute Planner WF",
      "type": "n8n-nodes-base.executeWorkflow",
      "typeVersion": 1,
      "position": [1040, 180]
    },
    {
      "parameters": {
        "value": "OK",
        "responseCode": 200
      },
      "id": "respond_200",
      "name": "Respond 200",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1040, 360]
    }
  ],
  "connections": {
    "Webhook /events": { "main": [[{ "node": "IF Secret OK", "type": "main", "index": 0 }]] },
    "IF Secret OK": {
      "main": [
        [{ "node": "Switch event_type", "type": "main", "index": 0 }],
        [{ "node": "Respond 401", "type": "main", "index": 0 }]
      ]
    },
    "Switch event_type": {
      "main": [
        [{ "node": "Execute Planner WF", "type": "main", "index": 0 }],
        [{ "node": "Respond 200", "type": "main", "index": 0 }]
      ]
    },
    "Execute Planner WF": { "main": [[{ "node": "Respond 200", "type": "main", "index": 0 }]] }
  },
  "active": true,
  "versionId": "1"
}
```

**Como usar:**
Após importar, pegue o **ID do workflow Planner** e defina no n8n uma env var:

* `WF_AGENT_PLANNER_ID = <id-do-workflow-planner>`

(Depois a gente adiciona Tester/Operator/Analyst/Learner do mesmo jeito.)

---

### 3.3 Workflow: `Agent Planner (Planning)` (MVP sem LLM ainda, só “fecha ciclo”)

Este workflow:

* Recebe o envelope do evento
* Cria um “output” básico (placeholder)
* Chama `agent-callback` para **ACK + agent_run** (e você já vê no dashboard)

```json
{
  "name": "Agent Planner (Planning)",
  "nodes": [
    {
      "parameters": {},
      "id": "start",
      "name": "Start",
      "type": "n8n-nodes-base.start",
      "typeVersion": 1,
      "position": [300, 300]
    },
    {
      "parameters": {
        "functionCode": "const ev = $json;\nreturn [{\n  event_id: ev.event_id,\n  tenant_id: ev.tenant_id,\n  project_id: ev.project_id,\n  event_type: ev.event_type,\n  planner_output: {\n    strategy: {\n      funnel: \"TOFU/MOFU/BOFU\",\n      channels: [\"meta_ads\", \"google_ads\"],\n      kpis: [\"CPA\", \"ROAS\"],\n      pacing: \"even\",\n      budget_policy: \"test_then_scale\"\n    },\n    hypotheses: [\n      { id: \"H1\", text: \"Criativo UGC supera institucional\" },\n      { id: \"H2\", text: \"Oferta com prova social reduz CPA\" }\n    ],\n    tests_map: [\n      { name: \"Teste Criativo A/B\", variable: \"creative\", window_hours: 48 }\n    ]\n  }\n}];"
      },
      "id": "fn_build",
      "name": "Build Planner Output",
      "type": "n8n-nodes-base.function",
      "typeVersion": 2,
      "position": [560, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_FUNCTIONS_BASE + '/agent-callback' }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "x-webhook-secret", "value": "={{ $env.N8N_WEBHOOK_SECRET }}" }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "jsonBody": "={\n  \"event_id\": $json.event_id,\n  \"tenant_id\": $json.tenant_id,\n  \"project_id\": $json.project_id,\n  \"agent\": {\"name\":\"Planner\",\"stage\":\"planning\"},\n  \"run\": {\"status\":\"completed\",\"output\": $json.planner_output},\n  \"updates\": [],\n  \"emit\": []\n}"
      },
      "id": "http_callback",
      "name": "Callback to Supabase",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [820, 300]
    }
  ],
  "connections": {
    "Start": { "main": [[{ "node": "Build Planner Output", "type": "main", "index": 0 }]] },
    "Build Planner Output": { "main": [[{ "node": "Callback to Supabase", "type": "main", "index": 0 }]] }
  },
  "active": true,
  "versionId": "1"
}
```

✅ Com isso você já valida:

* Trigger no DB cria `webhook_events`
* `dispatch-webhook` envia
* `Router` recebe
* Planner roda
* `agent-callback` dá ACK e grava `agent_runs`

---

