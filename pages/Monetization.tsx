
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface Project {
    id: string;
    name: string;
}

const MONETIZATION_CATEGORIES = [
    {
        id: 'display',
        name: 'Redes de Anúncios (Display Ads)',
        icon: 'grid_view',
        color: 'text-emerald-500',
        items: [
            { id: 'adsense', name: 'Google AdSense', desc: 'O padrão da indústria. Ideal para qualquer volume inicial.', url: 'https://www.google.com/adsense', req: 'Conteúdo original e conformidade com políticas.' },
            { id: 'ezoic', name: 'Ezoic', desc: 'Ideal para blogs médios (10k+ visitas). IA otimiza layout.', url: 'https://www.ezoic.com', req: 'Conteúdo original, conformidade com AdSense.' },
            { id: 'mediavine', name: 'Mediavine', desc: 'Ideal para blogs grandes (50k+ sessões). Excelente RPM.', url: 'https://www.mediavine.com', req: '50k sessões/mês, conteúdo lifestyle/food/travel.' },
            { id: 'adthrive', name: 'AdThrive (Raptive)', desc: 'Blogs premium (100k+ pageviews). Altíssima monetização.', url: 'https://raptive.com', req: '100k pageviews/mês, tráfego US/CA/UK.' },
            { id: 'monumetric', name: 'Monumetric', desc: 'A partir de 10k visitas. Modelo híbrido.', url: 'https://www.monumetric.com', req: '10k pageviews/mês, 50% tráfego premium.' },
            { id: 'propellerads', name: 'PropellerAds', desc: 'Menos exigente. Formatos agressivos (pop, push).', url: 'https://propellerads.com', req: 'Qualquer volume de tráfego.' },
        ]
    },
    {
        id: 'native',
        name: 'Native Ads',
        icon: 'article',
        color: 'text-purple-500',
        items: [
            { id: 'taboola', name: 'Taboola', desc: 'Recomendações de conteúdo. Ótimo para notícias.', url: 'https://www.taboola.com', req: '500k+ pageviews/mês.' },
            { id: 'outbrain', name: 'Outbrain', desc: 'Líder em native ads premium.', url: 'https://www.outbrain.com', req: 'Conteúdo de alta qualidade, 10M+ pageviews.' },
            { id: 'mgid', name: 'MGID', desc: 'Alternativa acessível para sites menores.', url: 'https://www.mgid.com', req: '3k+ visitantes únicos/dia.' },
        ]
    },
    {
        id: 'affiliate',
        name: 'Afiliados',
        icon: 'sell',
        color: 'text-amber-500',
        items: [
            { id: 'amazon', name: 'Amazon Afiliados', desc: 'Conversão alta para reviews e guias.', url: 'https://affiliate-program.amazon.com', req: '10 posts originais, 3 vendas em 180 dias.' },
            { id: 'hotmart', name: 'Hotmart', desc: 'Produtos digitais. Muito forte em PT-BR.', url: 'https://hotmart.com', req: 'Produtos digitais, infoprodutos.' },
            { id: 'impact', name: 'Impact / CJ Affiliate', desc: 'Grandes marcas globais.', url: 'https://impact.com', req: 'Nicho específico, site estabelecido.' },
        ]
    },
    {
        id: 'sponsorship',
        name: 'Patrocínios & Premium',
        icon: 'star',
        color: 'text-blue-500',
        items: [
            { id: 'direct', name: 'Patrocínios Diretos', desc: 'Venda direta de banners e artigos.', url: '#', req: 'Audiência fiel e nichada.' },
            { id: 'substack', name: 'Substack / Patreon', desc: 'Assinaturas e conteúdo pago.', url: 'https://substack.com', req: 'Produção recorrente de conteúdo.' },
            { id: 'whitepress', name: 'WhitePress / Getfluence', desc: 'Marketplace de posts patrocinados.', url: 'https://www.whitepress.com', req: 'Site com métricas de SEO reais.' },
        ]
    }
];

const Monetization: React.FC<{ tenantId?: string | null }> = ({ tenantId }) => {
    const [projectId, setProjectId] = useState<string | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [monetizationOptions, setMonetizationOptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [itemStatus, setItemStatus] = useState('inactive');
    const [itemExternalId, setItemExternalId] = useState('');
    const [itemNotes, setItemNotes] = useState('');

    useEffect(() => {
        if (!tenantId) return;
        const loadProjects = async () => {
            const { data, error } = await supabase
                .from('projects')
                .select('id, name')
                .eq('tenant_id', tenantId);
            if (error) setError(error.message);
            else setProjects(data || []);
        };
        loadProjects();
    }, [tenantId]);

    useEffect(() => {
        if (!projectId || !tenantId) return;
        const loadMonetization = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('monetization_options')
                .select('*')
                .eq('project_id', projectId);
            if (error) setError(error.message);
            else setMonetizationOptions(data || []);
            setLoading(false);
        };
        loadMonetization();
    }, [projectId, tenantId]);

    useEffect(() => {
        if (selectedItem) {
            const existing = monetizationOptions.find(o => o.network_id === selectedItem.id);
            if (existing) {
                setItemStatus(existing.status);
                setItemExternalId(existing.external_id || '');
                setItemNotes(existing.notes || '');
            } else {
                setItemStatus('inactive');
                setItemExternalId('');
                setItemNotes('');
            }
        }
    }, [selectedItem, monetizationOptions]);

    const handleSaveItem = async () => {
        if (!projectId || !tenantId || !selectedItem) return;
        setLoading(true);

        const { error } = await supabase
            .from('monetization_options')
            .upsert({
                project_id: projectId,
                tenant_id: tenantId,
                network_id: selectedItem.id,
                status: itemStatus,
                external_id: itemExternalId,
                notes: itemNotes
            }, { onConflict: 'project_id,network_id' });

        if (error) {
            setError(error.message);
        } else {
            // Reload options
            const { data } = await supabase
                .from('monetization_options')
                .select('*')
                .eq('project_id', projectId);
            setMonetizationOptions(data || []);
            setSelectedItem(null);
        }
        setLoading(false);
    };

    const getStatusBadge = (networkId: string) => {
        const opt = monetizationOptions.find(o => o.network_id === networkId);
        if (!opt || opt.status === 'inactive') return null;

        const colors: Record<string, string> = {
            'active': 'bg-emerald-500/20 text-emerald-500',
            'review': 'bg-amber-500/20 text-amber-500',
            'rejected': 'bg-rose-500/20 text-rose-500'
        };

        return (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${colors[opt.status] || 'bg-slate-500/20 text-slate-500'}`}>
                {opt.status}
            </span>
        );
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black tracking-tight underline decoration-primary decoration-4 underline-offset-8">Monetization Hub</h2>
                    <p className="text-slate-500 mt-4">Expanda a receita dos seus projetos com redes de anúncios, afiliados e patrocínios.</p>
                </div>
                <div className="w-64">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Projeto Ativo</label>
                    <select
                        className="w-full bg-card-dark border border-border-dark rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-primary focus:border-primary"
                        value={projectId || ''}
                        onChange={(e) => setProjectId(e.target.value)}
                    >
                        <option value="">Selecione um projeto</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>

            {!projectId ? (
                <div className="bg-primary/5 border border-primary/20 p-12 rounded-3xl text-center space-y-4">
                    <span className="material-symbols-outlined text-6xl text-primary animate-bounce">arrow_upward</span>
                    <h3 className="text-xl font-bold">Selecione um projeto para configurar a monetização</h3>
                    <p className="text-slate-400 max-w-md mx-auto text-sm">Cada projeto possui sua própria estratégia de monetização baseada em volume de tráfego e nicho de mercado.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {MONETIZATION_CATEGORIES.map((cat) => (
                        <div key={cat.id} className="bg-card-dark border border-border-dark rounded-3xl overflow-hidden group hover:border-primary/30 transition-all">
                            <div className="p-6 border-b border-border-dark flex items-center gap-4 bg-surface-dark/30">
                                <div className={`size-12 rounded-2xl flex items-center justify-center ${cat.color.replace('text', 'bg')}/10 ${cat.color}`}>
                                    <span className="material-symbols-outlined">{cat.icon}</span>
                                </div>
                                <div>
                                    <h3 className="font-black tracking-tight">{cat.name}</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Oportunidades de Receita</p>
                                </div>
                            </div>
                            <div className="p-4 space-y-2">
                                {cat.items.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedItem(item)}
                                        className="w-full text-left p-4 rounded-2xl hover:bg-white/5 transition-colors flex items-center justify-between group/item"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <p className="font-bold text-slate-200 group-hover/item:text-primary transition-colors">{item.name}</p>
                                                {getStatusBadge(item.id)}
                                            </div>
                                            <p className="text-xs text-slate-500">{item.desc}</p>
                                        </div>
                                        <span className="material-symbols-outlined text-slate-700 group-hover/item:text-primary transition-all group-hover/item:translate-x-1">chevron_right</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedItem && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card-dark border border-border-dark w-full max-w-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-border-dark flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-black">{selectedItem.name}</h3>
                                <p className="text-slate-400 mt-2">{selectedItem.desc}</p>
                            </div>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="size-10 rounded-full hover:bg-white/10 flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            {error && <div className="text-xs text-rose-500 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{error}</div>}

                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/20">
                                    <span className="material-symbols-outlined text-primary">info</span>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-1">Requisitos Mínimos</h4>
                                        <p className="text-sm font-medium">{selectedItem.req}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="p-4 rounded-2xl bg-surface-dark border border-border-dark">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Status da Conta</label>
                                        <select
                                            className="bg-transparent border-none text-sm font-bold w-full p-0 focus:ring-0"
                                            value={itemStatus}
                                            onChange={(e) => setItemStatus(e.target.value)}
                                        >
                                            <option value="inactive">Não Cadastrado</option>
                                            <option value="review">Em Análise</option>
                                            <option value="active">Ativo</option>
                                            <option value="rejected">Rejeitado</option>
                                        </select>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-surface-dark border border-border-dark">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">ID/Tag Local</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: PUB-12345"
                                            className="bg-transparent border-none text-sm font-bold w-full p-0 focus:ring-0"
                                            value={itemExternalId}
                                            onChange={(e) => setItemExternalId(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Notas do Projeto</label>
                                    <textarea
                                        className="w-full bg-surface-dark border border-border-dark rounded-2xl p-4 text-sm focus:ring-primary focus:border-primary min-h-[100px]"
                                        placeholder="Anote aqui prazos, contatos ou detalhes técnicos da integração..."
                                        value={itemNotes}
                                        onChange={(e) => setItemNotes(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <a
                                    href={selectedItem.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-primary hover:bg-blue-600 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl text-center shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                                >
                                    Ir para Cadastro
                                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                                </a>
                                <button
                                    onClick={handleSaveItem}
                                    disabled={loading}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? 'Salvando...' : 'Salvar Preferências'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Monetization;
