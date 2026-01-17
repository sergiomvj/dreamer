
-- Migration for Products, Offers and Social Media enhance
CREATE TABLE IF NOT EXISTS public.offers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  product_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  price numeric,
  currency text DEFAULT 'BRL',
  external_link text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT offers_pkey PRIMARY KEY (id),
  CONSTRAINT offers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT offers_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

-- Enhance social_channels with config for automation
ALTER TABLE public.social_channels ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE public.social_channels ADD COLUMN IF NOT EXISTS refresh_token text;
ALTER TABLE public.social_channels ADD COLUMN IF NOT EXISTS api_config jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.social_channels ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_general_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_offers_updated_at ON public.offers;
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION update_general_updated_at();

DROP TRIGGER IF EXISTS update_social_channels_updated_at ON public.social_channels;
CREATE TRIGGER update_social_channels_updated_at BEFORE UPDATE ON public.social_channels FOR EACH ROW EXECUTE FUNCTION update_general_updated_at();
