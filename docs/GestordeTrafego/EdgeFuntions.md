Aí vai. Vou te entregar **(A) Edge Functions em TypeScript (Supabase)** prontas + **(B) Blueprint n8n (nó-a-nó) por agente**, tudo no padrão **webhook → processamento → callback** e com **retry/auditoria**.

---

## A) Supabase Edge Functions (TypeScript)

### Estrutura sugerida

```
supabase/
  functions/
    dispatch-webhook/
      index.ts
    agent-callback/
      index.ts
    approve-action/
      index.ts
    ingest-metrics/
      index.ts
    _shared/
      cors.ts
      auth.ts
      supabase.ts
```

### Variáveis de ambiente (Supabase → Project Settings → Edge Functions)

* `SUPABASE_URL` (geralmente já existe)
* `SUPABASE_SERVICE_ROLE_KEY` ✅ (necessário para bypass RLS)
* `N8N_WEBHOOK_BASE_URL` (ex: [https://n8n.seudominio.com/webhook](https://n8n.seudominio.com/webhook))
* `N8N_WEBHOOK_SECRET` (token simples)
* `DISPATCH_BATCH_SIZE` (ex: `25`)
* `DISPATCH_MAX_RETRIES` (ex: `8`)
* `DISPATCH_BACKOFF_SECONDS` (ex: `10`)

> Recomendação: no n8n, valide `x-webhook-secret`.

---

### `supabase/functions/_shared/cors.ts`

```ts
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
```

### `supabase/functions/_shared/supabase.ts`

```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function supabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false } });
}
```

### `supabase/functions/_shared/auth.ts`

```ts
export function assertWebhookSecret(req: Request) {
  const expected = Deno.env.get("N8N_WEBHOOK_SECRET") || "";
  const got = req.headers.get("x-webhook-secret") || "";
  if (!expected || got !== expected) {
    throw new Error("Unauthorized: invalid webhook secret");
  }
}
```

---

## 1) `dispatch-webhook` — envia eventos pendentes ao n8n (com retry/backoff)

### O que faz

* Busca `webhook_events` com `status=new|failed` e `retry_count < max`
* Envia POST para `N8N_WEBHOOK_BASE_URL + "/events"`
* Marca `sent` ou incrementa `retry_count` e marca `failed`

### `supabase/functions/dispatch-webhook/index.ts`

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

function shouldRetry(event: any, maxRetries: number) {
  return (event.retry_count ?? 0) < maxRetries;
}

function backoffSeconds(retryCount: number) {
  const base = Number(Deno.env.get("DISPATCH_BACKOFF_SECONDS") || "10");
  // exponencial leve com teto
  return Math.min(base * Math.pow(2, retryCount), 600);
}

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    // Protege endpoint (chamado por cron/n8n/runner)
    assertWebhookSecret(req);

    const sb = supabaseAdmin();
    const batchSize = Number(Deno.env.get("DISPATCH_BATCH_SIZE") || "25");
    const maxRetries = Number(Deno.env.get("DISPATCH_MAX_RETRIES") || "8");
    const n8nBase = Deno.env.get("N8N_WEBHOOK_BASE_URL")!;
    const secret = Deno.env.get("N8N_WEBHOOK_SECRET")!;

    // pega eventos que ainda podem ser reenviados
    const { data: events, error } = await sb
      .from("webhook_events")
      .select("id, tenant_id, project_id, event_type, payload, status, created_at, retry_count, sent_at, acked_at, last_error")
      .in("status", ["new", "failed"])
      .order("created_at", { ascending: true })
      .limit(batchSize);

    if (error) throw error;

    const results: any[] = [];

    for (const ev of events ?? []) {
      if (!shouldRetry(ev, maxRetries)) {
        results.push({ id: ev.id, skipped: true, reason: "max_retries_reached" });
        continue;
      }

      // backoff: se falhou recentemente, espera
      if (ev.status === "failed" && ev.sent_at) {
        const sentAt = new Date(ev.sent_at).getTime();
        const wait = backoffSeconds(ev.retry_count ?? 0) * 1000;
        if (Date.now() - sentAt < wait) {
          results.push({ id: ev.id, skipped: true, reason: "backoff" });
          continue;
        }
      }

      const envelope = {
        event_id: ev.id,
        event_type: ev.event_type,
        tenant_id: ev.tenant_id,
        project_id: ev.project_id,
        created_at: ev.created_at,
        payload: ev.payload ?? {},
      };

      try {
        const resp = await fetch(`${n8nBase}/events`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-webhook-secret": secret,
          },
          body: JSON.stringify(envelope),
        });

        if (!resp.ok) {
          const text = await resp.text().catch(() => "");
          throw new Error(`n8n_http_${resp.status}: ${text}`);
        }

        await sb
          .from("webhook_events")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            last_error: null,
          })
          .eq("id", ev.id);

        results.push({ id: ev.id, sent: true });
      } catch (e: any) {
        await sb
          .from("webhook_events")
          .update({
            status: "failed",
            sent_at: new Date().toISOString(),
            retry_count: (ev.retry_count ?? 0) + 1,
            last_error: String(e?.message || e),
          })
          .eq("id", ev.id);

        results.push({ id: ev.id, sent: false, error: String(e?.message || e) });
      }
    }

    return json({ ok: true, processed: results.length, results });
  } catch (e: any) {
    return json({ ok: false, error: String(e?.message || e) }, 401);
  }
}
```

**Como rodar**: você pode chamar esse endpoint via **Cron do n8n** a cada 1–5 minutos.

---

## 2) `agent-callback` — n8n devolve resultado e atualiza banco (ack do evento + agent_run)

### O que recebe

```json
{
  "event_id": "uuid",
  "agent": { "name": "Planner", "stage": "planning" },
  "run": { "status": "completed", "output": {...}, "error": null },
  "updates": [
    { "table": "strategy_versions", "op": "update", "match": {"id":"..."}, "data": {...} }
  ],
  "emit": [
    { "event_type": "strategy.awaiting_approval", "tenant_id":"...", "project_id":"...", "payload": {...} }
  ]
}
```

### `supabase/functions/agent-callback/index.ts`

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

    // ACK do evento
    await sb
      .from("webhook_events")
      .update({ status: "acked", acked_at: new Date().toISOString() })
      .eq("id", eventId);

    // Registra/atualiza agent_run (opcional: criar sempre)
    const agentName = body?.agent?.name ?? "Unknown";
    const stage = body?.agent?.stage ?? "unknown";
    const runStatus = body?.run?.status ?? "completed";
    const output = body?.run?.output ?? {};
    const error = body?.run?.error ?? null;
    const tenantId = body?.tenant_id ?? body?.updates?.[0]?.data?.tenant_id ?? body?.emit?.[0]?.tenant_id;

    // tenta inferir project_id pelo evento
    const { data: ev } = await sb
      .from("webhook_events")
      .select("tenant_id, project_id, event_type")
      .eq("id", eventId)
      .maybeSingle();

    const resolvedTenant = tenantId ?? ev?.tenant_id;
    const resolvedProject = body?.project_id ?? ev?.project_id;

    // cria um run sempre (simples e auditável)
    await sb.from("agent_runs").insert({
      tenant_id: resolvedTenant,
      project_id: resolvedProject,
      agent_id: null, // se quiser vincular: buscar em agents por name
      trigger_event: ev?.event_type ?? "callback",
      input: body?.input ?? {},
      output,
      status: runStatus,
      started_at: body?.run?.started_at ?? null,
      finished_at: new Date().toISOString(),
      error,
    });

    // aplica updates declarativos
    const updates = Array.isArray(body?.updates) ? body.updates : [];
    for (const u of updates) {
      const table = u.table;
      const op = u.op;
      const match = u.match ?? {};
      const data = u.data ?? {};
      if (!table || !op) continue;

      if (op === "insert") {
        await sb.from(table).insert(data);
      } else if (op === "update") {
        let q = sb.from(table).update(data);
        for (const [k, v] of Object.entries(match)) q = q.eq(k, v as any);
        await q;
      } else if (op === "upsert") {
        await sb.from(table).upsert(data);
      }
    }

    // emite novos eventos se solicitado (usando função emit_event)
    const emit = Array.isArray(body?.emit) ? body.emit : [];
    for (const e of emit) {
      await sb.rpc("emit_event", {
        p_tenant_id: e.tenant_id,
        p_project_id: e.project_id ?? null,
        p_event_type: e.event_type,
        p_payload: e.payload ?? {},
      });
    }

    return json({ ok: true });
  } catch (e: any) {
    return json({ ok: false, error: String(e?.message || e) }, 400);
  }
}
```

---

## 3) `approve-action` — aprovação humana de ações (gera evento automaticamente via trigger)

### `supabase/functions/approve-action/index.ts`

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
    // Esse endpoint pode exigir JWT do usuário (Authorization Bearer)
    // Por simplicidade aqui usamos admin; em produção valide JWT e role do usuário.
    const sb = supabaseAdmin();
    const body = await req.json();

    const actionId = body?.campaign_action_id as string;
    const decision = body?.decision as "approved" | "rejected";

    if (!actionId || !decision) throw new Error("Missing campaign_action_id or decision");

    const { data: action, error: readErr } = await sb
      .from("campaign_actions")
      .select("id, tenant_id, project_id, approval_status")
      .eq("id", actionId)
      .single();

    if (readErr) throw readErr;
    if (action.approval_status !== "pending") {
      return json({ ok: true, message: "already_decided", approval_status: action.approval_status });
    }

    await sb
      .from("campaign_actions")
      .update({
        approval_status: decision,
        executed_at: decision === "approved" ? null : null,
      })
      .eq("id", actionId);

    // trigger no banco já emite action.approved/action.rejected
    return json({ ok: true, approval_status: decision });
  } catch (e: any) {
    return json({ ok: false, error: String(e?.message || e) }, 400);
  }
}
```

---

## 4) `ingest-metrics` — ingestão normalizada (via n8n)

### Payload esperado

```json
{
  "tenant_id": "uuid",
  "project_id": "uuid",
  "rows": [
    {
      "date": "2026-01-17",
      "campaign_id": "uuid|null",
      "experiment_id": "uuid|null",
      "spend": 100.5,
      "clicks": 120,
      "impressions": 10000,
      "conversions": 8,
      "revenue": 350.0,
      "raw": { "source":"meta", "adset":"..." }
    }
  ]
}
```

### `supabase/functions/ingest-metrics/index.ts`

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

function calcCPA(spend: number, conv: number) {
  if (!conv || conv <= 0) return null;
  return spend / conv;
}
function calcROAS(revenue: number, spend: number) {
  if (!spend || spend <= 0) return null;
  return revenue / spend;
}

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    assertWebhookSecret(req);
    const sb = supabaseAdmin();
    const body = await req.json();

    const tenant_id = body?.tenant_id as string;
    const project_id = body?.project_id as string;
    const rows = Array.isArray(body?.rows) ? body.rows : [];

    if (!tenant_id || !project_id) throw new Error("Missing tenant_id or project_id");
    if (!rows.length) return json({ ok: true, inserted: 0 });

    const payload = rows.map((r: any) => {
      const spend = Number(r.spend || 0);
      const conv = Number(r.conversions || 0);
      const revenue = Number(r.revenue || 0);
      return {
        tenant_id,
        project_id,
        campaign_id: r.campaign_id ?? null,
        experiment_id: r.experiment_id ?? null,
        date: r.date,
        spend,
        clicks: Number(r.clicks || 0),
        impressions: Number(r.impressions || 0),
        conversions: conv,
        revenue,
        cpa: calcCPA(spend, conv),
        roas: calcROAS(revenue, spend),
        raw: r.raw ?? {},
      };
    });

    const { error } = await sb.from("metrics_daily").upsert(payload, {
      onConflict: "tenant_id,project_id,date,campaign_id,experiment_id",
    });

    if (error) throw error;

    // Você pode emitir metrics.ingested se quiser (opcional)
    // await sb.rpc("emit_event", { p_tenant_id: tenant_id, p_project_id: project_id, p_event_type: "metrics.ingested", p_payload: { count: payload.length } });

    return json({ ok: true, upserted: payload.length });
  } catch (e: any) {
    return json({ ok: false, error: String(e?.message || e) }, 400);
  }
}
```

---

# B) n8n — Workflows (nó-a-nó) por agente

## Visão geral

Você terá **2 workflows “base”** + **5 workflows de agentes**.

### Workflow 0 — `CRON Dispatcher`

**Objetivo:** chamar `dispatch-webhook` periodicamente.

**Nós:**

1. **Cron** (every 2 min)
2. **HTTP Request** → `POST https://<supabase>/functions/v1/dispatch-webhook`

   * Headers: `x-webhook-secret: {{ $env.N8N_WEBHOOK_SECRET }}`

---

## Workflow 1 — `Event Ingest (Router)`

**Objetivo:** receber eventos do Supabase e roteá-los para o agente correto.

**Nós:**

1. **Webhook** (POST) `/events`

   * Validate secret header `x-webhook-secret`
2. **Switch** (por `event_type`)

   * `briefing.updated` → Planner
   * `strategy.approved` → Tester
   * `experiment.created` → Operator (opcional)
   * `action.approved` → Operator
   * `insight.created` → Learner
   * `metrics.ingested` → Analyst (se usar)
3. **Execute Workflow** (chama o workflow do agente) passando o JSON do evento

---

## Workflow 2 — `Agent: Planner (Planejamento)`

**Trigger:** Executado pelo Router quando `briefing.updated` ou `project.created`.

**Nós (pipeline):**

1. **Start** (entrada: envelope do evento)
2. **Supabase (HTTP Request)**: buscar contexto

   * GET `projects`, `project_briefings`, últimas `metrics_daily`, últimos `insights`
3. **Function**: montar `planner_input` (normalizar)
4. **LLM** (OpenAI/Outro) — Prompt do Planner

   * Saída esperada:

     * `strategy`: funil/canais/orçamento/pacing/KPIs
     * `hypotheses`: lista
     * `tests_map`: sugestões de experiments
     * `version_next`: int (ou deixe Supabase calcular)
5. **HTTP Request** → Supabase REST: `POST strategy_versions`

   * status: `awaiting_approval`
   * version: (pegar max+1 ou usar uma RPC; para MVP, pode buscar a maior e somar)
6. **HTTP Request** → Supabase REST: `POST notifications` para manager/admin/owner
7. **HTTP Request** → `agent-callback`

   * Headers `x-webhook-secret`
   * Body:

```json
{
  "event_id": "{{ $json.event_id }}",
  "agent": { "name": "Planner", "stage": "planning" },
  "run": { "status": "completed", "output": {{ $json }} },
  "updates": [],
  "emit": []
}
```

---

## Workflow 3 — `Agent: Tester (Testes & Experimentos)`

**Trigger:** `strategy.approved`

**Nós:**

1. Buscar `strategy_versions` (id do evento)
2. Function: gerar matriz de testes (experiments + variants) com regras
3. HTTP Request: `POST experiments` (1..N)
4. HTTP Request: `POST experiment_variants` (por experimento)
5. (Opcional) Emitir evento `experiment.window_reached` agendando

   * Melhor: usar **Wait node** / **Cron** para janela de análise
6. `agent-callback` com resultado + `emit` se quiser

---

## Workflow 4 — `Agent: Operator (Execução)`

**Trigger:** `action.approved` ou `experiment.passed`

**Nós:**

1. Buscar `campaign_actions` (payload, campaign_id)
2. Switch por `action_type`:

   * `scale_budget`
   * `pause`
   * `swap_creative`
3. HTTP Request: Meta/Google API (ou placeholder no MVP)
4. Atualizar `campaign_actions.executed_at = now()`
5. Atualizar `campaigns` se necessário
6. `agent-callback`

> Para MVP sem integrações: apenas simule execução e registre logs.

---

## Workflow 5 — `Agent: Analyst (Análise)`

**Trigger:** por tempo (janela) OU por evento (`metrics.ingested` / `experiment.window_reached`)

**Nós:**

1. Buscar métricas do período (`metrics_daily`) por experiment/campaign
2. Function: calcular deltas, winners/losers, estatística simples
3. LLM: gerar diagnóstico + recomendações objetivas
4. Inserir `insights`
5. Atualizar `experiments.status` (passed/failed/killed)
6. Se gerar ação: inserir `campaign_actions` com `requires_approval=true`
7. `agent-callback`

---

## Workflow 6 — `Agent: Learner (Aprendizado)`

**Trigger:** `insight.created`

**Nós:**

1. Buscar insight + contexto (nicho, canal, objetivo)
2. Function: mapear tags e score
3. Atualizar/Upsert `playbooks` (rules + confidence)
4. (Opcional) Atualizar `agents.config` (kill rules, budgets)
5. `agent-callback`

---

# C) Prompts base (curtos e operacionais)

## Prompt Planner (resumo)

* Entrada: briefing + métricas + aprendizados + objetivo
* Saída JSON: `strategy`, `hypotheses`, `tests_map`, `risk_flags`, `kpis`

## Prompt Analyst (resumo)

* Entrada: métricas agregadas + contexto
* Saída JSON: `diagnosis`, `top_causes`, `recommendations`, `actions[]` (com requires_approval)

(Se você quiser, eu já te entrego os prompts completos em formato “MagicPrompt style”, com variáveis e validação JSON.)

---

# D) Segurança e boas práticas (sem enrolação)

* **n8n nunca usa Service Role direto**: chama Edge Functions (melhor)
* `x-webhook-secret` obrigatório em:

  * `dispatch-webhook`
  * `agent-callback`
  * `ingest-metrics`
* Aprovações humanas: `approve-action` deve validar JWT/role (eu deixei simplificado; posso te entregar a versão com validação do token do Supabase)

---

