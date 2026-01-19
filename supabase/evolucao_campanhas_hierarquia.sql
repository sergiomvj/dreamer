-- ==========================================
-- EVOLUÇÃO DE CAMPANHAS: VINCULAÇÃO COM NOVA HIERARQUIA
-- ==========================================

-- 1. ADICIONAR REFERÊNCIAS EM CAMPAIGNS PARA PROJETOS DE CLIENTES E PRODUTOS
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS client_project_id uuid REFERENCES public.client_projects(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE CASCADE;

-- 2. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON COLUMN public.campaigns.client_project_id IS 'Vinculação da campanha com o novo nível de Projetos (client_projects)';
COMMENT ON COLUMN public.campaigns.product_id IS 'Vinculação direta com a oferta validada pelo Lion';
