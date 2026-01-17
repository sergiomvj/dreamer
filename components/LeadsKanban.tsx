import React from 'react';
import { Lead } from '../types';

interface LeadsKanbanProps {
  leads: Lead[];
  onUpdateStatus: (leadId: string, newStatus: Lead['status']) => void;
}

const COLUMNS: { id: Lead['status']; label: string; color: string }[] = [
  { id: 'new', label: 'Novos', color: 'border-blue-500/50' },
  { id: 'open', label: 'Em Aberto', color: 'border-yellow-500/50' },
  { id: 'qualified', label: 'Qualificados', color: 'border-emerald-500/50' },
  { id: 'customer', label: 'Clientes', color: 'border-purple-500/50' },
  { id: 'disqualified', label: 'Desqualificados', color: 'border-red-500/50' },
];

const NEXT_STATUS: Record<string, Lead['status']> = {
  'new': 'open',
  'open': 'qualified',
  'qualified': 'customer',
};

const LeadsKanban: React.FC<LeadsKanbanProps> = ({ leads, onUpdateStatus }) => {
  
  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => lead.status === status);
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: Lead['status']) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      onUpdateStatus(leadId, status);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-slate-400';
  };

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {COLUMNS.map(col => (
        <div 
          key={col.id}
          className={`min-w-[300px] bg-slate-800/20 rounded-xl border-t-4 ${col.color} flex flex-col h-full`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.id)}
        >
          <div className="p-4 border-b border-white/5 flex justify-between items-center">
            <h3 className="font-bold text-slate-200 uppercase tracking-wide text-sm">{col.label}</h3>
            <span className="bg-white/5 text-xs font-mono py-1 px-2 rounded-full text-slate-400">
              {getLeadsByStatus(col.id).length}
            </span>
          </div>
          
          <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {getLeadsByStatus(col.id).map(lead => (
              <div 
                key={lead.id}
                draggable
                onDragStart={(e) => handleDragStart(e, lead.id)}
                className="bg-surface-dark border border-border-dark p-4 rounded-lg shadow-sm hover:shadow-md hover:border-primary/50 transition cursor-grab active:cursor-grabbing group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 ${getScoreColor(lead.score)}`}>
                    Score: {lead.score}
                  </span>
                  <span className="text-xs text-slate-500">{new Date(lead.created_at).toLocaleDateString()}</span>
                </div>
                
                <h4 className="font-bold text-white mb-1 truncate">{lead.full_name || 'Sem nome'}</h4>
                <p className="text-xs text-slate-400 truncate mb-3">{lead.email}</p>
                
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                   <div className="flex gap-2">
                     {lead.intent === 'hot' && <span title="Alta Intenção">🔥</span>}
                     {lead.intent === 'warm' && <span title="Média Intenção">☀️</span>}
                     {lead.phone && <span className="material-symbols-outlined text-slate-500 text-[16px]" title="Tem telefone">call</span>}
                   </div>
                   {NEXT_STATUS[lead.status] && (
                     <button 
                       onClick={() => onUpdateStatus(lead.id, NEXT_STATUS[lead.status])}
                       className="text-slate-500 hover:text-primary opacity-0 group-hover:opacity-100 transition"
                       title={`Mover para ${NEXT_STATUS[lead.status]}`}
                     >
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                     </button>
                   )}
                </div>
              </div>
            ))}
            {getLeadsByStatus(col.id).length === 0 && (
               <div className="h-24 border-2 border-dashed border-white/5 rounded-lg flex items-center justify-center text-slate-600 text-xs uppercase font-bold tracking-widest">
                 Vazio
               </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LeadsKanban;
