
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface Product {
    id: string;
    name: string;
    awareness_level: string;
    product_role: string;
}

interface Offer {
    id: string;
    product_id: string;
    name: string;
    price: number;
    currency: string;
    is_active: boolean;
}

const Products: React.FC<{ tenantId?: string | null }> = ({ tenantId }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
    const [showProductModal, setShowProductModal] = useState(false);
    const [showOfferModal, setShowOfferModal] = useState(false);

    // Form states
    const [prodName, setProdName] = useState('');
    const [prodAwareness, setProdAwareness] = useState('unaware');
    const [prodRole, setProdRole] = useState('core');
    const [targetProjectId, setTargetProjectId] = useState<string>('');

    const [offerName, setOfferName] = useState('');
    const [offerPrice, setOfferPrice] = useState(0);
    const [offerLink, setOfferLink] = useState('');

    useEffect(() => {
        if (tenantId) {
            loadProjects();
            loadProducts();
        }
    }, [tenantId, selectedProjectId]);

    const loadProjects = async () => {
        const { data } = await supabase
            .from('projects')
            .select('id, name')
            .eq('tenant_id', tenantId);
        setProjects(data || []);
        if (data && data.length > 0 && !targetProjectId) {
            setTargetProjectId(data[0].id);
        }
    };

    const loadProducts = async () => {
        setLoading(true);
        let query = supabase
            .from('products')
            .select('*')
            .eq('tenant_id', tenantId);

        if (selectedProjectId !== 'all') {
            query = query.eq('project_id', selectedProjectId);
        }

        const { data } = await query.order('created_at', { ascending: false });
        setProducts(data || []);
        setLoading(false);
    };

    const loadOffers = async (pId: string) => {
        const { data } = await supabase
            .from('offers')
            .select('*')
            .eq('product_id', pId);
        setOffers(data || []);
    };

    const handleCreateProduct = async () => {
        if (!tenantId || !prodName || !targetProjectId) return;
        const { error } = await supabase.from('products').insert({
            tenant_id: tenantId,
            project_id: targetProjectId,
            name: prodName,
            awareness_level: prodAwareness,
            product_role: prodRole
        });
        if (!error) {
            setProdName('');
            setShowProductModal(false);
            loadProducts();
        }
    };

    const handleCreateOffer = async () => {
        if (!tenantId || !selectedProduct || !offerName) return;
        const { error } = await supabase.from('offers').insert({
            tenant_id: tenantId,
            product_id: selectedProduct.id,
            name: offerName,
            price: offerPrice,
            external_link: offerLink
        });
        if (!error) {
            setOfferName('');
            setOfferPrice(0);
            setOfferLink('');
            setShowOfferModal(false);
            loadOffers(selectedProduct.id);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <div>
                        <h2 className="text-3xl font-black">Produtos & Ofertas</h2>
                        <p className="text-slate-500 mt-2">Gerencie seu catálogo de soluções e propostas comerciais.</p>
                    </div>
                    {/* Project Filter */}
                    <div className="bg-card-dark border border-border-dark rounded-xl px-4 py-2 flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Projeto:</span>
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="bg-transparent border-none text-sm font-bold text-white focus:ring-0 cursor-pointer"
                        >
                            <option value="all">Todos os Projetos</option>
                            {projects.map(prj => (
                                <option key={prj.id} value={prj.id}>{prj.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setSelectedProduct(null);
                        setShowProductModal(true);
                    }}
                    className="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined">add</span>
                    Novo Produto
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Products List */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 px-2">Seus Produtos</h3>
                    {loading ? (
                        <p className="p-4 text-slate-500">Carregando...</p>
                    ) : products.length === 0 ? (
                        <div className="p-8 border-2 border-dashed border-white/5 rounded-3xl text-center">
                            <p className="text-sm text-slate-500">Nenhum produto encontrado.</p>
                        </div>
                    ) : (
                        products.map(p => (
                            <button
                                key={p.id}
                                onClick={() => {
                                    setSelectedProduct(p);
                                    loadOffers(p.id);
                                }}
                                className={`w-full text-left p-6 rounded-3xl border transition-all ${selectedProduct?.id === p.id
                                    ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10'
                                    : 'bg-card-dark border-border-dark hover:border-white/20'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-white">{p.name}</h4>
                                    <span className="material-symbols-outlined text-slate-500 text-sm">inventory_2</span>
                                </div>
                                <div className="flex gap-2 mb-3">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-400 uppercase">{p.awareness_level}</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-400 uppercase">{p.product_role}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">
                                    <span className="font-bold text-primary mr-1">PROJETO:</span>
                                    {projects.find(prj => prj.id === (p as any).project_id)?.name || 'N/A'}
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Offers for Selected Product */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedProduct ? (
                        <div className="bg-card-dark border border-border-dark rounded-3xl p-8 space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-black">{selectedProduct.name}</h3>
                                    <p className="text-sm text-slate-500">Gerencie as ofertas vinculadas a este produto.</p>
                                </div>
                                <button
                                    onClick={() => setShowOfferModal(true)}
                                    className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold border border-white/10 transition-all"
                                >
                                    Criar Oferta
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {offers.length === 0 ? (
                                    <div className="col-span-2 p-12 border-2 border-dashed border-white/5 rounded-2xl text-center">
                                        <p className="text-sm text-slate-500">Nenhuma oferta ativa para este produto.</p>
                                    </div>
                                ) : (
                                    offers.map(o => (
                                        <div key={o.id} className="p-6 bg-surface-dark border border-border-dark rounded-2xl group hover:border-emerald-500/30 transition-all">
                                            <div className="flex justify-between mb-4">
                                                <span className={`size-2 rounded-full ${o.is_active ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button className="material-symbols-outlined text-slate-500 hover:text-white text-sm">edit</button>
                                                    <button className="material-symbols-outlined text-rose-500/50 hover:text-rose-500 text-sm">delete</button>
                                                </div>
                                            </div>
                                            <h5 className="font-bold text-lg mb-1">{o.name}</h5>
                                            <p className="text-2xl font-black text-emerald-500">{o.currency} {o.price.toLocaleString()}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[400px] border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center p-12 text-center space-y-4">
                            <span className="material-symbols-outlined text-4xl text-slate-700">arrow_back</span>
                            <p className="text-slate-500 max-w-xs">Selecione um produto à esquerda para gerenciar suas ofertas e detalhes.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Product Modal */}
            {showProductModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-card-dark border border-border-dark w-full max-w-md rounded-3xl p-8 space-y-6">
                        <h3 className="text-xl font-black">Adicionar Produto</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Vincular ao Projeto</label>
                                <select
                                    value={targetProjectId}
                                    onChange={e => setTargetProjectId(e.target.value)}
                                    className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-sm"
                                >
                                    {projects.map(prj => (
                                        <option key={prj.id} value={prj.id}>{prj.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nome do Produto</label>
                                <input
                                    type="text"
                                    value={prodName}
                                    onChange={e => setProdName(e.target.value)}
                                    className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Consciência</label>
                                    <select
                                        value={prodAwareness}
                                        onChange={e => setProdAwareness(e.target.value)}
                                        className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-sm"
                                    >
                                        <option value="unaware">Inconsciente</option>
                                        <option value="problem_aware">Consciente Problema</option>
                                        <option value="solution_aware">Consciente Solução</option>
                                        <option value="most_aware">Totalmente Consciente</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Papel</label>
                                    <select
                                        value={prodRole}
                                        onChange={e => setProdRole(e.target.value)}
                                        className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-sm"
                                    >
                                        <option value="core">Principal</option>
                                        <option value="frontend">Entrada (LTV)</option>
                                        <option value="upsell">Upsell</option>
                                        <option value="downsell">Downsell</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowProductModal(false)}
                                className="flex-1 px-4 py-3 text-sm font-bold text-slate-400 hover:text-white"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateProduct}
                                className="flex-[2] bg-primary text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20"
                            >
                                Salvar Produto
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Offer Modal */}
            {showOfferModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-card-dark border border-border-dark w-full max-w-md rounded-3xl p-8 space-y-6">
                        <h3 className="text-xl font-black">Nova Oferta para {selectedProduct?.name}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Título da Oferta</label>
                                <input
                                    type="text"
                                    value={offerName}
                                    onChange={e => setOfferName(e.target.value)}
                                    className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Preço (BRL)</label>
                                <input
                                    type="number"
                                    value={offerPrice}
                                    onChange={e => setOfferPrice(Number(e.target.value))}
                                    className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Link Externo (Opcional)</label>
                                <input
                                    type="text"
                                    value={offerLink}
                                    onChange={e => setOfferLink(e.target.value)}
                                    className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-primary"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowOfferModal(false)} className="flex-1 px-4 py-3 text-sm font-bold text-slate-400">Cancelar</button>
                            <button onClick={handleCreateOffer} className="flex-[2] bg-emerald-500 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20">Criar Oferta</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
