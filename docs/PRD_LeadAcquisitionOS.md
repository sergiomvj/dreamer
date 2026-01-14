# 📄 PRD — Acquisition Intelligence Platform

## Lead Operations OS · Growth Control Plane

**Versão:** 1.0
**Status:** Base Oficial de Desenvolvimento
**Tipo:** SaaS B2B – Multi-Projeto / Multi-Conta
**Público:** Growth Leads, Heads de Marketing, SDR Managers, Fundadores, Agências, Operações de Receita

---

## 1. Visão Geral do Produto

### 1.1 Nome do Produto (placeholder)

**Acquisition Intelligence Platform (AIP)**
Apelido conceitual: **Lead Operations OS**

---

### 1.2 Problema que o Produto Resolve

Hoje, captação de leads sofre de:

* Fragmentação de canais
* Falta de leitura estratégica
* CRM sem contexto
* Automação sem governança
* Métricas de vaidade
* Decisão baseada em feeling

O resultado é:

> volume sem qualidade, escala sem controle e crescimento imprevisível.

---

### 1.3 Proposta de Valor

> **Governar a aquisição de leads como um sistema operacional**, onde estratégia precede execução, eventos precedem métricas e CRM é apenas uma camada operacional.

---

### 1.4 O Que Diferencia o Produto

* Estratégia antes de lead
* Orquestração antes de automação
* Eventos antes de métricas
* Decisão assistida por IA
* Multi-projeto nativo
* Parametrização total
* CRM subordinado ao Control Plane

---

## 2. Escopo do Produto

### 2.1 Dentro do Escopo

* Definição estratégica guiada
* Orquestração de canais e fluxos
* Inteligência de captação
* Lead scoring vivo
* CRM estratégico
* Automação consciente
* BI acionável
* SDR virtual

---

### 2.2 Fora do Escopo (MVP)

* Execução direta de campanhas (Ads Managers)
* Substituição completa de CRMs externos
* Billing complexo
* Gestão financeira
* Suporte omnichannel humano

---

## 3. Personas Principais

### 3.1 Head de Growth / Marketing

* Quer decidir onde investir
* Quer comparar estratégias
* Quer previsibilidade

### 3.2 Gestor de SDR / Comercial

* Quer fila inteligente
* Quer prioridade real
* Quer menos lead lixo

### 3.3 Fundador / Owner

* Quer visão executiva
* Quer ROI real
* Quer controle de risco

---

## 4. Arquitetura Conceitual do Produto

### Camadas do Sistema

1. **Foundation Layer** (Onboarding Estratégico)
2. **Strategy Layer** (Blueprints)
3. **Orchestration Layer** (Control Plane)
4. **Observability Layer** (Acquisition Intelligence / BI)
5. **Operational Layer** (CRM Estratégico)
6. **Integration Layer** (Canais, APIs, Automação)

---

## 5. Entidades Principais (Modelo Lógico)

### 5.1 Projeto

* id
* nome
* filosofia
* objetivos globais
* restrições
* status

---

### 5.2 Produto

* id
* projeto_id
* público-alvo
* dores
* nível de consciência
* tipo de decisão
* objetivo estratégico

---

### 5.3 Estratégia

* id
* projeto_id
* tipo (inbound, outbound, híbrida)
* hipótese
* status
* versão

---

### 5.4 Abordagem

* id
* estratégia_id
* canal
* formato (LP, Quiz, DM, Bot)
* permitido / bloqueado

---

### 5.5 Fluxo

* id
* abordagem_id
* etapas
* versão
* status

---

### 5.6 Evento

* id
* fluxo_id
* tipo
* payload
* timestamp
* impacto estratégico

---

### 5.7 Lead

* id
* projeto_id
* produto_id
* origem
* intenção
* score
* status
* próxima ação

---

## 6. Fluxo Principal do Usuário (Foundation Flow)

### 6.1 Onboarding Estratégico

Tela: **Cadastro do Projeto**

Campos:

* Missão existencial
* Objetivos globais
* Metas filosóficas
* Limites éticos
* Grau de automação permitido

Output:

> DNA Estratégico do Projeto

---

### 6.2 Cadastro de Produtos

Tela: **Produtos Estratégicos**

Campos:

* Público-alvo (quem é / quem não é)
* Dores resolvidas
* Tipo de decisão
* Objetivo do produto

---

### 6.3 Avaliação Automática

Tela: **Diagnóstico Inicial**

Sistema gera:

* Score de maturidade
* Tensões estratégicas
* Riscos
* Oportunidades
* Sugestão de caminhos

---

### 6.4 Definição do Escopo Estratégico

Opções:

* Conservador
* Híbrido
* Agressivo

Usuário define:

* Ritmo
* Prioridades
* Primeiras estratégias

---

## 7. Funcionalidades por Módulo

---

### 7.1 Orquestrador de Canais

**Funções**

* Conectar formulários
* Conectar WhatsApp / Instagram
* Receber webhooks
* Centralizar entradas

**Requisitos**

* Multi-origem
* Normalização de dados
* Registro de eventos

---

### 7.2 Motor de Qualificação (Lead Intelligence)

**Funções**

* Classificação frio / morno / quente
* ICP match
* Estágio de compra
* Score vivo

**Inputs**

* Eventos
* Dados enriquecidos
* Comportamento

---

### 7.3 Lead Scoring Vivo

Score baseado em:

* Tempo no site
* Páginas visitadas
* Interações
* Conversas
* Respostas

Atualização em tempo real.

---

### 7.4 SDR Virtual (IA)

Funções:

* Conversar
* Diagnosticar
* Qualificar
* Agendar
* Encaminhar
* Follow-up automático

Configurações:

* Tom
* Limites
* Quando chamar humano

---

### 7.5 Nutrição Multicanal

Canais:

* Email
* WhatsApp
* SMS
* Push

Recursos:

* Conteúdo dinâmico
* Gatilhos por evento
* Cadência parametrizada

---

### 7.6 CRM Estratégico

**Características**

* Lead nunca cru
* Contexto completo
* Próxima ação sugerida

**Filtros**

* Projeto
* Produto
* Estratégia
* Abordagem
* Fluxo
* Intenção
* Humano vs Automação

---

### 7.7 BI & Observabilidade

Dashboards:

**Executivo**

* Leads por canal
* ROI
* Gargalos
* Qualidade

**Estratégico**

* Estratégias vencedoras
* Fluxos eficientes
* Pontos de drop

**Operacional**

* Fila de leads
* Follow-ups
* Conversões

---

## 8. Requisitos Não Funcionais

* Multi-tenant nativo
* Parametrização total
* Versionamento de estratégia
* Audit trail de eventos
* Escalável
* API-first
* LGPD-ready

---

## 9. Tecnologias Sugeridas (não mandatórias)

* Frontend: React / Next.js
* Backend: Node / Python
* Banco: PostgreSQL / Supabase
* Automação: N8N
* IA: OpenAI / LLMs
* Mensageria: WhatsApp API
* Analytics: Event-based

---

## 10. Métricas de Sucesso do Produto

* Tempo para decisão
* Qualidade média dos leads
* Taxa de conversão por estratégia
* Redução de CAC
* Taxa de automação bem-sucedida
* Redução de leads descartados

---

## 11. Roadmap Inicial (Resumo)

**Fase 1**

* Foundation Flow
* Estratégia
* CRM básico com contexto

**Fase 2**

* Orquestração
* Score vivo
* BI

**Fase 3**

* SDR Virtual
* Playbooks
* Automação avançada

---

## 12. Observação Final

Este PRD **não descreve um CRM**.
Ele descreve um **Sistema Operacional de Aquisição**, onde:

> Estratégia governa
> Eventos informam
> IA orienta
> Humanos decidem
> Automação executa

---

Se quiser, no próximo passo posso:

* gerar **backlog técnico (épicos → stories)**
* gerar **modelagem SQL**
* gerar **PRD específico para Stitch**
* ou gerar **arquitetura técnica detalhada**

Você escolhe o próximo corte.
