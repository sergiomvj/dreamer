
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface Alternative {
    id: string;
    name: string;
    description: string;
    friction: 'Low' | 'Medium' | 'High';
    ticket: number;
    priority: 'Alta' | 'Média' | 'Baixa';
    isRegistered: boolean;
}

interface Props {
    tenantId: string | null;
}

const StrategicPlanning: React.FC<Props> = ({ tenantId }) => {
    const [activeSubTab, setActiveSubTab] = useState<'maturity' | 'products' | 'audience' | 'orchestrator'>('maturity');
    const [loading, setLoading] = useState(false);
    const [showNewModal, setShowNewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [lionEvaluation, setLionEvaluation] = useState<any>(null);
    const [editingAlt, setEditingAlt] = useState<Alternative | null>(null);

    // States for selections from DB
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

    const [currentStage, setCurrentStage] = useState<string | null>('Validação');
    const [salesModel, setSalesModel] = useState<string | null>('Consultiva');

    useEffect(() => {
        if (tenantId) fetchProjects();
    }, [tenantId]);

    useEffect(() => {
        if (selectedProjectId) fetchProducts(selectedProjectId);
    }, [selectedProjectId]);

    useEffect(() => {
        if (selectedProductId) loadProductReport(selectedProductId);
    }, [selectedProductId]);

    const fetchProjects = async () => {
        const { data } = await supabase.from('client_projects').select('*, client_id').order('name');
        setProjects(data || []);
        if (data?.[0]) setSelectedProjectId(data[0].id);
    };

    const fetchProducts = async (pId: string) => {
        const { data } = await supabase.from('products').select('*').eq('client_project_id', pId).order('name');
        setProducts(data || []);
        if (data?.[0]) setSelectedProductId(data[0].id);
    };

    const loadProductReport = async (pId: string) => {
        const { data } = await supabase.from('products').select('lion_report, validation_status').eq('id', pId).single();
        if (data?.lion_report && Object.keys(data.lion_report).length > 0) {
            setLionEvaluation(data.lion_report);
        }
    };

    const [alternatives, setAlternatives] = useState<Alternative[]>([
        { id: '1', name: 'Aceleração Mentoria Premium', description: 'Programa de acompanhamento 1-on-1 para escala.', friction: 'High', ticket: 5000, priority: 'Alta', isRegistered: true },
        { id: '2', name: 'Workshop de Tráfego Pago', description: 'Evento ao vivo de 2 dias sobre Facebook Ads.', friction: 'Medium', ticket: 497, priority: 'Média', isRegistered: false },
    ]);

    const [newAlt, setNewAlt] = useState<Partial<Alternative>>({
        name: '',
        description: '',
        friction: 'Medium',
        ticket: 0,
        priority: 'Média'
    });

    const subTabs = [
        { id: 'maturity', label: 'Visão Estratégica', icon: 'visibility' },
        { id: 'products', label: 'Alternativas de Comercialização', icon: 'inventory' },
        { id: 'audience', label: 'Público & Consciência', icon: 'groups' },
        { id: 'orchestrator', label: 'Orquestrador', icon: 'account_tree' },
    ];

    const runLionValidation = async () => {
        if (!selectedProductId) return alert('Selecione uma Oferta/Produto para validar.');
        setIsValidating(true);

        setTimeout(async () => {
            const evaluation = {
                score: 84,
                critique: "A fricção está alta para o ticket médio proposto. Recomendo um downsell imediato se a taxa de conversão na LP for inferior a 1.2%. O Lion não tolera desperdício de tráfego.",
                verdict: "PONTOS DE ATENÇÃO DETECTADOS",
                status: 'rejected',
                recommendations: [
                    "Reduzir ticket ou aumentar bônus de entrega imediata.",
                    "Implementar pré-checkout com vídeo de 2 minutos focado em prova social.",
                    "Ajustar prioridade estratégica devido ao LTV projetado."
                ]
            };

            setLionEvaluation(evaluation);

            await supabase.from('products').update({
                validation_status: evaluation.status,
                lion_report: evaluation,
                validation_at: new Date().toISOString()
            }).eq('id', selectedProductId);

            setIsValidating(false);
        }, 3000);
    };

    const handleForceApproval = async () => {
        if (!selectedProductId) return;
        setIsValidating(true);
        setTimeout(async () => {
            const evaluation = {
                score: 60,
                critique: "Aprovação forçada pelo operador. O Lion exige estas travas de segurança para viabilizar a operação com risco mitigado.",
                verdict: "APROVADO COM RESSALVAS CRÍTICAS",
                status: 'force_approved',
                recommendations: [
                    "Budget diário limitado a R$ 50 nos primeiros 7 dias.",
                    "Pausa automática se o CPC ultrapassar R$ 4.50.",
                    "Obrigatório acompanhamento em tempo real das sessões na LP."
                ]
            };

            setLionEvaluation(evaluation);

            await supabase.from('products').update({
                validation_status: evaluation.status,
                lion_report: evaluation,
                validation_at: new Date().toISOString()
            }).eq('id', selectedProductId);

            setIsValidating(false);
        }, 2000);
    };

    const confirmValidation = async (status: string) => {
        if (!tenantId || !lionEvaluation || !selectedProductId) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('products').update({
                validation_status: status === 'rejected' ? 'approved' : status,
                lion_report: lionEvaluation,
                validation_at: new Date().toISOString()
            }).eq('id', selectedProductId);

            if (error) throw error;
            alert(`Estratégia salva e validada com sucesso!`);
            setLionEvaluation(null);
        } catch (e: any) {
            alert('Erro ao salvar validação: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const addAlternative = () => {
        if (!newAlt.name) return;
        const alt: Alternative = {
            id: Math.random().toString(36).substr(2, 9),
            name: newAlt.name || '',
            description: newAlt.description || '',
            friction: (newAlt.friction as any) || 'Medium',
            ticket: newAlt.ticket || 0,
            priority: (newAlt.priority as any) || 'Média',
            isRegistered: false
        };
        setAlternatives([...alternatives, alt]);
        setShowNewModal(false);
        setNewAlt({ name: '', description: '', friction: 'Medium', ticket: 0, priority: 'Média' });
    };

    const handleEditAlt = (alt: Alternative) => {
        setEditingAlt(alt);
        setShowEditModal(true);
    };

    const updateAlternative = () => {
        if (!editingAlt) return;
        setAlternatives(alternatives.map(a => a.id === editingAlt.id ? editingAlt : a));
        setShowEditModal(false);
        setEditingAlt(null);
    };

    const deleteAlternative = (id: string) => {
        if (confirm('Deseja realmente excluir esta alternativa estratégica?')) {
            setAlternatives(alternatives.filter(a => a.id !== id));
        }
    };

    const registerAsProduct = async (alt: Alternative) => {
        if (!tenantId || !selectedProjectId) return alert('Selecione um projeto antes de registrar.');
        setLoading(true);
        try {
            // Find the parent client_id (project_id) from our projects list
            const parentProject = projects.find(p => p.id === selectedProjectId);
            const clientId = parentProject?.client_id;

            if (!clientId) throw new Error('Client ID não encontrado para o projeto selecionado.');

            const { data, error } = await supabase.from('products').insert({
                tenant_id: tenantId,
                client_project_id: selectedProjectId,
                project_id: clientId,
                name: alt.name,
                description: alt.description,
                friction_level: alt.friction.toLowerCase(),
                offer_type: 'core'
            }).select().single();

            if (!error && data) {
                setProducts([...products, data]);
                setSelectedProductId(data.id);
                setAlternatives(prev => prev.map(a => a.id === alt.id ? { ...a, isRegistered: true } : a));
                alert('Alternativa registrada com sucesso!');
            } else if (error) {
                throw error;
            }
        } catch (e: any) {
            alert('Erro ao registrar produto: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Modal Lion Guavamango */}
            {isValidating && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in zoom-in duration-500">
                    <div className="flex flex-col items-center space-y-8 max-w-md text-center">
                        <div className="size-48 bg-primary/20 rounded-full flex items-center justify-center border-4 border-primary/30 animate-pulse">
                            <span className="material-symbols-outlined text-8xl text-primary font-black">token</span>
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Lion Guavamango está avaliando...</h2>
                            <p className="text-slate-400 font-medium">Ele analisa fria e criteriosamente cada detalhe da sua estratégia comercial.</p>
                        </div>
                    </div>
                </div>
            )}

            {lionEvaluation && (
                <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-surface-dark border-2 border-primary/30 w-full max-w-2xl rounded-[40px] p-10 shadow-2xl space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <span className="material-symbols-outlined text-[120px] text-primary">token</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">Veredito do Especialista</span>
                                <span className="text-slate-500 font-black text-[10px] uppercase">Lion Guavamango v1.0</span>
                            </div>
                            <h3 className="text-4xl font-black text-white italic">{lionEvaluation.verdict}</h3>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-1">
                                <p className="text-[10px] font-black text-slate-500 uppercase">Score Lion</p>
                                <p className="text-3xl font-black text-primary">{lionEvaluation.score}/100</p>
                            </div>
                            <div className="col-span-2 bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                                <p className="text-sm text-slate-300 font-medium leading-relaxed italic">"{lionEvaluation.critique}"</p>
                                <div className="space-y-2 pt-2 border-t border-white/5">
                                    <p className="text-[10px] font-black text-slate-500 uppercase">Sugestões:</p>
                                    <ul className="space-y-1">
                                        {lionEvaluation.recommendations?.map((r: string, idx: number) => (
                                            <li key={idx} className="text-xs text-primary/80 font-bold flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[14px]">bolt</span> {r}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            {lionEvaluation.status === 'rejected' ? (
                                <>
                                    <button onClick={() => setLionEvaluation(null)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/10 transition-all">Realinhar Estratégia</button>
                                    <button onClick={handleForceApproval} className="flex-1 py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-rose-500/20 transition-all flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-sm">warning</span> Forçar Aprovação
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setLionEvaluation(null)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/10 transition-all">Sair</button>
                                    <button onClick={() => confirmValidation(lionEvaluation.status)} className="flex-1 py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/25 transition-all">Aceitar e Persistir</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Nova/Edição Alternativa omitido por brevidade se necessário, mas mantendo para consistência */}
            {showNewModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background-dark/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-surface-dark border border-border-dark w-full max-w-lg rounded-3xl p-8 shadow-2xl space-y-6">
                        <h3 className="text-2xl font-black text-white italic">Nova Alternativa</h3>
                        <div className="space-y-4">
                            <input type="text" value={newAlt.name} onChange={e => setNewAlt({ ...newAlt, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" placeholder="Nome" />
                            <textarea value={newAlt.description} onChange={e => setNewAlt({ ...newAlt, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none h-24" placeholder="Descrição" />
                        </div>
                        <button onClick={addAlternative} className="w-full bg-primary py-4 rounded-2xl font-black text-white uppercase text-[10px] tracking-widest">Criar Alternativa</button>
                    </div>
                </div>
            )}

            {/* HEADER DA PÁGINA COM SELETORES */}
            <div className="relative overflow-hidden bg-surface-dark border border-border-dark p-8 rounded-3xl space-y-4 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                                Strategic Core v2.0
                            </div>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-white">Gestão Estratégica</h1>
                        <p className="text-slate-400 max-w-2xl font-medium leading-relaxed">
                            Supervisão do <span className="text-primary font-black italic ml-1">Lion Guavamango</span>.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => selectedProductId && loadProductReport(selectedProductId)} disabled={!selectedProductId} className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 disabled:opacity-30">
                            Histórico
                        </button>
                        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 text-xs font-black">
                            <select value={selectedProjectId || ''} onChange={(e) => setSelectedProjectId(e.target.value)} className="bg-transparent border-none text-slate-400 uppercase outline-none cursor-pointer max-w-[120px]">
                                <option value="">Projeto...</option>
                                {projects.map(p => <option key={p.id} value={p.id} className="bg-surface-dark">{p.name}</option>)}
                            </select>
                            <div className="w-[1px] h-4 bg-white/10"></div>
                            <select value={selectedProductId || ''} onChange={(e) => setSelectedProductId(e.target.value)} className="bg-transparent border-none text-primary uppercase outline-none cursor-pointer max-w-[120px]">
                                <option value="">Oferta...</option>
                                {products.map(p => <option key={p.id} value={p.id} className="bg-surface-dark">{p.name}</option>)}
                            </select>
                        </div>
                        <button onClick={runLionValidation} className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-xl text-xs font-black shadow-lg shadow-primary/25 flex items-center gap-4 group uppercase tracking-widest transition-all">
                            Avaliar com Lion
                            <span className="material-symbols-outlined text-md group-hover:rotate-12 transition-transform">token</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-8 border-t border-white/5 relative z-10 overflow-x-auto">
                    {subTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeSubTab === tab.id ? 'bg-primary/15 text-primary border border-primary/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="grid grid-cols-1 gap-8">
                {activeSubTab === 'maturity' && <MaturityView currentStage={currentStage} setCurrentStage={setCurrentStage} salesModel={salesModel} setSalesModel={setSalesModel} />}
                {activeSubTab === 'products' && <AlternativesView alternatives={alternatives} registerAsProduct={registerAsProduct} setShowNewModal={setShowNewModal} deleteAlternative={deleteAlternative} handleEditAlt={handleEditAlt} />}
                {activeSubTab === 'audience' && <AudienceMappingView alternatives={alternatives} />}
                {activeSubTab === 'orchestrator' && <OrchestratorView />}
            </div>
        </div>
    );
};

// --- SUB-VIEWS components as simple functions for clean file structure ---

const MaturityView = ({ currentStage, setCurrentStage, salesModel, setSalesModel }: any) => (
    <div className="bg-surface-dark border border-border-dark p-8 rounded-3xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white">Maturidade do Negócio</h2>
            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-xl border border-emerald-500/20 text-[10px] font-black uppercase">
                <span className="size-2 bg-emerald-500 rounded-full animate-pulse"></span> IA Ativa
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Estágio Atual</label>
                <div className="grid grid-cols-1 gap-3">
                    {['Validação (Buscando PMF)', 'Crescimento (Escalando Canais)', 'Escala (Otimização e LTV)'].map(stage => (
                        <button key={stage} onClick={() => setCurrentStage(stage)} className={`p-5 rounded-2xl border text-left transition-all ${currentStage === stage ? 'border-primary bg-primary/10 text-white' : 'border-border-dark bg-white/5 text-slate-400 hover:border-white/20'}`}>
                            {stage}
                        </button>
                    ))}
                </div>
            </div>
            <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Modelo de Venda</label>
                <div className="grid grid-cols-1 gap-3">
                    {['Escalável (LP / Tráfego Direto)', 'VSL / Webinário', 'Consultiva (High-Touch)', 'Recorrente (SaaS/Assinatura)'].map(model => (
                        <button key={model} onClick={() => setSalesModel(model)} className={`p-5 rounded-2xl border text-left transition-all ${salesModel === model ? 'border-primary bg-primary/10 text-white' : 'border-border-dark bg-white/5 text-slate-400 hover:border-white/20'}`}>
                            {model}
                        </button>
                    ))}
                </div>
            </div>
        </div>
        <div className="bg-primary/5 border border-primary/10 p-6 rounded-2xl flex items-start gap-4">
            <span className="material-symbols-outlined text-primary p-2 bg-primary/20 rounded-lg">psychology</span>
            <div className="space-y-1">
                <h4 className="text-sm font-black text-white text-primary">Análise da IA:</h4>
                <p className="text-sm text-slate-400 italic">"Configuração em {salesModel} exige nutrição acelerada."</p>
            </div>
        </div>
    </div>
);

const AlternativesView = ({ alternatives, registerAsProduct, setShowNewModal, deleteAlternative, handleEditAlt }: any) => (
    <div className="bg-surface-dark border border-border-dark p-8 rounded-3xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white italic">Arquitetura de Ofertas</h2>
            <button onClick={() => setShowNewModal(true)} className="bg-primary text-white border border-primary/20 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">add_circle</span> Nova Alternativa
            </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {alternatives.map((alt: Alternative) => (
                <div key={alt.id} className="bg-white/5 border border-white/5 p-8 rounded-3xl space-y-6 hover:bg-white/10 transition-all group relative overflow-hidden">
                    <div className="flex items-start justify-between">
                        <div className="size-14 bg-primary/20 rounded-2xl flex items-center justify-center text-3xl text-primary shadow-xl">
                            <span className="material-symbols-outlined">{alt.friction === 'High' ? 'diamond' : 'package_2'}</span>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-2 mb-1">
                                <button onClick={() => handleEditAlt(alt)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-all"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                                <button onClick={() => deleteAlternative(alt.id)} className="p-2 bg-white/5 hover:bg-rose-500/20 rounded-lg text-slate-500 hover:text-rose-500 transition-all"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                            </div>
                            <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[9px] font-black uppercase border border-emerald-500/20">{alt.priority} Prioridade</span>
                            {alt.isRegistered && <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[9px] font-black uppercase border border-primary/20 italic">Registrado</span>}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors italic">{alt.name}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">{alt.description}</p>
                    </div>
                    {!alt.isRegistered && (
                        <button onClick={() => registerAsProduct(alt)} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest transition-all hover:border-primary/50">
                            Adicionar ao Cadastro
                        </button>
                    )}
                </div>
            ))}
        </div>
    </div>
);

const AudienceMappingView = ({ alternatives }: any) => {
    const [selectedAltId, setSelectedAltId] = useState<string>(alternatives?.[0]?.id || '');
    return (
        <div className="bg-surface-dark border border-border-dark p-8 rounded-3xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-white italic">Mapeamento de Jornada</h2>
                <select value={selectedAltId} onChange={e => setSelectedAltId(e.target.value)} className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs font-black text-primary outline-none uppercase">
                    {alternatives.map((alt: any) => <option key={alt.id} value={alt.id}>{alt.name}</option>)}
                </select>
            </div>
            <div className="space-y-4">
                {['Inconsciente', 'Consciente do Problema', 'Consciente da Solução', 'Consciente do Produto'].map((lvl, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/5 p-6 rounded-3xl flex items-center justify-between gap-6 hover:bg-white/10 transition-all border-l-4 border-l-primary/30">
                        <h4 className="font-black text-white text-sm">{lvl}</h4>
                        <button className="px-6 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase border border-primary/20">Mapear Dores</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const OrchestratorView = () => (
    <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-white/10 rounded-3xl space-y-8 bg-surface-dark animate-in fade-in duration-700">
        <div className="bg-primary/20 p-8 rounded-full border border-primary/30 animate-pulse"><span className="material-symbols-outlined text-6xl text-primary font-black">rocket_launch</span></div>
        <div className="text-center space-y-3">
            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Gerar Blueprint v1.0</h3>
            <p className="text-slate-500 max-w-sm text-sm font-medium">O Lion Guavamango travará a estratégia e publicará no orquestrador n8n.</p>
        </div>
        <button className="bg-primary text-white px-12 py-5 rounded-2xl font-black shadow-2xl shadow-primary/40 hover:scale-105 transition-all uppercase tracking-widest text-xs">Publicar Operação</button>
    </div>
);

export default StrategicPlanning;
