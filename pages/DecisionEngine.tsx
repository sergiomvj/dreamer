
import React from 'react';

const DecisionEngine: React.FC = () => {
  const recommendations = [
    {
      title: 'Onde Investir',
      target: 'Email Automation',
      reason: 'Yield LTV +18% superior à média com custo de aquisição (CAC) decrescente.',
      action: 'Aumentar orçamentário em 15%',
      priority: 'HIGH',
      color: 'border-emerald-500 text-emerald-500'
    },
    {
      title: 'Onde Cortar',
      target: 'Paid Search (Broad)',
      reason: 'Volume alto mas Lead Quality Index inferior a 40. Retorno sobre investimento negativo.',
      action: 'Reduzir budget em 22% agora',
      priority: 'CRITICAL',
      color: 'border-rose-500 text-rose-500'
    },
    {
      title: 'Quando Escalar',
      target: 'YouTube Retargeting',
      reason: 'Alta aderência em leads warm detectada. Teto de escala ainda não atingido.',
      action: 'Escalar progressivamente (10%/semana)',
      priority: 'MEDIUM',
      color: 'border-primary text-primary'
    }
  ];

  return (
    <div className="p-8 space-y-8 animate-in slide-in-from-right duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Decision Engine</h2>
          <p className="text-slate-500 mt-1">Respostas cognitivas para "O que fazer agora?" justificadas por dados.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-card-dark border border-border-dark text-slate-300 px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">history</span>
            Log de Decisões
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recommendations.map((rec, i) => (
          <div key={i} className="bg-card-dark border border-border-dark rounded-2xl p-6 relative group overflow-hidden">
            <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black uppercase rounded-bl-xl tracking-widest ${
              rec.priority === 'CRITICAL' ? 'bg-rose-500 text-white' : 
              rec.priority === 'HIGH' ? 'bg-emerald-500 text-white' : 'bg-primary text-white'
            }`}>
              {rec.priority}
            </div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">{rec.title}</h4>
            <h3 className="text-2xl font-black mb-2">{rec.target}</h3>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">"{rec.reason}"</p>
            
            <div className={`border-2 rounded-xl p-4 mb-4 ${rec.color} bg-opacity-5`}>
              <p className="text-xs font-black uppercase tracking-widest mb-1">Ação Sugerida</p>
              <p className="text-sm font-bold">{rec.action}</p>
            </div>

            <button className="w-full bg-white text-black hover:bg-slate-200 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2">
              Confirmar & Executar
              <span className="material-symbols-outlined text-sm">trending_flat</span>
            </button>
          </div>
        ))}
      </div>

      <div className="bg-surface-dark border border-border-dark rounded-2xl p-8">
        <h4 className="text-lg font-bold mb-6">Matriz de Decisão ROI vs. Qualidade</h4>
        <div className="aspect-[21/9] w-full bg-background-dark/50 rounded-xl border border-border-dark flex items-center justify-center">
          <p className="text-slate-700 font-bold uppercase tracking-[0.5em]">Visualização Gráfica do Engine</p>
        </div>
      </div>
    </div>
  );
};

export default DecisionEngine;
