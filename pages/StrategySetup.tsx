
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const StrategySetup: React.FC<{ tenantId?: string | null }> = ({ tenantId }) => {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clients (Legacy Projects Table)
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);

  // Projects (New Table client_projects)
  const [projects, setProjects] = useState<any[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);

  // Products
  const [products, setProducts] = useState<any[]>([]);
  const [productId, setProductId] = useState<string | null>(null);

  // Diagnostic
  const [diagnostic, setDiagnostic] = useState<any>(null);

  // Modal States
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [newName, setNewName] = useState('');

  const loadClients = async () => {
    if (!tenantId) return;
    const { data } = await supabase.from('projects').select('*').eq('tenant_id', tenantId).order('name');
    setClients(data || []);
  };

  const loadProjects = async (cId: string) => {
    const { data } = await supabase.from('client_projects').select('*').eq('client_id', cId).order('name');
    setProjects(data || []);
  };

  const loadProducts = async (pId: string) => {
    const { data } = await supabase.from('products').select('*').eq('client_project_id', pId).order('name');
    setProducts(data || []);
  };

  useEffect(() => {
    if (tenantId) loadClients();
  }, [tenantId]);

  const handleCreateClient = async () => {
    if (!newName || !tenantId) return;
    const { data, error } = await supabase.from('projects').insert({ name: newName, tenant_id: tenantId }).select().single();
    if (!error && data) {
      setClients([...clients, data]);
      setClientId(data.id);
      loadProjects(data.id);
      setStep(1);
      setShowCreateClient(false);
      setNewName('');
    }
  };

  const handleCreateProject = async () => {
    if (!clientId || !newName) return;
    const { data, error } = await supabase.from('client_projects').insert({ client_id: clientId, name: newName }).select().single();
    if (!error && data) {
      setProjects([...projects, data]);
      setProjectId(data.id);
      loadProducts(data.id);
      setStep(2);
      setShowCreateProject(false);
      setNewName('');
    }
  };

  const handleCreateProduct = async () => {
    if (!projectId || !tenantId || !newName) return;
    const { data, error } = await supabase.from('products').insert({ client_project_id: projectId, name: newName, tenant_id: tenantId }).select().single();
    if (!error && data) {
      setProducts([...products, data]);
      setProductId(data.id);
      setStep(3);
      runLionDiagnostic();
      setShowCreateProduct(false);
      setNewName('');
    }
  };

  const runLionDiagnostic = async () => {
    if (!productId) return;
    setLoading(true);
    // Simulação do Diagnóstico do Lion Guavamango
    setTimeout(async () => {
      const result = {
        risk: 'Alto (Fricção vs Ticket)',
        potential: 'Moderado',
        status: 'rejected',
        recommendations: [
          'O ticket proposto exige um nível de consciência "Produto" que não foi mapeado.',
          'Sua página de vendas atual (Lighthouse < 40) causará evasão de 60% do tráfego pago.',
          'Ausência de upsell imediato reduz o ROAS esperado para níveis insustentáveis.'
        ],
        buttons: ['Gerar Script WhatsApp', 'Exportar Blueprint', 'Ativar Radar', 'Notificar Equipe']
      };

      setDiagnostic(result);

      // Persistir no Banco
      await supabase.from('products').update({
        validation_status: result.status,
        lion_report: result
      }).eq('id', productId);

      setLoading(false);
    }, 2000);
  };

  const handleForceApproval = async () => {
    if (!productId) return;
    setLoading(true);
    setTimeout(async () => {
      const result = {
        risk: 'Controlado (Travas Ativas)',
        potential: 'Seguro p/ Teste',
        status: 'force_approved',
        recommendations: [
          'Budget diário limitado a R$ 50 para mitigar risco de queima de caixa.',
          'Pausa automática configurada para CPC > R$ 3.50.',
          'Obrigatório VSL de 3 minutos no topo da página para elevar consciência.'
        ],
        buttons: ['Ativar Travas n8n', 'Exportar Blueprint Seguro', 'Notificar Equipe']
      };
      setDiagnostic(result);

      await supabase.from('products').update({
        validation_status: result.status,
        lion_report: result
      }).eq('id', productId);

      setLoading(false);
    }, 1500);
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Modals for Creation */}
      {(showCreateClient || showCreateProject || showCreateProduct) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-surface-dark border border-white/10 w-full max-w-md rounded-[32px] p-8 shadow-2xl space-y-6">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white italic tracking-tight">
                {showCreateClient && 'Novo Cliente'}
                {showCreateProject && 'Novo Projeto'}
                {showCreateProduct && 'Nova Oferta'}
              </h3>
              <p className="text-slate-500 text-sm">Insira o nome para formalizar no ecossistema.</p>
            </div>
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome oficial..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-primary transition-all font-bold"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowCreateClient(false); setShowCreateProject(false); setShowCreateProduct(false); setNewName(''); }}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (showCreateClient) handleCreateClient();
                  if (showCreateProject) handleCreateProject();
                  if (showCreateProduct) handleCreateProduct();
                }}
                className="flex-1 py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="size-8 bg-primary/20 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">token</span>
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lion Guavamango Hub</span>
          </div>
          <h2 className="text-3xl font-black text-white italic">Gestão de Clientes & Estratégias</h2>
        </div>
        <div className="flex gap-2 bg-white/5 p-2 rounded-full border border-white/5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`size-2.5 rounded-full transition-all duration-500 ${step >= i ? 'bg-primary shadow-lg shadow-primary/40' : 'bg-white/10'}`}></div>
          ))}
        </div>
      </div>

      {/* Steps Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <button onClick={() => setStep(0)} className={`p-4 rounded-2xl border text-left transition-all ${step === 0 ? 'border-primary bg-primary/10 shadow-lg' : 'border-border-dark bg-white/5 hover:border-white/20'}`}>
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Passo 1</p>
          <p className="font-black text-white text-xs tracking-tight">DEFINIR CLIENTE</p>
        </button>
        <button onClick={() => setStep(1)} disabled={!clientId} className={`p-4 rounded-2xl border text-left transition-all ${step === 1 ? 'border-primary bg-primary/10 shadow-lg' : 'border-border-dark bg-white/5 opacity-50'}`}>
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Passo 2</p>
          <p className="font-black text-white text-xs tracking-tight">DEFINIR PROJETO</p>
        </button>
        <button onClick={() => setStep(2)} disabled={!projectId} className={`p-4 rounded-2xl border text-left transition-all ${step === 2 ? 'border-primary bg-primary/10 shadow-lg' : 'border-border-dark bg-white/5 opacity-50'}`}>
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Passo 3</p>
          <p className="font-black text-white text-xs tracking-tight">PRODUTO / OFERTA</p>
        </button>
        <button onClick={() => { setStep(3); if (!diagnostic) runLionDiagnostic(); }} disabled={!productId} className={`p-4 rounded-2xl border text-left transition-all ${step >= 3 ? 'border-primary bg-primary/10 shadow-lg' : 'border-border-dark bg-white/5 opacity-50'}`}>
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Passo 4 & 5</p>
          <p className="font-black text-white text-xs tracking-tight">ESTRATÉGIA & DIAGNÓSTICO</p>
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-surface-dark border border-border-dark rounded-3xl p-8 shadow-2xl relative overflow-hidden min-h-[400px]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32 rounded-full"></div>

        {step === 0 && (
          <div className="space-y-6 relative z-10">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Selecione o Cliente</h3>
                <p className="text-slate-500 text-sm">O cliente é a entidade raiz de faturamento e governança.</p>
              </div>
              <button onClick={() => setShowCreateClient(true)} className="bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">add</span> Novo Cliente
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {clients.map(c => (
                <button key={c.id} onClick={() => { setClientId(c.id); loadProjects(c.id); setStep(1); }} className={`p-6 rounded-2xl border text-left transition-all group ${clientId === c.id ? 'border-primary bg-primary/5' : 'border-white/5 bg-white/5 hover:border-white/10'}`}>
                  <p className="font-black text-white group-hover:text-primary transition-colors">{c.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase mt-2 tracking-widest">{c.niche || 'Geral'}</p>
                </button>
              ))}
              {clients.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 font-medium italic border border-dashed border-white/10 rounded-2xl">
                  Nenhum cliente cadastrado neste workspace.
                </div>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 relative z-10">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Selecione o Projeto</h3>
                <p className="text-slate-500 text-sm">Um cliente pode ter múltiplos projetos independentes.</p>
              </div>
              <button onClick={() => setShowCreateProject(true)} className="bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">add</span> Novo Projeto
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.map(p => (
                <button key={p.id} onClick={() => { setProjectId(p.id); loadProducts(p.id); setStep(2); }} className={`p-6 rounded-2xl border text-left transition-all group ${projectId === p.id ? 'border-primary bg-primary/5' : 'border-white/5 bg-white/5 hover:border-white/10'}`}>
                  <p className="font-black text-white group-hover:text-primary transition-colors">{p.name}</p>
                  <p className="text-[10px] text-emerald-500 uppercase mt-2 tracking-widest">{p.status}</p>
                </button>
              ))}
              {projects.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 font-medium italic border border-dashed border-white/10 rounded-2xl">
                  Este cliente ainda não possui projetos ativos.
                </div>
              )}
            </div>
            <button onClick={() => setStep(0)} className="text-xs font-bold text-slate-500 hover:text-white flex items-center gap-2 transition-colors">
              <span className="material-symbols-outlined text-sm">arrow_back</span> Mudar Cliente
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 relative z-10">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Selecione o Produto / Oferta</h3>
                <p className="text-slate-500 text-sm">A oferta é o que será vendido neste projeto específico.</p>
              </div>
              <button onClick={() => setShowCreateProduct(true)} className="bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">add</span> Nova Oferta
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.map(p => (
                <button key={p.id} onClick={() => { setProductId(p.id); setStep(3); runLionDiagnostic(); }} className={`p-6 rounded-2xl border text-left transition-all group ${productId === p.id ? 'border-primary bg-primary/5' : 'border-white/5 bg-white/5 hover:border-white/10'}`}>
                  <p className="font-black text-white group-hover:text-primary transition-colors">{p.name}</p>
                  <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest">{p.offer_type || 'Core Product'}</p>
                </button>
              ))}
              {products.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 font-medium italic border border-dashed border-white/10 rounded-2xl">
                  Nenhuma oferta vinculada a este projeto.
                </div>
              )}
            </div>
            <button onClick={() => setStep(1)} className="text-xs font-bold text-slate-500 hover:text-white flex items-center gap-2 transition-colors">
              <span className="material-symbols-outlined text-sm">arrow_back</span> Mudar Projeto
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white italic tracking-tighter">Diagnóstico Lion Guavamango</h3>
                <p className="text-slate-400 text-sm font-medium">Análise fria e criteriosa da viabilidade estratégica.</p>
              </div>
              <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl border border-primary/20 text-[10px] font-black uppercase">
                Protocolo de Onboarding v1.4
              </div>
            </div>

            {loading ? (
              <div className="p-20 flex flex-col items-center gap-6 animate-pulse">
                <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center border-4 border-primary/20 animate-spin">
                  <span className="material-symbols-outlined text-4xl text-primary">token</span>
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-primary font-black uppercase text-xs tracking-widest">Processando DNA Comercial...</p>
                  <p className="text-slate-600 text-[10px] font-bold uppercase">Aguarde a análise do especialista</p>
                </div>
              </div>
            ) : diagnostic && (
              <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 space-y-6 hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="size-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-3xl">analytics</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Risco Estratégico</p>
                        <p className="text-3xl font-black text-white">{diagnostic.risk}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Observações do Lion:</p>
                      <ul className="space-y-3">
                        {diagnostic.recommendations.map((r: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-slate-300 font-medium">
                            <span className="material-symbols-outlined text-primary text-sm mt-0.5">check_circle</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 space-y-6 hover:border-emerald-500/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="size-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-3xl">trending_up</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Potencial de Escala</p>
                        <p className="text-3xl font-black text-emerald-500">{diagnostic.potential}</p>
                      </div>
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                      <p className="text-sm text-slate-400 font-medium italic leading-relaxed">
                        "Este modelo apresenta baixa saturação no nicho atual. O custo por lead qualificado tende a se manter estável por ao menos 90 dias após o kickoff."
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confidence Score</span>
                      <span className="text-sm font-black text-white">94%</span>
                    </div>
                  </div>
                </div>

                <div className="pt-10 border-t border-white/5 space-y-8">
                  <div className="text-center space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {diagnostic.status === 'rejected' ? 'Decisão do Operador' : 'Ações Operacionais Disponíveis'}
                    </p>
                    <p className="text-sm text-slate-400">
                      {diagnostic.status === 'rejected' ? 'O Lion não recomenda este setup. Escolha um caminho:' : 'Implemente as sugestões do Lion com um clique.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4">
                    {diagnostic.status === 'rejected' ? (
                      <>
                        <button onClick={() => setStep(2)} className="bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-3">
                          <span className="material-symbols-outlined text-md">edit</span> Realinhar Estratégia
                        </button>
                        <button onClick={handleForceApproval} className="bg-rose-500/10 hover:bg-rose-500 text-white border border-rose-500/20 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-rose-500/20 flex items-center gap-3 group">
                          <span className="material-symbols-outlined text-md group-hover:rotate-12 transition-transform">warning</span> Forçar Aprovação
                        </button>
                      </>
                    ) : (
                      diagnostic.buttons.map((b: string) => (
                        <button key={b} className="bg-white/5 hover:bg-primary hover:text-white border border-white/10 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl hover:shadow-primary/20 flex items-center gap-3 group">
                          <span className="material-symbols-outlined text-md group-hover:scale-110 transition-transform">bolt</span>
                          {b}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {!loading && (
              <button onClick={() => setStep(2)} className="text-xs font-bold text-slate-500 hover:text-white flex items-center gap-2 transition-colors">
                <span className="material-symbols-outlined text-sm">arrow_back</span> Mudar Oferta
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategySetup;
