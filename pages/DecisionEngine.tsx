
import React, { useState } from 'react';
import { getStrategicRecommendations } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';

type Recommendation = {
  id: string;
  title: string;
  description: string;
  justification: string;
  action: string;
  priority: "High" | "Medium" | "Low";
  category: "Invest" | "Cut" | "Scale" | "Pause";
};

const DecisionEngine: React.FC<{ tenantId?: string | null }> = ({ tenantId }) => {
  const [campaignData, setCampaignData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const run = async () => {
    if (!campaignData.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const result = await getStrategicRecommendations(campaignData);
      setRecommendations(result as Recommendation[]);

      if (tenantId) {
        const { data: userData } = await supabase.auth.getUser();
        const actor = userData.user?.id ?? null;
        await supabase.from('audit_log').insert({
          tenant_id: tenantId,
          actor_user_id: actor,
          entity_type: 'decision_engine',
          entity_id: null,
          action: 'recommendations',
          payload: { input: campaignData, output: result }
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar recomendações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in slide-in-from-right duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Decision Engine</h2>
          <p className="text-slate-500 mt-1">Respostas cognitivas para "O que fazer agora?" justificadas por dados.</p>
        </div>
      </div>

      {error && <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">{error}</div>}

      <div className="bg-card-dark border border-border-dark rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-black">Input de Decisão</h3>
            <p className="text-sm text-slate-500">Cole dados de campanha, funil, custos e sinais.</p>
          </div>
          <button
            onClick={run}
            disabled={loading || !campaignData.trim()}
            className="bg-primary hover:bg-blue-600 disabled:bg-slate-700 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-xl shadow-primary/20 flex items-center gap-2 shrink-0"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin">sync</span>
                Processando…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">psychology</span>
                Gerar recomendações
              </>
            )}
          </button>
        </div>

        <textarea
          className="w-full bg-surface-dark border-border-dark rounded-xl p-4 text-slate-200 focus:ring-primary focus:border-primary min-h-[160px]"
          placeholder='Ex: "Google Ads: CPC, CTR, CPL, conversões, MQL->SQL, ROI por canal..."'
          value={campaignData}
          onChange={(e) => setCampaignData(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recommendations.map((rec) => (
          <div key={rec.id} className="bg-card-dark border border-border-dark rounded-2xl p-6 relative group overflow-hidden">
            <div
              className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black uppercase rounded-bl-xl tracking-widest ${
                rec.priority === 'High' ? 'bg-emerald-500 text-white' : rec.priority === 'Medium' ? 'bg-primary text-white' : 'bg-slate-700 text-white'
              }`}
            >
              {rec.priority}
            </div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">{rec.category}</h4>
            <h3 className="text-xl font-black mb-2">{rec.title}</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">{rec.description}</p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Justificativa</p>
              <p className="text-xs text-slate-300 italic leading-relaxed">"{rec.justification}"</p>
            </div>

            <button className="w-full bg-white text-black hover:bg-slate-200 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2">
              {rec.action}
              <span className="material-symbols-outlined text-sm">trending_flat</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DecisionEngine;
