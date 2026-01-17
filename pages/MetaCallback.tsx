import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const MetaCallback: React.FC = () => {
  const [status, setStatus] = useState('Processando...');
  // Since we are in a pure Vite app (likely), we might not have 'next/router'.
  // But the project has 'pages/' structure, implying some router.
  // I'll check App.tsx routing logic.
  // App.tsx has manual routing based on 'activeTab'.
  // This means there is NO real routing library like react-router-dom or next/router installed?
  // I need to check App.tsx again.

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const error = params.get('error');

      if (error) {
        setStatus(`Erro: ${params.get('error_description')}`);
        setTimeout(() => window.location.href = '/', 3000);
        return;
      }

      if (!code || !state) {
        setStatus('Código ou estado inválido.');
        return;
      }

      try {
        const { tenantId } = JSON.parse(state);
        
        // Call Supabase Function
        const { data, error: funcError } = await supabase.functions.invoke('meta-exchange-token', {
          body: {
            code,
            tenantId,
            redirectUri: `${window.location.origin}/auth/callback/meta`
          }
        });

        if (funcError) throw funcError;
        if (data?.error) throw new Error(data.error);

        setStatus('Conectado com sucesso! Redirecionando...');
        // Redirect back to main app with paid-traffic tab active?
        // Since App.tsx uses state for tabs, a full reload might reset state unless persisted.
        // App.tsx persists tenantId but not activeTab?
        // Let's check App.tsx persistence.
        // It does NOT persist activeTab.
        // We can pass a query param ?tab=paid-traffic to App.tsx if we handle it.
        // I will update App.tsx to handle initial tab from URL.
        
        window.location.href = '/?tab=paid-traffic';

      } catch (err: any) {
        console.error(err);
        setStatus(`Erro ao conectar: ${err.message}`);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Conectando com Meta...</h1>
        <p className="text-slate-400">{status}</p>
      </div>
    </div>
  );
};

export default MetaCallback;
