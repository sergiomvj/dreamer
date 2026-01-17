
import React, { useEffect, useMemo, useState } from 'react';
import { getCognitiveDiagnostic, suggestFieldContent, generateStrategyBlueprint } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import LLM_Strategy from '../components/LLM_Strategy';

type Project = {
  id: string;
  name: string;
  mission: string | null;
  global_objectives: string[] | null;
  philosophical_goals: string[] | null;
  constraints: { text: string } | null;
  automation_policy: { autonomy: number } | null;
};

type Product = {
  id: string;
  name: string;
  icp: { text: string } | null;
  pain_map: { text: string } | null;
  awareness_level: string | null;
  decision_type: string | null;
  product_role: string | null;
};

const StrategySetup: React.FC<{ tenantId?: string | null }> = ({ tenantId }) => {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [loading, setLoading] = useState(false);
  const [suggestingField, setSuggestingField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);

  const [projectName, setProjectName] = useState('');
  const [mission, setMission] = useState('');
  const [globalObjectives, setGlobalObjectives] = useState('');
  const [philosophicalGoals, setPhilosophicalGoals] = useState('');
  const [constraintsText, setConstraintsText] = useState('');
  const [autonomy, setAutonomy] = useState(50);

  const [products, setProducts] = useState<Product[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductIcp, setNewProductIcp] = useState('');
  const [newProductPain, setNewProductPain] = useState('');
  const [newProductAwareness, setNewProductAwareness] = useState('unaware');
  const [newProductDecision, setNewProductDecision] = useState('considered');
  const [newProductRole, setNewProductRole] = useState('core');

  type Strategy = {
    id: string;
    name: string;
    strategy_type: string | null;
    hypothesis: string | null;
    status: string | null;
    version: number | null;
  };

  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [newStrategyName, setNewStrategyName] = useState('');
  const [newStrategyType, setNewStrategyType] = useState('awareness');
  const [newStrategyHypothesis, setNewStrategyHypothesis] = useState('');

  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [pace, setPace] = useState<'conservative' | 'hybrid' | 'aggressive'>('hybrid');
  const [allowedChannels, setAllowedChannels] = useState<Record<string, boolean>>({
    outbound: true,
    inbound: true,
    conversational: true
  });

  const canProceed = useMemo(() => {
    if (step === 0) return true;
    if (step === 1) return Boolean(projectName.trim());
    if (step === 2) return Boolean(projectId);
    if (step === 3) return Boolean(projectId);
    return Boolean(projectId);
  }, [step, projectName, projectId]);

  const loadProjects = async () => {
    if (!tenantId) return;
    const { data, error: loadError } = await supabase
      .from('projects')
      .select('id,name,mission,global_objectives,philosophical_goals,constraints,automation_policy')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (loadError) throw loadError;
    setProjects((data || []) as Project[]);
  };

  const loadProducts = async (pId: string) => {
    if (!tenantId) return;
    const { data, error: loadError } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('project_id', pId)
      .order('created_at', { ascending: false });
    if (loadError) throw loadError;
    setProducts((data || []) as Product[]);
  };

  const loadStrategies = async (pId: string) => {
    if (!tenantId) return;
    const { data, error: loadError } = await supabase
      .from('strategies')
      .select('id,name,strategy_type,hypothesis,status,version')
      .eq('tenant_id', tenantId)
      .eq('project_id', pId)
      .order('created_at', { ascending: false });
    if (loadError) throw loadError;
    setStrategies((data || []) as Strategy[]);
  };

  useEffect(() => {
    if (!projectId) {
      setProjectName('');
      setMission('');
      setGlobalObjectives('');
      setPhilosophicalGoals('');
      setConstraintsText('');
      setAutonomy(50);
      setProducts([]);
      setStrategies([]);
      return;
    }
    const p = projects.find((p) => p.id === projectId);
    if (p) {
      setProjectName(p.name);
      setMission(p.mission || '');
      setGlobalObjectives((p.global_objectives || []).join('\n'));
      setPhilosophicalGoals((p.philosophical_goals || []).join('\n'));
      setConstraintsText(p.constraints?.text || '');
      setAutonomy(p.automation_policy?.autonomy ?? 50);
    }
  }, [projectId, projects]);

  useEffect(() => {
    if (!tenantId) return;
    void (async () => {
      setError(null);
      try {
        await loadProjects();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar projetos.');
      }
    })();
  }, [tenantId]);

  useEffect(() => {
    if (!projectId) return;
    void (async () => {
      setError(null);
      try {
        await loadProducts(projectId);
        await loadStrategies(projectId);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar produtos ou estratégias.');
      }
    })();
  }, [projectId]);

  const handleSuggest = async (fieldName: string, setter: (val: string) => void) => {
    setSuggestingField(fieldName);
    const context = {
      project: { projectName, mission, globalObjectives, philosophicalGoals, constraintsText },
      products,
      strategies
    };
    const result = await suggestFieldContent({ fieldName, context });
    if (result.suggestion) {
      setter(result.suggestion);
    }
    setSuggestingField(null);
  };

  const AIHelper: React.FC<{ fieldName: string, setter: (val: string) => void }> = ({ fieldName, setter }) => (
    <button
      onClick={() => handleSuggest(fieldName, setter)}
      disabled={!!suggestingField}
      className={`material-symbols-outlined text-[18px] transition-all hover:scale-110 ${suggestingField === fieldName ? 'text-primary animate-pulse' : 'text-slate-500 hover:text-primary'}`}
      title="Sugerir com IA"
    >
      psychology
    </button>
  );

  const saveProject = async () => {
    if (!tenantId) return;
    setError(null);
    setLoading(true);
    try {
      const objectives = globalObjectives
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const goals = philosophicalGoals
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const projectData = {
        tenant_id: tenantId,
        name: projectName,
        mission,
        global_objectives: objectives,
        philosophical_goals: goals,
        constraints: { text: constraintsText },
        automation_policy: { autonomy }
      };

      let result;
      if (projectId) {
        // Update existing project
        result = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', projectId)
          .eq('tenant_id', tenantId)
          .select('id,name,mission,global_objectives,philosophical_goals,constraints,automation_policy')
          .single();
      } else {
        // Create new project
        result = await supabase
          .from('projects')
          .insert(projectData)
          .select('id,name,mission,global_objectives,philosophical_goals,constraints,automation_policy')
          .single();
      }

      if (result.error) throw result.error;
      const saved = result.data as Project;
      setProjectId(saved.id);
      await loadProjects();
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar projeto.');
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async () => {
    if (!tenantId || !projectId) return;
    setError(null);
    setLoading(true);
    try {
      const { error: insertError } = await supabase.from('products').insert({
        tenant_id: tenantId,
        project_id: projectId,
        name: newProductName,
        icp: { text: newProductIcp },
        pain_map: { text: newProductPain },
        awareness_level: newProductAwareness,
        decision_type: newProductDecision,
        product_role: newProductRole
      });
      if (insertError) throw insertError;
      setNewProductName('');
      setNewProductIcp('');
      setNewProductPain('');
      setNewProductAwareness('unaware');
      setNewProductDecision('considered');
      setNewProductRole('core');
      await loadProducts(projectId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar produto.');
    } finally {
      setLoading(false);
    }
  };

  const addStrategy = async () => {
    if (!tenantId || !projectId) return;
    setError(null);
    setLoading(true);
    try {
      const { error: insertError } = await supabase.from('strategies').insert({
        tenant_id: tenantId,
        project_id: projectId,
        name: newStrategyName,
        strategy_type: newStrategyType,
        hypothesis: newStrategyHypothesis,
        status: 'draft',
        version: 1
      });
      if (insertError) throw insertError;
      setNewStrategyName('');
      setNewStrategyHypothesis('');
      setNewStrategyType('awareness');
      await loadStrategies(projectId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar estratégia.');
    } finally {
      setLoading(false);
    }
  };

  const deleteStrategy = async (id: string) => {
    if (!tenantId) return;
    setError(null);
    setLoading(true);
    try {
      const { error: delError } = await supabase.from('strategies').delete().eq('id', id).eq('tenant_id', tenantId);
      if (delError) throw delError;
      if (projectId) await loadStrategies(projectId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao remover estratégia.');
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!tenantId) return;
    setError(null);
    setLoading(true);
    try {
      const { error: delError } = await supabase.from('products').delete().eq('id', id).eq('tenant_id', tenantId);
      if (delError) throw delError;
      if (projectId) await loadProducts(projectId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao remover produto.');
    } finally {
      setLoading(false);
    }
  };

  const runDiagnostic = async () => {
    if (!projectId) return;
    setError(null);
    setLoading(true);
    try {
      const project = projects.find((p) => p.id === projectId);
      if (!project) {
        throw new Error('Projeto selecionado não encontrado.');
      }

      const payload = {
        project: {
          id: project.id,
          name: project.name,
          mission: project.mission,
          global_objectives: project.global_objectives,
          philosophical_goals: project.philosophical_goals,
          constraints: project.constraints,
          automation_policy: project.automation_policy
        },
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          icp: p.icp,
          pain_map: p.pain_map,
          awareness_level: p.awareness_level,
          decision_type: p.decision_type,
          product_role: p.product_role
        }))
      };
      const result = await getCognitiveDiagnostic(payload);
      setDiagnostic(result);

      if (tenantId) {
        const { data: userData } = await supabase.auth.getUser();
        const actor = userData.user?.id ?? null;
        await supabase.from('audit_log').insert({
          tenant_id: tenantId,
          actor_user_id: actor,
          entity_type: 'project',
          entity_id: projectId,
          action: 'diagnostic',
          payload: result
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar diagnóstico.');
    } finally {
      setLoading(false);
    }
  };

  const bootstrapStrategyLayer = async () => {
    if (!tenantId || !projectId) return;
    setError(null);
    setLoading(true);
    try {
      const project = projects.find(p => p.id === projectId);
      const channels = Object.entries(allowedChannels)
        .filter(([, v]) => v)
        .map(([k]) => k);

      // 1. Create Strategies
      const { data: strategiesData, error: strategyError } = await supabase
        .from('strategies')
        .insert(
          channels.map((c) => ({
            tenant_id: tenantId,
            project_id: projectId,
            name: `${c[0].toUpperCase()}${c.slice(1)} Strategy v0`,
            strategy_type: c,
            hypothesis: `${pace} pace`,
            status: 'draft',
            version: 1
          }))
        )
        .select('id,strategy_type,name');

      if (strategyError) throw strategyError;

      const createdStrategies = (strategiesData || []) as any[];
      const strategyByType = new Map<string, string>();
      for (const s of createdStrategies) {
        strategyByType.set(String(s.strategy_type), String(s.id));
      }

      // 2. Generate and store blueprints for each strategy
      const blueprintPromises = createdStrategies.map(async (s) => {
        const bp = await generateStrategyBlueprint({
          project: project,
          products: products,
          strategyName: s.name,
          strategyType: s.strategy_type
        });

        if (bp) {
          await supabase.from('strategy_blueprints').insert({
            tenant_id: tenantId,
            strategy_id: s.id,
            copy_assets: bp.copy_assets,
            kickoff_plan: bp.kickoff_plan,
            decision_rules: bp.decision_rules
          });
        }
      });

      await Promise.all(blueprintPromises);

      const approachesToCreate = channels.map((c) => ({
        tenant_id: tenantId,
        strategy_id: strategyByType.get(c),
        channel: c,
        format: 'template',
        allowed: true,
        rules: { pace }
      }));

      const { data: approaches, error: approachError } = await supabase.from('approaches').insert(approachesToCreate).select('id,channel');
      if (approachError) throw approachError;

      const approachByChannel = new Map<string, string>();
      for (const a of (approaches || []) as any[]) {
        approachByChannel.set(String(a.channel), String(a.id));
      }

      const flowsToCreate = channels.map((c) => ({
        tenant_id: tenantId,
        approach_id: approachByChannel.get(c),
        name: `${c[0].toUpperCase()}${c.slice(1)} Template Flow`,
        status: 'active',
        version: 1
      }));

      const { data: flows, error: flowError } = await supabase.from('flows').insert(flowsToCreate).select('id,name');
      if (flowError) throw flowError;

      const flowIdByKind = new Map<string, string>();
      for (const f of (flows || []) as any[]) {
        const name = String(f.name || '');
        const kind = name.toLowerCase().includes('outbound')
          ? 'outbound'
          : name.toLowerCase().includes('inbound')
            ? 'inbound'
            : 'conversational';
        flowIdByKind.set(kind, String(f.id));
      }

      const weights = {
        outbound: {
          page_view: 1,
          cta_click: 2,
          form_start: 3,
          form_submit: 10,
          quiz_submit: 12,
          reply: 18,
          call_booked: 30,
          won: 100,
          lost: -50,
          unsubscribe: -20
        },
        inbound: {
          page_view: 1,
          cta_click: 4,
          form_start: 5,
          form_submit: 14,
          quiz_submit: 18,
          reply: 12,
          call_booked: 25,
          won: 100,
          lost: -50,
          unsubscribe: -25
        },
        conversational: {
          page_view: 1,
          cta_click: 3,
          form_start: 4,
          form_submit: 10,
          quiz_submit: 15,
          reply: 20,
          call_booked: 28,
          won: 100,
          lost: -50,
          unsubscribe: -15
        }
      } as const;

      const eventTypesPayload: Array<{ tenant_id: string; flow_id: string; code: string; description: string; weight: number; schema: any }> = [];

      for (const kind of channels) {
        const flowId = flowIdByKind.get(kind);
        if (!flowId) continue;
        const kindWeights = (weights as any)[kind] as Record<string, number>;
        for (const [code, weight] of Object.entries(kindWeights)) {
          eventTypesPayload.push({
            tenant_id: tenantId,
            flow_id: flowId,
            code,
            description: code,
            weight,
            schema: {}
          });
        }
      }

      if (eventTypesPayload.length) {
        const { error: eventTypesError } = await supabase.from('event_types').insert(eventTypesPayload);
        if (eventTypesError) throw eventTypesError;
      }

      setStep(0);
      setDiagnostic(null);
      await loadProjects();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar setup.');
    } finally {
      setLoading(false);
    }
  };

  if (!tenantId) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="bg-card-dark border border-border-dark p-6 rounded-2xl text-slate-400">
          Selecione um workspace para iniciar o onboarding estratégico.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in slide-in-from-bottom duration-500 space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Projetos & Onboarding</h2>
          <p className="text-slate-500 mt-1">Wizard de Foundation Flow (projeto → produtos → diagnóstico → escopo).</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-primary">hub</span>
            <span className="text-xs font-bold uppercase tracking-widest">Tenant</span>
          </div>
        </div>
      </div>

      {error && <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">{error}</div>}

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {[
            { id: 0, title: 'Selecionar / Criar' },
            { id: 1, title: 'Project DNA' },
            { id: 2, title: 'Produtos' },
            { id: 3, title: 'Estratégias' },
            { id: 4, title: 'Diagnóstico & Escopo' }
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStep(s.id as any)}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${step === s.id ? 'bg-primary/10 border-primary/30' : 'bg-card-dark border-border-dark hover:bg-white/5'
                }`}
            >
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Step {s.id + 1}</p>
              <p className="font-bold">{s.title}</p>
            </button>
          ))}

          <LLM_Strategy storageKeyPrefix="dreamer.llm" />
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-6">
          {step === 0 && (
            <div className="bg-card-dark border border-border-dark rounded-2xl p-6 space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-black">Projetos</h3>
                <p className="text-sm text-slate-500">Selecione um existente ou crie um novo via wizard.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setProjectId(p.id);
                      setProjectName(p.name);
                      setMission(p.mission || '');
                      setGlobalObjectives((p.global_objectives || []).join('\n'));
                      setPhilosophicalGoals((p.philosophical_goals || []).join('\n'));
                      setConstraintsText(p.constraints?.text || '');
                      setAutonomy(p.automation_policy?.autonomy ?? 50);
                      setStep(2);
                    }}
                    className={`p-5 rounded-2xl border text-left hover:bg-white/5 transition-colors ${projectId === p.id ? 'border-primary/30 bg-primary/10' : 'border-border-dark bg-surface-dark/30'
                      }`}
                  >
                    <p className="font-bold">{p.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">{p.id}</p>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="bg-primary hover:bg-blue-600 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Criar novo projeto
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="bg-card-dark border border-border-dark rounded-2xl p-6 space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-black">Project DNA</h3>
                <p className="text-sm text-slate-500">Estratégia antes de lead. Governança antes de automação.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Project name</label>
                  <input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-slate-200 focus:ring-primary focus:border-primary"
                    placeholder="Ex: B2B Enterprise Expansion"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mission</label>
                    <AIHelper fieldName="Mission" setter={setMission} />
                  </div>
                  <textarea
                    value={mission}
                    onChange={(e) => setMission(e.target.value)}
                    className="w-full bg-surface-dark border border-border-dark rounded-xl p-4 text-slate-200 focus:ring-primary focus:border-primary min-h-[120px]"
                    placeholder="Ex: Expandir SaaS para mercado corporativo com governança de aquisição."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global objectives (1 por linha)</label>
                      <AIHelper fieldName="Global Objectives" setter={setGlobalObjectives} />
                    </div>
                    <textarea
                      value={globalObjectives}
                      onChange={(e) => setGlobalObjectives(e.target.value)}
                      className="w-full bg-surface-dark border border-border-dark rounded-xl p-4 text-slate-200 min-h-[120px]"
                      placeholder="Ex:\nAumentar SQL\nReduzir CAC\nAumentar LTV"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Philosophical goals (1 por linha)</label>
                      <AIHelper fieldName="Philosophical Goals" setter={setPhilosophicalGoals} />
                    </div>
                    <textarea
                      value={philosophicalGoals}
                      onChange={(e) => setPhilosophicalGoals(e.target.value)}
                      className="w-full bg-surface-dark border border-border-dark rounded-xl p-4 text-slate-200 min-h-[120px]"
                      placeholder="Ex:\nNão desumanizar\nSem spam\nDecisões explicáveis"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Constraints</label>
                    <AIHelper fieldName="Project Constraints" setter={setConstraintsText} />
                  </div>
                  <textarea
                    value={constraintsText}
                    onChange={(e) => setConstraintsText(e.target.value)}
                    className="w-full bg-surface-dark border border-border-dark rounded-xl p-4 text-slate-200 min-h-[90px]"
                    placeholder="Ex: Não disparar cold WhatsApp sem opt-in. Não aumentar budget sem qualidade mínima."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">AI autonomy</label>
                  <input
                    type="range"
                    value={autonomy}
                    min={0}
                    max={100}
                    onChange={(e) => setAutonomy(Number(e.target.value))}
                    className="w-full accent-primary h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-black text-slate-500 mt-4 tracking-widest">
                    <span>ASSISTIDA</span>
                    <span>CO-PILOTO</span>
                    <span>AUTÔNOMA</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => setStep(0)}
                  className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  Voltar
                </button>
                <button
                  onClick={saveProject}
                  disabled={loading || !projectName.trim()}
                  className="bg-primary hover:bg-blue-600 disabled:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">sync</span>
                      Salvando…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">check</span>
                      Salvar e continuar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-card-dark border border-border-dark rounded-2xl p-6 space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-black">Produtos</h3>
                <p className="text-sm text-slate-500">Unidades estratégicas: ICP, dores e papel do produto.</p>
              </div>

              <div className="bg-surface-dark/50 border border-border-dark rounded-2xl p-6 space-y-6">
                <h4 className="font-black text-lg">Adicionar Produto</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nome do Produto</label>
                    <input
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-slate-200 focus:ring-primary focus:border-primary"
                      placeholder="Ex: SaaS para PMEs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nível de Consciência</label>
                    <select
                      value={newProductAwareness}
                      onChange={(e) => setNewProductAwareness(e.target.value)}
                      className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-slate-200 focus:ring-primary focus:border-primary"
                    >
                      <option value="unaware">Inconsciente</option>
                      <option value="problem-aware">Consciente do Problema</option>
                      <option value="solution-aware">Consciente da Solução</option>
                      <option value="product-aware">Consciente do Produto</option>
                      <option value="most-aware">Totalmente Consciente</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Público-Alvo (ICP)</label>
                      <AIHelper fieldName="Product ICP (Buyer Persona)" setter={setNewProductIcp} />
                    </div>
                    <textarea
                      value={newProductIcp}
                      onChange={(e) => setNewProductIcp(e.target.value)}
                      className="w-full bg-surface-dark border border-border-dark rounded-xl p-4 text-slate-200 min-h-[90px]"
                      placeholder="Quem é e quem não é seu cliente ideal."
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mapa de Dores</label>
                      <AIHelper fieldName="Pain Map (Customer Problems)" setter={setNewProductPain} />
                    </div>
                    <textarea
                      value={newProductPain}
                      onChange={(e) => setNewProductPain(e.target.value)}
                      className="w-full bg-surface-dark border border-border-dark rounded-xl p-4 text-slate-200 min-h-[90px]"
                      placeholder="Quais problemas seu produto resolve."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tipo de Decisão</label>
                    <select
                      value={newProductDecision}
                      onChange={(e) => setNewProductDecision(e.target.value)}
                      className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-slate-200 focus:ring-primary focus:border-primary"
                    >
                      <option value="impulse">Impulso</option>
                      <option value="considered">Considerada</option>
                      <option value="committee">Comitê</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Papel do Produto</label>
                    <select
                      value={newProductRole}
                      onChange={(e) => setNewProductRole(e.target.value)}
                      className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-slate-200 focus:ring-primary focus:border-primary"
                    >
                      <option value="core">Core</option>
                      <option value="entry">Isca/Entrada</option>
                      <option value="upsell">Upsell</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={addProduct}
                    disabled={loading || !newProductName}
                    className="bg-primary hover:bg-blue-600 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">add</span>
                    {loading ? 'Adicionando...' : 'Adicionar Produto'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {products.map((p) => (
                  <div key={p.id} className="bg-surface-dark/30 border border-border-dark rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <p className="font-bold text-lg">{p.name}</p>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1">
                            <span className="font-bold">Consciência:</span> {p.awareness_level || 'N/A'}
                          </div>
                          <div className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1">
                            <span className="font-bold">Decisão:</span> {p.decision_type || 'N/A'}
                          </div>
                          <div className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1">
                            <span className="font-bold">Papel:</span> {p.product_role || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs text-slate-400">
                      <div>
                        <p className="font-bold text-slate-500 uppercase tracking-widest text-[10px] mb-1">ICP</p>
                        <p className="whitespace-pre-wrap">{p.icp?.text || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-500 uppercase tracking-widest text-[10px] mb-1">Dores</p>
                        <p className="whitespace-pre-wrap">{p.pain_map?.text || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  Voltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!projectId}
                  className="bg-primary hover:bg-blue-600 disabled:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-card-dark border border-border-dark rounded-2xl p-6 space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-black">Estratégias</h3>
                <p className="text-sm text-slate-500">Defina as hipóteses e canais de ataque.</p>
              </div>

              <div className="bg-surface-dark/50 border border-border-dark rounded-2xl p-6 space-y-6">
                <h4 className="font-black text-lg">Nova Estratégia</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nome da Estratégia</label>
                    <input
                      value={newStrategyName}
                      onChange={(e) => setNewStrategyName(e.target.value)}
                      className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-slate-200 focus:ring-primary focus:border-primary"
                      placeholder="Ex: Aquisição Inbound Q1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tipo</label>
                    <select
                      value={newStrategyType}
                      onChange={(e) => setNewStrategyType(e.target.value)}
                      className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-slate-200 focus:ring-primary focus:border-primary"
                    >
                      <option value="awareness">Awareness (Topo)</option>
                      <option value="conversion">Conversão (Meio/Fundo)</option>
                      <option value="outbound">Outbound Direto</option>
                      <option value="retention">Retenção / LTV</option>
                    </select>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hipótese Estratégica</label>
                    <AIHelper fieldName="Strategic Hypothesis" setter={setNewStrategyHypothesis} />
                  </div>
                  <textarea
                    value={newStrategyHypothesis}
                    onChange={(e) => setNewStrategyHypothesis(e.target.value)}
                    className="w-full bg-surface-dark border border-border-dark rounded-xl p-4 text-slate-200 min-h-[90px]"
                    placeholder="Se [ação], então [resultado] porque [razão]."
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={addStrategy}
                    disabled={loading || !newStrategyName}
                    className="bg-primary hover:bg-blue-600 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">add</span>
                    {loading ? 'Adicionando...' : 'Adicionar Estratégia'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {strategies.map((s) => (
                  <div key={s.id} className="bg-surface-dark/30 border border-border-dark rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <p className="font-bold text-lg">{s.name}</p>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1">
                            <span className="font-bold">Tipo:</span> {s.strategy_type || 'N/A'}
                          </div>
                          <div className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1">
                            <span className="font-bold">Status:</span> {s.status || 'draft'}
                          </div>
                          <div className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1">
                            <span className="font-bold">v:</span> {s.version || '1'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteStrategy(s.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                    <div className="mt-4 text-xs text-slate-400">
                      <p className="font-bold text-slate-500 uppercase tracking-widest text-[10px] mb-1">Hipótese</p>
                      <p className="whitespace-pre-wrap">{s.hypothesis || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  Voltar
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!projectId}
                  className="bg-primary hover:bg-blue-600 disabled:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                  Continuar
                </button>
              </div>
            </div>
          )}



          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-card-dark border border-border-dark rounded-2xl p-6 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black">Diagnóstico Inicial</h3>
                    <p className="text-sm text-slate-500">Gerar score, riscos e caminhos estratégicos.</p>
                  </div>
                  <button
                    onClick={runDiagnostic}
                    disabled={loading || !projectId}
                    className="bg-primary hover:bg-blue-600 disabled:bg-slate-700 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">sync</span>
                        Processando…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">psychology</span>
                        Gerar diagnóstico
                      </>
                    )}
                  </button>
                </div>

                {diagnostic ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 border border-primary/30 p-6 rounded-2xl">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Score de Maturidade</p>
                      <p className="text-5xl font-black text-primary">{diagnostic.maturity}%</p>
                      <p className="text-sm text-slate-400 italic mt-4">"{diagnostic.executiveSummary}"</p>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-surface-dark/30 border border-border-dark rounded-2xl p-5">
                        <p className="text-xs font-black text-rose-500 uppercase tracking-widest mb-3">Riscos</p>
                        <ul className="space-y-2">
                          {(diagnostic.risks || []).map((r: string, i: number) => (
                            <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                              <span className="size-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0"></span>
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-surface-dark/30 border border-border-dark rounded-2xl p-5">
                        <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-3">Caminhos</p>
                        <ul className="space-y-2">
                          {(diagnostic.strategicPaths || []).map((p: string, i: number) => (
                            <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                              <span className="size-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0"></span>
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-card-dark/30 border-2 border-dashed border-border-dark rounded-2xl flex flex-col items-center justify-center text-center p-8">
                    <span className="material-symbols-outlined text-6xl text-slate-700 mb-4">analytics</span>
                    <p className="text-slate-500 font-bold">Gere o diagnóstico para habilitar setup inicial.</p>
                  </div>
                )}
              </div>

              <div className="bg-card-dark border border-border-dark rounded-2xl p-6 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-xl font-black">Scope & Pace</h3>
                  <p className="text-sm text-slate-500">Escolha ritmo e quais canais podem operar agora.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { id: 'conservative', label: 'Conservative', desc: 'Mais humano, mais controle.' },
                    { id: 'hybrid', label: 'Hybrid', desc: 'Equilíbrio entre automação e humano.' },
                    { id: 'aggressive', label: 'Aggressive', desc: 'Escala rápida com guardrails.' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPace(p.id as any)}
                      className={`p-5 rounded-2xl border text-left transition-colors ${pace === p.id ? 'bg-primary/10 border-primary/30' : 'bg-surface-dark/30 border-border-dark hover:bg-white/5'
                        }`}
                    >
                      <p className="font-black">{p.label}</p>
                      <p className="text-sm text-slate-500 mt-1">{p.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { id: 'outbound', label: 'Outbound' },
                    { id: 'inbound', label: 'Inbound' },
                    { id: 'conversational', label: 'Conversational' }
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setAllowedChannels((prev) => ({ ...prev, [c.id]: !prev[c.id] }))}
                      className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${allowedChannels[c.id] ? 'bg-primary/10 border-primary/30' : 'bg-surface-dark/30 border-border-dark hover:bg-white/5'
                        }`}
                    >
                      <span className="font-bold">{c.label}</span>
                      <span className="material-symbols-outlined text-base">{allowedChannels[c.id] ? 'check' : 'close'}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={() => setStep(3)}
                    className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    Voltar
                  </button>
                  <button
                    onClick={bootstrapStrategyLayer}
                    disabled={loading || !projectId}
                    className="bg-primary hover:bg-blue-600 disabled:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">sync</span>
                        Gerando…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">rocket_launch</span>
                        Gerar setup v0
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end">
        <button
          disabled={loading || !canProceed}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default StrategySetup;
