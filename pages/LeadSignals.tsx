
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabaseClient';

type LeadRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  score: number;
  intent: "cold" | "warm" | "hot";
  source: any;
  next_best_action: any;
  requires_human: boolean;
  created_at: string;
};

type LeadEventRow = {
  id: string;
  event_code: string;
  payload: any;
  happened_at: string;
};

const LeadSignals: React.FC<{ tenantId?: string | null }> = ({ tenantId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [events, setEvents] = useState<LeadEventRow[]>([]);

  const activeLead = useMemo(() => leads.find((l) => l.id === activeLeadId) || null, [leads, activeLeadId]);

  const loadLeads = async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: loadError } = await supabase
        .from("leads")
        .select("id,full_name,email,phone,score,intent,source,next_best_action,requires_human,created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (loadError) throw loadError;
      const rows = (data || []) as LeadRow[];
      setLeads(rows);
      setActiveLeadId((prev) => prev || rows[0]?.id || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar leads.");
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async (leadId: string) => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: loadError } = await supabase
        .from("lead_events")
        .select("id,event_code,payload,happened_at")
        .eq("tenant_id", tenantId)
        .eq("lead_id", leadId)
        .order("happened_at", { ascending: false })
        .limit(40);
      if (loadError) throw loadError;
      setEvents((data || []) as LeadEventRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar eventos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLeads();
  }, [tenantId]);

  useEffect(() => {
    if (!activeLeadId) return;
    void loadEvents(activeLeadId);
  }, [activeLeadId, tenantId]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <div>
        <h2 className="text-3xl font-black tracking-tight">Lead Intelligence</h2>
        <p className="text-slate-500 mt-1">Detecção de intenção real baseada em eventos comportamentais.</p>
      </div>

      {error && <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">{error}</div>}

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-7">
          <div className="bg-card-dark border border-border-dark rounded-2xl overflow-hidden">
            <div className="p-4 bg-surface-dark border-b border-border-dark flex justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Feed de Sinais Vivos</span>
              <div className="flex items-center gap-3">
                {loading && <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Carregando…</span>}
                <button
                  onClick={() => void loadLeads()}
                  className="px-2 py-0.5 bg-white/5 border border-white/10 text-slate-300 text-[10px] font-bold rounded hover:bg-white/10"
                >
                  Atualizar
                </button>
              </div>
            </div>
            <div className="divide-y divide-border-dark">
              {leads.length === 0 ? (
                <div className="p-8 text-slate-500 text-sm">Nenhum lead encontrado para este tenant.</div>
              ) : (
              leads.map((lead) => (
                <div 
                  key={lead.id} 
                  onClick={() => setActiveLeadId(lead.id)}
                  className={`p-6 cursor-pointer transition-colors ${activeLeadId === lead.id ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-white/5 border-l-4 border-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold">{lead.full_name || lead.email || lead.phone || "Lead"}</h4>
                      <p className="text-xs text-slate-500">{lead.source?.channel || "unknown"} · {lead.source?.campaign || lead.source?.utm_campaign || "—"}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                        lead.intent === 'hot' ? 'bg-rose-500 text-white' : 
                        lead.intent === 'warm' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {lead.intent}
                      </span>
                      <p className="text-2xl font-black mt-1">{Math.round(lead.score)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 italic line-clamp-1">
                    "{lead.next_best_action?.title || lead.next_best_action?.action || "Sem próxima ação calculada."}"
                  </p>
                </div>
              )))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5">
          {activeLead ? (
            <div className="space-y-6 sticky top-8">
              <div className="bg-white/5 border border-primary/30 p-8 rounded-2xl relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                  <div className="size-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-3xl">psychology</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Detecção de Intenção Real</h3>
                    <p className="text-xs text-slate-500">Cognitive Analysis Processed</p>
                  </div>
                </div>

                <div className="bg-background-dark/80 p-6 rounded-xl border border-white/5 mb-8">
                  <p className="text-sm leading-relaxed text-slate-300">
                    "{activeLead.next_best_action?.reason || activeLead.next_best_action?.summary || "Sem explicação disponível."}"
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Próximos Passos Recomendados</h4>
                  <div className="flex flex-col gap-2">
                    <button className="bg-primary hover:bg-blue-600 text-white py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm">handshake</span>
                      Handoff para SDR Humano
                    </button>
                    <button className="bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm">smart_toy</span>
                      Manter em Fluxo de Nurturing
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-card-dark border border-border-dark p-6 rounded-2xl">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Evolutionary Timeline</h4>
                <div className="space-y-4">
                  {events.length === 0 ? (
                    <div className="text-xs text-slate-500">Sem eventos para este lead.</div>
                  ) : (
                  events.slice(0, 10).map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`size-3 ${i === 0 ? "bg-primary" : "bg-slate-600"} rounded-full`}></div>
                        {i !== Math.min(9, events.length - 1) && <div className="w-px h-full bg-slate-800 my-1"></div>}
                      </div>
                      <p className="text-xs text-slate-400 font-medium">
                        {item.event_code} · {new Date(item.happened_at).toLocaleString()}
                      </p>
                    </div>
                  )))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 border-2 border-dashed border-border-dark rounded-2xl flex items-center justify-center text-slate-500 font-bold">
              Selecione um lead para ver a análise cognitiva.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadSignals;
