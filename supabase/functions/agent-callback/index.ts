import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";
import { assertWebhookSecret } from "../_shared/auth.ts";

function json(res: unknown, status = 200) {
    return new Response(JSON.stringify(res), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

Deno.serve(async (req) => {
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
});
