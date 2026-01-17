import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { target_id } = await req.json();
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (!target_id) throw new Error("Missing target_id");

    // 1. Get Target Info
    const { data: target, error: targetError } = await supabaseClient
      .from("scraping_targets")
      .select("*")
      .eq("id", target_id)
      .single();

    if (targetError || !target) throw new Error("Target not found");

    // 2. Update Status to Processing
    await supabaseClient
      .from("scraping_targets")
      .update({ status: "processing", last_run_at: new Date().toISOString() })
      .eq("id", target_id);

    // 3. Simulate Scraping (Mock)
    // In a real scenario, this would call Puppeteer or an external API (BrightData, ZenRows, etc.)
    console.log(`Scraping ${target.url} via ${target.platform}...`);
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockResults = [
      {
        full_name: "Mock Lead 1",
        email: "mock1@example.com",
        title: "CEO",
        company: "Tech Corp",
        source_url: target.url
      },
      {
        full_name: "Mock Lead 2",
        email: "mock2@example.com",
        title: "CTO",
        company: "Inovação Ltda",
        source_url: target.url
      }
    ];

    // 4. Save Raw Contacts
    const { error: insertError } = await supabaseClient
      .from("raw_contacts")
      .insert(mockResults.map(r => ({
        tenant_id: target.tenant_id,
        scraping_target_id: target.id,
        source_platform: target.platform,
        data: r,
        processed: false
      })));

    if (insertError) throw insertError;

    // 5. Update Status to Completed
    await supabaseClient
      .from("scraping_targets")
      .update({ status: "completed" })
      .eq("id", target_id);

    return new Response(
      JSON.stringify({ success: true, count: mockResults.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error(error);
    
    // Try to update status to failed if possible
    try {
      if (req.body) { // If we have the body, we might have the ID, but complex to parse again. 
         // For now, we rely on the client or logs.
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
