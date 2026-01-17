
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { getGlobalInsights, downloadProjectBackup } from '../services/geminiService';

const Dashboard: React.FC<{ tenantId?: string | null, setActiveTab?: (tab: string) => void }> = ({ tenantId, setActiveTab }) => {
  const [loading, setLoading] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{
    leads24h: number;
    hot24h: number;
    avgScore24h: number;
    requiresHuman24h: number;
  } | null>(null);

  const [insights, setInsights] = useState<{
    operationStatus: string;
    estimatedRevenue: string;
    suggestedDecision: string;
  } | null>(null);

  const sinceIso = useMemo(() => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), []);

  useEffect(() => {
    if (!tenantId) {
      setMetrics(null);
      setInsights(null);
      return;
    }

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: loadError } = await supabase
          .from('leads')
          .select('id,score,intent,requires_human,created_at')
          .eq('tenant_id', tenantId)
          .gte('created_at', sinceIso)
          .limit(500);

        if (loadError) throw loadError;

        const rows = (data || []) as Array<{ score: number; intent: string; requires_human: boolean }>;
        const leads24h = rows.length;
        const hot24h = rows.filter((r) => r.intent === 'hot').length;
        const requiresHuman24h = rows.filter((r) => r.requires_human).length;
        const avgScore24h = leads24h === 0 ? 0 : rows.reduce((acc, r) => acc + Number(r.score || 0), 0) / leads24h;

        const newMetrics = { leads24h, hot24h, avgScore24h, requiresHuman24h };
        setMetrics(newMetrics);

        // Fetch AI Insights based on metrics
        setLoadingInsights(true);
        const aiInsights = await getGlobalInsights(newMetrics);
        setInsights(aiInsights);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar métricas.');
        setMetrics(null);
      } finally {
        setLoading(false);
        setLoadingInsights(false);
      }
    })();
  }, [tenantId, sinceIso]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Control Tower</h2>
          <p className="text-slate-500 mt-1">Interpretação sistêmica da sua governança de aquisição.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => tenantId && downloadProjectBackup(tenantId)}
            className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg flex items-center gap-2 transition-all active:scale-95 group"
            title="Baixar Backup de Segurança (JSON)"
          >
            <span className="material-symbols-outlined text-sm text-emerald-400 group-hover:rotate-12 transition-transform">shield</span>
            <span className="text-xs font-bold">Safe Backup</span>
          </button>

          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-primary">calendar_today</span>
            <span className="text-xs font-bold">Últimas 24h</span>
          </div>
        </div>
      </div>

      {error && <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">{error}</div>}

      {/* Main Metrics with AI Interpretation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Leads (24h)',
            value: metrics ? String(metrics.leads24h) : loading ? '—' : '0',
            interpretation: 'Volume bruto do período. Interprete junto com score e intenção.',
            color: 'text-primary'
          },
          {
            label: 'Score Médio (24h)',
            value: metrics ? String(Math.round(metrics.avgScore24h)) : loading ? '—' : '0',
            interpretation: 'Proxy de qualidade. Se cair, ajuste canal/abordagem.',
            color: 'text-emerald-500'
          },
          {
            label: 'Hot (24h)',
            value: metrics ? String(metrics.hot24h) : loading ? '—' : '0',
            interpretation: 'Leads em alta intenção no período.',
            color: 'text-rose-500'
          },
          {
            label: 'Requer Humano (24h)',
            value: metrics ? String(metrics.requiresHuman24h) : loading ? '—' : '0',
            interpretation: 'Fila que não pode ser automatizada sem risco.',
            color: 'text-amber-500'
          }
        ].map((stat, i) => (
          <div key={i} className="bg-card-dark border border-border-dark p-6 rounded-2xl hover:border-primary/50 transition-all flex flex-col justify-between group">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className={`text-3xl font-black ${stat.color}`}>{stat.value}</h3>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-[11px] leading-relaxed text-slate-400 italic">
                <span className="text-primary font-bold">IA:</span> {stat.interpretation}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Real-time Alerts */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <h4 className="text-sm font-black uppercase text-slate-500 tracking-widest">O que merece atenção agora</h4>
          <div className="space-y-3">
            {[
              { type: 'risk', title: 'Queda de Qualidade (LinkedIn Ads)', desc: 'Leads do LinkedIn estão vindo com Score < 30. Recomenda-se pausar e revisar criativos de "Ebook".', time: '12m ago' },
              { type: 'opportunity', title: 'Pico de Intenção: Global Tech Inc', desc: 'Michael Ross visitou a página de Enterprise 5x hoje. SDR virtual sugeriu handoff humano imediato.', time: '2m ago' },
              { type: 'alert', title: 'Anomalia de Custo: Google Ads', desc: 'CPC subiu 45% sem aumento proporcional em cliques qualificados. Investigar bot-traffic.', time: '1h ago' }
            ].map((alert, i) => (
              <div key={i} className="bg-card-dark border border-border-dark p-5 rounded-2xl flex items-start gap-4 hover:bg-white/5 transition-colors border-l-4 border-l-primary">
                <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${alert.type === 'risk' ? 'bg-rose-500/10 text-rose-500' :
                  alert.type === 'opportunity' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'
                  }`}>
                  <span className="material-symbols-outlined">
                    {alert.type === 'risk' ? 'warning' : alert.type === 'opportunity' ? 'rocket_launch' : 'notifications'}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h5 className="font-bold text-sm">{alert.title}</h5>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{alert.time}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{alert.desc}</p>
                  <div className="mt-3 flex gap-2">
                    <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Ver Detalhes</button>
                    <button className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white">Ignorar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cognitive Summary */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 glow-primary sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <span className={`material-symbols-outlined text-primary text-xl ${loadingInsights ? 'animate-spin' : ''}`}>
                {loadingInsights ? 'sync' : 'psychology'}
              </span>
              <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">Resumo Cognitivo Global</p>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-tighter">Status da Operação</p>
                <div className={`text-sm text-slate-300 leading-relaxed ${loadingInsights ? 'animate-pulse bg-white/5 rounded h-12' : ''}`}>
                  {insights ? (
                    <span>"{insights.operationStatus}"</span>
                  ) : !loadingInsights && (
                    <span>"Aguardando processamento cognitivo..."</span>
                  )}
                </div>
              </div>
              <div className="p-4 bg-background-dark/50 rounded-xl border border-white/5">
                <h6 className="text-[10px] font-black text-slate-500 uppercase mb-3 text-left">Receita Estimada (24h)</h6>
                <p className={`text-xl font-black text-emerald-500 mb-1 ${loadingInsights ? 'animate-pulse' : ''}`}>
                  {insights ? insights.estimatedRevenue : '$ 0.00'}
                </p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">+12% vs ontem</p>
              </div>

              <div className="p-4 bg-background-dark/50 rounded-xl border border-white/5">
                <h6 className="text-[10px] font-black text-slate-500 uppercase mb-3">Decisão Sugerida</h6>
                <p className={`text-xs font-bold text-white mb-4 ${loadingInsights ? 'animate-pulse bg-white/5 h-8 rounded' : ''}`}>
                  {insights?.suggestedDecision}
                </p>
                <button className="w-full bg-primary hover:bg-blue-600 text-white py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20">
                  Executar Agora
                </button>
              </div>

              <button
                onClick={() => setActiveTab?.('monetization')}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-xl flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">payments</span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">Configurar Monetização</p>
                    <p className="text-[10px] text-slate-500">Otimizar RPM de Projetos</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-500 group-hover:text-primary transition-all">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
