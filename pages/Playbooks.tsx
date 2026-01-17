
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface Blueprint {
    id: string;
    strategy_id: string;
    copy_assets: {
        headline: string;
        body: string;
        cta: string;
    };
    kickoff_plan: string[];
    decision_rules: string[];
    strategy: {
        name: string;
        strategy_type: string;
    };
}

const Playbooks: React.FC<{ tenantId: string | null }> = ({ tenantId }) => {
    const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (tenantId) {
            fetchBlueprints();
        }
    }, [tenantId]);

    const fetchBlueprints = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('strategy_blueprints')
            .select(`
        *,
        strategy:strategies(name, strategy_type)
      `)
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching blueprints:', error);
        } else {
            setBlueprints(data as any[]);
        }
        setLoading(false);
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-white">Strategic Playbooks</h2>
                    <p className="text-slate-500 mt-1">Planos de execução gerados dinamicamente pela IA para seus canais.</p>
                </div>
                <button
                    onClick={fetchBlueprints}
                    className="text-slate-500 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-widest"
                >
                    <span className="material-symbols-outlined text-base">refresh</span>
                    Atualizar
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-500 gap-3">
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    <span className="font-bold">Sincronizando modelos cognitivos...</span>
                </div>
            ) : blueprints.length === 0 ? (
                <div className="bg-card-dark border-2 border-dashed border-border-dark rounded-3xl p-20 text-center flex flex-col items-center">
                    <span className="material-symbols-outlined text-6xl text-slate-700 mb-4">auto_stories</span>
                    <h3 className="text-xl font-bold text-slate-400">Nenhum Playbook Ativo</h3>
                    <p className="text-slate-600 max-w-sm mt-2">Vá até "Foundation Setup" e conclua o diagnóstico para gerar seus primeiros blueprints estratégicos.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {blueprints.map((bp) => (
                        <div key={bp.id} className="bg-card-dark border border-border-dark rounded-3xl overflow-hidden group hover:border-primary/50 transition-all flex flex-col">
                            <div className="p-6 border-b border-white/5 bg-surface-dark/50">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded mb-2 inline-block">
                                            {bp.strategy?.strategy_type} Strategy
                                        </span>
                                        <h4 className="text-xl font-black text-white">{bp.strategy?.name}</h4>
                                    </div>
                                    <div className="size-10 bg-white/5 rounded-xl flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">menu_book</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-8 flex-1">
                                {/* Copy Section */}
                                <div className="space-y-4">
                                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <span className="material-symbols-outlined text-xs">edit_note</span>
                                        Sugestão de Copy (AI)
                                    </h5>
                                    <div className="bg-background-dark/50 border border-white/5 rounded-2xl p-5 space-y-3">
                                        <p className="text-sm font-black text-white">{bp.copy_assets.headline}</p>
                                        <p className="text-xs text-slate-400 leading-relaxed">{bp.copy_assets.body}</p>
                                        <div className="pt-2">
                                            <button className="text-[10px] bg-primary/20 text-primary px-3 py-1.5 rounded-lg font-black uppercase tracking-widest hover:bg-primary/30 transition-all">
                                                {bp.copy_assets.cta}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Kickoff Plan */}
                                    <div className="space-y-4">
                                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <span className="material-symbols-outlined text-xs">format_list_numbered</span>
                                            Kickoff Plan
                                        </h5>
                                        <ul className="space-y-3">
                                            {bp.kickoff_plan.map((step, i) => (
                                                <li key={i} className="flex gap-3 text-xs text-slate-400 group/item">
                                                    <span className="text-primary font-bold">{i + 1}.</span>
                                                    <span className="group-hover/item:text-slate-200 transition-colors">{step}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Decision Rules */}
                                    <div className="space-y-4">
                                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <span className="material-symbols-outlined text-xs">gavel</span>
                                            Decision Rules
                                        </h5>
                                        <ul className="space-y-3">
                                            {bp.decision_rules.map((rule, i) => (
                                                <li key={i} className="flex gap-3 text-xs text-slate-400 group/item">
                                                    <span className="material-symbols-outlined text-[10px] text-emerald-500 mt-0.5">verified_user</span>
                                                    <span className="group-hover/item:text-slate-200 transition-colors">{rule}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 pt-0">
                                <button className="w-full bg-slate-800 hover:bg-primary text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                                    Ativar no Orchestrador
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Playbooks;
