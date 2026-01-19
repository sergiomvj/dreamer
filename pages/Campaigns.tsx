import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

type Project = {
  id: string;
  name: string;
};

type Campaign = {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  strategies: Strategy[];
  channels: Channel[];
};

type Strategy = {
  id: string;
  name: string;
};

type Channel = {
  id: string;
  name: string;
};

const Campaigns: React.FC<{ tenantId?: string | null }> = ({ tenantId }) => {
  // Selections
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [scopeLoading, setScopeLoading] = useState(false);
  const [projectScope, setProjectScope] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDescription, setNewCampaignDescription] = useState('');
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  useEffect(() => {
    if (tenantId) {
      loadClients();
      loadChannels();
    }
  }, [tenantId]);

  useEffect(() => {
    if (selectedClientId) {
      loadProjects(selectedClientId);
    } else {
      setProjects([]);
      setSelectedProjectId('');
    }
  }, [selectedClientId]);

  useEffect(() => {
    if (selectedProjectId) {
      loadProducts(selectedProjectId);
      loadCampaigns(selectedProjectId);
    } else {
      setProducts([]);
      setSelectedProductId('');
      setCampaigns([]);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedProductId) {
      generateProjectScope(selectedProductId);
    } else {
      setProjectScope(null);
    }
  }, [selectedProductId]);

  const loadClients = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const { data, error: loadError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .order('name');
      if (loadError) throw loadError;
      setClients(data || []);
      if (data && data.length > 0) setSelectedClientId(data[0].id);
    } catch (e) {
      setError('Erro ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async (cId: string) => {
    try {
      const { data } = await supabase.from('client_projects').select('id, name').eq('client_id', cId).order('name');
      setProjects(data || []);
      if (data && data.length > 0) setSelectedProjectId(data[0].id);
      else setSelectedProjectId('');
    } catch (e) { console.error(e); }
  };

  const loadProducts = async (pId: string) => {
    try {
      // FILTRO: Apenas ofertas validadas (approved ou force_approved)
      // Nota: O mockup do banco ainda pode estar sendo atualizado, então simulamos o filtro logicamente se necessário
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('client_project_id', pId)
        .in('validation_status', ['approved', 'force_approved'])
        .order('name');

      setProducts(data || []);
      if (data && data.length > 0) setSelectedProductId(data[0].id);
      else setSelectedProductId('');
    } catch (e) { console.error(e); }
  };

  const generateProjectScope = async (prodId: string) => {
    setScopeLoading(true);
    // Simulação de IA gerando o escopo com base no relatório do Lion
    setTimeout(() => {
      setProjectScope({
        title: "Escopo de Execução Prioritário",
        deliverables: [
          "Configuração de Pixel de Conversão na LP",
          "Ativação de Fluxo de Abandono (n8n)",
          "Launch de Criativos Focados em 'Dor de Incompetência'"
        ],
        lionInsight: "Este projeto exige vigilância sobre o CPC. O escopo foca em volume inicial para treinar o algoritmo."
      });
      setScopeLoading(false);
    }, 1500);
  };

  const loadChannels = async () => {
    if (!tenantId) return;
    try {
      const { data, error: loadError } = await supabase
        .from('channels')
        .select('id,name')
        .eq('tenant_id', tenantId);
      if (loadError) throw loadError;
      setChannels((data || []) as Channel[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar canais.');
    }
  };

  const loadStrategies = async (projectId: string) => {
    if (!tenantId) return;
    try {
      const { data, error: loadError } = await supabase
        .from('strategies')
        .select('id,name')
        .eq('tenant_id', tenantId)
        .eq('project_id', projectId);
      if (loadError) throw loadError;
      setStrategies((data || []) as Strategy[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar estratégias.');
    }
  };

  const loadCampaigns = async (pId: string) => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const { data, error: loadError } = await supabase
        .from('campaigns')
        .select(`
          id,
          name,
          description,
          status,
          strategies (id, name),
          channels (id, name)
        `)
        .eq('tenant_id', tenantId)
        .eq('client_project_id', pId) // Usando a nova coluna de hierarquia
        .order('created_at', { ascending: false });
      if (loadError) throw loadError;
      setCampaigns((data || []) as Campaign[]);
    } catch (e) {
      setError('Erro ao carregar campanhas do projeto.');
    } finally {
      setLoading(false);
    }
  };

  const addCampaign = async () => {
    if (!tenantId || !selectedProjectId || !newCampaignName) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Insert the campaign and get its ID
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          tenant_id: tenantId,
          project_id: selectedClientId, // Mantém compatibilidade com legacy se necessário
          client_project_id: selectedProjectId, // Nova Hierarquia
          product_id: selectedProductId, // Oferta Validada
          name: newCampaignName,
          description: newCampaignDescription,
          status: 'draft'
        })
        .select('id')
        .single();

      if (campaignError) throw campaignError;
      if (!campaignData) throw new Error('Falha ao criar a campanha.');

      const campaignId = campaignData.id;

      // 2. Insert into the join table for strategies
      if (selectedStrategies.length > 0) {
        const campaignStrategies = selectedStrategies.map(strategyId => ({
          campaign_id: campaignId,
          strategy_id: strategyId,
        }));
        const { error: strategiesError } = await supabase
          .from('campaign_strategies')
          .insert(campaignStrategies);
        if (strategiesError) throw strategiesError;
      }

      // 3. Insert into the join table for channels
      if (selectedChannels.length > 0) {
        const campaignChannels = selectedChannels.map(channelId => ({
          campaign_id: campaignId,
          channel_id: channelId,
        }));
        const { error: channelsError } = await supabase
          .from('campaign_channels')
          .insert(campaignChannels);
        if (channelsError) throw channelsError;
      }

      setNewCampaignName('');
      setNewCampaignDescription('');
      setSelectedStrategies([]);
      setSelectedChannels([]);
      await loadCampaigns(selectedProjectId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar campanha.');
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId)
        .eq('tenant_id', tenantId);
      if (deleteError) throw deleteError;
      await loadCampaigns(selectedProjectId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao remover campanha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 p-6 bg-background-dark text-white">
      <header className="flex items-center justify-between pb-6 border-b border-border-dark">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">Campanhas</h1>
          <p className="text-slate-400">Orquestre e execute suas estratégias de aquisição.</p>
        </div>
      </header>
      <div className="mt-8 space-y-8">
        {/* Hierarchical Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Cliente</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full bg-surface-dark border border-white/5 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-primary transition-all appearance-none"
            >
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Projeto</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-surface-dark border border-white/5 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-primary transition-all appearance-none disabled:opacity-50"
              disabled={!selectedClientId || projects.length === 0}
            >
              {projects.length === 0 && <option value="">Sem projetos ativos</option>}
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Oferta Validada (Lion)</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-surface-dark border border-white/5 rounded-2xl px-5 py-4 text-primary font-black outline-none focus:border-primary transition-all appearance-none disabled:opacity-50"
              disabled={!selectedProjectId || products.length === 0}
            >
              {products.length === 0 && <option value="">Aguardando validação IA...</option>}
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* Project Scope View (NEW) */}
        {selectedProductId && (
          <div className="bg-primary/5 border border-primary/20 rounded-[32px] p-8 space-y-6 animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <span className="material-symbols-outlined text-[100px] text-primary">token</span>
            </div>
            {scopeLoading ? (
              <div className="flex items-center gap-4 animate-pulse">
                <div className="size-10 bg-primary/20 rounded-full animate-spin"></div>
                <p className="text-sm font-black text-primary uppercase tracking-widest">IA interpretando escopo operacional...</p>
              </div>
            ) : projectScope && (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-white italic tracking-tight">{projectScope.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="size-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vinculado à Oferta: {products.find(p => p.id === selectedProductId)?.name}</p>
                    </div>
                  </div>
                  <button className="bg-primary text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                    Ativar Automações
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Deliverables de Campanha:</p>
                    <ul className="space-y-2">
                      {projectScope.deliverables.map((d: string, i: number) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-slate-200 font-medium">
                          <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-black/20 p-6 rounded-3xl border border-white/5 space-y-2 self-start">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Lion Intel:</p>
                    <p className="text-xs text-slate-400 font-medium italic leading-relaxed">"{projectScope.lionInsight}"</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className={`transition-opacity duration-500 ${selectedProjectId ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form to Add Campaign */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-surface-dark/50 border border-border-dark rounded-2xl p-6">
                <h3 className="text-xl font-black tracking-tighter mb-4">Nova Campanha</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nome da Campanha</label>
                    <input
                      value={newCampaignName}
                      onChange={(e) => setNewCampaignName(e.target.value)}
                      className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-slate-200 focus:ring-primary focus:border-primary"
                      placeholder="Ex: Lançamento do Produto X"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Descrição</label>
                    <textarea
                      value={newCampaignDescription}
                      onChange={(e) => setNewCampaignDescription(e.target.value)}
                      className="w-full bg-surface-dark border border-border-dark rounded-xl p-4 text-slate-200 min-h-[100px]"
                      placeholder="Descreva o objetivo principal desta campanha."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Estratégias Associadas</label>
                    <div className="bg-surface-dark border border-border-dark rounded-xl p-4 max-h-40 overflow-y-auto space-y-2">
                      {strategies.length > 0 ? strategies.map(strategy => (
                        <div key={strategy.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`strategy-${strategy.id}`}
                            checked={selectedStrategies.includes(strategy.id)}
                            onChange={() => {
                              setSelectedStrategies(prev =>
                                prev.includes(strategy.id)
                                  ? prev.filter(id => id !== strategy.id)
                                  : [...prev, strategy.id]
                              );
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor={`strategy-${strategy.id}`} className="ml-3 text-sm text-slate-300">
                            {strategy.name}
                          </label>
                        </div>
                      )) : <p className="text-xs text-slate-500">Nenhuma estratégia encontrada para este projeto.</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Canais de Distribuição</label>
                    <div className="bg-surface-dark border border-border-dark rounded-xl p-4 max-h-40 overflow-y-auto space-y-2">
                      {channels.length > 0 ? channels.map(channel => (
                        <div key={channel.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`channel-${channel.id}`}
                            checked={selectedChannels.includes(channel.id)}
                            onChange={() => {
                              setSelectedChannels(prev =>
                                prev.includes(channel.id)
                                  ? prev.filter(id => id !== channel.id)
                                  : [...prev, channel.id]
                              );
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor={`channel-${channel.id}`} className="ml-3 text-sm text-slate-300">
                            {channel.name}
                          </label>
                        </div>
                      )) : <p className="text-xs text-slate-500">Nenhum canal encontrado.</p>}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={addCampaign}
                      disabled={loading || !newCampaignName}
                      className="bg-primary hover:bg-blue-600 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                      {loading ? 'Criando...' : 'Criar Campanha'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* List of Campaigns */}
            <div className="lg:col-span-2 space-y-4">
              {campaigns.map((c) => (
                <div key={c.id} className="bg-surface-dark/30 border border-border-dark rounded-xl p-5">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <p className="font-bold text-lg">{c.name}</p>
                      <div className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 inline-block">
                        <span className="font-bold">Status:</span> {c.status || 'draft'}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteCampaign(c.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                  <div className="mt-4 text-sm text-slate-400">
                    <p>{c.description || 'Sem descrição.'}</p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="border-t border-border-dark pt-3">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Estratégias</h4>
                      <div className="flex flex-wrap gap-2">
                        {c.strategies && c.strategies.map(s => (
                          <div key={s.id} className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1">
                            {s.name}
                          </div>
                        ))}
                        {(!c.strategies || c.strategies.length === 0) && (
                          <p className="text-xs text-slate-500">Nenhuma.</p>
                        )}
                      </div>
                    </div>
                    <div className="border-t border-border-dark pt-3">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Canais</h4>
                      <div className="flex flex-wrap gap-2">
                        {c.channels && c.channels.map(ch => (
                          <div key={ch.id} className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1">
                            {ch.name}
                          </div>
                        ))}
                        {(!c.channels || c.channels.length === 0) && (
                          <p className="text-xs text-slate-500">Nenhum.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {campaigns.length === 0 && !loading && (
                <div className="text-center py-12 text-slate-500">
                  <span className="material-symbols-outlined text-5xl">campaign</span>
                  <p className="mt-4 font-bold">Nenhuma campanha encontrada</p>
                  <p className="text-sm">Crie a primeira campanha para este projeto.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Campaigns;
