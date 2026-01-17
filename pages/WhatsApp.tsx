import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { WhatsAppConversation, WhatsAppMessage, WhatsAppTemplate } from '../types';

interface WhatsAppProps {
  tenantId: string | null;
}

const WhatsApp: React.FC<WhatsAppProps> = ({ tenantId }) => {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'chats' | 'templates'>('chats');
  const [loading, setLoading] = useState(false);

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

    // 1. Insert Outbound Message
    const { data: msg, error } = await supabase.from('whatsapp_messages').insert({
      conversation_id: selectedConversation.id,
      direction: 'outbound',
      content: newMessage,
      status: 'sent'
    }).select().single();

    if (!error && msg) {
      setMessages([...messages, msg as WhatsAppMessage]);
      setNewMessage('');
      
      // Update Conversation Last Message
      await supabase.from('whatsapp_conversations').update({
        last_message_at: new Date().toISOString()
      }).eq('id', selectedConversation.id);

      // Mock Auto-Reply
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

  return (
    <div className="flex h-full text-white">
      {/* Sidebar */}
      <div className="w-80 bg-surface-dark border-r border-border-dark flex flex-col">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-xl font-bold mb-4">WhatsApp</h2>
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button 
              onClick={() => setActiveTab('chats')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${activeTab === 'chats' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Conversas
            </button>
            <button 
              onClick={() => setActiveTab('templates')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${activeTab === 'templates' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Templates
            </button>
          </div>
        </div>

        {activeTab === 'chats' ? (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <button 
                onClick={handleCreateMockConversation}
                className="w-full bg-white/5 hover:bg-white/10 text-slate-300 py-2 rounded border border-dashed border-slate-600 mb-4 text-xs font-bold"
              >
                + Nova Conversa (Mock)
              </button>
              {conversations.map(conv => (
                <div 
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition ${selectedConversation?.id === conv.id ? 'bg-primary/20 border border-primary/50' : 'bg-slate-800/30 border border-transparent hover:bg-slate-800'}`}
                >
                  <div className="flex justify-between">
                    <span className="font-bold text-sm">{conv.phone_number}</span>
                    <span className="text-[10px] text-slate-500">{new Date(conv.last_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 truncate">Clique para ver mensagens</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4">
            <p className="text-slate-500 text-sm text-center italic">Gerenciamento de Templates em breve.</p>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-background-dark">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border-dark flex justify-between items-center bg-surface-dark">
              <div>
                <h3 className="font-bold">{selectedConversation.phone_number}</h3>
                <p className="text-xs text-slate-400">Via WhatsApp Business API</p>
              </div>
              <button className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-xl text-sm ${
                    msg.direction === 'outbound' 
                      ? 'bg-emerald-600 text-white rounded-tr-none' 
                      : 'bg-slate-700 text-white rounded-tl-none'
                  }`}>
                    <p>{msg.content}</p>
                    <div className={`text-[10px] mt-1 text-right ${msg.direction === 'outbound' ? 'text-emerald-200' : 'text-slate-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      {msg.direction === 'outbound' && (
                        <span className="ml-1 material-symbols-outlined text-[10px] align-middle">done_all</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 bg-surface-dark border-t border-border-dark">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <button type="button" className="text-slate-400 hover:text-white p-2">
                  <span className="material-symbols-outlined">attach_file</span>
                </button>
                <input 
                  type="text" 
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-full px-4 py-2 text-white focus:border-emerald-500 outline-none"
                  placeholder="Digite uma mensagem..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white p-2 rounded-full shadow-lg transition"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-20">chat</span>
            <p>Selecione uma conversa para iniciar o atendimento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsApp;
