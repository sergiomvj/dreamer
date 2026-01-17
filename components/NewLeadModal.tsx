import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantId: string;
}

const NewLeadModal: React.FC<NewLeadModalProps> = ({ isOpen, onClose, onSuccess, tenantId }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.email || !formData.full_name) {
      alert('Nome e Email são obrigatórios');
      setLoading(false);
      return;
    }

    // 1. Get Project ID (Required by schema, pick the first one for now or default)
    // For simplicity, we'll try to get a project, or let the database handle default if nullable (it's NOT NULL in schema)
    // Wait, let's check schema. leads.project_id IS NOT NULL.
    // We need to fetch a project_id or let the user select one.
    // For MVP, let's fetch the first project of the tenant.
    
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('tenant_id', tenantId)
      .limit(1);
    
    const projectId = projects?.[0]?.id;

    if (!projectId) {
      alert('Erro: Nenhum projeto encontrado para este tenant. Crie um projeto primeiro.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('leads').insert({
      tenant_id: tenantId,
      project_id: projectId,
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      source: { type: 'manual' },
      status: 'new',
      score: 10,
      intent: 'cold'
    });

    if (error) {
      alert('Erro ao criar lead: ' + error.message);
    } else {
      onSuccess();
      onClose();
      setFormData({ full_name: '', email: '', phone: '' });
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-dark border border-border-dark rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Novo Lead</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome Completo</label>
            <input 
              type="text" 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none transition"
              value={formData.full_name}
              onChange={e => setFormData({...formData, full_name: e.target.value})}
              placeholder="Ex: João Silva"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email Corporativo</label>
            <input 
              type="email" 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none transition"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              placeholder="joao@empresa.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Telefone (Opcional)</label>
            <input 
              type="tel" 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none transition"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              placeholder="+55 11 99999-9999"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-lg transition"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading && <span className="material-symbols-outlined animate-spin text-sm">sync</span>}
              Salvar Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewLeadModal;
