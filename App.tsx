
import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import StrategySetup from './pages/StrategySetup';
// import LeadSignals from './pages/LeadSignals';
import DecisionEngine from './pages/DecisionEngine';
import SDRCommand from './pages/SDRCommand';
import Insights from './pages/Insights';
import Auth from './pages/Auth';
import Workspace from './pages/Workspace';
import Campaigns from './pages/Campaigns';
import ContentIdeation from './pages/ContentIdeation';
import PaidTraffic from './pages/paid-traffic';
import MetaCallback from './pages/MetaCallback';
import LeadsCRM from './pages/LeadsCRM';
import DataMining from './pages/DataMining';
import Orchestration from './pages/Orchestration';
import WhatsApp from './pages/WhatsApp';
import SocialMedia from './pages/SocialMedia';
import Monetization from './pages/Monetization.tsx';
import Products from './pages/Products.tsx';
import Settings from './pages/Settings.tsx';
import Playbooks from './pages/Playbooks';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(() => {
    try {
      return localStorage.getItem("dreamer.tenant_id");
    } catch {
      return null;
    }
  });
  const [activeTenantName, setActiveTenantName] = useState<string | null>(() => {
    try {
      return localStorage.getItem("dreamer.tenant_name");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUserId(data.session?.user?.id ?? null);
      setAuthLoading(false);
    };

    void init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setAuthLoading(false);
      if (!session) {
        setActiveTenantId(null);
        setActiveTenantName(null);
        try {
          localStorage.removeItem("dreamer.tenant_id");
          localStorage.removeItem("dreamer.tenant_name");
        } catch { }
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    try {
      if (activeTenantId) localStorage.setItem("dreamer.tenant_id", activeTenantId);
      if (activeTenantName) localStorage.setItem("dreamer.tenant_name", activeTenantName);
    } catch { }
  }, [activeTenantId, activeTenantName]);

  useEffect(() => {
    // Handle basic routing
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, []);

  if (currentPath === '/auth/callback/meta') {
    return <MetaCallback />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard tenantId={activeTenantId} setActiveTab={setActiveTab} />;
      case 'strategy': return <StrategySetup tenantId={activeTenantId} />;
      case 'campaigns': return <Campaigns />;
      case 'content-ideation': return <ContentIdeation tenantId={activeTenantId} />;
      case 'paid-traffic': return <PaidTraffic tenantId={activeTenantId} />;
      case 'orchestration': return <Orchestration tenantId={activeTenantId} />;
      case 'datamining': return <DataMining tenantId={activeTenantId} />;
      case 'whatsapp': return <WhatsApp tenantId={activeTenantId} />;
      case 'social-media': return <SocialMedia tenantId={activeTenantId} />;
      case 'leads': return <LeadsCRM tenantId={activeTenantId} />;
      case 'decisions': return <DecisionEngine tenantId={activeTenantId} />;
      case 'sdr': return <SDRCommand tenantId={activeTenantId} />;
      case 'insights': return <Insights tenantId={activeTenantId} />;
      case 'monetization': return <Monetization tenantId={activeTenantId} />;
      case 'products': return <Products tenantId={activeTenantId} />;
      case 'settings': return <Settings tenantId={activeTenantId} />;
      case 'playbooks':
        return <Playbooks tenantId={activeTenantId} />;
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background-dark text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 font-bold">
          <span className="material-symbols-outlined animate-spin">sync</span>
          Carregando…
        </div>
      </div>
    );
  }

  if (!userId) {
    return <Auth />;
  }

  if (!activeTenantId) {
    return (
      <Workspace
        userId={userId}
        activeTenantId={activeTenantId}
        onSelectTenant={(t) => {
          setActiveTenantId(t.id);
          setActiveTenantName(t.name);
        }}
      />
    );
  }

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
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{activeTenantName || "Workspace"}</p>
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
