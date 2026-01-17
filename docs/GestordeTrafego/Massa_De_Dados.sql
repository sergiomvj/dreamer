-- Massa de Dados para Testes do Dreamer (Paid Traffic Hub)
-- Certifique-se de que o tenant_id existe. O script busca o primeiro disponível.

DO $$
DECLARE
    v_tenant_id UUID;
    v_proj1_id UUID;
    v_proj2_id UUID;
    v_proj3_id UUID;
BEGIN
    -- 1. Buscar o primeiro tenant disponível (Workspace)
    SELECT id INTO v_tenant_id FROM workspaces LIMIT 1;

    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'Nenhum tenant (workspace) encontrado. Crie um workspace na UI antes de rodar este script.';
        RETURN;
    END IF;

    -- 2. Criar 3 Projetos (Empresas)
    INSERT INTO projects (tenant_id, name, description, status)
    VALUES 
        (v_tenant_id, 'Nova Imóveis', 'Imobiliária focada em alto padrão e lançamentos residenciais.', 'active')
    RETURNING id INTO v_proj1_id;

    INSERT INTO projects (tenant_id, name, description, status)
    VALUES 
        (v_tenant_id, 'TechFlow Solutions', 'SaaS de CRM especializado em automação de vendas para B2B.', 'active')
    RETURNING id INTO v_proj2_id;

    INSERT INTO projects (tenant_id, name, description, status)
    VALUES 
        (v_tenant_id, 'BioNature Fitness', 'E-commerce de suplementos naturais e kits de bem-estar.', 'active')
    RETURNING id INTO v_proj3_id;

    -- 3. Criar 2 Produtos para cada Projeto
    INSERT INTO products (tenant_id, project_id, name, description, price)
    VALUES 
        (v_tenant_id, v_proj1_id, 'Apartamentos Decorados', 'Unidades prontas para morar no setor nobre.', 850000),
        (v_tenant_id, v_proj1_id, 'Terrenos Verticais', 'Lotes para desenvolvimento de prédios residenciais.', 5000000),
        
        (v_tenant_id, v_proj2_id, 'CRM Pro', 'Licença anual para equipes de até 10 pessoas.', 1200),
        (v_tenant_id, v_proj2_id, 'Automação de Vendas', 'Consultoria + Setup de fluxos de outbound.', 3500),
        
        (v_tenant_id, v_proj3_id, 'Whey Protein Premium', 'Proteína isolada sabor chocolate belga.', 189.90),
        (v_tenant_id, v_proj3_id, 'Kit Emagrecimento', 'Combo de chá, termogênico e guia alimentar.', 299.00);

    -- 4. Criar Briefings Iniciais (Para o Planner IA atuar)
    INSERT INTO project_briefings (tenant_id, project_id, target_audience, core_offer, budget_monthly, goals)
    VALUES 
        (v_tenant_id, v_proj1_id, 'Casais 30-50 anos, renda > 20k, interesse em investimentos imobiliários.', 'Visita ao decorado com café da manhã exclusivo.', 10000, 'Gerar 50 visitas qualificadas por mês.'),
        (v_tenant_id, v_proj2_id, 'Gestores de vendas e donos de agências de marketing.', 'Trial de 14 dias + Diagnóstico gratuito.', 3000, 'Custo por Lead (CPL) abaixo de R$ 15,00.'),
        (v_tenant_id, v_proj3_id, 'Pessoas que buscam vida saudável, 20-45 anos, praticantes de crossfit.', 'Frete grátis na primeira compra acima de R$ 200.', 5000, 'ROAS mínimo de 3.5x.');

    RAISE NOTICE 'Massa de dados criada com sucesso para o tenant %', v_tenant_id;
END $$;
