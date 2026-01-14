
import React, { useState } from 'react';
import { getCognitiveDiagnostic } from '../services/geminiService';

const StrategySetup: React.FC = () => {
  const [projectInfo, setProjectInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [diagnostic, setDiagnostic] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!projectInfo) return;
    setLoading(true);
    try {
      const result = await getCognitiveDiagnostic(projectInfo);
      setDiagnostic(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in slide-in-from-bottom duration-500">
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-black tracking-tight mb-4">Diagnóstico Inicial de Maturidade</h2>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Descreva sua estratégia de aquisição atual ou projeto futuro para que o Stitch avalie riscos e sugira caminhos estratégicos.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-7 space-y-6">
          <div className="bg-card-dark border border-border-dark p-6 rounded-2xl">
            <label className="block text-sm font-bold mb-3 uppercase tracking-widest text-slate-500">Missão do Projeto</label>
            <textarea
              className="w-full bg-surface-dark border-border-dark rounded-xl p-4 text-slate-200 focus:ring-primary focus:border-primary min-h-[200px]"
              placeholder="Ex: Queremos expandir a operação de SaaS para o mercado corporativo nos próximos 6 meses com foco em inbound..."
              value={projectInfo}
              onChange={(e) => setProjectInfo(e.target.value)}
            />
            <button
              onClick={handleAnalyze}
              disabled={loading || !projectInfo}
              className="mt-6 w-full bg-primary hover:bg-blue-600 disabled:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  Analisando Cognitivamente...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">psychology</span>
                  Gerar Diagnóstico por IA
                </>
              )}
            </button>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5">
          {diagnostic ? (
            <div className="space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="bg-white/5 border border-primary/30 p-8 rounded-2xl relative overflow-hidden">
                <div className="text-center mb-6">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Score de Maturidade</p>
                  <h3 className="text-6xl font-black text-primary">{diagnostic.maturity}%</h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      Riscos Identificados
                    </h4>
                    <ul className="space-y-2">
                      {diagnostic.risks.map((risk: string, i: number) => (
                        <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                          <span className="size-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0"></span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">trending_up</span>
                      Caminhos Estratégicos
                    </h4>
                    <ul className="space-y-2">
                      {diagnostic.strategicPaths.map((path: string, i: number) => (
                        <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                          <span className="size-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0"></span>
                          {path}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl italic text-sm text-slate-400">
                "{diagnostic.executiveSummary}"
              </div>
            </div>
          ) : (
            <div className="h-full bg-card-dark/30 border-2 border-dashed border-border-dark rounded-2xl flex flex-col items-center justify-center text-center p-8">
              <span className="material-symbols-outlined text-6xl text-slate-700 mb-4">analytics</span>
              <p className="text-slate-500 font-bold">Aguardando entrada de dados para iniciar processamento cognitivo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StrategySetup;
