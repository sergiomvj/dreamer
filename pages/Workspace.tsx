import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabaseClient";

type Tenant = {
  id: string;
  name: string;
};

const Workspace: React.FC<{
  userId: string;
  activeTenantId: string | null;
  onSelectTenant: (tenant: Tenant) => void;
}> = ({ userId, activeTenantId, onSelectTenant }) => {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeTenant = useMemo(() => tenants.find((t) => t.id === activeTenantId) || null, [tenants, activeTenantId]);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const { data: memberships, error: membershipsError } = await supabase
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (membershipsError) throw membershipsError;

      const tenantIds = (memberships || []).map((m) => m.tenant_id).filter(Boolean);
      if (tenantIds.length === 0) {
        setTenants([]);
        return;
      }

      const { data: tenantRows, error: tenantsError } = await supabase.from("tenants").select("id,name").in("id", tenantIds);
      if (tenantsError) throw tenantsError;

      setTenants((tenantRows || []) as Tenant[]);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao carregar workspaces.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [userId]);

  const createTenant = async () => {
    setError(null);
    setCreating(true);
    try {
      const { data: tenantRow, error: createTenantError } = await supabase.from("tenants").insert({ name: newName }).select("id,name").single();
      if (createTenantError) throw createTenantError;

      const tenant = tenantRow as Tenant;

      const { error: membershipError } = await supabase.from("tenant_members").insert({
        tenant_id: tenant.id,
        user_id: userId,
        role: "owner",
        is_active: true
      });

      if (membershipError) throw membershipError;

      setNewName("");
      await load();
      onSelectTenant(tenant);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao criar workspace.";
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-card-dark border border-border-dark rounded-2xl p-8 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight">Workspace</h2>
            <p className="text-sm text-slate-500">Selecione onde governar projetos e estratégias.</p>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            Sair
          </button>
        </div>

        {error && <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Workspaces existentes</p>
              {loading && <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Carregando…</span>}
            </div>
            <div className="bg-surface-dark/30 border border-border-dark rounded-2xl divide-y divide-border-dark overflow-hidden">
              {tenants.length === 0 && !loading ? (
                <div className="p-6 text-sm text-slate-500">Nenhum workspace encontrado. Crie um novo.</div>
              ) : (
                tenants.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onSelectTenant(t)}
                    className={`w-full text-left p-5 hover:bg-white/5 transition-colors flex items-center justify-between ${
                      activeTenant?.id === t.id ? "bg-primary/10" : ""
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="font-bold">{t.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">{t.id}</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-500">chevron_right</span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Criar workspace</p>
            <div className="bg-surface-dark/30 border border-border-dark rounded-2xl p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nome</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-slate-200 focus:ring-primary focus:border-primary"
                  placeholder="Ex: Dreamer Corp"
                />
              </div>
              <button
                onClick={createTenant}
                disabled={creating || !newName}
                className="w-full bg-primary hover:bg-blue-600 disabled:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
              >
                {creating ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    Criando…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">add</span>
                    Criar workspace
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;

