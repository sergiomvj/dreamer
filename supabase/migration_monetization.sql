
-- Migration to add monetization options table
CREATE TABLE IF NOT EXISTS public.monetization_options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  network_id text NOT NULL,
  status text NOT NULL DEFAULT 'inactive',
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

-- Add update trigger for updated_at
CREATE OR REPLACE FUNCTION update_monetization_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_monetization_options_updated_at
BEFORE UPDATE ON public.monetization_options
FOR EACH ROW
EXECUTE FUNCTION update_monetization_updated_at();
