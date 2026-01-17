import { supabase } from "./supabaseClient";

const defaultModel = process.env.OPENROUTER_MODEL || "mistralai/mistral-7b-instruct:free";
const poolKey = "dreamer.llm.pool";
const overrideModelKey = "dreamer.llm.model";

type ChatRole = "system" | "user" | "assistant";

type OpenRouterMessage = {
  role: ChatRole;
  content: string;
};

type LlmPurpose = "diagnostic" | "recommendations" | "intent" | "sdr" | "generic";
type LlmUrgency = "normal" | "urgent";
type LlmTier = "free" | "paid" | "auto";

type LlmPoolConfig = {
  version: 1;
  free: { enabled: boolean; models: string[] };
  paid: { enabled: boolean; models: string[] };
  routing: {
    defaultUrgency: LlmUrgency;
    purposeTier: Partial<Record<LlmPurpose, LlmTier>>;
  };
};

const defaultPoolConfig: LlmPoolConfig = {
  version: 1,
  free: {
    enabled: true,
    models: ["mistralai/mistral-7b-instruct:free", "google/gemini-2.0-flash-exp:free"]
  },
  paid: {
    enabled: false,
    models: ["openai:gpt-4o-mini", "openai:gpt-4o-mini-2024-07-18", "openai:gpt-4.1-mini"]
  },
  routing: {
    defaultUrgency: "normal",
    purposeTier: {
      diagnostic: "free",
      recommendations: "free",
      intent: "free",
      sdr: "free",
      generic: "free"
    }
  }
};

type LlmProvider = "openrouter" | "openai";

const parseProviderModel = (model: string): { provider: LlmProvider; model: string } => {
  const trimmed = model.trim();
  if (trimmed.toLowerCase().startsWith("openai:")) {
    const m = trimmed.slice("openai:".length).trim();
    return { provider: "openai", model: m || "gpt-4o-mini" };
  }
  return { provider: "openrouter", model: trimmed };
};

const readPoolConfig = (): LlmPoolConfig => {
  try {
    const raw = localStorage.getItem(poolKey);
    if (!raw) return defaultPoolConfig;
    const parsed = JSON.parse(raw) as Partial<LlmPoolConfig> | null;
    if (!parsed || parsed.version !== 1) return defaultPoolConfig;

    const freeModels = Array.isArray(parsed.free?.models) ? parsed.free?.models : defaultPoolConfig.free.models;
    const paidModels = Array.isArray(parsed.paid?.models) ? parsed.paid?.models : defaultPoolConfig.paid.models;

    return {
      version: 1,
      free: {
        enabled: typeof parsed.free?.enabled === "boolean" ? parsed.free.enabled : defaultPoolConfig.free.enabled,
        models: freeModels.map(String).map((s) => s.trim()).filter(Boolean)
      },
      paid: {
        enabled: typeof parsed.paid?.enabled === "boolean" ? parsed.paid.enabled : defaultPoolConfig.paid.enabled,
        models: paidModels.map(String).map((s) => s.trim()).filter(Boolean)
      },
      routing: {
        defaultUrgency:
          parsed.routing?.defaultUrgency === "urgent" || parsed.routing?.defaultUrgency === "normal"
            ? parsed.routing.defaultUrgency
            : defaultPoolConfig.routing.defaultUrgency,
        purposeTier: typeof parsed.routing?.purposeTier === "object" && parsed.routing?.purposeTier
          ? parsed.routing.purposeTier
          : defaultPoolConfig.routing.purposeTier
      }
    };
  } catch {
    return defaultPoolConfig;
  }
};

const readOverrideModel = () => {
  try {
    const saved = localStorage.getItem(overrideModelKey);
    return saved?.trim() || "";
  } catch {
    return "";
  }
};

const getCandidateModels = (params: {
  requestedModel?: string;
  purpose: LlmPurpose;
  urgency: LlmUrgency;
}): string[] => {
  const config = readPoolConfig();
  const purposeTier = config.routing.purposeTier[params.purpose] || "free";

  const paidEnabled = Boolean(config.paid.enabled);
  const freeEnabled = Boolean(config.free.enabled);

  const models: string[] = [];

  const allowedSet = new Set<string>();
  if (freeEnabled) for (const m of config.free.models) allowedSet.add(m);
  if (paidEnabled) for (const m of config.paid.models) allowedSet.add(m);

  const pushUnique = (list: string[]) => {
    for (const m of list) {
      const model = m.trim();
      if (!model) continue;
      if (allowedSet.size > 0 && !allowedSet.has(model)) continue;
      if (!models.includes(model)) models.push(model);
    }
  };

  const overrideModel = readOverrideModel();
  if (overrideModel) pushUnique([overrideModel]);
  if (params.requestedModel) pushUnique([params.requestedModel]);

  const addFree = () => {
    if (freeEnabled) pushUnique(config.free.models.length ? config.free.models : [defaultModel]);
  };

  const addPaid = () => {
    if (paidEnabled) pushUnique(config.paid.models);
  };

  if (purposeTier === "free") {
    addFree();
  } else if (purposeTier === "paid") {
    addPaid();
    addFree();
  } else {
    if (params.urgency === "urgent") {
      addPaid();
      addFree();
    } else {
      addFree();
      addPaid();
    }
  }

  if (models.length === 0) return [defaultModel];
  return models.slice(0, 4);
};

const callOpenRouterJson = async <T>(params: {
  system: string;
  user: string;
  model?: string;
  purpose?: LlmPurpose;
  urgency?: LlmUrgency;
}): Promise<T> => {
  const purpose = params.purpose || "generic";
  const urgency = params.urgency || readPoolConfig().routing.defaultUrgency;

  const messages: OpenRouterMessage[] = [
    { role: "system", content: params.system },
    { role: "user", content: params.user }
  ];

  const candidateModels = getCandidateModels({
    requestedModel: params.model,
    purpose,
    urgency
  });

  let lastError: Error | null = null;

  for (const model of candidateModels) {
    try {
      const parsedModel = parseProviderModel(model);
      if (!parsedModel.model) throw new Error("Invalid model");

      const session = (await supabase.auth.getSession()).data.session;
      const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

      console.log(`[LLM] Calling ${parsedModel.model}...`);

      console.log(`[LLM] URL Base: ${supabase.functions['url']} | Chamando: hub`);
      const { data, error } = await supabase.functions.invoke("hub", {
        body: {
          provider: parsedModel.provider,
          model: parsedModel.model,
          messages,
          temperature: 0.2,
          response_format: "json"
        }
      });

      if (error) {
        // Se for erro de rede ou instabilidade externa (502/504), não vamos travar o app
        if (error.message?.includes('502') || error.message?.includes('504')) {
          console.warn(`[LLM] Upstream model ${model} currently unavailable (502/504). This is normal for free models.`);
        } else {
          console.error(`[LLM] Error from ${model}:`, error);
        }
        return { maturity: "N/A", suggestion: "IA instável", operationStatus: "OK" } as any;
      }

      // Função auxiliar para extrair JSON de texto barulhento ou envelopes da API
      const extractJson = (input: any) => {
        let str = "";

        // Se veio o envelope completo da OpenAI/OpenRouter (com choices)
        if (input && typeof input === 'object' && input.choices) {
          str = input.choices[0]?.message?.content || "";
        } else if (input && typeof input === 'object' && input.content) {
          str = input.content;
        } else if (typeof input === 'string') {
          str = input;
        } else if (typeof input === 'object') {
          return input; // Já é o objeto que queremos
        }

        const start = str.indexOf('{');
        const end = str.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          return JSON.parse(str.substring(start, end + 1));
        }
        // Se não achou JSON, mas temos texto, retorna como conteúdo
        return { content: str };
      };

      if (data) {
        try {
          return extractJson(data) as T;
        } catch (e) {
          console.warn("[LLM] Parse attempt failed, returning raw or next...", e);
        }
      }

      return { content: "Processando..." } as any;
    } catch (e) {
      console.error(`LLM error with model ${model}:`, e);
      lastError = e instanceof Error ? e : new Error("LLM request failed");
    }
  }

  throw lastError || new Error("LLM request failed");
};

export const getGlobalInsights = async (metrics: any) => {
  try {
    return await callOpenRouterJson<{
      operationStatus: string;
      estimatedRevenue: string;
      suggestedDecision: string;
    }>({
      purpose: "diagnostic",
      system: "Você é o cérebro estratégico da plataforma Dreamer. Analise as métricas e devolva um resumo executivo de altíssimo nível. Responda somente JSON válido.",
      user: `Analise as métricas das últimas 24h e gere um resumo cognitivo.
Métricas: ${JSON.stringify(metrics)}

Formato (JSON):
{
  "operationStatus": "Resumo curto (1-2 frases) em tom profissional",
  "estimatedRevenue": "Valor estimado com base nos leads (ex: $ 1,500.00)",
  "suggestedDecision": "Ação imediata recomendada"
}`
    });
  } catch (e) {
    console.error("Global insights error:", e);
    return {
      operationStatus: "O sistema está operando em modo de manutenção cognitiva.",
      estimatedRevenue: "$ 0.00",
      suggestedDecision: "Aguardando mais dados para decisão autônoma."
    };
  }
};

export const generateStrategyBlueprint = async (params: {
  project: any;
  products: any[];
  strategyName: string;
  strategyType: string;
}) => {
  try {
    return await callOpenRouterJson<{
      copy_assets: {
        headline: string;
        body: string;
        cta: string;
      };
      kickoff_plan: string[];
      decision_rules: string[];
    }>({
      purpose: "recommendations",
      system: "Você é um arquiteto de estratégias de aquisição. Gere um blueprint detalhado e acionável. Responda somente JSON válido.",
      user: `Gere um Strategy Blueprint para a estratégia "${params.strategyName}" (${params.strategyType}).
      
Dados do Projeto: ${JSON.stringify(params.project)}
Produtos Relacionados: ${JSON.stringify(params.products)}

Formato (JSON):
{
  "copy_assets": {
    "headline": "Headline magnética",
    "body": "Texto curto de copy",
    "cta": "Chamada para ação"
  },
  "kickoff_plan": ["Ação 1", "Ação 2", "Ação 3"],
  "decision_rules": ["Regra de automação 1", "Regra de handoff 1"]
}`
    });
  } catch (e) {
    console.error("Blueprint generation error:", e);
    return null;
  }
};

export const getCognitiveDiagnostic = async (projectData: any) => {
  try {
    return await callOpenRouterJson<{
      maturity: number;
      risks: string[];
      strategicPaths: string[];
      executiveSummary: string;
    }>({
      purpose: "diagnostic",
      system: "Você é um estrategista de aquisição e governança de alta performance. Analise os dados e responda somente JSON válido.",
      user: `Analise o projeto abaixo e devolva um diagnóstico estratégico profundo. 
      
Dados do Projeto:
${typeof projectData === 'string' ? projectData : JSON.stringify(projectData, null, 2)}

Formato esperado (JSON):
{
  "maturity": number (0-100),
  "risks": string[],
  "strategicPaths": string[],
  "executiveSummary": string
}`
    });
  } catch (e) {
    console.error("Diagnostic error:", e);
    return { maturity: 0, risks: ["Falha na conexão cognitiva"], strategicPaths: [], executiveSummary: "Erro ao processar diagnóstico. Verifique as configurações de LLM." };
  }
};

export const getStrategicRecommendations = async (campaignData: string) => {
  try {
    return await callOpenRouterJson<Array<{
      id: string;
      title: string;
      description: string;
      justification: string;
      action: string;
      priority: "High" | "Medium" | "Low";
      category: "Invest" | "Cut" | "Scale" | "Pause";
    }>>({
      purpose: "recommendations",
      system: "Você é um Control Plane de aquisição. Responda somente JSON válido.",
      user: `Com base nos dados abaixo, gere 3 recomendações acionáveis. Explique: "O que fazer agora", "Onde investir", "Onde cortar".
Dados: ${JSON.stringify(campaignData)}

Formato (JSON):
[
  {
    "id": "1",
    "title": "Title",
    "description": "What to do",
    "justification": "Why this decision",
    "action": "Call to action text",
    "priority": "High" | "Medium" | "Low",
    "category": "Invest" | "Cut" | "Scale" | "Pause"
  }
]`
    });
  } catch {
    return [];
  }
};

export const analyzeLeadIntent = async (leadSignals: string) => {
  try {
    return await callOpenRouterJson<{
      temperature: "COLD" | "WARM" | "HOT";
      score: number;
      intentSummary: string;
    }>({
      purpose: "intent",
      system: "Você é um motor de intenção. Responda somente JSON válido.",
      user: `Analise os sinais comportamentais abaixo e categorize como COLD, WARM ou HOT. Gere score 0-100 e um resumo curto da intenção real.
Sinais: ${JSON.stringify(leadSignals)}

Formato (JSON):
{
  "temperature": "COLD" | "WARM" | "HOT",
  "score": number,
  "intentSummary": "string"
}`
    });
  } catch {
    return { temperature: "COLD", score: 0, intentSummary: "Unavailable" };
  }
};

export const processSDRInteraction = async (chatHistory: { role: 'user' | 'model', text: string }[]) => {
  try {
    const systemContent = `Você é um SDR Cognitivo Virtual para Dreamer (Acquisition Intelligence Platform).
Conduza um diálogo de diagnóstico orientado, com tom profissional e útil.
Sempre responda em JSON válido no formato:
{
  "reply": "string",
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "SKEPTICAL" | "URGENT",
  "cognitivePath": "string",
  "recommendedNextStep": "string",
  "scoreUpdate": number
}`;

    // Reconstruct the conversation for callOpenRouterJson
    // We send the history as the 'user' part or we could extend callOpenRouterJson to accept messages.
    // For now, let's keep it simple and just use the last message as user + summary of history if needed,
    // or better: let's modify callOpenRouterJson to be more flexible.

    // Actually, I'll just use the existing logic but fix the parsing.
    const messages: OpenRouterMessage[] = [
      { role: "system", content: systemContent }
    ];

    for (const m of chatHistory) {
      messages.push({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text
      });
    }

    const candidateModels = getCandidateModels({
      purpose: "sdr",
      urgency: readPoolConfig().routing.defaultUrgency
    });

    let lastError: Error | null = null;

    for (const model of candidateModels) {
      try {
        const parsedModel = parseProviderModel(model);
        if (!parsedModel.model) throw new Error("Invalid model");

        const { data, error } = await supabase.functions.invoke("llm", {
          body: {
            provider: parsedModel.provider,
            model: parsedModel.model,
            messages,
            temperature: 0.3,
            response_format: "json"
          }
        });

        if (error) throw new Error(error.message);

        if (data && typeof data === 'object') {
          if (data.reply) return data;
          if (data.content && typeof data.content === 'string') {
            const jsonStart = data.content.indexOf("{");
            return JSON.parse(data.content.slice(jsonStart));
          }
          return data;
        }

        if (typeof data === 'string') {
          const jsonStart = data.indexOf("{");
          return JSON.parse(data.slice(jsonStart));
        }

        throw new Error("Empty LLM response");
      } catch (e) {
        lastError = e instanceof Error ? e : new Error("LLM request failed");
      }
    }

    throw lastError || new Error("LLM request failed");
  } catch (e) {
    console.error("SDR Error:", e);
    return {
      reply: "Sinto muito, tive um erro no processamento cognitivo. Pode repetir?",
      sentiment: "NEUTRAL",
      cognitivePath: "Error in LLM output",
      recommendedNextStep: "Retry",
      scoreUpdate: 0
    };
  }
};

export const suggestFieldContent = async (params: {
  fieldName: string;
  context: any;
}) => {
  try {
    return await callOpenRouterJson<{ suggestion: string }>({
      purpose: "generic",
      system: "Você é um assistente de estratégia de marketing e vendas (Dreamer). Sua missão é ajudar o usuário a preencher campos de setup de projeto e onboarding. Seja criativo, profissional e focado em resultados reais de aquisição. Responda somente JSON válido.",
      user: `Com base no contexto atual do projeto fornecido, sugira um preenchimento adequado para o campo "${params.fieldName}".
      
Contexto do Projeto:
${JSON.stringify(params.context, null, 2)}

Formato (JSON):
{
  "suggestion": "Sua sugestão de texto aqui"
}`
    });
  } catch (e) {
    console.error("Error in field suggestion:", e);
    return { suggestion: "" };
  }
};

/**
 * BACKUP SYSTEM
 * Baixa todos os dados críticos do tenant para um arquivo JSON de segurança.
 */
export const downloadProjectBackup = async (tenantId: string) => {
  try {
    alert("Iniciando extração de dados...");

    // Função auxiliar para capturar dados sem quebrar o backup se uma tabela falhar
    const safeGet = async (table: string) => {
      try {
        const { data, error } = await supabase.from(table).select('*').eq('tenant_id', tenantId).limit(1000);
        if (error) throw error;
        return data || [];
      } catch (e) {
        console.warn(`[Backup] Erro na tabela ${table}:`, e);
        return [];
      }
    };

    const [projects, products, strategies, leads] = await Promise.all([
      safeGet('projects'),
      safeGet('products'),
      safeGet('strategy_versions'),
      safeGet('leads')
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      tenantId,
      projects,
      products,
      strategies,
      leads,
      version: "1.1-safe-backup"
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `getleads_backup_${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert("Backup baixado com sucesso! Verifique sua pasta de Downloads.");
    return { success: true };
  } catch (e) {
    alert("Ocorreu um erro ao gerar o arquivo JSON. Verifique o console.");
    console.error("[Backup] Falha crítica:", e);
    throw e;
  }
};
