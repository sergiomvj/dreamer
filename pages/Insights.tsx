
import React from 'react';

const Insights: React.FC = () => {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black tracking-tight">Insights & BI</h2>
        <p className="text-slate-500 mt-1">Transformando dados brutos em decisões acionáveis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card-dark border border-border-dark rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-black uppercase text-slate-500 tracking-widest">Performance por Canal</h4>
            <span className="material-symbols-outlined text-slate-500">info</span>
          </div>
          <div className="aspect-video bg-surface-dark/50 rounded-xl border border-border-dark flex items-center justify-center text-slate-700 font-black uppercase tracking-widest">
            Gráfico: ROI vs CAC (Simulado)
          </div>
          <div className="bg-primary/5 border border-l-4 border-primary p-4 rounded-r-xl">
            <h5 className="text-xs font-black text-primary uppercase mb-2">E daí? (Interpretação)</h5>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "Canais orgânicos possuem o melhor LTV, mas atingiram o teto de volume. O tráfego pago está 'comprando' volume a um custo 22% maior que o aceitável no longo prazo."
            </p>
            <h5 className="text-xs font-black text-primary uppercase mt-4 mb-2">O que fazer agora? (Ação)</h5>
            <p className="text-xs text-slate-300 font-bold">
              Implementar teto de bid por lead e focar em SEO para as keywords 'Enterprise Solutions'.
            </p>
          </div>
        </div>

        <div className="bg-card-dark border border-border-dark rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-black uppercase text-slate-500 tracking-widest">Aderência Produto-Mercado</h4>
            <span className="material-symbols-outlined text-slate-500">trending_up</span>
          </div>
          <div className="aspect-video bg-surface-dark/50 rounded-xl border border-border-dark flex items-center justify-center text-slate-700 font-black uppercase tracking-widest">
            Gráfico: Conversão por Segmento
          </div>
          <div className="bg-emerald-500/5 border border-l-4 border-emerald-500 p-4 rounded-r-xl">
            <h5 className="text-xs font-black text-emerald-500 uppercase mb-2">E daí? (Interpretação)</h5>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "O segmento de Médias Empresas (Mid-Market) é o mais resiliente, com churn zero nos primeiros 90 dias, mas é o que recebe menos orçamentário hoje."
            </p>
            <h5 className="text-xs font-black text-emerald-500 uppercase mt-4 mb-2">O que fazer agora? (Ação)</h5>
            <p className="text-xs text-slate-300 font-bold">
              Criar uma campanha dedicada para Mid-Market com o Playbook "Expansão Eficiente".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;
