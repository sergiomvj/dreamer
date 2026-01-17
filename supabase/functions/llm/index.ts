import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type ChatRole = "system" | "user" | "assistant";

type Message = {
  role: ChatRole;
  content: string;
};

type LlmRequestBody = {
  provider?: "openrouter" | "openai";
  model?: string;
  messages?: Message[];
  temperature?: number;
  response_format?: "json" | "text";
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const readTextSafe = async (res: Response) => {
  try {
    return await res.text();
  } catch {
    return "";
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let body: LlmRequestBody;
  try {
    body = (await req.json()) as LlmRequestBody;
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const {
    provider = "openrouter",
    model: requestedModel = "mistralai/mistral-7b-instruct:free",
    messages = [],
    temperature = 0.2,
    response_format = "text"
  } = body as LlmRequestBody;

  if (!Array.isArray(messages) || messages.length === 0) {
    return json(400, { error: "Missing messages" });
  }

  const makeTextOrJsonResponse = (content: string, meta: { model: string; provider: string }) => {
    if (response_format === "json") {
      try {
        const parsed = JSON.parse(content);
        return json(200, { ...parsed, ...meta });
      } catch {
        return json(200, { content, ...meta });
      }
    }

    return new Response(content, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" }
    });
  };

  const attemptFetch = async (attempt: number) => {
    if (provider === "openrouter") {
      const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY") || "";
      if (!openRouterApiKey) return json(500, { error: "OPENROUTER_API_KEY not configured" });

      const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: requestedModel,
          messages,
          temperature
        })
      });

      if (!upstream.ok) {
        const details = await readTextSafe(upstream);
        if (upstream.status === 429 && attempt === 0) {
          await sleep(300);
          return await attemptFetch(1);
        }
        return json(502, { error: "Upstream error", provider, status: upstream.status, details, model: requestedModel });
      }

      const data = await upstream.json();
      const content: string | undefined = data?.choices?.[0]?.message?.content;
      if (!content) return json(502, { error: "Upstream returned empty content", provider, model: requestedModel });
      return makeTextOrJsonResponse(content, { model: requestedModel, provider });
    }

    if (provider === "openai") {
      const openAiApiKey = Deno.env.get("OPENAI_API_KEY") || "";
      if (!openAiApiKey) return json(500, { error: "OPENAI_API_KEY not configured" });

      const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: requestedModel,
          messages,
          temperature,
          ...(response_format === "json" ? { response_format: { type: "json_object" } } : {})
        })
      });

      if (!upstream.ok) {
        const details = await readTextSafe(upstream);
        if (upstream.status === 429 && attempt === 0) {
          await sleep(300);
          return await attemptFetch(1);
        }
        return json(502, { error: "Upstream error", provider, status: upstream.status, details, model: requestedModel });
      }

      const data = await upstream.json();
      const content: string | undefined = data?.choices?.[0]?.message?.content;
      if (!content) return json(502, { error: "Upstream returned empty content", provider, model: requestedModel });
      return makeTextOrJsonResponse(content, { model: requestedModel, provider });
    }

    return json(400, { error: "Unsupported provider" });
  };

  return await attemptFetch(0);
});
