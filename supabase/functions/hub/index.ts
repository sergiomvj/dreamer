// HUB - Versão "Inquebrável"
Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        // Tenta ler o JSON, se falhar vira objeto vazio em vez de dar erro 500
        const body = await req.json().catch(() => ({}));
        const { provider, model, messages } = body;

        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: "O campo 'messages' é obrigatório e deve ser uma lista." }), {
                status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const apiKey = provider === "openrouter"
            ? Deno.env.get("OPENROUTER_API_KEY")
            : Deno.env.get("OPENAI_API_KEY");

        if (!apiKey) {
            return new Response(JSON.stringify({ error: "Chave de API não configurada no Supabase Secrets." }), {
                status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const apiUrl = provider === "openrouter"
            ? "https://openrouter.ai/api/v1/chat/completions"
            : "https://api.openai.com/v1/chat/completions";

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://dreamer.leads.ai',
                'X-Title': 'GetLeads',
            },
            body: JSON.stringify({
                model: model || "mistralai/mistral-7b-instruct:free",
                messages: messages,
                temperature: 0.7,
            }),
        });

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message, stack: "Edge" }), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
