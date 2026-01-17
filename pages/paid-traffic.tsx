import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { AdAccount } from '../types';
import PaidTrafficDashboard from '../components/PaidTrafficDashboard';
import AdRulesList from '../components/AdRulesList';

interface PaidTrafficPageProps {
  tenantId: string | null;
}

const PaidTrafficPage: React.FC<PaidTrafficPageProps> = ({ tenantId }) => {
  const [activeSubTab, setActiveSubTab] = useState<'cockpit' | 'planning' | 'experiments' | 'operation' | 'analytics' | 'playbooks' | 'connections'>('cockpit');
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'cockpit', label: 'Cockpit IA', icon: 'psychology' },
    { id: 'planning', label: 'Planejamento', icon: 'architecture' },
    { id: 'experiments', label: 'Experimentos', icon: 'biotech' },
    { id: 'operation', label: 'Operação', icon: 'rocket_launch' },
    { id: 'analytics', label: 'Analytics', icon: 'query_stats' },
    { id: 'playbooks', label: 'Playbook IA', icon: 'auto_stories' },
    { id: 'connections', label: 'Conexões', icon: 'link' },
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const message = params.get('message');
    if (status === 'error') alert(`Erro ao conectar com o Meta: ${message}`);
  }, []);

  useEffect(() => {
    const fetchAdAccounts = async () => {
      if (!tenantId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('ad_accounts')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('Error fetching ad accounts:', error);
        setAdAccounts([]);
      } else {
        setAdAccounts(data as AdAccount[]);
      }
      setLoading(false);
    };

    fetchAdAccounts();
  }, [tenantId]);

  const handleConnectMeta = () => {
    if (!tenantId) {
      alert("Selecione um workspace primeiro.");
      return;
    }
    const META_APP_ID = (import.meta as any).env.VITE_META_APP_ID || 'YOUR_META_APP_ID';
    const REDIRECT_URI = `${window.location.origin}/auth/callback/meta`;
    const scope = 'ads_read,read_insights,business_management';
    const state = JSON.stringify({ tenantId });
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}&response_type=code&state=${encodeURIComponent(state)}`;
    window.location.href = authUrl;
  };

  const handleApproveStrategy = async (strategyId: string = 'mock-id') => {
    if (!tenantId) return;
    try {
      // In a real scenario, strategyId would come from the state
      const { data, error } = await supabase.functions.invoke('approve-strategy', {
        body: { strategy_version_id: strategyId, decision: 'approved' }
      });
      if (error) throw error;
      alert("Estratégia aprovada! O Agente Tester foi acionado via n8n.");
    } catch (e: any) {
      console.error(e);
      alert(`Erro ao aprovar estratégia: ${e.message || "Erro desconhecido"}`);
    }
  };

  const renderContent = () => {
    switch (activeSubTab) {
      case 'cockpit':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Investimento IA', val: 'R$ 1.240,00', trend: '+12%', icon: 'payments', color: 'text-primary' },
                { label: 'CPA Atual', val: 'R$ 14,20', trend: '-8%', icon: 'target', color: 'text-emerald-400' },
                { label: 'ROAS Global', val: '4.2x', trend: '+0.5', icon: 'trending_up', color: 'text-purple-400' },
                { label: 'Autonomia', val: 'Level 2', trend: 'Semi-Auto', icon: 'bolt', color: 'text-amber-400' },
              ].map((m, i) => (
                <div key={i} className="bg-card-dark/50 border border-white/5 p-5 rounded-3xl backdrop-blur-md">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`material-symbols-outlined text-xl ${m.color}`}>{m.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{m.label}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-black text-white">{m.val}</span>
                    <span className={`text-[10px] font-bold ${m.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{m.trend}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-surface-dark border border-white/5 rounded-3xl p-8">
                  <h2 className="text-xl font-black mb-6 uppercase tracking-tight flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">psychology</span>
                    Fluxo de Pensamento da IA
                  </h2>
                  <div className="space-y-6">
                    {[
                      { agent: 'Planner', action: 'Estratégia Gerada', detail: 'Identificado padrão de alta conversão em criativos de vídeo para o nicho imobiliário.', time: 'Agora' },
                      { agent: 'Analyst', action: 'Orçamento Reajustado', detail: 'Transferindo saldo da Meta (Story) para Google Search devido ao CPA menor.', time: '14 min ago' },
                      { agent: 'Tester', action: 'Variante Vencedora', detail: 'Experimento [H1] concluído. Variante B aprovada com 95% de confiança.', time: '2h ago' },
                    ].map((step, i) => (
                      <div key={i} className="relative pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-[-24px] before:w-[1px] before:bg-white/10 last:before:hidden">
                        <div className="absolute left-0 top-1.5 size-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                          <div className="size-1.5 rounded-full bg-primary animate-pulse"></div>
                        </div>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{step.agent}</span>
                            <h4 className="font-bold text-white text-sm">{step.action}</h4>
                            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{step.detail}</p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-600">{step.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary/20 to-purple-900/10 border border-primary/20 rounded-3xl p-8 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 size-32 bg-primary/20 blur-3xl rounded-full"></div>
                <h3 className="text-lg font-black text-white relative z-10">Autonomia Nível 2</h3>
                <p className="text-xs text-slate-300 mt-2 relative z-10 leading-relaxed">
                  A IA está autorizada a sugerir e ajustar orçamentos em até 20% diariamente.
                  Modificações de estratégia exigem sua aprovação manual.
                </p>
                <div className="mt-8 space-y-3 relative z-10">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                    <span>Performance</span>
                    <span>92%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[92%]"></div>
                  </div>
                </div>
                <button className="mt-8 w-full py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95">
                  Expandir Escopo
                </button>
              </div>
            </div>
          </div>
        );
      case 'planning':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/5">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined font-black">architecture</span>
                </div>
                <div>
                  <h3 className="font-black text-white">Estratégia: Funil Híbrido V3</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Gerado pelo Agente Planner • v1.0.4</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApproveStrategy()}
                  className="px-5 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-lg hover:shadow-primary/20 transition active:scale-95"
                >
                  Aprovar & Rodar
                </button>
                <button className="px-5 py-2.5 bg-white/5 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition">Editar Manualmente</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-surface-dark border border-white/5 rounded-3xl p-8">
                <h4 className="text-xs font-black uppercase tracking-[.2em] text-slate-500 mb-6 italic">Visualização do Funil Cognitivo</h4>
                <div className="flex flex-col gap-4">
                  {[
                    { label: 'TOFU - Atração', channel: 'Meta Ads (Video)', spend: 'R$ 500/dia', icon: 'play_circle' },
                    { label: 'MOFU - Consideração', channel: 'Google Search', spend: 'R$ 300/dia', icon: 'search' },
                    { label: 'BOFU - Conversão', channel: 'Meta Remarketing', spend: 'R$ 200/dia', icon: 'repeat' },
                  ].map((f, i) => (
                    <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-primary/50 transition">
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-primary">{f.icon}</span>
                        <div>
                          <p className="text-xs font-black text-white uppercase tracking-tight">{f.label}</p>
                          <p className="text-[10px] text-slate-500 font-bold">{f.channel}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 font-mono tracking-tighter">{f.spend}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-surface-dark border border-white/5 rounded-3xl p-8">
                <h4 className="text-xs font-black uppercase tracking-[.2em] text-slate-500 mb-6 italic">Hipóteses de Teste (Planner)</h4>
                <div className="space-y-4">
                  {[
                    "H1: Criativo tipo 'Storytelling' reduz CPA em 15% comparado a 'Banner Direto'.",
                    "H2: Público de 'Interesse em Imóveis de Luxo' qualifica 2x mais que 'Lookalike'.",
                    "H3: Oferta de 'Avaliação Grátis' gera 40% mais leads que 'E-book'."
                  ].map((h, i) => (
                    <div key={i} className="flex gap-4 items-start p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                      <span className="text-primary font-black text-xs">0{i + 1}</span>
                      <p className="text-xs font-bold text-slate-300 leading-relaxed">{h}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'connections':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="bg-card-dark border border-border-dark rounded-3xl p-8 h-fit">
              <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">Gestão de Conexões</h2>
              <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                As APIs de tráfego são a espinha dorsal da operação.
                Garanta que as credenciais estejam ativas para que os agentes operem com 100% de visão.
              </p>
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleConnectMeta}
                  className="bg-[#1877F2] hover:bg-[#166fe5] text-white font-black py-4 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-[#1877F2]/10"
                >
                  <span className="text-2xl font-black">f</span>
                  <span>Conectar Meta Social Ads</span>
                </button>
                <button
                  onClick={() => alert("Integrando Google Ads...")}
                  className="bg-white hover:bg-slate-100 text-black font-black py-4 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-white/5"
                >
                  <span className="text-xl font-black text-blue-500">G</span>
                  <span>Conectar Google Ads API</span>
                </button>
              </div>
            </div>

            <div className="bg-card-dark border border-border-dark rounded-3xl p-8 h-fit">
              <h2 className="text-2xl font-black mb-6 uppercase tracking-tighter">Ambiente Conectado</h2>
              <div className="space-y-4">
                {loading ? (
                  <div className="flex items-center gap-2 text-slate-500 p-8 justify-center">
                    <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                    <span className="font-black uppercase text-xs tracking-[.2em]">Estabelecendo Bridge...</span>
                  </div>
                ) : adAccounts.length === 0 ? (
                  <div className="py-20 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-slate-600">
                    <span className="material-symbols-outlined text-4xl mb-2">cloud_off</span>
                    <p className="text-xs font-black uppercase italic">Nenhum Túnel Ativo</p>
                  </div>
                ) : (
                  adAccounts.map((account) => (
                    <div key={account.id} className="p-5 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group hover:border-primary/50 transition">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/20 p-3 rounded-xl text-primary">
                          <span className="font-black text-xl leading-none">f</span>
                        </div>
                        <div>
                          <p className="font-black text-white">{account.account_name}</p>
                          <p className="text-[10px] text-slate-500 font-mono tracking-widest">{account.platform_account_id}</p>
                        </div>
                      </div>
                      <button className="text-red-500 hover:bg-red-500/10 p-2.5 rounded-xl transition opacity-0 group-hover:opacity-100">
                        <span className="material-symbols-outlined">link_off</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center py-48 text-slate-600 bg-surface-dark/20 rounded-3xl border-2 border-dashed border-white/5 animate-pulse">
            <span className="material-symbols-outlined text-6xl mb-4">cognition</span>
            <h3 className="text-xl font-black uppercase tracking-[.4em]">Módulo Cognitivo</h3>
            <p className="mt-4 font-bold text-xs uppercase tracking-widest text-slate-700">O Agente correspondente está em treinamento...</p>
          </div>
        );
    }
  };

  return (
    <div className="p-8 text-white space-y-8 min-h-screen bg-background-dark overflow-y-auto no-scrollbar">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white">paid</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Paid Traffic Hub</h1>
          </div>
          <p className="text-slate-500 mt-2 font-bold tracking-widest text-[10px] uppercase flex items-center gap-2">
            <span className="size-2 bg-primary rounded-full animate-ping"></span>
            Multi-Agent Orchestration Engine • v2.0
          </p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2 hover:bg-white/10 transition group">
            <span className="material-symbols-outlined text-primary group-hover:rotate-180 transition-all duration-500">sync</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Sincronizar APIs</span>
          </button>
        </div>
      </div>

      {/* Sub-menu lateral/horizontal tipo tabs premium */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar border-b border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`
              flex items-center gap-3 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[.2em] transition-all shrink-0
              ${activeSubTab === tab.id
                ? 'bg-primary text-white shadow-2xl shadow-primary/40 border border-primary/20'
                : 'bg-card-dark/50 text-slate-500 hover:text-white hover:bg-white/5 border border-white/5'}
            `}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 pb-12">
        {renderContent()}
      </div>
    </div>
  );
};

export default PaidTrafficPage;
