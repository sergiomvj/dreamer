import React, { useEffect, useState } from 'react';
import { Lead, LeadEvent, LeadTask } from '../types';
import { supabase } from '../services/supabaseClient';
import { analyzeLeadIntent } from '../services/geminiService';

interface LeadDetailsProps {
  lead: Lead | null;
  onClose: () => void;
  onEnroll?: () => void;
}

const LeadDetails: React.FC<LeadDetailsProps> = ({ lead, onClose, onEnroll }) => {
  const [events, setEvents] = useState<LeadEvent[]>([]);
  const [tasks, setTasks] = useState<LeadTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [intentAnalysis, setIntentAnalysis] = useState<{
    temperature: "COLD" | "WARM" | "HOT";
    score: number;
    intentSummary: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'tasks'>('timeline');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    if (lead) {
      fetchEvents(lead.id);
      fetchTasks(lead.id);
      setIntentAnalysis(null);
    }
  }, [lead]);

  const handleAnalyzeIntent = async () => {
    if (!lead) return;
    setAnalyzing(true);
    const signals = {
      leadInfo: {
        score: lead.score,
        intent: lead.intent,
        status: lead.status,
        source: lead.source
      },
      recentEvents: events.slice(0, 10).map(e => ({
        code: e.event_code,
        payload: e.payload,
        time: e.happened_at
      }))
    };

    const analysis = await analyzeLeadIntent(JSON.stringify(signals));
    setIntentAnalysis(analysis as any);
    setAnalyzing(false);
  };

  const fetchEvents = async (leadId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lead_events')
      .select('*')
      .eq('lead_id', leadId)
      .order('happened_at', { ascending: false });

    if (error) console.error('Error fetching events:', error);
    else setEvents(data as LeadEvent[]);
    setLoading(false);
  };

  const fetchTasks = async (leadId: string) => {
    const { data, error } = await supabase
      .from('lead_tasks')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching tasks:', error);
    else setTasks(data as LeadTask[]);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !lead) return;

    const { error } = await supabase.from('lead_tasks').insert({
      tenant_id: lead.tenant_id,
      lead_id: lead.id,
      title: newTaskTitle,
      task_type: 'todo',
      status: 'open'
    });

    if (!error) {
      setNewTaskTitle('');
      fetchTasks(lead.id);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'open' ? 'completed' : 'open';
    // Optimistic
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t));

    await supabase.from('lead_tasks').update({ status: newStatus }).eq('id', taskId);
  };

  if (!lead) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-background-dark border-l border-border-dark shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto">
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-bold text-white">Detalhes do Lead</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="bg-surface-dark border border-border-dark p-4 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="size-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xl font-bold text-white">
                {lead.full_name?.charAt(0) || '?'}
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{lead.full_name}</h3>
                <p className="text-slate-400 text-sm">{lead.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Status</p>
                <span className="text-sm font-bold text-white capitalize">{lead.status}</span>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Score</p>
                <span className="text-sm font-bold text-emerald-400">{lead.score}/100</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={onEnroll}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm"
              >
                <span className="material-symbols-outlined text-lg">mail</span>
                Adicionar à Sequência
              </button>
            </div>
          </div>

          {/* AI Intent Discovery */}
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">psychology</span>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">IA Insight</p>
              </div>
              {!intentAnalysis && (
                <button
                  onClick={handleAnalyzeIntent}
                  disabled={analyzing}
                  className="text-[10px] font-bold text-primary hover:underline disabled:opacity-50"
                >
                  {analyzing ? 'Analisando...' : 'Analisar Intenção'}
                </button>
              )}
            </div>

            {intentAnalysis ? (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${intentAnalysis.temperature === 'HOT' ? 'bg-rose-500/20 text-rose-500' :
                      intentAnalysis.temperature === 'WARM' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'
                    }`}>
                    {intentAnalysis.temperature} INTENT
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    AI Score: {intentAnalysis.score}
                  </div>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed italic">
                  "{intentAnalysis.intentSummary}"
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                {analyzing ? 'O motor cognitivo está processando os sinais...' : 'Clique para descobrir a intenção real do lead via IA.'}
              </p>
            )}
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Contato</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-300 text-sm">
                <span className="material-symbols-outlined text-slate-500">mail</span>
                {lead.email}
              </div>
              <div className="flex items-center gap-3 text-slate-300 text-sm">
                <span className="material-symbols-outlined text-slate-500">call</span>
                {lead.phone || 'Não informado'}
              </div>
              <div className="flex items-center gap-3 text-slate-300 text-sm">
                <span className="material-symbols-outlined text-slate-500">link</span>
                {lead.source?.type || 'Manual'}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/5 mb-4">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wide transition ${activeTab === 'timeline' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-white'}`}
            >
              Linha do Tempo
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wide transition ${activeTab === 'tasks' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-white'}`}
            >
              Tarefas ({tasks.filter(t => t.status === 'open').length})
            </button>
          </div>

          {activeTab === 'timeline' ? (
            /* Activity Timeline */
            <div>
              <div className="relative border-l border-slate-700 ml-2 space-y-6">
                {/* Always show creation */}
                <div className="pl-6 relative">
                  <div className="absolute -left-[5px] top-1 size-2.5 bg-slate-500 rounded-full border-2 border-background-dark"></div>
                  <p className="text-xs text-slate-400 mb-1">{new Date(lead.created_at).toLocaleString()}</p>
                  <p className="text-sm text-slate-300">Lead criado</p>
                </div>

                {loading ? (
                  <div className="pl-6 py-2 text-slate-500 text-xs">Carregando eventos...</div>
                ) : events.map(event => (
                  <div key={event.id} className="pl-6 relative">
                    <div className="absolute -left-[5px] top-1 size-2.5 bg-primary rounded-full border-2 border-background-dark"></div>
                    <p className="text-xs text-slate-400 mb-1">{new Date(event.happened_at).toLocaleString()}</p>
                    <p className="text-sm text-white font-medium capitalize">
                      {event.event_code.replace('_', ' ')}
                    </p>
                    {event.payload && Object.keys(event.payload).length > 0 && (
                      <div className="mt-2 bg-slate-800/50 p-2 rounded text-xs text-slate-400 font-mono overflow-x-auto">
                        {JSON.stringify(event.payload, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Tasks */
            <div className="space-y-4">
              <form onSubmit={handleCreateTask} className="flex gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="Adicionar tarefa..."
                  className="flex-1 bg-slate-800/50 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-primary outline-none"
                />
                <button type="submit" className="bg-primary/20 text-primary hover:bg-primary/30 p-2 rounded">
                  <span className="material-symbols-outlined text-lg">add</span>
                </button>
              </form>

              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <p className="text-slate-500 text-sm italic text-center py-4">Nenhuma tarefa registrada.</p>
                ) : tasks.map(task => (
                  <div key={task.id} className="flex items-start gap-3 bg-slate-800/30 p-3 rounded hover:bg-slate-800/50 transition group">
                    <button
                      onClick={() => handleToggleTask(task.id, task.status)}
                      className={`mt-0.5 size-4 rounded border flex items-center justify-center transition ${task.status === 'completed' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500 hover:border-primary'}`}
                    >
                      {task.status === 'completed' && <span className="material-symbols-outlined text-white text-[10px] font-bold">check</span>}
                    </button>
                    <div className="flex-1">
                      <p className={`text-sm ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-white'}`}>
                        {task.title}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">{new Date(task.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadDetails;
