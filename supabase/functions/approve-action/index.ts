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
        // Esse endpoint pode exigir JWT do usuário (Authorization Bearer)
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
});
