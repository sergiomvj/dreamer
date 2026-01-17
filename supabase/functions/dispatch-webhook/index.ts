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

Deno.serve(async (req) => {
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

        const appName = Deno.env.get("APP_NAME") || "Dreamer";

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
                app_name: appName,
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
});
