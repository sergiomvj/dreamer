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

Deno.serve(async (req) => {
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

        return json({ ok: true, upserted: payload.length });
    } catch (e: any) {
        return json({ ok: false, error: String(e?.message || e) }, 400);
    }
});
