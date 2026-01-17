import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";

type Mode = "signin" | "signup";

const Auth: React.FC = () => {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao autenticar.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card-dark border border-border-dark rounded-2xl p-8 space-y-8">
        <div className="flex items-center gap-3">
          <div className="bg-primary size-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-xl">polyline</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tight leading-none">Dreamer</h1>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Lead Operations OS</span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black">{mode === "signup" ? "Criar conta" : "Entrar"}</h2>
          <p className="text-sm text-slate-500">
            {mode === "signup"
              ? "Crie seu acesso para iniciar o Control Plane."
              : "Acesse seu workspace e retome decisões."}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-slate-200 focus:ring-primary focus:border-primary"
              placeholder="voce@empresa.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Senha</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-slate-200 focus:ring-primary focus:border-primary"
              placeholder="••••••••"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>

          {error && <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">{error}</div>}

          <button
            onClick={submit}
            disabled={loading || !email || !password}
            className="w-full bg-primary hover:bg-blue-600 disabled:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin">sync</span>
                Processando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">{mode === "signup" ? "person_add" : "login"}</span>
                {mode === "signup" ? "Criar conta" : "Entrar"}
              </>
            )}
          </button>

          <button
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="w-full text-sm font-bold text-slate-400 hover:text-white transition-colors"
          >
            {mode === "signup" ? "Já tem conta? Entrar" : "Não tem conta? Criar agora"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;

