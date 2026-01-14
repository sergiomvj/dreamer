
import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Control Tower</h2>
          <p className="text-slate-500 mt-1">Interpretação sistêmica da sua governança de aquisição.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-primary">calendar_today</span>
            <span className="text-xs font-bold">Últimas 24h</span>
          </div>
        </div>
      </div>

      {/* Main Metrics with AI Interpretation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Saúde do Funil', value: '84%', interpretation: 'Ótima. Conversão MQL → SQL acima do benchmark em 12%.', color: 'text-emerald-500' },
          { label: 'CPL vs Target', value: '-R$ 3,40', interpretation: 'Abaixo do teto. Espaço para escala em canais de search.', color: 'text-emerald-500' },
          { label: 'Intent Peak', value: 'Hot', interpretation: 'Pico de intenção detectado no segmento SaaS/Enterprise.', color: 'text-primary' },
          { label: 'Risco de Churn', value: 'Baixo', interpretation: 'Engajamento pós-lead estável. SDR virtual respondendo em < 1m.', color: 'text-emerald-500' },
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
                <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                  alert.type === 'risk' ? 'bg-rose-500/10 text-rose-500' : 
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
              <span className="material-symbols-outlined text-primary text-xl">psychology</span>
              <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">Resumo Cognitivo Global</p>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-tighter">Status da Operação</p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  "O sistema está operando em <span className="text-emerald-500 font-bold">Modo de Escala</span>. A eficiência de conversão superou a meta trimestral em 4 dias. O maior gargalo atual é a capacidade de atendimento humano para leads de alta intenção."
                </p>
              </div>
              <div className="p-4 bg-background-dark/50 rounded-xl border border-white/5">
                <h6 className="text-[10px] font-black text-slate-500 uppercase mb-3">Decisão Sugerida</h6>
                <p className="text-xs font-bold text-white mb-4">Migrar 15% do budget de Awareness para Retargeting Conversacional.</p>
                <button className="w-full bg-primary hover:bg-blue-600 text-white py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20">
                  Executar Agora
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
