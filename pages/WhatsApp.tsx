import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { WhatsAppConversation, WhatsAppMessage, WhatsAppTemplate } from '../types';

interface WhatsAppProps {
  tenantId: string | null;
}

const WhatsApp: React.FC<WhatsAppProps> = ({ tenantId }) => {
  const [activeSubTab, setActiveSubTab] = useState<'cockpit' | 'chats' | 'sequences' | 'playbook' | 'connections'>('cockpit');
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const subTabs = [
    { id: 'cockpit', label: 'Cockpit SDR', icon: 'smart_toy' },
    { id: 'chats', label: 'Conversas', icon: 'chat_bubble' },
    { id: 'sequences', label: 'Sequências', icon: 'alt_route' },
    { id: 'playbook', label: 'Playbook IA', icon: 'menu_book' },
    { id: 'connections', label: 'Conexões', icon: 'api' },
  ];

  useEffect(() => {
    if (tenantId) {
      fetchConversations();
      fetchTemplates();
    }
  }, [tenantId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    const { data } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('last_message_at', { ascending: false });
    if (data) setConversations(data as WhatsAppConversation[]);
  };

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (data) setTemplates(data as WhatsAppTemplate[]);
  };

  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as WhatsAppMessage[]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !newMessage.trim()) return;

    const { data: msg, error } = await supabase.from('whatsapp_messages').insert({
      conversation_id: selectedConversation.id,
      direction: 'outbound',
      content: newMessage,
      status: 'sent'
    }).select().single();

    if (!error && msg) {
      setMessages([...messages, msg as WhatsAppMessage]);
      setNewMessage('');
      await supabase.from('whatsapp_conversations').update({
        last_message_at: new Date().toISOString()
      }).eq('id', selectedConversation.id);

      setTimeout(async () => {
        const { data: reply } = await supabase.from('whatsapp_messages').insert({
          conversation_id: selectedConversation.id,
          direction: 'inbound',
          content: 'Obrigado pelo contato! Um atendente responderá em breve.',
          status: 'delivered'
        }).select().single();
        if (reply) setMessages(prev => [...prev, reply as WhatsAppMessage]);
      }, 2000);
    }
  };

  const handleCreateMockConversation = async () => {
    const phone = prompt('Digite um número de telefone (Ex: 5511999999999):');
    if (!phone) return;
    const { data: conv } = await supabase.from('whatsapp_conversations').insert({
      tenant_id: tenantId,
      phone_number: phone,
      status: 'open'
    }).select().single();
    if (conv) {
      setConversations([conv as WhatsAppConversation, ...conversations]);
      setSelectedConversation(conv as WhatsAppConversation);
    }
  };

  const renderContent = () => {
    switch (activeSubTab) {
      case 'cockpit':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Conversas Ativas', value: '42', delta: '+12%', icon: 'forum', color: 'text-blue-400' },
                { label: 'Taxa de IA', value: '88%', delta: 'Autonomia', icon: 'processor', color: 'text-emerald-400' },
                { label: 'Leads Qualificados', value: '15', delta: 'Últimos 7 dias', icon: 'verified', color: 'text-purple-400' },
                { label: 'Tempo Médio Resposta', value: '45s', delta: 'IA Ativa', icon: 'timer', color: 'text-amber-400' },
              ].map((kpi, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/[0.07] transition group">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`material-symbols-outlined ${kpi.color} text-2xl`}>{kpi.icon}</span>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">{kpi.delta}</span>
                  </div>
                  <h4 className="text-3xl font-black mb-1 tracking-tight">{kpi.value}</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{kpi.label}</p>
                </div>
              ))}
            </div>

            {/* AI Status & Recent Signals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-black text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">psychology</span>
                    Fluxo de Pensamento do SDR IA
                  </h3>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">
                      <span className="size-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      Online
                    </span>
                  </div>
                </div>
                <div className="space-y-6">
                  {[
                    { time: 'Agora', lead: '+55 11 999...', action: 'Qualificando', detail: 'Identificando orçamento e urgência.' },
                    { time: '2m atrás', lead: '+55 21 988...', action: 'Agendamento', detail: 'Enviou link da agenda para reunião.' },
                    { time: '15m atrás', lead: '+55 31 977...', action: 'Nutrição', detail: 'Enviou PDF de apresentação do CRM.' },
                  ].map((log, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className="size-2 rounded-full bg-primary ring-4 ring-primary/20" />
                        {i !== 2 && <div className="w-[1px] h-12 bg-white/10 my-1" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-black text-slate-500">{log.time}</span>
                          <span className="text-xs font-black text-white">{log.lead}</span>
                          <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase">{log.action}</span>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed font-medium">{log.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="font-black text-white mb-6">Maturidade do SDR</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                        <span>Precisão de Resposta</span>
                        <span className="text-primary">94%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[94%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                        <span>ICP Discovery</span>
                        <span className="text-emerald-400">82%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 w-[82%]" />
                      </div>
                    </div>
                    <button className="w-full mt-4 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition">Treinar IA com Novos Dados</button>
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 size-40 bg-primary/20 blur-3xl rounded-full" />
              </div>
            </div>
          </div>
        );
      case 'chats':
        return (
          <div className="flex h-[calc(100vh-280px)] bg-white/5 border border-white/10 rounded-3xl overflow-hidden animate-in fade-in duration-500">
            {/* Sidebar Conversas */}
            <div className="w-80 border-r border-white/10 flex flex-col bg-slate-900/50">
              <div className="p-4 border-b border-white/5">
                <button
                  onClick={handleCreateMockConversation}
                  className="w-full bg-primary/10 hover:bg-primary/20 text-primary py-3 rounded-2xl border border-primary/20 mb-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Nova Conversa
                </button>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white" placeholder="Buscar conversas..." />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {conversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 rounded-2xl cursor-pointer transition relative group ${selectedConversation?.id === conv.id ? 'bg-primary border border-primary text-white' : 'bg-white/5 border border-white/5 hover:bg-white/10'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm">{conv.phone_number}</span>
                      <span className={`text-[9px] font-black opacity-60`}>12:45</span>
                    </div>
                    <p className={`text-[10px] truncate opacity-60 font-bold uppercase tracking-tight`}>Aguardando Resposta</p>
                    {conv.status === 'open' && <div className="absolute right-4 bottom-4 size-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-900/30">
              {selectedConversation ? (
                <>
                  <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                        <span className="material-symbols-outlined font-black">person</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{selectedConversation.phone_number}</h3>
                        <div className="flex items-center gap-2">
                          <span className="size-2 bg-emerald-400 rounded-full animate-pulse" />
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SDR IA Ativo</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 transition">Pausar IA</button>
                      <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 transition">Assumir Atendimento</button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[60%] p-5 rounded-3xl shadow-xl ${msg.direction === 'outbound'
                            ? 'bg-primary text-white rounded-tr-none'
                            : 'bg-white/10 text-white rounded-tl-none border border-white/10'
                          }`}>
                          <p className="font-medium leading-relaxed">{msg.content}</p>
                          <div className={`text-[9px] mt-2 flex items-center gap-2 font-black uppercase opacity-60 ${msg.direction === 'outbound' ? 'justify-end' : ''}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {msg.direction === 'outbound' && <span className="material-symbols-outlined text-[10px]">done_all</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 bg-white/5 border-t border-white/10">
                    <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto">
                      <button type="button" className="text-slate-400 hover:text-white p-2">
                        <span className="material-symbols-outlined">attach_file</span>
                      </button>
                      <input
                        type="text"
                        className="flex-1 bg-white/10 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                        placeholder="Escreva como o SDR IA ou envie uma mensagem direta..."
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-primary hover:bg-blue-600 disabled:opacity-50 text-white px-8 rounded-2xl shadow-xl shadow-primary/20 transition font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">send</span>
                        Enviar
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 animate-pulse">
                  <div className="size-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-5xl opacity-20">chat_bubble</span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Selecione um lead para iniciar a conversa</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'sequences':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-primary/50 transition cursor-pointer group">
              <div className="flex justify-between items-start mb-6">
                <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <span className="material-symbols-outlined font-black">schedule</span>
                </div>
                <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-black rounded-full uppercase">Ativo</div>
              </div>
              <h3 className="font-black text-white text-lg mb-2">Follow-up: Resgate Frio</h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">Cadência de 4 mensagens para leads que não respondem há 2 dias. Foco em urgência.</p>
              <div className="flex items-center gap-6 pt-6 border-t border-white/5">
                <div>
                  <p className="text-lg font-black text-white">128</p>
                  <p className="text-[9px] text-slate-500 font-black uppercase">Fila</p>
                </div>
                <div>
                  <p className="text-lg font-black text-emerald-400">14%</p>
                  <p className="text-[9px] text-slate-500 font-black uppercase">Resgate</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-slate-500 hover:text-primary hover:border-primary/50 transition cursor-pointer gap-4">
              <span className="material-symbols-outlined text-4xl">add_circle</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Criar Nova Automação</span>
            </div>
          </div>
        );
      case 'playbook':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-8">
              <h3 className="font-black text-white text-xl">Diretrizes da IA</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Tom de Voz</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Consultivo', 'Amigável', 'Executivo'].map(t => (
                      <button key={t} className={`py-2 text-[10px] font-black uppercase rounded-xl border ${t === 'Consultivo' ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Objetivo Primário</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none">
                    <option>Qualificar e Agendar Reunião</option>
                    <option>Responder Dúvidas e Enviar Link de Check-out</option>
                    <option>Somente Qualificação Geral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Zonas Proibidas (No-Go)</label>
                  <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm text-white h-32 focus:border-primary outline-none"
                    placeholder="Ex: Não dar descontos sem aprovação, não falar da concorrência X..."
                  />
                </div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <h3 className="font-black text-white text-xl mb-6">Discovery Script</h3>
              <div className="space-y-4">
                {[
                  { q: 'Pergunta 1', text: 'Você já utiliza algum sistema de gestão hoje?' },
                  { q: 'Pergunta 2', text: 'Qual é o tamanho atual do seu time de vendas?' },
                  { q: 'Pergunta 3', text: 'Qual é a sua principal dor no processo comercial?' },
                ].map((s, i) => (
                  <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{s.q}</p>
                    <p className="text-sm font-medium text-white">{s.text}</p>
                  </div>
                ))}
                <button className="w-full py-4 mt-6 border border-dashed border-white/10 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-primary hover:border-primary/50 transition">Adicionar Pergunta de Diagnóstico</button>
              </div>
            </div>
          </div>
        );
      case 'connections':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex items-center justify-between group">
              <div className="flex items-center gap-6">
                <div className="size-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <span className="material-symbols-outlined text-4xl">cloud_done</span>
                </div>
                <div>
                  <h3 className="font-black text-white text-lg">WhatsApp Cloud API</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">WABA: 772922139...</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-emerald-400">check_circle</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex items-center justify-between group">
              <div className="flex items-center gap-6">
                <div className="size-16 rounded-3xl bg-slate-500/10 flex items-center justify-center text-slate-400 border border-white/10">
                  <span className="material-symbols-outlined text-4xl">link_off</span>
                </div>
                <div>
                  <h3 className="font-black text-white text-lg">Twilio API</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Não Conectado</p>
                </div>
              </div>
              <button className="text-[10px] font-black uppercase text-primary hover:underline">Configurar</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8 text-white min-h-screen bg-background-dark">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-emerald-400">chat_bubble</span>
            Gestor WhatsApp
          </h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Operação Conversacional & Inbound SDR IA</p>
        </div>

        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 overflow-x-auto">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeSubTab === tab.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

export default WhatsApp;
