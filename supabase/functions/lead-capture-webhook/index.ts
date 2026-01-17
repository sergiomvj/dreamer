import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Validate Payload
    const body = await req.json();
    const { 
      email, 
      full_name, 
      phone, 
      source, 
      tenant_id, 
      campaign_id,
      project_id 
    } = body;

    if (!email || !tenant_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, tenant_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Find or Create Lead
    // Check if lead exists in this tenant
    const { data: existingLead } = await supabaseAdmin
      .from("leads")
      .select("id, score")
      .eq("tenant_id", tenant_id)
      .eq("email", email)
      .single();

    let leadId = existingLead?.id;
    let isNew = false;

    if (leadId) {
      // Update existing lead
      await supabaseAdmin
        .from("leads")
        .update({
          full_name: full_name || undefined, // Only update if provided
          phone: phone || undefined,
          updated_at: new Date().toISOString()
        })
        .eq("id", leadId);
    } else {
      // Create new lead
      isNew = true;
      const { data: newLead, error: createError } = await supabaseAdmin
        .from("leads")
        .insert({
          tenant_id,
          email,
          full_name,
          phone,
          source: source || { type: "webhook" },
          project_id: project_id || (await supabaseAdmin.from("projects").select("id").eq("tenant_id", tenant_id).limit(1).single()).data?.id,
          status: "new",
          intent: "cold",
          score: 10 // Initial score
        })
        .select("id")
        .single();

      if (createError) throw createError;
      leadId = newLead.id;
    }

    // 3. Register Event
    await supabaseAdmin.from("lead_events").insert({
      tenant_id,
      lead_id: leadId,
      event_code: isNew ? "lead_created" : "lead_updated",
      payload: {
        source,
        campaign_id,
        raw_body: body
      }
    });

    return new Response(
      JSON.stringify({ success: true, lead_id: leadId, is_new: isNew }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
