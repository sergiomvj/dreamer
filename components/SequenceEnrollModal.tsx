import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { EmailSequence } from '../types';

interface SequenceEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  tenantId: string;
  onSuccess: () => void;
}

const SequenceEnrollModal: React.FC<SequenceEnrollModalProps> = ({ isOpen, onClose, leadId, tenantId, onSuccess }) => {
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSequences();
    }
  }, [isOpen, tenantId]);

  const fetchSequences = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('email_sequences')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active') // Only active sequences
      .order('name');

    if (!error && data) {
      setSequences(data as EmailSequence[]);
    }
    setLoading(false);
  };

  const handleEnroll = async (sequenceId: string) => {
    setEnrolling(true);
    const { error } = await supabase.from('lead_sequence_enrollments').insert({
      tenant_id: tenantId,
      lead_id: leadId,
      sequence_id: sequenceId,
      status: 'active',
      current_step_order: 1
    });

    if (error) {
      // Check for uniqueness constraint violation
      if (error.code === '23505') {
        alert('Este lead já está inscrito nesta sequência.');
      } else {
        alert('Erro ao inscrever lead: ' + error.message);
      }
    } else {
      onSuccess();
      onClose();
    }
    setEnrolling(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-surface-dark border border-border-dark rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Inscrever em Sequência</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {loading ? (
          <p className="text-slate-500 text-center py-4">Carregando sequências...</p>
        ) : sequences.length === 0 ? (
          <p className="text-slate-500 text-center py-4">Nenhuma sequência ativa disponível.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {sequences.map(seq => (
              <button
                key={seq.id}
                onClick={() => handleEnroll(seq.id)}
                disabled={enrolling}
                className="w-full text-left bg-slate-800/50 hover:bg-primary/20 hover:border-primary border border-transparent p-3 rounded-lg transition group"
              >
                <h4 className="font-bold text-white group-hover:text-primary transition">{seq.name}</h4>
                <p className="text-xs text-slate-400 truncate">{seq.description || 'Sem descrição'}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SequenceEnrollModal;
