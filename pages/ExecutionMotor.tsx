
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface Props {
    tenantId: string | null;
}

const ExecutionMotor: React.FC<Props> = ({ tenantId }) => {
    const [activeSubTab, setActiveSubTab] = useState<'infrastructure' | 'cal' | 'radar' | 'inbox'>('infrastructure');

    const subTabs = [
        { id: 'infrastructure', label: 'Infraestrutura', icon: 'account_tree' },
        { id: 'cal', label: 'Ciclo de Aquecimento (CAL)', icon: 'local_fire_department' },
        { id: 'radar', label: 'Radar de Oportunidades', icon: 'radar' },
        { id: 'inbox', label: 'Inbox Inteligente', icon: 'all_inbox' },
    ];

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Dynamic Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                            Execution Engine v3.0
                        </div>
                        <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                            CAL Active
                        </div>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-white">Motor de Execução</h1>
                    <p className="text-slate-400 font-medium">Orquestração avançada de mensageria, aquecimento de leads e radar de grupos.</p>
                </div>

                <div className="flex bg-surface-dark border border-border-dark p-1 rounded-2xl">
                    {subTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id as any)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === tab.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main View Grid */}
            <div className="grid grid-cols-1 gap-8">
                {activeSubTab === 'infrastructure' && <InfrastructureView />}
                {activeSubTab === 'cal' && <CALView />}
                {activeSubTab === 'radar' && <RadarView />}
                {activeSubTab === 'inbox' && <SmartInboxView />}
            </div>
        </div>
    );
};

// --- SUB-VIEWS ---

const InfrastructureView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-dark border border-border-dark p-8 rounded-3xl space-y-4">
                <div className="flex justify-between items-start">
                    <div className="bg-emerald-500/10 p-3 rounded-2xl">
                        <span className="material-symbols-outlined text-emerald-500 text-3xl">cloud_done</span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-500 uppercase">Saudável</span>
                </div>
                <div>
                    <h3 className="text-xl font-black text-white">Conta Principal</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">+55 (11) 98877-6655</p>
                </div>
                <div className="pt-4 space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                        <span>Health Score</span>
                        <span className="text-emerald-500">98%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="w-[98%] h-full bg-emerald-500"></div>
                    </div>
                </div>
            </div>

            <div className="bg-surface-dark border border-border-dark p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 group cursor-pointer hover:border-primary/50 transition-all border-dashed">
                <div className="bg-white/5 p-4 rounded-full group-hover:bg-primary/10 transition-all">
                    <span className="material-symbols-outlined text-slate-500 group-hover:text-primary text-4xl">add</span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-primary">Adicionar Nova Conta Cloud API</p>
            </div>
        </div>
    </div>
);

const CALView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
                { label: 'Leads Latentes', value: '1,284', color: 'bg-slate-500' },
                { label: 'Em Aquecimento', value: '342', color: 'bg-amber-500' },
                { label: 'Interação Ativa', value: '89', color: 'bg-primary' },
                { label: 'Opt-in Confirmados', value: '12', color: 'bg-emerald-500' },
            ].map((kpi, idx) => (
                <div key={idx} className="bg-surface-dark border border-border-dark p-6 rounded-3xl">
                    <div className={`w-8 h-1 mb-4 rounded-full ${kpi.color}`}></div>
                    <h4 className="text-2xl font-black text-white">{kpi.value}</h4>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{kpi.label}</p>
                </div>
            ))}
        </div>

        <div className="bg-surface-dark border border-border-dark rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-border-dark bg-white/5">
                <h3 className="font-black text-white uppercase tracking-widest text-xs">Fila de Aquecimento em Tempo Real</h3>
            </div>
            <table className="w-full text-left text-sm">
                <thead className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5">
                    <tr>
                        <th className="p-4">Lead</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4">Score</th>
                        <th className="p-4">Última Ação</th>
                        <th className="p-4 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                    {[1, 2, 3].map(i => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-4 text-white font-bold">+55 21 998***</td>
                            <td className="p-4">
                                <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20">Warming Active</span>
                            </td>
                            <td className="p-4 font-black">68/100</td>
                            <td className="p-4 text-slate-400">Resposta em 12min (Interesse)</td>
                            <td className="p-4 text-right">
                                <button className="bg-white/5 p-2 rounded-lg text-slate-500 hover:text-white transition-all">
                                    <span className="material-symbols-outlined text-sm">bolt</span>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const RadarView = () => (
    <div className="bg-surface-dark border border-border-dark p-8 rounded-3xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex items-start justify-between">
            <div className="space-y-1">
                <h2 className="text-2xl font-black text-white">Radar de Oportunidades</h2>
                <p className="text-slate-500 text-sm font-medium">Monitoramento ativo de grupos e gatilhos de interesse.</p>
            </div>
            <div className="flex bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-xl border border-emerald-500/20 text-[10px] font-black uppercase items-center gap-2">
                <span className="size-2 bg-emerald-500 rounded-full animate-pulse"></span>
                IA Escaneando 12 Grupos
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(i => (
                <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-3xl space-y-4 hover:bg-white/[0.07] transition-all group">
                    <div className="flex justify-between items-center">
                        <h3 className="font-black text-white text-lg">Grupo: {i === 1 ? 'Network & Business' : 'Dropshipping High Level'}</h3>
                        <span className="text-[10px] font-black text-slate-500 uppercase">342 membros</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {['Mentoria', 'Vendas', 'Lead'].map(tag => (
                            <span key={tag} className="bg-white/5 text-slate-400 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest">{tag}</span>
                        ))}
                    </div>
                    <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl space-y-2">
                        <p className="text-[10px] font-black text-primary uppercase">Último Alerta do Radar:</p>
                        <p className="text-sm font-medium text-slate-300">"Possível lead perguntando sobre indicação de CRM. Intenção detectada: [ALTA]"</p>
                        <button className="w-full mt-2 py-2 bg-primary text-white text-[10px] font-black uppercase rounded-lg">Iniciar Aquecimento</button>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const SmartInboxView = () => (
    <div className="flex h-[600px] border border-border-dark rounded-3xl overflow-hidden bg-surface-dark/50 animate-in fade-in duration-500">
        <div className="w-80 border-r border-border-dark bg-surface-dark">
            <div className="p-4 border-b border-border-dark space-y-4">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                    <input className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white" placeholder="Pesquisar conversas..." />
                </div>
                <div className="flex gap-2">
                    {['Tudas', 'Prioritárias', 'Frias'].map(f => (
                        <button key={f} className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${f === 'Prioritárias' ? 'bg-primary text-white' : 'text-slate-500 hover:text-white'}`}>{f}</button>
                    ))}
                </div>
            </div>
            <div className="overflow-y-auto h-full p-2 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`p-4 rounded-2xl cursor-pointer transition-all ${i === 0 ? 'bg-primary shadow-lg shadow-primary/20' : 'hover:bg-white/5'}`}>
                        <div className="flex justify-between items-center mb-1">
                            <span className={`text-sm font-black ${i === 0 ? 'text-white' : 'text-slate-200'}`}>+55 11 9***</span>
                            <span className="text-[9px] font-black opacity-50">14:02</span>
                        </div>
                        <p className={`text-xs truncate ${i === 0 ? 'text-white/80' : 'text-slate-500'} font-medium`}>"Tenho interesse no plano premium..."</p>
                    </div>
                ))}
            </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 bg-white/[0.02]">
            <span className="material-symbols-outlined text-6xl opacity-10 mb-4">chat_bubble</span>
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Selecione um atendimento priorizado pela IA</p>
        </div>
    </div>
);

export default ExecutionMotor;
