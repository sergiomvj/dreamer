import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

function json(res: unknown, status = 200) {
    return new Response(JSON.stringify(res), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

Deno.serve(async (req) => {
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
});
