import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Lead } from '../types';
import LeadsKanban from '../components/LeadsKanban';
import LeadDetails from '../components/LeadDetails';
import NewLeadModal from '../components/NewLeadModal';
import SequenceEnrollModal from '../components/SequenceEnrollModal';

interface LeadsCRMProps {
  tenantId: string | null;
}

const LeadsCRM: React.FC<LeadsCRMProps> = ({ tenantId }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [enrollModalLeadId, setEnrollModalLeadId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, [tenantId, filterStatus, searchTerm, dateRange]);

  const fetchLeads = async () => {
    if (!tenantId) return;
    setLoading(true);
    
    let query = supabase
      .from('leads')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    if (dateRange.start) {
      query = query.gte('created_at', dateRange.start);
    }
    if (dateRange.end) {
      query = query.lte('created_at', dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching leads:', error);
    } else {
      setLeads(data as Lead[]);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (leadId: string, newStatus: Lead['status']) => {
    // Optimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));

    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (error) {
      console.error('Error updating status:', error);
      fetchLeads(); // Revert on error
    } else {
       // Log Status Change Event
       await supabase.from('lead_events').insert({
         tenant_id: tenantId,
         lead_id: leadId,
         event_code: 'status_changed',
         payload: {
           old_status: leads.find(l => l.id === leadId)?.status,
           new_status: newStatus
         }
       });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-400';
      case 'qualified': return 'bg-emerald-500/20 text-emerald-400';
      case 'disqualified': return 'bg-red-500/20 text-red-400';
      case 'customer': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'hot': return '🔥';
      case 'warm': return '☀️';
      default: return '❄️';
    }
  };

  return (
    <div className="p-8 text-white h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">CRM de Leads</h1>
          <p className="text-slate-400 text-sm mt-1">Gerencie seus leads e oportunidades.</p>
        </div>
        <button 
          onClick={() => setIsNewLeadModalOpen(true)}
          className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition"
        >
          <span className="material-symbols-outlined">add</span>
          Novo Lead
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 items-center justify-between flex-wrap">
        <div className="flex gap-2 items-center">
           {/* Status Filters */}
           <div className="flex bg-surface-dark border border-border-dark rounded-lg p-1">
              {['all', 'new', 'open', 'qualified', 'customer'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition ${
                    filterStatus === status 
                      ? 'bg-primary text-white shadow' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {status === 'all' ? 'Todos' : status}
                </button>
              ))}
           </div>

           {/* Search & Date */}
           <div className="flex items-center gap-2">
             <div className="relative">
                <span className="material-symbols-outlined absolute left-2 top-2 text-slate-500 text-lg">search</span>
                <input 
                  type="text" 
                  placeholder="Buscar leads..." 
                  className="pl-8 pr-4 py-1.5 bg-surface-dark border border-border-dark rounded-lg text-sm text-white w-48 focus:border-primary outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <input 
                type="date" 
                className="py-1.5 px-3 bg-surface-dark border border-border-dark rounded-lg text-sm text-slate-400 focus:border-primary outline-none"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
             />
           </div>
        </div>

        <div className="bg-surface-dark border border-border-dark rounded-lg p-1 flex gap-1">
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded transition ${viewMode === 'list' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            title="Lista"
          >
            <span className="material-symbols-outlined text-xl">table_rows</span>
          </button>
          <button 
            onClick={() => setViewMode('kanban')}
            className={`p-2 rounded transition ${viewMode === 'kanban' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            title="Kanban"
          >
            <span className="material-symbols-outlined text-xl">view_kanban</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative flex overflow-hidden">
        <div className="flex-1 overflow-hidden flex flex-col">
          {viewMode === 'kanban' ? (
            <div className="flex-1 overflow-hidden">
              <LeadsKanban 
                leads={leads} 
                onUpdateStatus={handleUpdateStatus} 
              />
            </div>
          ) : (
          /* Leads Table */
          <div className="flex-1 bg-surface-dark/30 border border-border-dark rounded-xl overflow-hidden flex flex-col">
            <div className="overflow-x-auto custom-scrollbar flex-1">
              <table className="w-full text-sm text-left text-slate-400">
                <thead className="text-xs text-slate-200 uppercase bg-slate-800/50 sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-4">Nome / Email</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">Intenção</th>
                    <th className="px-6 py-4">Origem</th>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center">
                        <span className="material-symbols-outlined animate-spin text-2xl">sync</span>
                      </td>
                    </tr>
                  ) : leads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        Nenhum lead encontrado com este filtro.
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr 
                        key={lead.id} 
                        className="hover:bg-white/5 transition group cursor-pointer"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-white text-base">{lead.full_name || 'Sem Nome'}</span>
                            <span className="text-xs text-slate-500">{lead.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(lead.status)}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500" 
                                style={{ width: `${Math.min(lead.score, 100)}%` }}
                              />
                            </div>
                            <span className="font-mono text-white">{lead.score}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-lg" title={`Intent: ${lead.intent}`}>
                            {getIntentIcon(lead.intent)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-800 px-2 py-1 rounded text-xs font-mono border border-slate-700">
                            {lead.source?.type || 'Manual'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); }}
                            className="text-slate-500 hover:text-white p-2 rounded-lg hover:bg-white/10 opacity-0 group-hover:opacity-100 transition"
                          >
                            <span className="material-symbols-outlined">visibility</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border-dark bg-slate-800/30 text-xs text-slate-500 flex justify-between">
              <span>Mostrando {leads.length} leads</span>
              <span>Página 1 de 1</span>
            </div>
          </div>
          )}
        </div>
        
        {/* Slide-over Details */}
        {selectedLead && (
          <LeadDetails 
            lead={selectedLead} 
            onClose={() => setSelectedLead(null)} 
            onEnroll={() => setEnrollModalLeadId(selectedLead.id)}
          />
        )}
      </div>

      {/* Modals */}
      <NewLeadModal 
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        onSuccess={fetchLeads}
        tenantId={tenantId || ''}
      />

      <SequenceEnrollModal 
        isOpen={!!enrollModalLeadId}
        onClose={() => setEnrollModalLeadId(null)}
        leadId={enrollModalLeadId || ''}
        tenantId={tenantId || ''}
        onSuccess={() => alert('Lead inscrito com sucesso!')}
      />
    </div>
  );
};

export default LeadsCRM;
