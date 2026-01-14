
import React, { useState, useRef, useEffect } from 'react';
import { processSDRInteraction } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
  sentiment?: string;
  cognitivePath?: string;
  nextStep?: string;
}

const SDRCommand: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      text: 'Olá! Sou o SDR Virtual da Stitch. Vi que você tem interesse em otimizar sua aquisição corporativa. Qual é o seu maior gargalo hoje?',
      cognitivePath: 'Initial diagnostic hook focusing on corporate acquisition challenges.',
      nextStep: 'Identify pain points'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMsg: Message = { role: 'user', text: inputValue };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputValue('');
    setLoading(true);

    try {
      const result = await processSDRInteraction(newHistory.map(m => ({ role: m.role, text: m.text })));
      const sdrMsg: Message = { 
        role: 'model', 
        text: result.reply,
        sentiment: result.sentiment,
        cognitivePath: result.cognitivePath,
        nextStep: result.recommendedNextStep
      };
      setMessages(prev => [...prev, sdrMsg]);
      setLastAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 h-[calc(100vh-64px)] flex flex-col">
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h2 className="text-3xl font-black tracking-tight">SDR Virtual Cognitivo</h2>
          <p className="text-slate-500 mt-1">Simulação e Monitoramento de Diálogos Guiados.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <span className="size-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-500 uppercase">AI Cognitive Engine Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 flex-1 min-h-0">
        {/* Left Panel: Cognitive Insights */}
        <div className="col-span-12 lg:col-span-4 space-y-6 overflow-y-auto custom-scrollbar pr-2">
          <div className="bg-card-dark border border-border-dark rounded-2xl p-6">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Cognitive Insight Panel</h4>
            {lastAnalysis ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-2">Sentiment Detected</label>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                    lastAnalysis.sentiment === 'POSITIVE' ? 'bg-emerald-500/20 text-emerald-500' :
                    lastAnalysis.sentiment === 'NEGATIVE' ? 'bg-rose-500/20 text-rose-500' :
                    lastAnalysis.sentiment === 'URGENT' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-700 text-slate-300'
                  }`}>
                    <span className="material-symbols-outlined text-sm">
                      {lastAnalysis.sentiment === 'POSITIVE' ? 'mood' : 'sentiment_neutral'}
                    </span>
                    {lastAnalysis.sentiment}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-2">Cognitive Reasoning</label>
                  <p className="text-sm text-slate-400 italic leading-relaxed bg-surface-dark p-4 rounded-xl border border-white/5">
                    "{lastAnalysis.cognitivePath}"
                  </p>
                </div>

                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
                  <h5 className="text-xs font-black text-primary uppercase mb-2">Recommended Strategy</h5>
                  <p className="text-sm font-bold text-slate-200">{lastAnalysis.recommendedNextStep}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">Lead Score Impact:</span>
                    <span className={`text-xs font-bold ${lastAnalysis.scoreUpdate >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {lastAnalysis.scoreUpdate >= 0 ? '+' : ''}{lastAnalysis.scoreUpdate}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-600">
                <span className="material-symbols-outlined text-4xl mb-2">insights</span>
                <p className="text-xs font-bold">Inicie o diálogo para ver a análise cognitiva em tempo real.</p>
              </div>
            )}
          </div>

          <div className="bg-surface-dark border border-border-dark rounded-2xl p-6">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Tree Navigation</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 opacity-50">
                <div className="size-2 bg-slate-600 rounded-full"></div>
                <span className="text-xs font-medium">1. Qualification Intro</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-2 bg-primary rounded-full ring-4 ring-primary/20"></div>
                <span className="text-xs font-bold text-white">2. Pain Point Discovery</span>
              </div>
              <div className="flex items-center gap-3 opacity-50">
                <div className="size-2 bg-slate-600 rounded-full"></div>
                <span className="text-xs font-medium">3. Solution Alignment</span>
              </div>
              <div className="flex items-center gap-3 opacity-50">
                <div className="size-2 bg-slate-600 rounded-full"></div>
                <span className="text-xs font-medium">4. Human Handoff / Demo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Chat Interface */}
        <div className="col-span-12 lg:col-span-8 bg-card-dark border border-border-dark rounded-2xl flex flex-col min-h-0 overflow-hidden shadow-2xl">
          <div className="p-4 bg-surface-dark border-b border-border-dark flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
                <span className="material-symbols-outlined">smart_toy</span>
              </div>
              <div>
                <p className="text-sm font-bold">Virtual SDR Simulator</p>
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 bg-emerald-500 rounded-full"></span>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Cognitive Mode Enabled</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setMessages([{ role: 'model', text: 'Olá! Como posso ajudar sua empresa hoje?' }])}
                className="text-slate-400 hover:text-white p-2"
              >
                <span className="material-symbols-outlined text-lg">restart_alt</span>
              </button>
            </div>
          </div>
          
          <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-surface-dark text-slate-200 rounded-tl-none border border-border-dark'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  {msg.sentiment && (
                    <div className="mt-2 flex items-center gap-2 opacity-60">
                       <span className="text-[9px] font-black uppercase tracking-tighter">SDR Tone: {msg.sentiment}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-surface-dark p-4 rounded-2xl rounded-tl-none border border-border-dark">
                  <div className="flex gap-1">
                    <div className="size-1.5 bg-primary rounded-full animate-bounce"></div>
                    <div className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-surface-dark border-t border-border-dark shrink-0">
            <div className="relative group">
              <input 
                className="w-full bg-background-dark border-border-dark rounded-xl py-4 pl-6 pr-14 text-sm text-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                placeholder="Responda como se fosse o Lead para testar o SDR..."
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button 
                onClick={handleSendMessage}
                disabled={loading || !inputValue.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary hover:bg-blue-600 disabled:bg-slate-700 text-white size-10 rounded-lg flex items-center justify-center transition-all shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined text-lg">send</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-600 mt-3 text-center font-medium uppercase tracking-[0.2em]">
              Interaction processed via Gemini 3 Cognitive Intelligence
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SDRCommand;
