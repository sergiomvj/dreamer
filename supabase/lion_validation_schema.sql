-- ==========================================
-- LION GUAVAMANGO: STATUS DE VALIDAÇÃO E DIAGNÓSTICO
-- ==========================================

-- 1. ADICIONAR CAMPOS DE VALIDAÇÃO NA TABELA DE PRODUTOS
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS validation_status text DEFAULT 'pending' 
CHECK (validation_status IN ('pending', 'approved', 'rejected', 'force_approved')),
ADD COLUMN IF NOT EXISTS lion_report jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS validation_at timestamptz;

-- 2. COMENTÁRIO PARA DOCUMENTAÇÃO
COMMENT ON COLUMN public.products.validation_status IS 'Status de validação pelo especialista Lion Guavamango';
COMMENT ON COLUMN public.products.lion_report IS 'Relatório completo de diagnóstico gerado pelo Lion';
