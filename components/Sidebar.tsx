
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const menuGroups = [
    {
      label: 'Governança',
      items: [
        { id: 'dashboard', label: 'Control Tower', icon: 'dashboard' },
        { id: 'strategy', label: 'Projetos & Onboarding', icon: 'explore' },
      ]
    },
    {
      label: 'Arquitetura',
      items: [
        { id: 'products', label: 'Produtos & Ofertas', icon: 'shopping_bag' },
        { id: 'orchestration', label: 'Orquestração (Fluxos)', icon: 'account_tree' },
      ]
    },
    {
      label: 'Inteligência',
      items: [
        { id: 'leads', label: 'Lead Intelligence', icon: 'radar' },
        { id: 'sdr', label: 'SDR Virtual', icon: 'forum' },
        { id: 'decisions', label: 'Decision Engine', icon: 'psychology' },
      ]
    },
    {
      label: 'Performance',
      items: [
        { id: 'insights', label: 'Insights & BI', icon: 'bar_chart' },
        { id: 'playbooks', label: 'Playbook Library', icon: 'library_books' },
      ]
    }
  ];

  return (
    <aside className={`
      fixed lg:relative inset-y-0 left-0 z-50 w-64 border-r border-border-dark flex flex-col h-full bg-background-dark transition-transform duration-300 ease-in-out shrink-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary size-8 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-xl">polyline</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight leading-none">Dreamer</h1>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">The Lead Machine</span>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-1 text-slate-500 hover:text-white"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <nav className="flex-1 px-4 py-2 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">{group.label}</p>
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                  activeTab === item.id 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-primary'}`}>
                  {item.icon}
                </span>
                <span className="text-sm font-bold tracking-tight">{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-border-dark bg-surface-dark/30">
        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Cognitive Core</p>
          <div className="flex items-center gap-2">
            <span className="size-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold text-slate-300 text-left">Active & Interpreting</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
