import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { AdRule } from '../types';

interface AdRulesListProps {
  tenantId: string;
}

const AdRulesList: React.FC<AdRulesListProps> = ({ tenantId }) => {
  const [rules, setRules] = useState<AdRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // New Rule State
  const [newRule, setNewRule] = useState<Partial<AdRule>>({
    name: '',
    metric: 'cpa',
    operator: '>',
    value: 50,
    action: 'pause_campaign',
    scope: 'campaign',
    is_active: true
  });

  useEffect(() => {
    fetchRules();
  }, [tenantId]);

  const fetchRules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ad_rules')
      .select('*')
      .eq('tenant_id', tenantId);
    
    if (!error && data) {
      setRules(data as AdRule[]);
    }
    setLoading(false);
  };

  const handleCreateRule = async () => {
    if (!newRule.name) return alert('Nome da regra é obrigatório');

    const { error } = await supabase
      .from('ad_rules')
      .insert([{ ...newRule, tenant_id: tenantId }]);

    if (error) {
      alert('Erro ao criar regra: ' + error.message);
    } else {
      setIsCreating(false);
      fetchRules();
      setNewRule({
        name: '',
        metric: 'cpa',
        operator: '>',
        value: 50,
        action: 'pause_campaign',
        scope: 'campaign',
        is_active: true
      });
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Tem certeza?')) return;
    await supabase.from('ad_rules').delete().eq('id', id);
    fetchRules();
  };

  return (
    <div className="bg-surface-dark/30 border border-border-dark rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Regras de Automação</h2>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-primary/20 text-primary hover:bg-primary/30 px-4 py-2 rounded-lg text-sm font-bold transition"
        >
          {isCreating ? 'Cancelar' : '+ Nova Regra'}
        </button>
      </div>

      {isCreating && (
        <div className="bg-slate-800/50 p-4 rounded-lg mb-6 space-y-4 border border-slate-700">
          <div>
            <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Nome da Regra</label>
            <input 
              type="text" 
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              value={newRule.name}
              onChange={e => setNewRule({...newRule, name: e.target.value})}
              placeholder="Ex: Pausar se CPA alto"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Se (Métrica)</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                value={newRule.metric}
                onChange={e => setNewRule({...newRule, metric: e.target.value as any})}
              >
                <option value="cpa">CPA (Custo por Ação)</option>
                <option value="spend">Gasto Total</option>
                <option value="roas">ROAS</option>
                <option value="cpc">CPC</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Operador</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                value={newRule.operator}
                onChange={e => setNewRule({...newRule, operator: e.target.value as any})}
              >
                <option value=">">Maior que ( &gt; )</option>
                <option value="<">Menor que ( &lt; )</option>
                <option value=">=">Maior ou Igual ( &gt;= )</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Valor</label>
              <input 
                type="number" 
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                value={newRule.value}
                onChange={e => setNewRule({...newRule, value: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Então (Ação)</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                value={newRule.action}
                onChange={e => setNewRule({...newRule, action: e.target.value as any})}
              >
                <option value="pause_campaign">Pausar Campanha</option>
                <option value="notify_manager">Notificar Gestor</option>
              </select>
            </div>
          </div>
          <button 
            onClick={handleCreateRule}
            className="w-full bg-primary text-white font-bold py-2 rounded-lg hover:bg-primary-dark transition"
          >
            Salvar Regra
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Carregando regras...</p>
      ) : rules.length === 0 ? (
        <p className="text-slate-500 italic">Nenhuma regra definida.</p>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg border border-white/5">
              <div>
                <p className="font-bold text-white text-sm">{rule.name}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Se <span className="text-primary font-mono">{rule.metric.toUpperCase()} {rule.operator} {rule.value}</span>, 
                  então <span className="text-red-400 font-mono">{rule.action === 'pause_campaign' ? 'PAUSAR' : 'NOTIFICAR'}</span>
                </p>
              </div>
              <button 
                onClick={() => handleDeleteRule(rule.id)}
                className="text-slate-500 hover:text-red-500"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdRulesList;
