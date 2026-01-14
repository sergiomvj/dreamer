
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import StrategySetup from './pages/StrategySetup';
import LeadSignals from './pages/LeadSignals';
import DecisionEngine from './pages/DecisionEngine';
import SDRCommand from './pages/SDRCommand';
import Insights from './pages/Insights';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'strategy': return <StrategySetup />;
      case 'leads': return <LeadSignals />;
      case 'decisions': return <DecisionEngine />;
      case 'sdr': return <SDRCommand />;
      case 'insights': return <Insights />;
      case 'products':
      case 'orchestration':
      case 'playbooks': 
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center">
            <span className="material-symbols-outlined text-6xl mb-4">construction</span>
            <p className="text-xl font-bold uppercase tracking-widest">{activeTab.replace('_', ' ')}</p>
            <p className="mt-2 font-medium">Módulo em desenvolvimento cognitivo pela equipe Antigravity.</p>
          </div>
        );
      case 'settings':
        return (
          <div className="p-8 max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
            <h2 className="text-2xl font-black">Configurações do Sistema</h2>
            <div className="bg-card-dark border border-border-dark p-8 rounded-2xl space-y-8">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">Nível de Autonomia da IA</label>
                <input type="range" className="w-full accent-primary h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                <div className="flex justify-between text-[10px] font-black text-slate-500 mt-4 tracking-widest">
                  <span>ASSISTIDA</span>
                  <span>CO-PILOTO</span>
                  <span>AUTÔNOMA</span>
                </div>
              </div>
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">Auto-Handoff</span>
                      <span className="text-[10px] text-slate-500 text-left">Escalar automaticamente para SDR humano em casos de urgência.</span>
                    </div>
                    <div className="size-6 bg-primary rounded shadow-lg shadow-primary/20 flex items-center justify-center">
                       <span className="material-symbols-outlined text-white text-sm">check</span>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        );
      default: return <Dashboard />;
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  return (
    <div className="flex h-screen bg-background-dark font-display overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
      />
      
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-border-dark flex items-center justify-between px-4 lg:px-8 bg-background-dark/80 backdrop-blur-md sticky top-0 z-30">
          {/* Logo on Left for Mobile, Context for Desktop */}
          <div className="flex items-center gap-4">
            <div className="flex lg:hidden items-center gap-2">
              <div className="bg-primary size-7 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-lg">polyline</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-tight leading-none">Dreamer</span>
                <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">The Lead Machine</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-widest">{activeTab}</span>
              <span className="text-slate-700">|</span>
              <span className="text-[10px] font-bold text-primary animate-pulse uppercase tracking-widest">Modo Cognitivo Ativo</span>
            </div>
          </div>

          {/* Controls and Menu on Right */}
          <div className="flex items-center gap-3 lg:gap-6">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <span className="size-2 bg-emerald-500 rounded-full"></span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Vitals: Normal</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-white uppercase leading-none mb-0.5">Admin Operator</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Dreamer Corp</p>
              </div>
              <div className="size-9 lg:size-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-primary overflow-hidden shadow-sm">
                 <img src="https://picsum.photos/100/100?seed=stitch" alt="Avatar" className="w-full h-full object-cover grayscale opacity-80" />
              </div>
            </div>

            {/* Mobile Sandwich Menu on the Right */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -mr-2 text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
              aria-label="Open Menu"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-surface-dark/20">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
