import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { ScrapingTarget, RawContact } from '../types';

interface DataMiningProps {
  tenantId: string | null;
}

const DataMining: React.FC<DataMiningProps> = ({ tenantId }) => {
  const [targets, setTargets] = useState<ScrapingTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [rawContacts, setRawContacts] = useState<RawContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);

  // New Target Form
  const [newTarget, setNewTarget] = useState({
    name: '',
    url: '',
    platform: 'linkedin',
    stealth_mode: false
  });

  useEffect(() => {
    fetchTargets();
  }, [tenantId]);

  useEffect(() => {
    if (selectedTarget) {
      fetchRawContacts(selectedTarget);
    } else {
      setRawContacts([]);
    }
  }, [selectedTarget]);

  const fetchTargets = async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('scraping_targets')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTargets(data as ScrapingTarget[]);
    }
    setLoading(false);
  };

  const fetchRawContacts = async (targetId: string) => {
    setContactsLoading(true);
    const { data, error } = await supabase
      .from('raw_contacts')
      .select('*')
      .eq('scraping_target_id', targetId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRawContacts(data as RawContact[]);
    }
    setContactsLoading(false);
  };

  const handleCreateTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    const targetData = {
      tenant_id: tenantId,
      name: newTarget.name,
      url: newTarget.url,
      platform: newTarget.platform,
      config: { stealth_mode: newTarget.stealth_mode }
    };

    let result;
    if (editTargetId) {
      result = await supabase
        .from('scraping_targets')
        .update(targetData)
        .eq('id', editTargetId);
    } else {
      result = await supabase
        .from('scraping_targets')
        .insert({ ...targetData, status: 'pending' });
    }

    if (result.error) {
      alert(`Erro ao ${editTargetId ? 'atualizar' : 'criar'} alvo: ` + result.error.message);
    } else {
      setIsCreating(false);
      setEditTargetId(null);
      setNewTarget({ name: '', url: '', platform: 'linkedin', stealth_mode: false });
      fetchTargets();
    }
  };

  const handleEditClick = (target: ScrapingTarget) => {
    setNewTarget({
      name: target.name,
      url: target.url,
      platform: target.platform,
      stealth_mode: !!target.config?.stealth_mode
    });
    setEditTargetId(target.id);
    setIsCreating(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteTarget = async (id: string) => {
    if (!confirm('Tem certeza?')) return;
    await supabase.from('scraping_targets').delete().eq('id', id);
    fetchTargets();
  };

  const handleExecuteTarget = async (id: string) => {
    // 1. Update UI immediately
    setTargets(prev => prev.map(t => t.id === id ? { ...t, status: 'processing' as any } : t));

    // 2. Call Edge Function
    const { error } = await supabase.functions.invoke('scraping-worker', {
      body: { target_id: id }
    });

    if (error) {
      alert('Erro ao iniciar extração: ' + error.message);
      fetchTargets(); // Revert/Refresh
    } else {
      // 3. Poll for updates (or just wait a bit and refresh)
      setTimeout(fetchTargets, 3000);
    }
  };

  const handleResetStatus = async (id: string) => {
    const { error } = await supabase
      .from('scraping_targets')
      .update({ status: 'pending' })
      .eq('id', id);

    if (error) {
      alert('Erro ao resetar status: ' + error.message);
    } else {
      fetchTargets();
    }
  };

  const handlePromoteToLead = async (contact: RawContact) => {
    // 1. Check if project exists
    const { data: projects } = await supabase.from('projects').select('id').eq('tenant_id', tenantId).limit(1);
    const projectId = projects?.[0]?.id;
    if (!projectId) return alert('Nenhum projeto encontrado para associar o lead.');

    // 2. Insert Lead
    const { data: lead, error } = await supabase.from('leads').insert({
      tenant_id: tenantId,
      project_id: projectId,
      full_name: contact.data.full_name || 'Desconhecido',
      email: contact.data.email,
      phone: contact.data.phone,
      source: { type: 'scraping', platform: contact.source_platform, target_id: contact.scraping_target_id },
      status: 'new',
      score: 10,
      intent: 'cold'
    }).select().single();

    if (error) {
      alert('Erro ao criar lead: ' + error.message);
    } else {
      // 3. Update Raw Contact as Processed
      await supabase.from('raw_contacts').update({ processed: true, lead_id: lead.id }).eq('id', contact.id);

      // 4. Update UI
      setRawContacts(prev => prev.map(c => c.id === contact.id ? { ...c, processed: true, lead_id: lead.id } : c));
    }
  };

  return (
    <div className="p-8 text-white h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Data Mining & Scraping</h1>
          <p className="text-slate-400 mt-1">Configure fontes de dados para enriquecimento e prospecção.</p>
        </div>
        <button
          onClick={() => {
            setEditTargetId(null);
            setNewTarget({ name: '', url: '', platform: 'linkedin', stealth_mode: false });
            setIsCreating(true);
          }}
          className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition"
        >
          <span className="material-symbols-outlined">add</span>
          Novo Alvo
        </button>
      </div>

      {isCreating && (
        <div className="bg-surface-dark border border-border-dark p-6 rounded-xl mb-8 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold mb-4">{editTargetId ? 'Editar Alvo' : 'Configurar Novo Alvo'}</h3>
          <form onSubmit={handleCreateTarget} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome do Alvo</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:border-primary outline-none"
                  placeholder="Ex: CEOs de Tech em SP"
                  value={newTarget.name}
                  onChange={e => setNewTarget({ ...newTarget, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Plataforma</label>
                <select
                  className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:border-primary outline-none"
                  value={newTarget.platform}
                  onChange={e => setNewTarget({ ...newTarget, platform: e.target.value })}
                >
                  <option value="linkedin">LinkedIn</option>
                  <option value="google">Google Maps/Search</option>
                  <option value="instagram">Instagram</option>
                  <option value="amazon">Amazon (Produtos)</option>
                  <option value="other">Outros (Web)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">URL de Origem (Query)</label>
              <input
                type="url"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:border-primary outline-none"
                placeholder="https://..."
                value={newTarget.url}
                onChange={e => setNewTarget({ ...newTarget, url: e.target.value })}
              />
              <p className="text-[10px] text-slate-500 mt-1">Cole a URL da página de pesquisa ou lista que deseja extrair.</p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
              <input
                type="checkbox"
                id="stealth_mode"
                className="size-5 rounded border-slate-700 bg-slate-900 text-primary focus:ring-primary"
                checked={newTarget.stealth_mode}
                onChange={e => setNewTarget({ ...newTarget, stealth_mode: e.target.checked })}
              />
              <label htmlFor="stealth_mode" className="cursor-pointer">
                <span className="block text-sm font-bold text-primary italic tracking-tight">Habilitar Anti-Bloqueio (Deep Stealth)</span>
                <span className="block text-[10px] text-slate-500 font-medium">Burlar Cloudflare, JS dinâmico e simular navegador real. (Mais lento)</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-slate-400 hover:text-white font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg transition"
              >
                {editTargetId ? 'Atualizar Alvo' : 'Salvar Alvo'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {loading ? (
          <p className="text-slate-500">Carregando...</p>
        ) : targets.length === 0 ? (
          <div className="col-span-full text-center py-12 border-2 border-dashed border-white/5 rounded-xl">
            <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">engineering</span>
            <p className="text-slate-500">Nenhum alvo de extração configurado.</p>
          </div>
        ) : (
          targets.map(target => (
            <div
              key={target.id}
              onClick={() => setSelectedTarget(target.id)}
              className={`bg-surface-dark border rounded-xl p-5 hover:border-primary/30 transition group relative cursor-pointer ${selectedTarget === target.id ? 'border-primary ring-1 ring-primary' : 'border-border-dark'
                }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span
                    onClick={(e) => {
                      if (target.status === 'failed' && target.config?.last_error) {
                        e.stopPropagation();
                        alert(`LOG DE ERRO:\n\n${target.config.last_error}`);
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${target.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' :
                      target.status === 'processing' ? 'bg-blue-500/20 text-blue-500 animate-pulse' :
                        target.status === 'failed' ? 'bg-red-500/20 text-red-500 cursor-help' :
                          'bg-slate-700 text-slate-300'
                      }`}
                    title={target.status === 'failed' ? 'Clique para ver o log de erro' : ''}
                  >
                    {target.status}
                  </span>
                  <span className="text-xs text-slate-500">{target.platform}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEditClick(target); }}
                    className="text-slate-600 hover:text-primary opacity-0 group-hover:opacity-100 transition p-1"
                    title="Editar Alvo"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteTarget(target.id); }}
                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1"
                    title="Excluir Alvo"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-lg text-white mb-1 truncate" title={target.name}>{target.name}</h3>
              <a href={target.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-xs text-slate-400 hover:text-primary truncate block mb-4">
                {target.url}
              </a>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  {target.last_run_at ? `Última exec: ${new Date(target.last_run_at).toLocaleDateString()}` : 'Nunca executado'}
                </div>
                <div className="flex gap-2">
                  {target.status !== 'pending' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleResetStatus(target.id); }}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 rounded-lg transition text-[10px] font-black uppercase tracking-tighter"
                      title="Resetar status para Pendente"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleExecuteTarget(target.id); }}
                    disabled={target.status === 'processing'}
                    className="bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition"
                    title="Executar Agora"
                  >
                    <span className={`material-symbols-outlined text-lg ${target.status === 'processing' ? 'animate-spin' : ''}`}>
                      {target.status === 'processing' ? 'sync' : 'play_arrow'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Raw Contacts Results */}
      {selectedTarget && (
        <div className="bg-surface-dark border border-border-dark rounded-xl p-6 animate-in slide-in-from-bottom-4 fade-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Resultados da Extração</h3>
            <button onClick={() => setSelectedTarget(null)} className="text-slate-500 hover:text-white">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {contactsLoading ? (
            <p className="text-slate-500 text-sm">Carregando contatos...</p>
          ) : rawContacts.length === 0 ? (
            <p className="text-slate-500 text-sm italic">Nenhum dado extraído ainda. Execute o alvo para obter resultados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-400">
                <thead className="text-xs text-slate-200 uppercase bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3">Principal</th>
                    <th className="px-6 py-3">Contato/Info</th>
                    <th className="px-6 py-3">Visualização</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {rawContacts.map(contact => (
                    <tr key={contact.id} className="hover:bg-white/5">
                      <td className="px-6 py-3 font-medium text-white max-w-[200px] truncate">
                        {contact.data.full_name || contact.data.title || 'Página Web'}
                      </td>
                      <td className="px-6 py-3">
                        {contact.data.email || contact.data.company || 'Conteúdo Extraído'}
                      </td>
                      <td className="px-6 py-3">
                        {(contact.data.markdown || contact.data.content) && (
                          <button
                            onClick={() => setSelectedContent(contact.data.markdown || contact.data.content)}
                            className="flex items-center gap-2 text-primary hover:text-primary-dark font-bold text-xs"
                          >
                            <span className="material-symbols-outlined text-sm">description</span>
                            Ver Texto
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {contact.processed ? (
                          <span className="text-emerald-500 text-xs font-bold uppercase flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">check</span>
                            Lead Criado
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs font-bold uppercase">Pendente</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {!contact.processed && (
                          <button
                            onClick={() => handlePromoteToLead(contact)}
                            className="bg-primary/20 hover:bg-primary/40 text-primary text-xs font-bold px-3 py-1.5 rounded transition"
                          >
                            Promover a Lead
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Content Viewer Modal */}
      {selectedContent && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-8">
          <div className="bg-surface-dark border border-white/10 w-full max-w-4xl h-[80vh] rounded-[40px] flex flex-col shadow-2xl animate-in zoom-in-95">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-white italic tracking-tighter">Conteúdo Extraído (Markdown)</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Fonte: Firecrawl Intel</p>
              </div>
              <button
                onClick={() => setSelectedContent(null)}
                className="size-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-95"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 bg-black/20">
              <pre className="text-slate-300 font-mono text-sm whitespace-pre-wrap leading-relaxed select-all">
                {selectedContent}
              </pre>
            </div>
            <div className="p-8 border-t border-white/5 flex justify-end gap-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedContent);
                  alert('Copiado para a área de transferência!');
                }}
                className="bg-primary text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20"
              >
                Copiar Texto Integral
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataMining;
