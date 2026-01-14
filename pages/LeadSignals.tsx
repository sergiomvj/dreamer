
import React, { useState } from 'react';

const LeadSignals: React.FC = () => {
  const [activeLead, setActiveLead] = useState<number | null>(0);

  const leads = [
    { 
      id: 1, 
      name: 'Michael Ross', 
      company: 'Global Tech Inc', 
      score: 98, 
      temp: 'HOT', 
      signals: '3 visits to pricing, downloaded enterprise case study, compared features.',
      intent: 'Aprovando budget corporativo para implementação no Q1.'
    },
    { 
      id: 2, 
      name: 'Sarah Jenkins', 
      company: 'Innovate SaaS', 
      score: 42, 
      temp: 'WARM', 
      signals: 'Opened 3 educational emails, clicked on "How it works" webinar.',
      intent: 'Em fase inicial de aprendizado (ToFu), comparando fornecedores.'
    },
    { 
      id: 3, 
      name: 'John Doe', 
      company: 'Consulting Co', 
      score: 15, 
      temp: 'COLD', 
      signals: 'Unsubscribed from newsletter, low time on site.',
      intent: 'Desinteresse detectado ou target incorreto.'
    },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <div>
        <h2 className="text-3xl font-black tracking-tight">Lead Intelligence</h2>
        <p className="text-slate-500 mt-1">Detecção de intenção real baseada em eventos comportamentais.</p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-7">
          <div className="bg-card-dark border border-border-dark rounded-2xl overflow-hidden">
            <div className="p-4 bg-surface-dark border-b border-border-dark flex justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Feed de Sinais Vivos</span>
              <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded animate-pulse">LIVE</span>
            </div>
            <div className="divide-y divide-border-dark">
              {leads.map((lead, idx) => (
                <div 
                  key={lead.id} 
                  onClick={() => setActiveLead(idx)}
                  className={`p-6 cursor-pointer transition-colors ${activeLead === idx ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-white/5 border-l-4 border-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold">{lead.name}</h4>
                      <p className="text-xs text-slate-500">{lead.company}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                        lead.temp === 'HOT' ? 'bg-rose-500 text-white' : 
                        lead.temp === 'WARM' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {lead.temp}
                      </span>
                      <p className="text-2xl font-black mt-1">{lead.score}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 italic line-clamp-1">"{lead.signals}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5">
          {activeLead !== null ? (
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
                    "{leads[activeLead].intent}"
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
                  {[
                    { event: 'Preços visitados (3x)', color: 'bg-primary' },
                    { event: 'Case study download', color: 'bg-emerald-500' },
                    { event: 'Inbound email click', color: 'bg-orange-500' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`size-3 ${item.color} rounded-full`}></div>
                        {i !== 2 && <div className="w-px h-full bg-slate-800 my-1"></div>}
                      </div>
                      <p className="text-xs text-slate-400 font-medium">{item.event}</p>
                    </div>
                  ))}
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
