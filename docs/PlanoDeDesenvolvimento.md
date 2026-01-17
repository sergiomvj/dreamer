# 🗺️ Plano de Desenvolvimento: Acquisition Intelligence Platform

Este documento detalha as fases e sub-etapas para a construção dos módulos essenciais da plataforma, conforme definido no `ConceitoGeral.md`. O desenvolvimento seguirá uma abordagem modular, permitindo a entrega de valor incremental em cada fase.

---

##  Fase 0: Fundação e Control Plane (Núcleo)

*Status: Parcialmente Concluído*

O objetivo desta fase é solidificar a base da aplicação, incluindo autenticação, gestão de múltiplos tenants e as estruturas de dados centrais.

*   **[Concluído]** 0.1. Setup do Projeto (Next.js, Supabase, TailwindCSS).
*   **[Concluído]** 0.2. Implementação de Autenticação e Gestão de Usuários.
*   **[Concluído]** 0.3. Implementação de Multi-Tenancy (isolamento de dados por cliente/empresa).
*   **[Concluído]** 0.4. Criação do Módulo de Projetos (CRUD básico).
*   **[Concluído]** 0.5. Criação do Módulo de Campanhas (CRUD básico).
*   **[Pendente]** 0.6. Refinamento da UI do "Control Plane" (Navegação principal, Dashboard inicial).

---

## Fase 1: Módulo de Conteúdo e SEO (Inbound)

*Status: Concluído*

Foco em transformar ideias em conteúdo publicável, estabelecendo o fluxo de trabalho de marketing de conteúdo.

*   **[Concluído]** 1.1. Geração de Ideias de Conteúdo via LLM.
*   **[Concluído]** 1.2. Conversão de Ideias em Rascunhos (Drafts).
*   **[Concluído]** 1.3. Implementação de um Editor de Texto Rico (TipTap).
*   **[Concluído]** 1.4. Sistema de Status (Ideia → Rascunho → Publicado).
*   **[Concluído]** 1.5. UI para visualizar conteúdo publicado.

---

## Fase 2: Módulo de Tráfego Pago (Outbound)

*Status: Concluído*

O objetivo é integrar e governar as principais plataformas de anúncios, trazendo dados de performance para o Control Plane.

*   **2.1. Estrutura de Dados:**
    *   **[Concluído]** 2.1.1. Criar tabelas no Supabase para armazenar dados de contas de anúncios (`ad_accounts`), campanhas de anúncios (`ad_campaigns`), conjuntos de anúncios (`ad_sets`) e anúncios (`ads`).
    *   **[Concluído]** 2.1.2. Adicionar campos para métricas essenciais (custo, cliques, impressões, CPC, CPA, ROAS).
*   **2.2. Integração (Backend):**
    *   **[Concluído]** 2.2.1. Implementar autenticação segura (OAuth 2.0) para a API do Meta (Facebook/Instagram Ads).
    *   **[Concluído]** 2.2.2. Criar Supabase Functions (ou API Route) para sincronizar campanhas e métricas da Meta.
    *   **[Pendente]** 2.2.3. (Opcional) Repetir o processo para a API do Google Ads.
*   **2.3. Interface (Frontend):**
    *   **[Concluído]** 2.3.1. Criar uma nova página "Tráfego Pago".
    *   **[Concluído]** 2.3.2. Desenvolver UI para conectar e gerenciar contas de anúncios.
    *   **[Concluído]** 2.3.3. Criar um dashboard para visualizar a performance das campanhas com gráficos e tabelas.
    *   **[Concluído]** 2.3.4. Implementar regras básicas (ex: "Pausar campanha se CPA > X").

---

## Fase 3: Módulo de CRM Estratégico

*Status: Em Progresso*

Centralizar todos os leads capturados, enriquecê-los com dados e fornecer contexto estratégico.

*   **3.1. Estrutura de Dados:**
    *   3.1.1. Criar a tabela `leads` no Supabase com campos para dados pessoais, status (novo, qualificado, etc.), score de intenção e origem.
    *   3.1.2. Criar a tabela `lead_events` para rastrear a jornada do lead (ex: "preencheu formulário X", "clicou no anúncio Y").
*   **3.2. Captura de Leads:**
    *   3.2.1. Criar um endpoint de API seguro para receber webhooks de diversas fontes (Lead Ads, Landing Pages, etc.).
    *   3.2.2. Implementar a lógica para associar cada lead a um `tenant`, `projeto` e `campanha`.
*   **3.3. Interface (Frontend):**
    *   3.3.1. Criar uma nova página "Leads".
    *   3.3.2. Desenvolver uma UI de visualização de leads em formato de tabela/kanban.
    *   3.3.3. Implementar filtros avançados (por data, campanha, status, etc.).
    *   3.3.4. Criar uma tela de "Detalhe do Lead" mostrando seu perfil completo e linha do tempo de eventos.

---

## Fase 4: Módulos de Automação (Scrapping, Email, WhatsApp)

*Status: Não Iniciado*

Construir as ferramentas de execução para prospecção ativa e nutrição.

*   **4.1. Módulo de Scrapping:**
    *   4.1.1. Criar uma interface para configurar "Alvos de Scraping" (ex: URL de uma página de resultados do LinkedIn).
    *   4.1.2. Desenvolver Supabase Functions (Edge) que utilizem bibliotecas como `puppeteer` ou `cheerio` para extrair dados.
    *   4.1.3. Salvar os dados extraídos como "Contatos Brutos" para posterior qualificação e uso.
*   **4.2. Módulo de Email Marketing:**
    *   4.2.1. Integrar com um serviço de envio (ex: Resend, SendGrid).
    *   4.2.2. Criar uma UI para construir sequências de email ("cadências").
    *   4.2.3. Implementar a lógica para disparar as sequências para listas de leads do CRM.
*   **4.3. Módulo de WhatsApp:**
    *   4.3.1. Integrar com uma API de WhatsApp Business (ex: Twilio).
    *   4.3.2. Criar uma interface para templates de mensagens e automações básicas.

---

## Fase 5: Gestão de Redes Sociais

*Status: Não Iniciado*

Centralizar o agendamento e publicação de conteúdo nas redes sociais.

*   **5.1. Calendário de Conteúdo:**
    *   5.1.1. Desenvolver uma UI de calendário (semanal/mensal).
    *   5.1.2. Permitir arrastar e soltar conteúdos "Publicados" (da Fase 1) para agendar postagens.
*   **5.2. Integração com APIs:**
    *   5.2.1. Implementar autenticação (OAuth) para APIs do LinkedIn e Instagram/Facebook.
    *   5.2.2. Criar a lógica para publicar o conteúdo agendado na data/hora correta.
*   **5.3. Dashboard de Performance Social:**
    *   5.3.1. Importar métricas básicas (curtidas, comentários, compartilhamentos) dos posts publicados.
