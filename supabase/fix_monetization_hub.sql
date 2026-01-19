-- ==========================================
-- ESTRUTURA MONETIZATION HUB (CORREÇÃO)
-- ==========================================

-- 1. CRIAR TABELA DE OPÇÕES DE MONETIZAÇÃO
CREATE TABLE IF NOT EXISTS public.monetization_options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  network_id text NOT NULL,
  status text NOT NULL DEFAULT 'inactive', -- 'active', 'review', 'rejected', 'inactive'
  external_id text,
  notes text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT monetization_options_pkey PRIMARY KEY (id),
  CONSTRAINT monetization_options_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT monetization_options_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  UNIQUE(project_id, network_id)
);

-- 2. TRIGGER PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_monetization_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_monetization_options_updated_at ON public.monetization_options;
CREATE TRIGGER update_monetization_options_updated_at
BEFORE UPDATE ON public.monetization_options
FOR EACH ROW
EXECUTE FUNCTION update_monetization_updated_at();

-- 3. HABILITAR RLS
ALTER TABLE public.monetization_options ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE ACESSO
DROP POLICY IF EXISTS "Acesso por Tenant em Monetização" ON public.monetization_options;
CREATE POLICY "Acesso por Tenant em Monetização" ON public.monetization_options
    FOR ALL USING (tenant_id = auth.uid() OR EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = monetization_options.tenant_id AND user_id = auth.uid()));

-- 5. GRANTS
GRANT ALL ON public.monetization_options TO authenticated;
GRANT ALL ON public.monetization_options TO service_role;
