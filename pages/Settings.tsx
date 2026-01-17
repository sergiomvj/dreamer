
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import LLM_Strategy from '../components/LLM_Strategy';

interface SocialAccount {
    id: string;
    platform: string;
    account_name: string;
    status: string;
    external_id: string;
}

const Settings: React.FC<{ tenantId?: string | null }> = ({ tenantId }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'social'>('general');
    const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSocialModal, setShowSocialModal] = useState(false);

    // Social form
    const [plat, setPlat] = useState('instagram');
    const [accName, setAccName] = useState('');
    const [extId, setExtId] = useState('');

    useEffect(() => {
        if (tenantId && activeTab === 'social') {
            loadSocial();
        }
    }, [tenantId, activeTab]);

    const loadSocial = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('social_channels')
            .select('*')
            .eq('tenant_id', tenantId);
        setSocialAccounts(data || []);
        setLoading(false);
    };

    const handleAddSocial = async () => {
        if (!tenantId || !accName) return;
        const { error } = await supabase.from('social_channels').insert({
            tenant_id: tenantId,
            platform: plat,
            account_name: accName,
            external_id: extId,
            status: 'active'
        });
        if (!error) {
            setAccName('');
            setExtId('');
            setShowSocialModal(false);
            loadSocial();
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div>
                <h2 className="text-3xl font-black">Configurações</h2>
                <p className="text-slate-500 mt-2">Centralize a inteligência e as integrações do sistema.</p>
            </div>

            <div className="flex gap-2 p-1 bg-surface-dark/50 border border-border-dark rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'general' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
                >
                    Geral & IA
                </button>
                <button
                    onClick={() => setActiveTab('social')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'social' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
                >
                    Redes Sociais
                </button>
            </div>

            {activeTab === 'general' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <LLM_Strategy title="Pool de Inteligência (LLM)" />

                    <div className="bg-card-dark border border-border-dark rounded-3xl p-8 space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Ajustes do Workspace</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-surface-dark border border-border-dark rounded-2xl">
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Timezone do Sistema</label>
                                <select className="bg-transparent border-none text-sm font-bold w-full p-0">
                                    <option>America/Sao_Paulo (GMT-3)</option>
                                    <option>UTC</option>
                                </select>
                            </div>
                            <div className="p-4 bg-surface-dark border border-border-dark rounded-2xl">
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Idioma de Geração</label>
                                <select className="bg-transparent border-none text-sm font-bold w-full p-0">
                                    <option>Português (Brasil)</option>
                                    <option>English</option>
                                    <option>Español</option>
                                </select>
                            </div>
                            <button className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl text-sm font-bold transition-all uppercase tracking-widest border border-white/10">
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'social' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Canais de Distribuição</h3>
                        <button
                            onClick={() => setShowSocialModal(true)}
                            className="text-primary text-xs font-bold hover:underline"
                        >
                            + Adicionar Rede
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            <p className="text-slate-500">Carregando...</p>
                        ) : socialAccounts.length === 0 ? (
                            <div className="col-span-full p-12 border-2 border-dashed border-white/5 rounded-3xl text-center">
                                <span className="material-symbols-outlined text-4xl text-slate-700 mb-4">share</span>
                                <p className="text-sm text-slate-500">Nenhuma rede social conectada para automação.</p>
                            </div>
                        ) : (
                            socialAccounts.map(s => (
                                <div key={s.id} className="bg-card-dark border border-border-dark p-6 rounded-3xl flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-primary">{s.platform === 'instagram' ? 'camera' : s.platform === 'linkedin' ? 'work' : 'share'}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">{s.account_name}</h4>
                                            <p className="text-[10px] font-mono text-slate-500">{s.external_id || 'manual-connection'}</p>
                                        </div>
                                    </div>
                                    <button className="opacity-0 group-hover:opacity-100 material-symbols-outlined text-rose-500/50 hover:text-rose-500 transition-all">delete</button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {showSocialModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-card-dark border border-border-dark w-full max-w-md rounded-3xl p-8 space-y-6">
                        <h3 className="text-xl font-black">Conectar Rede Social</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Plataforma</label>
                                <select
                                    value={plat}
                                    onChange={e => setPlat(e.target.value)}
                                    className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-sm"
                                >
                                    <option value="instagram">Instagram</option>
                                    <option value="linkedin">LinkedIn</option>
                                    <option value="facebook">Facebook</option>
                                    <option value="twitter">X (Twitter)</option>
                                    <option value="youtube">YouTube</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nome da Conta / @handle</label>
                                <input
                                    type="text"
                                    value={accName}
                                    onChange={e => setAccName(e.target.value)}
                                    placeholder="Ex: @getleads_app"
                                    className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">ID Externo / API Key</label>
                                <input
                                    type="password"
                                    value={extId}
                                    onChange={e => setExtId(e.target.value)}
                                    placeholder="Para automação via post planejado"
                                    className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-primary"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setShowSocialModal(false)} className="flex-1 px-4 py-3 text-sm font-bold text-slate-400">Cancelar</button>
                            <button
                                onClick={handleAddSocial}
                                className="flex-[2] bg-primary text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20"
                            >
                                Conectar Conta
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
