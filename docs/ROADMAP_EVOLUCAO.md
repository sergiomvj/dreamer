# 🗺️ Roadmap de Evolução: Projeto Dreamer

Este documento detalha o plano de desenvolvimento para integrar as visões de **Gestão Estratégica**, **Gestor WhatsApp (CAL)** e **Automações (n8n)** conforme a arquitetura proposta.

---

## 🏗️ Análise de Gap (Atual vs. Proposto)

| Módulo | Status Atual | O que falta (Gap) |
| :--- | :--- | :--- |
| **Gestão Estratégica** | CRUD básico de projetos e estratégias simple. | UI de Maturidade, Blueprint de Execução (JSON), Validador Estratégico, Versionamento de Status. |
| **Gestor WhatsApp** | Detecção de intenção via IA (básico). | Gestão de Contas Cloud API, Máquina de Estados CAL (Latent -> Opt-in), Scoring Engine, Inbox Unificada. |
| **Automações** | Função Edge "hub" (proxy IA). | Integração n8n-mcp, Geração de Workflows Draft, Dashboard de Logs e Monitoramento. |

---

## 🚀 Fases de Desenvolvimento

### 🟢 Fase 1: Fundação & Planejamento Estratégico
*Objetivo: Criar a "unidade de inteligência" que gera os Blueprints para o resto do sistema.*

*   **Subfase 1.1: Refatoração de Dados & RBAC**
    *   Implementar tabelas `workspaces`, `product_architecture`, `audience_mapping`.
    *   Configurar RLS baseado em Claims (Admin, Gestor, Operador).
    *   Criar tabela `execution_blueprints` para armazenar o contrato final.

*   **Subfase 1.2: UI de Onboarding Estratégico**
    *   Tela de **Maturidade do Negócio** (Quiz dinâmico + IA).
    *   Tela de **Arquitetura de Ofertas** (Fricção, Ticket Médio, Prioridade).
    *   Tela de **Mapeamento de Consciência** do Público.

*   **Subfase 1.3: Motor de Validação & Aprovação**
    *   Sistema de Checklist Automático (Bloqueia aprovação se a jornada tiver saltos).
    *   Geração automática de payloads JSON para captação.
    *   Painel de Versionamento (v1.0, v1.1) com Rollback.

---

### 🟡 Fase 2: Motor de Execução (WhatsApp & CAL)
*Objetivo: Implementar o canal de comunicação seguro e o Ciclo de Aquecimento de Leads.*

*   **Subfase 2.1: Infraestrutura de Mensageria**
    *   Dashboard de **Contas de WhatsApp** (Conexão Cloud API, QR Code).
    *   Monitoramento de **Saúde da Conta** (Spam score).
    *   Inbox Unificada (Conversas filtradas por intenção IA).

*   **Subfase 2.2: O Ciclo de Aquecimento de Leads (CAL)**
    *   Implementação do **State Machine** (latent → warming → active → opt-in).
    *   **Scoring Engine**: Ganho/perda de pontos por leitura, clique e resposta.
    *   Regras de **Safe Mode** (Bloqueio automático de disparos se taxa de rejeição subir).

*   **Subfase 2.3: Radar de Oportunidades**
    *   Monitoramento de Grupos (Detecção de palavras-chave e intenção via IA).
    *   Conversão direta de "Interesse em Grupo" para "Lead no Ciclo de Aquecimento".

---

### 🔵 Fase 3: Orquestração & Automação (n8n Hub)
*Objetivo: Conectar o Antigravity ao n8n para automação total de workflows.*

*   **Subfase 3.1: Integração n8n-mcp**
    *   Configuração do servidor MCP para Antigravity controlar o n8n local/self-hosted.
    *   Criação de templates de workflows (Blueprints) injetáveis via n8n-skills.

*   **Subfase 3.2: Fluxo Automatizado de Estratégia**
    *   Webhook: `strategy.approved` → n8n cria automaticamente os fluxos de aquecimento.
    *   Webhook: `lead.opt_out` → n8n remove lead de todos os sistemas instantaneamente.

*   **Subfase 3.3: Dashboard de Observabilidade**
    *   Visualização de logs de execução do n8n dentro do Dashboard GetLeads.
    *   Relatórios de conversão estratégica (Qual versão da estratégia performou melhor?).

---

## 📈 Próximos Passos (Amanhã)
1. **Priorização Crítica**: Definir qual das Subfases da Fase 1 iniciaremos.
2. **Setup do Ambiente**: Preparar a instalação do `n8n-mcp` para testes de criação de workflows.
3. **Draft de UI**: Esboçar a nova aba "Planejamento Estratégico".

---
**Autor:** Antigravity AI
**Data:** 17/01/2026
**Status:** Aguardando Aprovação do Humano
