# Acquisition Intelligence Platform (GetLeads)

Uma plataforma completa de aquisição e inteligência de leads, integrando Marketing de Conteúdo, Tráfego Pago, CRM, Automação e Redes Sociais.

## 🚀 Módulos

### 1. Inbound (Conteúdo & SEO)
*   **Geração de Ideias**: Uso de IA (Gemini) para gerar ideias de conteúdo baseadas em campanhas.
*   **Editor de Rascunhos**: Editor de texto rico para expandir ideias em posts/artigos.
*   **Gestão de Status**: Fluxo de Ideia -> Rascunho -> Publicado.

### 2. Outbound (Tráfego Pago)
*   **Gestão de Contas**: Conexão com Meta Ads (Facebook/Instagram).
*   **Dashboard de Performance**: Visualização de métricas (Spend, CPA, CTR).
*   **Regras de Otimização**: Configuração de regras automáticas (ex: Pausar se CPA > X).

### 3. CRM Estratégico
*   **Gestão de Leads**: Visualização em Lista e Kanban.
*   **Perfil 360º**: Detalhes do lead, timeline de eventos e tarefas.
*   **Scoring**: Pontuação automática de leads.

### 4. Automação
*   **Data Mining**: Ferramenta de scraping para extrair contatos de fontes externas (LinkedIn, Google).
*   **Email Marketing**: Construtor visual de sequências de email e disparos automáticos.
*   **WhatsApp**: Interface de chat integrada para atendimento e disparos.

### 5. Redes Sociais
*   **Calendário**: Visualização mensal de postagens.
*   **Agendamento**: Criação de posts para LinkedIn/Instagram.
*   **Integração**: Importação direta de conteúdos "Publicados" do módulo Inbound.

## 🛠️ Tecnologia

*   **Frontend**: React, TypeScript, TailwindCSS, Vite.
*   **Backend**: Supabase (PostgreSQL, Auth, Realtime).
*   **Edge Functions**: Deno (Supabase Functions) para lógica de IA e Automação.
*   **IA**: Integração com Google Gemini.

## 📦 Instalação

1.  **Clone o repositório**:
    ```bash
    git clone <repo-url>
    cd GetLeads
    ```

2.  **Instale as dependências**:
    ```bash
    npm install
    ```

3.  **Configuração do Supabase**:
    *   Crie um projeto no Supabase.
    *   Execute os scripts SQL na pasta `supabase/` na ordem correta (ou use o `schema.sql` consolidado).
    *   Configure as variáveis de ambiente em `.env.local`:
        ```
        VITE_SUPABASE_URL=your_project_url
        VITE_SUPABASE_ANON_KEY=your_anon_key
        ```

4.  **Execute o projeto**:
    ```bash
    npm run dev
    ```

## 🔄 Edge Functions (Workers)

Para funcionalidades de automação (Scraping, Email, AI), é necessário deployar as Edge Functions:

```bash
supabase functions deploy llm
supabase functions deploy scraping-worker
supabase functions deploy sequence-worker
```

## 📅 Status do Projeto

*   [x] Fase 0: Foundation
*   [x] Fase 1: Content
*   [x] Fase 2: Paid Traffic
*   [x] Fase 3: CRM
*   [x] Fase 4: Automation
*   [x] Fase 5: Social Media

---
Desenvolvido com ❤️ e IA.
