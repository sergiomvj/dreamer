import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { EmailSequence, EmailSequenceStep } from '../types';

interface SequenceBuilderProps {
  sequence: EmailSequence;
  onBack: () => void;
}

const SequenceBuilder: React.FC<SequenceBuilderProps> = ({ sequence, onBack }) => {
  const [steps, setSteps] = useState<EmailSequenceStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingStep, setIsAddingStep] = useState(false);
  
  // New Step State
  const [newStep, setNewStep] = useState<{
    step_type: 'email' | 'wait' | 'task';
    delay_hours: number;
    subject?: string;
    body_content?: string;
  }>({
    step_type: 'email',
    delay_hours: 24,
    subject: '',
    body_content: ''
  });

  useEffect(() => {
    fetchSteps();
  }, [sequence.id]);

  const fetchSteps = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('email_sequence_steps')
      .select('*, email_templates(name, subject)')
      .eq('sequence_id', sequence.id)
      .order('step_order', { ascending: true });

    if (!error && data) {
      setSteps(data as EmailSequenceStep[]);
    }
    setLoading(false);
  };

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let templateId = null;

    // If Email step, create template first (Simplified MVP)
    if (newStep.step_type === 'email') {
      if (!newStep.subject || !newStep.body_content) return alert('Assunto e corpo são obrigatórios');
      
      const { data: template, error: tmplError } = await supabase.from('email_templates').insert({
        tenant_id: sequence.tenant_id,
        name: `${sequence.name} - Step ${steps.length + 1}`,
        subject: newStep.subject,
        body_content: newStep.body_content
      }).select().single();

      if (tmplError || !template) return alert('Erro ao criar template: ' + tmplError?.message);
      templateId = template.id;
    }

    // Insert Step
    const { error } = await supabase.from('email_sequence_steps').insert({
      sequence_id: sequence.id,
      step_order: steps.length + 1,
      step_type: newStep.step_type,
      delay_hours: newStep.delay_hours,
      template_id: templateId
    });

    if (error) {
      alert('Erro ao criar passo: ' + error.message);
    } else {
      setIsAddingStep(false);
      setNewStep({ step_type: 'email', delay_hours: 24, subject: '', body_content: '' });
      fetchSteps();
    }
  };

  const handleDeleteStep = async (id: string) => {
    if (!confirm('Remover este passo?')) return;
    await supabase.from('email_sequence_steps').delete().eq('id', id);
    fetchSteps();
  };

  return (
    <div className="p-8 text-white h-full overflow-y-auto animate-in slide-in-from-right-4">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="text-slate-400 hover:text-white transition">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold">{sequence.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              sequence.status === 'active' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-700 text-slate-300'
            }`}>
              {sequence.status}
            </span>
            <p className="text-slate-400 text-xs">{sequence.description}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Timeline of Steps */}
        <div className="relative border-l-2 border-slate-800 ml-4 space-y-8 pb-12">
          {steps.map((step, index) => (
            <div key={step.id} className="relative pl-8 group">
              {/* Connector Dot */}
              <div className="absolute -left-[9px] top-4 size-4 bg-slate-800 border-2 border-slate-600 rounded-full group-hover:border-primary transition"></div>
              
              <div className="bg-surface-dark border border-border-dark rounded-xl p-5 hover:border-primary/30 transition">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2 py-1 rounded uppercase">
                      Passo {index + 1}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {step.delay_hours > 0 ? `Esperar ${step.delay_hours}h` : 'Imediato'}
                    </span>
                  </div>
                  <button onClick={() => handleDeleteStep(step.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>

                {step.step_type === 'email' ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-primary">mail</span>
                      <h3 className="font-bold text-white">Email: {(step.email_templates as any)?.subject}</h3>
                    </div>
                    <p className="text-xs text-slate-400 bg-slate-900/50 p-3 rounded italic border border-white/5">
                      "{(step.email_templates as any)?.name}"
                    </p>
                  </div>
                ) : step.step_type === 'wait' ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="material-symbols-outlined">hourglass_empty</span>
                    <span>Apenas aguardar</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-400">
                    <span className="material-symbols-outlined">task</span>
                    <span>Tarefa Manual</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add Step Button */}
          <div className="relative pl-8">
             <div className="absolute -left-[9px] top-3 size-4 bg-primary border-2 border-primary rounded-full animate-pulse"></div>
             {!isAddingStep ? (
               <button 
                 onClick={() => setIsAddingStep(true)}
                 className="w-full border-2 border-dashed border-slate-700 rounded-xl p-4 text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition flex items-center justify-center gap-2 font-bold"
               >
                 <span className="material-symbols-outlined">add_circle</span>
                 Adicionar Passo
               </button>
             ) : (
               <div className="bg-surface-dark border border-border-dark rounded-xl p-6 animate-in fade-in zoom-in duration-200">
                 <h3 className="font-bold text-white mb-4">Novo Passo</h3>
                 <form onSubmit={handleAddStep} className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo</label>
                       <select 
                         className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-primary outline-none"
                         value={newStep.step_type}
                         onChange={e => setNewStep({...newStep, step_type: e.target.value as any})}
                       >
                         <option value="email">Enviar Email</option>
                         <option value="wait">Aguardar</option>
                         <option value="task">Criar Tarefa</option>
                       </select>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Delay (Horas após anterior)</label>
                        <input 
                          type="number" 
                          min="0"
                          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-primary outline-none"
                          value={newStep.delay_hours}
                          onChange={e => setNewStep({...newStep, delay_hours: parseInt(e.target.value)})}
                        />
                     </div>
                   </div>

                   {newStep.step_type === 'email' && (
                     <div className="space-y-3 pt-2 border-t border-white/5">
                       <input 
                         type="text" 
                         placeholder="Assunto do Email"
                         className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:border-primary outline-none font-bold"
                         value={newStep.subject}
                         onChange={e => setNewStep({...newStep, subject: e.target.value})}
                       />
                       <textarea 
                         placeholder="Corpo do email (Olá {{first_name}}...)"
                         className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:border-primary outline-none min-h-[150px]"
                         value={newStep.body_content}
                         onChange={e => setNewStep({...newStep, body_content: e.target.value})}
                       />
                       <p className="text-[10px] text-slate-500">Variáveis disponíveis: {'{{full_name}}'}, {'{{company}}'}</p>
                     </div>
                   )}

                   <div className="flex justify-end gap-3 pt-2">
                     <button 
                       type="button" 
                       onClick={() => setIsAddingStep(false)}
                       className="px-4 py-2 text-slate-400 hover:text-white font-bold"
                     >
                       Cancelar
                     </button>
                     <button 
                       type="submit" 
                       className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg transition"
                     >
                       Salvar Passo
                     </button>
                   </div>
                 </form>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SequenceBuilder;
