import React, { useEffect, useMemo, useState } from "react";

type LlmPurpose = "diagnostic" | "recommendations" | "intent" | "sdr";
type LlmTier = "free" | "paid" | "auto";
type LlmUrgency = "normal" | "urgent";

type LlmPoolConfig = {
  version: 1;
  free: { enabled: boolean; models: string[] };
  paid: { enabled: boolean; models: string[] };
  routing: {
    defaultUrgency: LlmUrgency;
    purposeTier: Record<LlmPurpose | "generic", LlmTier>;
  };
};

const parseLines = (text: string) =>
  text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

const serializeLines = (models: string[]) => models.join("\n");

const defaultConfig: LlmPoolConfig = {
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

export type LLM_StrategyProps = {
  storageKeyPrefix?: string;
  title?: string;
};

const LLM_Strategy: React.FC<LLM_StrategyProps> = ({ storageKeyPrefix = "planner.llm", title = "LLM Pools" }) => {
  const poolKey = `${storageKeyPrefix}.pool`;
  const overrideModelKey = `${storageKeyPrefix}.model`;

  const [freeEnabled, setFreeEnabled] = useState(true);
  const [freeModelsText, setFreeModelsText] = useState(serializeLines(defaultConfig.free.models));
  const [paidEnabled, setPaidEnabled] = useState(false);
  const [paidModelsText, setPaidModelsText] = useState(serializeLines(defaultConfig.paid.models));
  const [defaultUrgency, setDefaultUrgency] = useState<LlmUrgency>("normal");
  const [overrideModel, setOverrideModel] = useState("");
  const [purposeTier, setPurposeTier] = useState<Record<LlmPurpose, LlmTier>>({
    diagnostic: "free",
    recommendations: "free",
    intent: "free",
    sdr: "free"
  });

  const freeModels = useMemo(() => parseLines(freeModelsText), [freeModelsText]);
  const paidModels = useMemo(() => parseLines(paidModelsText), [paidModelsText]);
  const allModels = useMemo(() => {
    const set = new Set<string>();
    for (const m of freeModels) set.add(m);
    for (const m of paidModels) set.add(m);
    return Array.from(set);
  }, [freeModels, paidModels]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(poolKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<LlmPoolConfig> | null;
        if (parsed?.version === 1) {
          setFreeEnabled(typeof parsed.free?.enabled === "boolean" ? parsed.free.enabled : defaultConfig.free.enabled);
          setPaidEnabled(typeof parsed.paid?.enabled === "boolean" ? parsed.paid.enabled : defaultConfig.paid.enabled);
          setDefaultUrgency(parsed.routing?.defaultUrgency === "urgent" ? "urgent" : defaultConfig.routing.defaultUrgency);

          if (Array.isArray(parsed.free?.models)) setFreeModelsText(serializeLines(parsed.free.models.map(String)));
          if (Array.isArray(parsed.paid?.models)) setPaidModelsText(serializeLines(parsed.paid.models.map(String)));

          const tiers = parsed.routing?.purposeTier || {};
          setPurposeTier((prev) => ({
            ...prev,
            diagnostic: (tiers as any)?.diagnostic || prev.diagnostic,
            recommendations: (tiers as any)?.recommendations || prev.recommendations,
            intent: (tiers as any)?.intent || prev.intent,
            sdr: (tiers as any)?.sdr || prev.sdr
          }));
        }
      }

      const savedOverride = localStorage.getItem(overrideModelKey);
      setOverrideModel(savedOverride?.trim() || "");
    } catch { }
  }, [overrideModelKey, poolKey]);

  useEffect(() => {
    const config: LlmPoolConfig = {
      version: 1,
      free: { enabled: freeEnabled, models: freeModels },
      paid: { enabled: paidEnabled, models: paidModels },
      routing: {
        defaultUrgency,
        purposeTier: {
          diagnostic: purposeTier.diagnostic,
          recommendations: purposeTier.recommendations,
          intent: purposeTier.intent,
          sdr: purposeTier.sdr,
          generic: "free"
        }
      }
    };

    try {
      localStorage.setItem(poolKey, JSON.stringify(config));
    } catch { }
  }, [defaultUrgency, freeEnabled, freeModels, paidEnabled, paidModels, poolKey, purposeTier]);

  useEffect(() => {
    try {
      localStorage.setItem(overrideModelKey, overrideModel);
    } catch { }
  }, [overrideModel, overrideModelKey]);

  return (
    <div className="bg-card-dark border border-border-dark rounded-2xl p-6 space-y-4">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</p>

      <div className="space-y-3">
        <label className="flex items-center justify-between gap-4">
          <span className="text-xs text-slate-400">Ativar pool free</span>
          <input
            type="checkbox"
            checked={freeEnabled}
            onChange={(e) => setFreeEnabled(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
        </label>

        <label className="flex items-center justify-between gap-4">
          <span className="text-xs text-slate-400">Ativar pool paga</span>
          <input
            type="checkbox"
            checked={paidEnabled}
            onChange={(e) => setPaidEnabled(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Urgência padrão</p>
            <select
              className="w-full bg-surface-dark border border-border-dark rounded-xl px-3 py-2 text-slate-200"
              value={defaultUrgency}
              onChange={(e) => setDefaultUrgency(e.target.value === "urgent" ? "urgent" : "normal")}
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Modelo fixo</p>
            <select
              className="w-full bg-surface-dark border border-border-dark rounded-xl px-3 py-2 text-slate-200"
              value={overrideModel}
              onChange={(e) => setOverrideModel(e.target.value)}
            >
              <option value="">Auto (pool)</option>
              {(paidEnabled ? allModels : freeModels).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Roteamento por tipo</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "diagnostic" as const, label: "Diagnóstico" },
              { id: "recommendations" as const, label: "Recomendações" },
              { id: "intent" as const, label: "Intenção" },
              { id: "sdr" as const, label: "SDR" }
            ].map((p) => (
              <div key={p.id} className="space-y-1">
                <p className="text-xs text-slate-400">{p.label}</p>
                <select
                  className="w-full bg-surface-dark border border-border-dark rounded-xl px-3 py-2 text-slate-200"
                  value={purposeTier[p.id]}
                  onChange={(e) => {
                    const v = e.target.value as LlmTier;
                    setPurposeTier((prev) => ({ ...prev, [p.id]: v }));
                  }}
                >
                  <option value="free">Free</option>
                  <option value="auto">Auto</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Modelos free (1 por linha)</p>
          <textarea
            value={freeModelsText}
            onChange={(e) => setFreeModelsText(e.target.value)}
            className="w-full bg-surface-dark border border-border-dark rounded-xl px-3 py-2 text-slate-200 min-h-[90px]"
          />
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Modelos pagos (1 por linha)</p>
          <textarea
            value={paidModelsText}
            onChange={(e) => setPaidModelsText(e.target.value)}
            className="w-full bg-surface-dark border border-border-dark rounded-xl px-3 py-2 text-slate-200 min-h-[90px]"
          />
        </div>

        <button
          onClick={() => {
            setFreeEnabled(defaultConfig.free.enabled);
            setPaidEnabled(false);
            setDefaultUrgency(defaultConfig.routing.defaultUrgency);
            setOverrideModel("");
            setPurposeTier({
              diagnostic: defaultConfig.routing.purposeTier.diagnostic,
              recommendations: defaultConfig.routing.purposeTier.recommendations,
              intent: defaultConfig.routing.purposeTier.intent,
              sdr: defaultConfig.routing.purposeTier.sdr
            });
            setFreeModelsText(serializeLines(defaultConfig.free.models));
            setPaidModelsText(serializeLines(defaultConfig.paid.models));
          }}
          className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-slate-200 hover:bg-white/5 transition-colors text-sm font-bold"
        >
          Resetar pool
        </button>
      </div>
    </div>
  );
};

export default LLM_Strategy;
