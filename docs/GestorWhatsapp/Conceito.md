Perfeito. Vou tratar isso **como um produto sério de operações, compliance e crescimento**, não como uma automação “esperta”.
Abaixo está tudo **organizado, encadeado e pronto para virar backlog técnico**.

---

# 📘 PROJETO CONCEITUAL

## Plataforma de Gestão de WhatsApp com Ciclo de Aquecimento de Leads (CAL)

### 1. Visão Geral

A aplicação é uma **plataforma central de controle, monitoramento e geração de oportunidades via WhatsApp**, projetada para **operações multi-conta**, **monitoramento de grupos**, **captação opt-in** e **conversão progressiva de leads frios** por meio de um **Ciclo de Aquecimento controlado, ético e reversível**.

Ela atua como:

* **Painel de Operações**
* **Radar de oportunidades**
* **Pré-CRM**
* **Orquestrador de automações via N8N**

---

### 2. Problema que o sistema resolve

* Gestores **não conseguem escalar WhatsApp** sem risco.
* Leads de grupos são **subutilizados ou usados de forma agressiva**.
* Falta **governança, rastreabilidade e scoring real**.
* Automação sem inteligência gera **banimento, denúncias e leads ruins**.

---

### 3. Princípios do Produto

1. **Opt-in como objetivo final**
2. **Aquecimento antes da conversão**
3. **Usuário sempre no controle**
4. **Automação com limites**
5. **Observabilidade > Disparo**
6. **N8N como motor de execução**
7. **Plataforma preparada para auditoria**

---

### 4. Público-Alvo

* Gestores de tráfego
* Agências
* Operações de vendas consultivas
* Comunidades e admins de grupos
* Negócios que usam WhatsApp como canal principal

---

### 5. Diferencial Estratégico

O **Ciclo de Aquecimento de Leads (CAL)** transforma contatos frios e latentes em **leads qualificados e consentidos**, reduzindo risco operacional e aumentando LTV.

---

# 📐 PRD – PRODUCT REQUIREMENTS DOCUMENT

## Aplicação Completa (com CAL)

---

## 1. Estrutura de Módulos

1. Autenticação & Workspaces
2. Contas de WhatsApp
3. Inbox Unificada
4. Monitoramento de Grupos
5. Radar de Oportunidades
6. Leads & CRM Leve
7. **Ciclo de Aquecimento de Leads (CAL)**
8. Automações & N8N
9. Relatórios & Analytics
10. Compliance & LGPD
11. Configurações & Segurança

---

## 2. Telas e Funcionalidades

---

### 2.1 Autenticação & Workspaces

* Login
* Seleção de Workspace
* Multi-tenant
* RBAC (Admin, Gestor, Operador, Auditor)

---

### 2.2 Contas de WhatsApp

* Cadastro de contas (Cloud API)
* Status da conta
* Limites operacionais
* Health score da conta
* Modo de operação:

  * Conservador
  * Balanceado
  * Conversão

---

### 2.3 Inbox Unificada

* Conversas por conta
* Tags
* Atribuição
* SLA
* Sugestão de resposta (IA – opcional)
* Histórico completo

---

### 2.4 Monitoramento de Grupos

* Cadastro de grupos monitorados
* Tags por grupo
* Palavras-chave
* Intenção detectada
* Alertas automáticos
* Resumo diário/semanal (IA)

---

### 2.5 Radar de Oportunidades

* Lista de oportunidades detectadas
* Origem (grupo, mensagem, palavra-chave)
* Contexto automático
* Ação sugerida
* Conversão para Lead

---

### 2.6 Leads & CRM Leve

* Status:

  * latent
  * warming
  * opt_in
  * converted
  * opted_out
* Tags
* Score
* Histórico de interações
* Origem e rastreamento

---

### 2.7 **Ciclo de Aquecimento de Leads (CAL)**

#### Estados do Lead

1. `latent_lead`
2. `warming_candidate`
3. `warming_attempted`
4. `warming_active`
5. `opt_in_confirmed`
6. `opted_out_locked`

#### Funcionalidades

* Configuração de regras por conta
* Limites de contato
* Templates aprovados (copy externa ao módulo)
* Histórico de consentimento
* Lock técnico de opt-out

---

### 2.8 Automações & N8N

* Lista de workflows ativos
* Logs de execução
* Retry inteligente
* Fallback manual

---

### 2.9 Relatórios & Analytics

* Funil de aquecimento
* Taxa de opt-in
* Taxa de rejeição
* Score médio por origem
* Risco por conta
* Leads por grupo

---

### 2.10 Compliance & LGPD

* Registro de consentimento
* Exportação de dados
* Exclusão definitiva
* Palavras de saída universais
* Auditoria completa

---

### 2.11 Configurações & Segurança

* Limites por conta
* Revisão humana obrigatória
* Modo emergência (pause tudo)
* Lista global de bloqueados

---

# ⚙️ FLUXO TÉCNICO – EVENTOS & N8N

## Automação Total

---

## 1. Arquitetura Geral

* Frontend → API → Supabase
* Supabase → Webhooks → N8N
* N8N → WhatsApp Cloud API
* N8N → IA / Analytics / CRM

---

## 2. Eventos Principais

### Eventos de Lead

* `lead.created`
* `lead.updated`
* `lead.status_changed`
* `lead.opted_out`
* `lead.opted_in`

### Eventos de Grupo

* `group.message_detected`
* `group.intent_detected`
* `group.opportunity_created`

### Eventos do Ciclo

* `warming.entered`
* `warming.message_sent`
* `warming.response_received`
* `warming.advanced`
* `warming.abandoned`

---

## 3. Workflows N8N (exemplos)

### WF-01 – Entrada no Ciclo

Trigger: `lead.created (latent)`
→ Validação de regras
→ Delay configurável
→ Marca como `warming_candidate`

---

### WF-02 – Tentativa de Aquecimento

Trigger: `warming_candidate`
→ Checa limites
→ Envia mensagem neutra
→ Marca `warming_attempted`
→ Start timeout (48–72h)

---

### WF-03 – Resposta do Usuário

Trigger: mensagem recebida

* SIM → `warming_active`
* SAIR → `opted_out_locked`
* Sem resposta → abandono

---

### WF-04 – Aquecimento Progressivo

Trigger: `warming_active`
→ Conteúdo leve
→ Delay controlado
→ Atualiza score
→ Decide avanço ou pausa

---

### WF-05 – Conversão Opt-in

Trigger: score ≥ threshold
→ Solicita consentimento formal
→ Se confirmado → `opt_in_confirmed`

---

### WF-06 – Opt-out Global

Trigger: mensagem contém “SAIR”
→ Marca `opted_out_locked`
→ Confirma remoção
→ Bloqueia qualquer fluxo futuro

---

# 📊 SCORING & REGRAS AUTOMÁTICAS

---

## 1. Warm Score (0–100)

### Pontos Positivos

* Leitura: +5
* Clique: +10
* Resposta: +15
* Resposta rápida (<1h): +10
* Mensagem espontânea: +20

### Pontos Negativos

* Ignorar mensagem: −5
* Tempo longo sem interação: −10
* Palavra negativa: −20

---

## 2. Thresholds

* **<20** → Lead frio (pause)
* **20–49** → Aquecimento leve
* **50–79** → Aquecimento ativo
* **≥80** → Solicitar opt-in formal

---

## 3. Regras Automáticas

* Máx. 1 mensagem ativa por 72h (fase 2)
* Máx. 2 mensagens/semana (fase 3)
* Opt-out trava o lead para sempre
* Conta com rejeição alta entra em modo conservador
* Score cai automaticamente com inatividade

---

## 4. Modos de Operação

* 🔒 Conservador → até Fase 2
* ⚖️ Balanceado → até Fase 3
* 🚀 Conversão → só leads ≥ 50

---

## 🧠 Conclusão Estratégica

Esse sistema:

* Não depende de gambiarra
* Não cria risco jurídico
* Não destrói reputação
* Constrói **ativos reais de relacionamento**
* Escala com segurança

---

### Próximo passo sugerido

1️⃣ Transformar isso em **backlog técnico (épics + stories)**
2️⃣ Criar **schemas Supabase + RLS**
3️⃣ Diagramar **fluxos N8N visualmente**
4️⃣ Definir **API contracts**

Qual você quer agora?
