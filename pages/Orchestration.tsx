import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { EmailSequence } from '../types';
import SequenceBuilder from '../components/SequenceBuilder';

interface OrchestrationProps {
  tenantId: string | null;
}

const Orchestration: React.FC<OrchestrationProps> = ({ tenantId }) => {
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newSequence, setNewSequence] = useState({ name: '', description: '' });
  const [selectedSequence, setSelectedSequence] = useState<EmailSequence | null>(null);

  useEffect(() => {
    fetchSequences();
  }, [tenantId]);

  const fetchSequences = async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('email_sequences')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSequences(data as EmailSequence[]);
    }
    setLoading(false);
  };

  const handleCreateSequence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    const { error } = await supabase.from('email_sequences').insert({
      tenant_id: tenantId,
      name: newSequence.name,
      description: newSequence.description,
      status: 'draft'
    });

    if (error) {
      alert('Erro ao criar sequência: ' + error.message);
    } else {
      setIsCreating(false);
      setNewSequence({ name: '', description: '' });
      fetchSequences();
    }
  };

  if (selectedSequence) {
    return <SequenceBuilder sequence={selectedSequence} onBack={() => setSelectedSequence(null)} />;
  }

  return (
    <div className="p-8 text-white h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Orquestração de Email</h1>
          <p className="text-slate-400 mt-1">Crie sequências automatizadas de nutrição e vendas.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition"
        >
          <span className="material-symbols-outlined">add</span>
          Nova Sequência
        </button>
      </div>

      {isCreating && (
        <div className="bg-surface-dark border border-border-dark p-6 rounded-xl mb-8 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold mb-4">Nova Sequência</h3>
          <form onSubmit={handleCreateSequence} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome da Campanha</label>
              <input 
                type="text" 
                required
                className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:border-primary outline-none"
                placeholder="Ex: Cadência de Boas-vindas"
                value={newSequence.name}
                onChange={e => setNewSequence({...newSequence, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Descrição</label>
              <textarea 
                className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:border-primary outline-none"
                placeholder="Objetivo desta sequência..."
                value={newSequence.description}
                onChange={e => setNewSequence({...newSequence, description: e.target.value})}
              />
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
                Criar Rascunho
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-slate-500">Carregando...</p>
        ) : sequences.length === 0 ? (
          <div className="col-span-full text-center py-12 border-2 border-dashed border-white/5 rounded-xl">
            <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">mail</span>
            <p className="text-slate-500">Nenhuma sequência criada.</p>
          </div>
        ) : (
          sequences.map(seq => (
            <div 
              key={seq.id} 
              onClick={() => setSelectedSequence(seq)}
              className="bg-surface-dark border border-border-dark rounded-xl p-5 hover:border-primary/30 transition group relative cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  seq.status === 'active' ? 'bg-emerald-500/20 text-emerald-500' :
                  seq.status === 'paused' ? 'bg-yellow-500/20 text-yellow-500' :
                  'bg-slate-700 text-slate-300'
                }`}>
                  {seq.status}
                </span>
                <button className="text-slate-600 hover:text-white opacity-0 group-hover:opacity-100 transition">
                  <span className="material-symbols-outlined text-lg">settings</span>
                </button>
              </div>
              
              <h3 className="font-bold text-lg text-white mb-1 truncate">{seq.name}</h3>
              <p className="text-xs text-slate-400 mb-4 line-clamp-2">{seq.description || 'Sem descrição.'}</p>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Criado em: {new Date(seq.created_at).toLocaleDateString()}
                </div>
                <button className="bg-white/5 hover:bg-white/10 text-white p-2 rounded-lg transition">
                   <span className="material-symbols-outlined text-lg">edit</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orchestration;
