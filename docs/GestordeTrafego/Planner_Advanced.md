Bora. Vou te entregar agora o **Planner “real” (gera Strategy Version + notifica aprovação)** + **Tester (gera Experiments/Variants)** + **fluxo de aprovação** (Edge Function `approve-strategy`) e um **upgrade no `agent-callback`** para suportar **RPC calls** (porque isso simplifica MUITO a vida no n8n).

---

# 1) Upgrade: `agent-callback` com suporte a `rpc[]`

### O que muda

Além de `updates[]` e `emit[]`, o callback passa a aceitar:

```json
"rpc": [
  { "fn": "create_strategy_version", "args": { ... } }
]
```

### Substitua o arquivo `supabase/functions/agent-callback/index.ts` por este (mesmo, completo)

```ts
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";
import { assertWebhookSecret } from "../_shared/auth.ts";

function json(res: unknown, status = 200) {
  return new Response(JSON.stringify(res), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    assertWebhookSecret(req);
    const sb = supabaseAdmin();
    const body = await req.json();

    const eventId = body?.event_id as string | undefined;
    if (!eventId) throw new Error("Missing event_id");

    // lê o evento antes de atualizar
    const { data: ev, error: evErr } = await sb
      .from("webhook_events")
      .select("tenant_id, project_id, event_type")
      .eq("id", eventId)
      .maybeSingle();

    if (evErr) throw evErr;

    // ACK
    await sb
      .from("webhook_events")
      .update({ status: "acked", acked_at: new Date().toISOString() })
      .eq("id", eventId);

    const resolvedTenant = body?.tenant_id ?? ev?.tenant_id;
    const resolvedProject = body?.project_id ?? ev?.project_id;

    // grava agent_run (auditável)
    await sb.from("agent_runs").insert({
      tenant_id: resolvedTenant,
      project_id: resolvedProject,
      agent_id: null,
      trigger_event: ev?.event_type ?? "callback",
      input: body?.input ?? {},
      output: body?.run?.output ?? {},
      status: body?.run?.status ?? "completed",
      started_at: body?.run?.started_at ?? null,
      finished_at: new Date().toISOString(),
      error: body?.run?.error ?? null,
    });

    // RPC calls (novidade)
    const rpcs = Array.isArray(body?.rpc) ? body.rpc : [];
    const rpcResults: any[] = [];
    for (const r of rpcs) {
      if (!r?.fn) continue;
      const { data, error } = await sb.rpc(r.fn, r.args ?? {});
      if (error) throw error;
      rpcResults.push({ fn: r.fn, data });
    }

    // updates declarativos
    const updates = Array.isArray(body?.updates) ? body.updates : [];
    for (const u of updates) {
      const table = u.table;
      const op = u.op;
      const match = u.match ?? {};
      const data = u.data ?? {};
      if (!table || !op) continue;

      if (op === "insert") {
        const { error } = await sb.from(table).insert(data);
        if (error) throw error;
      } else if (op === "update") {
        let q = sb.from(table).update(data);
        for (const [k, v] of Object.entries(match)) q = q.eq(k, v as any);
        const { error } = await q;
        if (error) throw error;
      } else if (op === "upsert") {
        const { error } = await sb.from(table).upsert(data);
        if (error) throw error;
      }
    }

    // emits
    const emit = Array.isArray(body?.emit) ? body.emit : [];
    for (const e of emit) {
      const { error } = await sb.rpc("emit_event", {
        p_tenant_id: e.tenant_id,
        p_project_id: e.project_id ?? null,
        p_event_type: e.event_type,
        p_payload: e.payload ?? {},
      });
      if (error) throw error;
    }

    return json({ ok: true, rpcResults });
  } catch (e: any) {
    return json({ ok: false, error: String(e?.message || e) }, 400);
  }
}
```

---

# 2) Edge Function: `approve-strategy` (fluxo de aprovação do plano)

### Objetivo

Gestor aprova/rejeita uma `strategy_versions` e isso dispara os triggers que você já tem:

* `strategy.approved` → Tester
* `strategy.rejected` → (opcional)

### `supabase/functions/approve-strategy/index.ts`

```ts
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

function json(res: unknown, status = 200) {
  return new Response(JSON.stringify(res), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // MVP: admin client. Produção: validar JWT e role do usuário no tenant.
    const sb = supabaseAdmin();
    const body = await req.json();

    const strategyVersionId = body?.strategy_version_id as string;
    const decision = body?.decision as "approved" | "rejected";

    if (!strategyVersionId || !decision) throw new Error("Missing strategy_version_id or decision");

    const { data: sv, error: readErr } = await sb
      .from("strategy_versions")
      .select("id, status, tenant_id, project_id, version")
      .eq("id", strategyVersionId)
      .single();

    if (readErr) throw readErr;
    if (sv.status === decision) return json({ ok: true, status: sv.status });

    const { error: updErr } = await sb
      .from("strategy_versions")
      .update({ status: decision })
      .eq("id", strategyVersionId);

    if (updErr) throw updErr;

    // triggers do DB emitem strategy.approved/strategy.rejected
    return json({ ok: true, status: decision });
  } catch (e: any) {
    return json({ ok: false, error: String(e?.message || e) }, 400);
  }
}
```

---

# 3) n8n — Router atualizado (agora chama Tester também)

No workflow **Event Ingest (Router)**:

* Adicione env var: `WF_AGENT_TESTER_ID`
* No Switch, conecte `strategy.approved` → Execute Tester WF

**Alteração conceitual**:

* `briefing.updated` / `project.created` → Planner
* `strategy.approved` → Tester

*(Se quiser, depois adicionamos Operator/Analyst/Learner.)*

---

# 4) Planner REAL (n8n) — LLM → create_strategy_version → notification → callback

## 4.1 Prompt Planner (JSON estrito)

**System**

```text
You are a senior paid traffic strategist. Output ONLY valid JSON matching the schema. No markdown.
```

**User**

```text
Context:
- Goal: create a campaign strategy and a test map.
- You must be pragmatic: few channels, clear KPIs, clear hypotheses.
- Use Brazilian Portuguese.

Input JSON:
{{CONTEXT_JSON}}

Return JSON with this exact shape:
{
  "strategy": {
    "funnel": {"tofu":[], "mofu":[], "bofu":[]},
    "channels": [{"provider":"meta_ads|google_ads|tiktok_ads|linkedin_ads","objective":"text","budget_split_pct":0}],
    "kpis": ["CPA","ROAS","CVR","CPL"],
    "budget_policy": {"test_budget":0, "scale_rules":["..."], "kill_rules":["..."]},
    "pacing": "even|frontloaded|backloaded",
    "tracking": {"required":["pixel","capi|gtm","events"], "notes":"..."}
  },
  "hypotheses": [
    {"id":"H1","type":"creative|offer|audience|landing|funnel","statement":"...","success_metric":"...","min_window_hours":48}
  ],
  "tests_map": [
    {"name":"...","variable":"creative|audience|offer|landing","variants":2,"window_hours":48,"budget_cap":0}
  ],
  "risk_flags": ["..."],
  "approval_note": "Texto curto pedindo aprovação humana."
}
```

## 4.2 Workflow “Agent Planner (Real)” (passo a passo)

**Nós:**

1. **Input** (recebe envelope do Router)
2. **HTTP Request (Supabase REST)**: buscar briefing e projeto
3. **Function**: montar `CONTEXT_JSON`
4. **LLM**: gerar JSON
5. **HTTP Request → Supabase Edge (agent-callback)** com:

   * `rpc: [ create_strategy_version(...) ]`
   * `updates: [ notifications insert ]`

### Exemplo do callback payload (o mais importante)

```json
{
  "event_id": "{{ $json.event_id }}",
  "tenant_id": "{{ $json.tenant_id }}",
  "project_id": "{{ $json.project_id }}",
  "agent": { "name": "Planner", "stage": "planning" },
  "run": { "status": "completed", "output": {{ $json.llm_output }} },
  "rpc": [
    {
      "fn": "create_strategy_version",
      "args": {
        "p_tenant_id": "{{ $json.tenant_id }}",
        "p_project_id": "{{ $json.project_id }}",
        "p_strategy": {{ $json.llm_output.strategy }},
        "p_hypotheses": {{ $json.llm_output.hypotheses }},
        "p_status": "awaiting_approval"
      }
    }
  ],
  "updates": [
    {
      "table": "notifications",
      "op": "insert",
      "data": {
        "tenant_id": "{{ $json.tenant_id }}",
        "user_id": "{{ $json.manager_user_id }}",
        "type": "strategy.awaiting_approval",
        "title": "Estratégia pronta para aprovação",
        "message": "{{ $json.llm_output.approval_note }}",
        "meta": { "project_id": "{{ $json.project_id }}" }
      }
    }
  ],
  "emit": []
}
```

> **Nota:** `manager_user_id` você pega de `tenant_members` (role manager/admin/owner). No MVP: mande para o owner/admin primeiro.

---

# 5) Tester (n8n) — strategy.approved → cria experiments + variants → callback

## 5.1 Regras do Tester (mínimo viável e bom)

* Cada hypothesis gera **1 experimento**
* Cada experimento gera **2 variants** (A/B) por padrão
* `budget_cap` e `window` vêm do `tests_map` (ou default)

## 5.2 Workflow “Agent Tester (Real)”

**Nós:**

1. Recebe envelope `strategy.approved`
2. Busca `strategy_versions` pelo `strategy_version_id` do payload
3. Function: construir lista `experiments_to_create[]` e `variants_to_create[]`
4. Callback para Supabase com `updates[]` (insert experiments / variants)
5. Callback final (ACK + agent_run)

### Payload esperado do evento `strategy.approved`

Pelo seu trigger atual:

```json
{
  "project_id": "uuid",
  "strategy_version_id": "uuid",
  "version": 3
}
```

### Callback com inserts

```json
{
  "event_id": "{{ $json.event_id }}",
  "tenant_id": "{{ $json.tenant_id }}",
  "project_id": "{{ $json.project_id }}",
  "agent": { "name": "Tester", "stage": "testing" },
  "run": { "status": "completed", "output": {{ $json.tester_output }} },
  "updates": [
    { "table":"experiments","op":"insert","data": { ... } },
    { "table":"experiment_variants","op":"insert","data": { ... } }
  ],
  "emit": []
}
```

---

# 6) Aprovação na UI (fluxo simples)

Na sua tela **Planejamento → Estratégia (awaiting_approval)**:

* Botão ✅ **Aprovar**
* Botão ❌ **Rejeitar**

A UI chama:

* `POST /functions/v1/approve-strategy`

```json
{ "strategy_version_id": "uuid", "decision": "approved" }
```

Isso muda o status → o trigger emite `strategy.approved` → dispatcher → n8n → Tester.

---

# 7) O que você já consegue fazer com isso (MVP completo do ciclo 1)

✅ Criar projeto/briefing → evento `briefing.updated`
✅ Supabase dispara evento → n8n Planner gera estratégia + hypotheses
✅ Estratégia fica “aguardando aprovação” + notificação
✅ Aprova → dispara Tester
✅ Tester cria experiments + variants
✅ Você já tem base pronta para:

* execução (Operator)
* análise (Analyst)
* aprendizado (Learner)

---

## Próximo passo (Registrar como Upgrade futuro)

1. **Export JSON do n8n** para:

   * Planner REAL (com LLM)
   * Tester REAL
   * Router atualizado (com Tester)
2. **Tabelas auxiliares** para UI:

   * `project_status_view`
   * `pending_approvals_view`
3. **Operator MVP** (sem integrações, só cria actions e logs) + approvals

