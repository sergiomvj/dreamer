import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import DraftEditor from '../components/DraftEditor';

type Project = {
  id: string;
  name: string;
};

type Campaign = {
  id: string;
  name: string;
  description: string | null;
  strategies: { id: string; name: string }[];
  channels: { id: string; name: string }[];
};

type ContentIdea = {
  id: string;
  idea_text: string;
  status: 'ideia' | 'draft' | 'published';
  content_draft: string | null;
};

const ContentIdeation: React.FC<{ tenantId?: string | null }> = ({ tenantId }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<ContentIdea | null>(null);
  const [activeTab, setActiveTab] = useState<'ideas' | 'published'>('ideas');

  useEffect(() => {
    if (tenantId) {
      loadProjects();
    }
  }, [tenantId]);

  useEffect(() => {
    if (selectedProjectId) {
      loadCampaigns(selectedProjectId);
    } else {
      setCampaigns([]);
      setSelectedCampaignId('');
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedCampaignId) {
      loadIdeas(selectedCampaignId);
    } else {
      setIdeas([]);
    }
  }, [selectedCampaignId]);

  const loadProjects = async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('tenant_id', tenantId);
      if (error) throw error;
      setProjects(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar projetos.');
    }
  };

  const loadCampaigns = async (projectId: string) => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          id,
          name,
          description,
          strategies (id, name),
          channels (id, name)
        `)
        .eq('tenant_id', tenantId)
        .eq('project_id', projectId);
      if (error) throw error;
      setCampaigns(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar campanhas.');
    } finally {
      setLoading(false);
    }
  };

  const loadIdeas = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('content_ideas')
        .select('id, idea_text, status, content_draft')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setIdeas(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar ideias.');
    }
  };

  const handleGenerateIdeas = async () => {
    if (!selectedCampaign || !tenantId) return;

    setGenerating(true);
    setError(null);

    const { name, description, strategies, channels } = selectedCampaign;

    const prompt = `
      Você é um especialista em marketing de conteúdo.
      Gere 5 ideias de posts para uma campanha de marketing.

      **Detalhes da Campanha:**
      - **Nome:** ${name}
      - **Descrição:** ${description || 'N/A'}
      - **Estratégias-chave:** ${strategies.map(s => s.name).join(', ') || 'N/A'}
      - **Canais de Distribuição:** ${channels.map(c => c.name).join(', ') || 'N/A'}

      Para cada ideia, forneça um título chamativo e uma breve descrição (1-2 frases).
      Formate a saída como uma lista numerada, com cada item em uma nova linha. Apenas a lista, sem introdução.
      Exemplo:
      1. Título da Ideia 1: Descrição da ideia.
      2. Título da Ideia 2: Descrição da ideia.
    `;

    try {
      const { data: llmData, error: llmError } = await supabase.functions.invoke('llm', {
        body: { prompt },
      });

      if (llmError) throw llmError;
      
      const rawIdeas = (llmData?.text || '').split('\n').filter((line: string) => line.trim().length > 0 && /^\d+\./.test(line));
      
      const newIdeasToSave = rawIdeas.map((ideaText: string) => ({
        tenant_id: tenantId,
        campaign_id: selectedCampaign.id,
        idea_text: ideaText.replace(/^\d+\.\s*/, ''), // Remove numbering
        status: 'ideia', // Default status
      }));

      if (newIdeasToSave.length > 0) {
        const { error: insertError } = await supabase.from('content_ideas').insert(newIdeasToSave);
        if (insertError) throw insertError;
      }

      // Reload ideas from DB
      await loadIdeas(selectedCampaign.id);

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar ou salvar ideias.');
    } finally {
      setGenerating(false);
    }
  };

  const convertToDraft = async (idea: ContentIdea) => {
    setGenerating(true); // Reuse generating state for spinner
    setError(null);

    const prompt = `
      Você é um redator de conteúdo.
      Expanda a seguinte ideia em um rascunho de post para blog ou rede social.
      Crie um texto com cerca de 150-200 palavras.
      Inclua um título, uma introdução, um corpo principal e uma chamada para ação (CTA).

      **Ideia Original:**
      "${idea.idea_text}"

      Formate a saída em Markdown.
    `;

    try {
      const { data: llmData, error: llmError } = await supabase.functions.invoke('llm', {
        body: { prompt },
      });

      if (llmError) throw llmError;

      const draftContent = llmData.text;

      const { error: updateError } = await supabase
        .from('content_ideas')
        .update({ status: 'draft', content_draft: draftContent })
        .eq('id', idea.id);

      if (updateError) throw updateError;

      await loadIdeas(selectedCampaignId);

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao converter para rascunho.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async (newContent: string) => {
    if (!editingDraft) return;

    try {
      const { error } = await supabase
        .from('content_ideas')
        .update({ content_draft: newContent })
        .eq('id', editingDraft.id);

      if (error) throw error;

      setEditingDraft(null);
      await loadIdeas(selectedCampaignId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar o rascunho.');
    }
  };

  const handlePublish = async (idea: ContentIdea) => {
    try {
      const { error } = await supabase
        .from('content_ideas')
        .update({ status: 'published' })
        .eq('id', idea.id);

      if (error) throw error;

      // Update local state to reflect the change immediately
      setIdeas(currentIdeas =>
        currentIdeas.map(i =>
          i.id === idea.id ? { ...i, status: 'published' } : i
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao publicar o conteúdo.');
    }
  };

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  return (
    <div className="p-8 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Geração de Ideias de Conteúdo</h1>
      </div>

      {error && <div className="bg-rose-500/20 border border-rose-500 text-rose-300 p-4 rounded-xl mb-6">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column 1: Settings */}
        <div className="lg:col-span-1 space-y-6">
          <div>
            <label htmlFor="project-select" className="block text-sm font-medium text-slate-400 mb-2">1. Selecione o Projeto</label>
            <select
              id="project-select"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-surface-dark border border-border-dark rounded-xl p-3 text-white"
            >
              <option value="">-- Escolha um Projeto --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {selectedProjectId && (
            <div>
              <label htmlFor="campaign-select" className="block text-sm font-medium text-slate-400 mb-2">2. Selecione a Campanha</label>
              <select
                id="campaign-select"
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                disabled={loading}
                className="w-full bg-surface-dark border border-border-dark rounded-xl p-3 text-white"
              >
                <option value="">-- Escolha uma Campanha --</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {selectedCampaign && (
            <div className="bg-surface-dark/50 border border-border-dark rounded-xl p-4 space-y-4">
              <h3 className="font-bold text-lg">{selectedCampaign.name}</h3>
              <p className="text-sm text-slate-400">{selectedCampaign.description}</p>
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Estratégias</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCampaign.strategies.map(s => <span key={s.id} className="bg-white/10 text-xs rounded-full px-2 py-1">{s.name}</span>)}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Canais</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCampaign.channels.map(c => <span key={c.id} className="bg-white/10 text-xs rounded-full px-2 py-1">{c.name}</span>)}
                </div>
              </div>
              <button 
                onClick={handleGenerateIdeas}
                disabled={generating}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Gerando...
                  </>
                ) : (
                  'Gerar Ideias de Conteúdo'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Column 2: Results */}
        <div className="lg:col-span-2">
          <div className="bg-surface-dark/30 border border-border-dark rounded-xl p-6 min-h-[600px]">
            <div className="flex items-center border-b border-border-dark mb-4">
              <button
                onClick={() => setActiveTab('ideas')}
                className={`px-4 py-2 text-sm font-semibold transition ${activeTab === 'ideas' ? 'text-primary border-b-2 border-primary' : 'text-slate-400'}`}
              >
                Ideias & Rascunhos
              </button>
              <button
                onClick={() => setActiveTab('published')}
                className={`px-4 py-2 text-sm font-semibold transition ${activeTab === 'published' ? 'text-primary border-b-2 border-primary' : 'text-slate-400'}`}
              >
                Publicados
              </button>
            </div>
            
            {generating && ideas.length === 0 && (
              <div className="text-center text-slate-400 py-20">
                <span className="material-symbols-outlined text-6xl animate-spin">progress_activity</span>
                <p className="mt-4">Aguarde, a IA está pensando...</p>
              </div>
            )}

            {ideas.length > 0 && (
              <div className="space-y-4">
                {ideas.filter(idea => activeTab === 'ideas' ? ['ideia', 'draft'].includes(idea.status) : idea.status === 'published').map((idea) => (
                  <div key={idea.id} className="bg-surface-dark p-4 rounded-lg border border-border-dark flex justify-between items-center">
                    <p className="text-slate-300 flex-1">{idea.idea_text}</p>
                    <div className="flex items-center gap-2 ml-4">
                      <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${
                        idea.status === 'draft' ? 'bg-blue-500/20 text-blue-300' :
                        idea.status === 'published' ? 'bg-green-500/20 text-green-300' :
                        'bg-slate-700 text-slate-400'
                      }`}>
                        {idea.status}
                      </span>
                      {idea.status === 'ideia' && (
                        <button
                          onClick={() => convertToDraft(idea)}
                          className="bg-primary/20 hover:bg-primary/40 text-primary font-semibold text-xs px-3 py-1 rounded-lg transition"
                          disabled={generating}
                          title="Converter em Rascunho"
                        >
                          <span className="material-symbols-outlined text-base">edit_document</span>
                        </button>
                      )}
                      {idea.status === 'draft' && (
                        <>
                          <button
                            onClick={() => setEditingDraft(idea)}
                            className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 font-semibold text-xs px-3 py-1 rounded-lg transition"
                            title="Editar Rascunho"
                          >
                            <span className="material-symbols-outlined text-base">drive_file_rename_outline</span>
                          </button>
                          <button
                            onClick={() => handlePublish(idea)}
                            className="bg-green-500/20 hover:bg-green-500/40 text-green-300 font-semibold text-xs px-3 py-1 rounded-lg transition"
                            title="Publicar"
                          >
                            <span className="material-symbols-outlined text-base">publish</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!generating && ideas.filter(idea => activeTab === 'ideas' ? ['ideia', 'draft'].includes(idea.status) : idea.status === 'published').length === 0 && (
              <div className="text-center text-slate-500 py-20">
                <span className="material-symbols-outlined text-6xl">
                  {activeTab === 'ideas' ? 'emoji_objects' : 'newspaper'}
                </span>
                <p className="mt-4">
                  {activeTab === 'ideas'
                    ? 'As ideias de conteúdo aparecerão aqui.'
                    : 'Nenhum conteúdo publicado ainda.'}
                </p>
                <p className="text-sm text-slate-600">
                  {activeTab === 'ideas'
                    ? 'Selecione um projeto e campanha para começar.'
                    : 'Publique um rascunho para vê-lo aqui.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <DraftEditor
        isOpen={!!editingDraft}
        onClose={() => setEditingDraft(null)}
        content={editingDraft?.content_draft || editingDraft?.idea_text || ''}
        onSave={handleSaveDraft}
      />
    </div>
  );
};

export default ContentIdeation;
