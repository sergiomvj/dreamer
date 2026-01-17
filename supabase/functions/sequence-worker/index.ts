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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Find active enrollments
    const { data: enrollments, error: enrollError } = await supabaseClient
      .from("lead_sequence_enrollments")
      .select("*, email_sequences(*), leads(*)")
      .eq("status", "active");

    if (enrollError) throw enrollError;

    let processedCount = 0;

    for (const enrollment of enrollments) {
      // 2. Get current step details
      const { data: currentStep } = await supabaseClient
        .from("email_sequence_steps")
        .select("*, email_templates(*)")
        .eq("sequence_id", enrollment.sequence_id)
        .eq("step_order", enrollment.current_step_order)
        .single();

      if (!currentStep) {
        // No more steps, mark as completed
        await supabaseClient
          .from("lead_sequence_enrollments")
          .update({ status: "completed" })
          .eq("id", enrollment.id);
        continue;
      }

      // 3. Check delay
      const lastAction = new Date(enrollment.last_action_at || enrollment.enrolled_at);
      const now = new Date();
      const diffHours = (now.getTime() - lastAction.getTime()) / (1000 * 60 * 60);

      if (diffHours < currentStep.delay_hours) {
        continue; // Wait more
      }

      // 4. Execute Step
      if (currentStep.step_type === 'email') {
        // Send Email (Mock for now)
        console.log(`[Email Mock] Sending "${currentStep.email_templates.subject}" to ${enrollment.leads.email}`);
        
        // In real world: Call Resend/SendGrid API here
        // await sendEmail(...)
        
        // Log Event
        await supabaseClient.from("lead_events").insert({
          tenant_id: enrollment.tenant_id,
          lead_id: enrollment.lead_id,
          event_code: "email_sent",
          payload: { 
            sequence_id: enrollment.sequence_id,
            step_order: enrollment.current_step_order,
            subject: currentStep.email_templates.subject 
          }
        });
      } else if (currentStep.step_type === 'task') {
        // Create Task
        await supabaseClient.from("lead_tasks").insert({
          tenant_id: enrollment.tenant_id,
          lead_id: enrollment.lead_id,
          title: `[Sequência] ${currentStep.email_templates?.name || 'Tarefa Manual'}`,
          task_type: 'todo',
          status: 'open'
        });
      }

      // 5. Advance to next step
      await supabaseClient
        .from("lead_sequence_enrollments")
        .update({ 
          current_step_order: enrollment.current_step_order + 1,
          last_action_at: new Date().toISOString()
        })
        .eq("id", enrollment.id);

      processedCount++;
    }

    return new Response(
      JSON.stringify({ success: true, processed: processedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
