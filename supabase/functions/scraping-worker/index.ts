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
    const body = await req.json().catch(() => ({}));
    const { target_id } = body;

    console.log("Iniciando Motor Jina AI (Turbo Clean + Amazon Optimized) - Alvo:", target_id);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (!target_id) throw new Error("target_id requerido.");

    const { data: target, error: targetError } = await supabaseClient
      .from("scraping_targets")
      .select("*")
      .eq("id", target_id)
      .single();

    if (targetError || !target) throw new Error("Alvo não encontrado.");

    await supabaseClient
      .from("scraping_targets")
      .update({ status: "processing", last_run_at: new Date().toISOString() })
      .eq("id", target_id);

    const jinaKey = Deno.env.get("JINA_API_KEY") || "";
    const jinaUrl = `https://r.jina.ai/${target.url}`;

    const headers: any = {
      "Authorization": jinaKey ? `Bearer ${jinaKey}` : "",
      "X-Return-Format": "markdown",
      "X-With-Links-Summary": "false",
      "X-With-Images-Summary": "false",
      "X-No-Cache": "true"
    };

    // Filtros pesados para Amazon e Sites complexos
    if (target.url.includes("amazon") || target.platform === 'amazon') {
      headers["X-Remove-Selector"] = "script, style, noscript, .nav-sprite, #nav-main, #nav-footer, #wayfinding-breadcrumbs_container, #detailBullets_feature_div, #averageCustomerReviews, #similarities_feature_div, #feature-bullets-expander, #productDetails_feature_div";
    } else {
      headers["X-Remove-Selector"] = "script, style, noscript, nav, footer, header, .ads, .sidebar";
    }

    const response = await fetch(jinaUrl, { method: "GET", headers });

    if (!response.ok) {
      throw new Error(`Jina AI Error: ${response.status} - ${await response.text()}`);
    }

    let markdown = await response.text();

    // --- LIMPEZA AGRESSIVA DE PÓS-PROCESSAMENTO ---

    // 1. Remover blocos de código grandes (geralmente JSON/Scripts injetados)
    markdown = markdown.replace(/```[\s\S]*?```/g, '');

    // 2. Remover longas sequências de caracteres não-texto (comum em códigos de rastreio)
    // Se tiver uma "palavra" com mais de 100 caracteres sem espaços, provavelmente é código/hash
    markdown = markdown.replace(/[^\s]{100,}/g, '');

    // 3. Remover tabelas massivas de dados técnicos se o usuário quiser só o texto (opcional)
    // markdown = markdown.replace(/\|[\s\S]*?\|\n[\|\-\s]*\n/g, ''); 

    // 4. Remover links massivos de navegação que sobraram
    markdown = markdown.replace(/\[Back to top\]\(#\)/gi, '');

    // 5. Limpar excesso de espaços e quebras
    markdown = markdown.replace(/\r/g, '\n');
    markdown = markdown.replace(/\n{3,}/g, '\n\n');
    markdown = markdown.replace(/[ \t]{2,}/g, ' ');

    console.log("Limpeza Ultra-Clean concluída.");

    const titleMatch = markdown.match(/^# (.*)/);
    const pageTitle = titleMatch ? titleMatch[1] : target.name;

    const result = {
      tenant_id: target.tenant_id,
      scraping_target_id: target.id,
      source_platform: target.platform,
      data: {
        title: pageTitle.substring(0, 200),
        markdown: markdown.trim(),
        engine: "jina-turbo-clean-v2"
      },
      processed: false
    };

    const { error: insertError } = await supabaseClient.from("raw_contacts").insert([result]);
    if (insertError) throw insertError;

    await supabaseClient
      .from("scraping_targets")
      .update({
        status: "completed",
        config: { ...target.config, last_result_summary: `Extração limpa concluída (${new Date().toLocaleTimeString()}).` }
      })
      .eq("id", target_id);

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("Erro no Worker (Jina Turbo):", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
