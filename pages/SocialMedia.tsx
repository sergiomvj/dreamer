import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface SocialMediaProps {
  tenantId: string | null;
}

interface SocialPost {
  id: string;
  scheduled_at: string;
  body_text: string;
  status: 'scheduled' | 'published' | 'failed';
  metrics?: { likes: number; comments: number };
  social_channels?: { platform: string; account_name: string };
}

const SocialMedia: React.FC<SocialMediaProps> = ({ tenantId }) => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isCreating, setIsCreating] = useState(false);
  const [newPost, setNewPost] = useState({
    body_text: '',
    scheduled_date: '',
    scheduled_time: '10:00'
  });

  const [drafts, setDrafts] = useState<any[]>([]);

  useEffect(() => {
    fetchPosts();
    fetchDrafts();
  }, [tenantId, currentMonth]);

  const fetchDrafts = async () => {
    if (!tenantId) return;
    // Fetch published content from Phase 1
    const { data } = await supabase
      .from('content_ideas')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    
    if (data) setDrafts(data);
  };

  const fetchPosts = async () => {
    if (!tenantId) return;
    setLoading(true);
    
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString();

    const { data, error } = await supabase
      .from('social_posts')
      .select('*, social_channels(platform, account_name)')
      .eq('tenant_id', tenantId)
      .gte('scheduled_at', startOfMonth)
      .lte('scheduled_at', endOfMonth)
      .order('scheduled_at', { ascending: true });

    if (!error && data) {
      setPosts(data as SocialPost[]);
    }
    setLoading(false);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    // Create a mock channel if none exists
    const { data: channels } = await supabase.from('social_channels').select('id').eq('tenant_id', tenantId).limit(1);
    let channelId = channels?.[0]?.id;

    if (!channelId) {
      const { data: newChannel } = await supabase.from('social_channels').insert({
        tenant_id: tenantId,
        platform: 'linkedin',
        account_name: 'Minha Empresa',
        status: 'active'
      }).select().single();
      channelId = newChannel?.id;
    }

    const scheduledAt = new Date(`${newPost.scheduled_date}T${newPost.scheduled_time}:00`).toISOString();

    const { error } = await supabase.from('social_posts').insert({
      tenant_id: tenantId,
      channel_id: channelId,
      body_text: newPost.body_text,
      scheduled_at: scheduledAt,
      status: 'scheduled'
    });

    if (error) {
      alert('Erro ao agendar post: ' + error.message);
    } else {
      setIsCreating(false);
      setNewPost({ body_text: '', scheduled_date: '', scheduled_time: '10:00' });
      fetchPosts();
    }
  };

  // Calendar Logic
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(); // 0 = Sunday

  const renderCalendarDays = () => {
    const days = [];
    // Empty cells for previous month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="bg-slate-900/30 border border-slate-800 h-32"></div>);
    }
    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0];
      const dayPosts = posts.filter(p => p.scheduled_at.startsWith(dateStr));

      days.push(
        <div key={day} className="bg-surface-dark border border-border-dark h-32 p-2 overflow-y-auto hover:bg-slate-800/50 transition relative group">
          <span className="text-slate-500 font-bold text-sm absolute top-2 right-2">{day}</span>
          
          <div className="mt-6 space-y-1">
            {dayPosts.map(post => (
              <div key={post.id} className={`text-[10px] p-1.5 rounded truncate font-medium ${
                post.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {new Date(post.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {post.body_text}
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => {
              setNewPost(prev => ({ ...prev, scheduled_date: dateStr }));
              setIsCreating(true);
            }}
            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 bg-primary text-white size-6 rounded-full flex items-center justify-center transition shadow-lg"
          >
            <span className="material-symbols-outlined text-sm">add</span>
          </button>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="flex h-full text-white">
      {/* Sidebar: Content Drafts */}
      <div className="w-80 bg-surface-dark border-r border-border-dark flex flex-col">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-xl font-bold">Conteúdos Publicados</h2>
          <p className="text-xs text-slate-400">Clique para agendar</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {drafts.length === 0 ? (
            <p className="text-slate-500 text-sm text-center">Nenhum conteúdo publicado na Fase 1.</p>
          ) : drafts.map(draft => (
            <div 
              key={draft.id} 
              className="bg-slate-800/50 p-3 rounded-lg border border-transparent hover:border-primary cursor-pointer group transition"
              onClick={() => {
                setNewPost({ ...newPost, body_text: draft.content_draft || draft.idea_text });
                setIsCreating(true);
              }}
            >
              <h4 className="font-bold text-sm text-white mb-1 line-clamp-1">{draft.idea_text}</h4>
              <p className="text-xs text-slate-400 line-clamp-2">{draft.content_draft}</p>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition">
                <span className="material-symbols-outlined text-sm">schedule</span>
                Agendar
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 overflow-y-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Redes Sociais</h1>
          <p className="text-slate-400 mt-1">Planeje e publique conteúdo em todos os canais.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-2 hover:text-white text-slate-400">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className="font-bold px-2 min-w-[120px] text-center">
              {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-2 hover:text-white text-slate-400">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition"
          >
            <span className="material-symbols-outlined">edit_calendar</span>
            Agendar Post
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-dark border border-border-dark rounded-xl p-6 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-6">Novo Post</h3>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Conteúdo</label>
                <textarea 
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none min-h-[120px]"
                  placeholder="O que você quer compartilhar?"
                  value={newPost.body_text}
                  onChange={e => setNewPost({...newPost, body_text: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Data</label>
                  <input 
                    type="date" 
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none"
                    value={newPost.scheduled_date}
                    onChange={e => setNewPost({...newPost, scheduled_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Hora</label>
                  <input 
                    type="time" 
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none"
                    value={newPost.scheduled_time}
                    onChange={e => setNewPost({...newPost, scheduled_time: e.target.value})}
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg transition"
                >
                  Agendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-border-dark border border-border-dark rounded-xl overflow-hidden shadow-2xl">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="bg-slate-800 py-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            {day}
          </div>
        ))}
        {renderCalendarDays()}
      </div>
      </div>
    </div>
  );
};

export default SocialMedia;
