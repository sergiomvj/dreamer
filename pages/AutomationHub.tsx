
import React, { useState } from 'react';

interface Props {
    tenantId: string | null;
}

const AutomationHub: React.FC<Props> = ({ tenantId }) => {
    const [activeSubTab, setActiveSubTab] = useState<'workflows' | 'observability' | 'blueprints'>('workflows');

    const subTabs = [
        { id: 'workflows', label: 'Workflows n8n', icon: 'account_tree' },
        { id: 'observability', label: 'Observabilidade', icon: 'visibility' },
        { id: 'blueprints', label: 'Blueprints (Fluxos)', icon: 'auto_awesome_motion' },
    ];

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Heavy Tech Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                            Orchestration Hub v1.0
                        </div>
                        <div className="bg-slate-500/10 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                            Connected to n8n-mcp
                        </div>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-white italic">Automação & Orquestração</h1>
                    <p className="text-slate-400 font-medium">Controle total dos seus fluxos de trabalho e monitoramento de execução em tempo real.</p>
                </div>

                <div className="flex bg-surface-dark border border-border-dark p-1 rounded-2xl">
                    {subTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === tab.id
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

            <div className="grid grid-cols-1 gap-8">
                {activeSubTab === 'workflows' && <WorkflowsView />}
                {activeSubTab === 'observability' && <ObservabilityView />}
                {activeSubTab === 'blueprints' && <BlueprintsView />}
            </div>
        </div>
    );
};

// --- SUB-VIEWS ---

const WorkflowsView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-surface-dark border border-border-dark p-8 rounded-3xl space-y-6 hover:border-primary/50 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-[40px] rounded-full -mr-12 -mt-12 group-hover:bg-primary/10 transition-all"></div>
                    <div className="flex justify-between items-start">
                        <div className="bg-white/5 p-3 rounded-2xl text-primary border border-white/5">
                            <span className="material-symbols-outlined text-2xl font-black">sync_alt</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Ativo</span>
                            <span className="text-[8px] font-black text-slate-500 uppercase">ID: n8n_wf_{i}</span>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors">
                            {i === 1 ? 'Aquecimento de Leads' : i === 2 ? 'Qualificador IA' : 'Sync SDR CRM'}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-2 leading-relaxed">
                            Workflow responsável por processar gatilhos de interesse e disparar o ciclo de aquecimento.
                        </p>
                    </div>
                    <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Execuções (7d)</p>
                            <p className="text-lg font-black text-white">{i * 242}</p>
                        </div>
                        <button className="bg-white/5 p-3 rounded-xl text-slate-400 hover:text-white transition-all border border-white/5">
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const ObservabilityView = () => (
    <div className="bg-surface-dark border border-border-dark rounded-3xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="p-8 border-b border-border-dark flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.02]">
            <div>
                <h2 className="text-2xl font-black text-white">Console de Observabilidade</h2>
                <p className="text-sm text-slate-500 font-medium">Logs de execução em tempo real sincronizados do seu n8n.</p>
            </div>
            <div className="flex gap-4">
                <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-xl border border-emerald-500/20 text-[10px] font-black uppercase">
                    <span className="size-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Gateway Connectado
                </div>
            </div>
        </div>

        <div className="p-4 overflow-x-auto">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2">
                <thead className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">
                    <tr>
                        <th className="px-6 py-4">Execução ID</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Duração</th>
                        <th className="px-6 py-4">Payload In / Out</th>
                        <th className="px-6 py-4 text-right">Data/Hora</th>
                    </tr>
                </thead>
                <tbody className="font-medium">
                    {[1, 2, 3, 4, 5].map(i => (
                        <tr key={i} className="bg-white/5 hover:bg-white/[0.08] transition-all group rounded-2xl overflow-hidden">
                            <td className="px-6 py-5 first:rounded-l-2xl border-y border-l border-white/5 text-slate-300 font-mono text-xs">#38491-WF{i}</td>
                            <td className="px-6 py-5 border-y border-white/5">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10 ${i === 3 ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                    {i === 3 ? 'Failed' : 'Success'}
                                </span>
                            </td>
                            <td className="px-6 py-5 border-y border-white/5 text-slate-400">842ms</td>
                            <td className="px-6 py-5 border-y border-white/5">
                                <div className="flex gap-2 text-slate-500">
                                    <span className="material-symbols-outlined text-sm hover:text-primary transition-colors cursor-pointer">login</span>
                                    <span className="material-symbols-outlined text-sm hover:text-emerald-400 transition-colors cursor-pointer">logout</span>
                                </div>
                            </td>
                            <td className="px-6 py-5 last:rounded-r-2xl border-y border-r border-white/5 text-slate-500 text-right text-xs">
                                {new Date().toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const BlueprintsView = () => (
    <div className="bg-surface-dark border border-border-dark p-8 rounded-3xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <h2 className="text-2xl font-black text-white">Blueprints & Skills</h2>
                <p className="text-slate-500 text-sm font-medium">Modelos de automação pré-validados para injeção rápida.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
                { title: 'Safe Opt-Out Engine', desc: 'Garante o bloqueio técnico instantâneo do lead em todos os canais.', tags: ['Safety', 'Compliance'] },
                { title: 'Dual-Speed Warming', desc: 'Alterna entre aquecimento conservador e ativo via n8n.', tags: ['Marketing', 'CAL'] },
            ].map((bp, i) => (
                <div key={i} className="bg-white/5 border border-white/5 p-8 rounded-3xl space-y-6 hover:bg-white/[0.08] transition-all">
                    <h3 className="text-xl font-black text-white">{bp.title}</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{bp.desc}</p>
                    <div className="flex flex-wrap gap-2 pt-2">
                        {bp.tags.map(tag => (
                            <span key={tag} className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{tag}</span>
                        ))}
                    </div>
                    <button className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary hover:border-primary/50 transition-all">
                        Injetar Blueprint no n8n
                    </button>
                </div>
            ))}
        </div>
    </div>
);

export default AutomationHub;
