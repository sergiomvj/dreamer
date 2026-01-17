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
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for the new campaign form
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDescription, setNewCampaignDescription] = useState('');
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  useEffect(() => {
    if (tenantId) {
      loadProjects();
      loadChannels();
    }
  }, [tenantId]);

  useEffect(() => {
    if (selectedProjectId) {
      loadCampaigns(selectedProjectId);
      loadStrategies(selectedProjectId);
    } else {
      setCampaigns([]);
      setStrategies([]);
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const { data, error: loadError } = await supabase
        .from('projects')
        .select('id,name')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      if (loadError) throw loadError;
      setProjects((data || []) as Project[]);
      if (data && data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar projetos.');
    } finally {
      setLoading(false);
    }
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

  const loadCampaigns = async (projectId: string) => {
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
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (loadError) throw loadError;
      setCampaigns((data || []) as Campaign[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar campanhas.');
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
          project_id: selectedProjectId,
          name: newCampaignName,
          description: newCampaignDescription,
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
        {/* Project Selector */}
        <div className="max-w-md">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Projeto Ativo</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-slate-200 focus:ring-primary focus:border-primary"
            disabled={loading || projects.length === 0}
          >
            {projects.length === 0 && <option>Nenhum projeto encontrado</option>}
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

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
