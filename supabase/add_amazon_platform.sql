-- ADICIONAR AMAZON NAS PLATAFORMAS DE MINERAÇÃO
ALTER TABLE public.scraping_targets DROP CONSTRAINT IF EXISTS scraping_targets_platform_check;
ALTER TABLE public.scraping_targets ADD CONSTRAINT scraping_targets_platform_check 
CHECK (platform IN ('linkedin', 'google', 'instagram', 'amazon', 'other'));
