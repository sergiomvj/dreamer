
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabaseClient';

type ChannelRow = {
  channel: string;
  leads: number;
  hot: number;
  avgScore: number;
};

const Insights: React.FC<{ tenantId?: string | null }> = ({ tenantId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channels, setChannels] = useState<ChannelRow[]>([]);

  const sinceIso = useMemo(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), []);

  useEffect(() => {
    if (!tenantId) {
      setChannels([]);
      return;
    }

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: loadError } = await supabase
          .from('leads')
          .select('score,intent,source,created_at')
          .eq('tenant_id', tenantId)
          .gte('created_at', sinceIso)
          .limit(1000);

        if (loadError) throw loadError;

        const rows = (data || []) as Array<{ score: number; intent: string; source: any }>;
        const acc = new Map<string, { leads: number; hot: number; scoreSum: number }>();

        for (const r of rows) {
          const channel = String(r.source?.channel || 'unknown');
          const cur = acc.get(channel) || { leads: 0, hot: 0, scoreSum: 0 };
          cur.leads += 1;
          cur.hot += r.intent === 'hot' ? 1 : 0;
          cur.scoreSum += Number(r.score || 0);
          acc.set(channel, cur);
        }

        const list: ChannelRow[] = Array.from(acc.entries()).map(([channel, v]) => ({
          channel,
          leads: v.leads,
          hot: v.hot,
          avgScore: v.leads === 0 ? 0 : v.scoreSum / v.leads
        }));

        list.sort((a, b) => b.leads - a.leads);
        setChannels(list);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar insights.');
        setChannels([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [tenantId, sinceIso]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black tracking-tight">Insights & BI</h2>
        <p className="text-slate-500 mt-1">Transformando dados brutos em decisões acionáveis (30 dias).</p>
      </div>

      {error && <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card-dark border border-border-dark rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-black uppercase text-slate-500 tracking-widest">Performance por Canal</h4>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{loading ? 'Carregando…' : 'Atualizado'}</span>
          </div>
          <div className="bg-surface-dark/50 rounded-xl border border-border-dark overflow-hidden">
            <div className="grid grid-cols-4 gap-2 p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-border-dark">
              <div>Canal</div>
              <div className="text-right">Leads</div>
              <div className="text-right">Hot</div>
              <div className="text-right">Score</div>
            </div>
            <div className="divide-y divide-border-dark">
              {channels.length === 0 && !loading ? (
                <div className="p-6 text-sm text-slate-500">Sem dados para este período.</div>
              ) : (
                channels.slice(0, 8).map((c) => (
                  <div key={c.channel} className="grid grid-cols-4 gap-2 p-4 text-sm">
                    <div className="font-bold text-slate-200">{c.channel}</div>
                    <div className="text-right text-slate-300 font-bold">{c.leads}</div>
                    <div className="text-right text-rose-400 font-bold">{c.hot}</div>
                    <div className="text-right text-slate-300 font-bold">{Math.round(c.avgScore)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="bg-primary/5 border border-l-4 border-primary p-4 rounded-r-xl">
            <h5 className="text-xs font-black text-primary uppercase mb-2">E daí? (Interpretação)</h5>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "Compare volume vs score médio. Se um canal traz volume mas score baixo, revise abordagem e mapeamento de eventos."
            </p>
            <h5 className="text-xs font-black text-primary uppercase mt-4 mb-2">O que fazer agora? (Ação)</h5>
            <p className="text-xs text-slate-300 font-bold">
              Criar limites por canal: pausar/ajustar quando score médio cair abaixo do mínimo.
            </p>
          </div>
        </div>

        <div className="bg-card-dark border border-border-dark rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-black uppercase text-slate-500 tracking-widest">Aderência Produto-Mercado</h4>
            <span className="material-symbols-outlined text-slate-500">trending_up</span>
          </div>
          <div className="aspect-video bg-surface-dark/50 rounded-xl border border-border-dark flex items-center justify-center text-slate-700 font-black uppercase tracking-widest">
            Gráfico: Conversão por Segmento (em evolução)
          </div>
          <div className="bg-emerald-500/5 border border-l-4 border-emerald-500 p-4 rounded-r-xl">
            <h5 className="text-xs font-black text-emerald-500 uppercase mb-2">E daí? (Interpretação)</h5>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "Esse painel vira real quando você associar leads a product_id e estratégias por produto."
            </p>
            <h5 className="text-xs font-black text-emerald-500 uppercase mt-4 mb-2">O que fazer agora? (Ação)</h5>
            <p className="text-xs text-slate-300 font-bold">
              No onboarding, cadastre produtos e conecte as estratégias aos produtos antes de escalar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;
