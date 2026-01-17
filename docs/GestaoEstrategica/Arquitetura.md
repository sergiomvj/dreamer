Perfeito. Vou entregar **TODOS os itens**, de forma **coesa, integrada e pronta para implementação**, mantendo o mesmo rigor arquitetural que você definiu desde o início.

> **Visão geral do que você vai receber abaixo**
> 1️⃣ Contrato **Captação → WhatsApp / CAL**
> 2️⃣ Blueprint padrão de **Workflows N8N (lógico + estrutura JSON)**
> 3️⃣ **RBAC detalhado** (papéis, permissões, enforcement)
> 4️⃣ **Checklist de Compliance Automático** (LGPD + risco operacional)

Tudo pensado para **automatização máxima**, **governança forte** e **zero improviso**.

---

# 1️⃣ CONTRATO DE INTEGRAÇÃO

## **Captação → WhatsApp / Ciclo de Aquecimento de Leads (CAL)**

### Missão do contrato

Garantir que:

* Nenhuma mensagem seja enviada fora de contexto estratégico
* Nenhum lead seja abordado sem regras claras
* O CAL seja respeitado tecnicamente (não só “na teoria”)

---

## 1.1 Princípio Fundamental

> **Captação não fala direto com WhatsApp.**
> Captação **emite intenções**.
> O **CAL decide se, quando e como** a mensagem pode sair.

---

## 1.2 Payload padrão (Captação → CAL)

```json
{
  "execution_id": "exec_001",
  "strategy_id": "str_123",
  "action_id": "act_001",
  "lead_id": "lead_456",
  "requested_action": "send_message",
  "channel": "whatsapp",
  "journey_stage": "warming",
  "timestamp": "2026-01-17T15:00:00Z"
}
```

---

## 1.3 Validações obrigatórias (CAL)

Antes de qualquer envio:

* Estratégia aprovada?
* Lead em estado permitido?
* Frequência respeitada?
* Palavra de saída registrada?
* Conta em modo seguro?
* Score mínimo atingido?

👉 **Falhou em qualquer ponto → execução abortada + log**

---

## 1.4 Resposta do CAL

```json
{
  "execution_id": "exec_001",
  "allowed": true,
  "reason": null,
  "next_allowed_at": "2026-01-20T15:00:00Z"
}
```

ou

```json
{
  "allowed": false,
  "reason": "lead_opted_out_locked"
}
```

---

# 2️⃣ BLUEPRINT PADRÃO — WORKFLOWS N8N

## 2.1 Arquitetura Geral

```
[Webhook Planejamento]
        ↓
[N8N - Strategy Guard]
        ↓
[Captação Executor]
        ↓
[CAL Guard]
        ↓
[WhatsApp Cloud API]
```

---

## 2.2 WF-01 — Strategy Guard (GLOBAL)

**Função:** impedir qualquer execução fora da estratégia.

**Passos:**

1. Recebe evento
2. Busca blueprint aprovado
3. Valida limites globais
4. Libera ou bloqueia

---

## 2.3 WF-02 — Lead State Manager

**Trigger:** `lead.status_changed`

* Atualiza score
* Decide próxima fase
* Agenda próxima ação
* Pode pausar ou abandonar lead

---

## 2.4 WF-03 — CAL Message Orchestrator

**Trigger:** `cal.request_send`

* Verifica cooldown
* Aplica limites
* Registra tentativa
* Envia mensagem
* Inicia timeout de resposta

---

## 2.5 WF-04 — Response Interpreter

**Trigger:** mensagem recebida

* Detecta:

  * SIM
  * SAIR
  * Palavra negativa
  * Mensagem espontânea
* Atualiza estado do lead
* Dispara eventos de avanço ou bloqueio

---

## 2.6 WF-05 — Opt-out Global (CRÍTICO)

**Trigger:** palavra universal (SAIR)

Ações:

* Marca `opted_out_locked`
* Remove de TODOS os fluxos
* Confirma saída
* Registra consent log

---

## 2.7 Estrutura JSON base (simplificada)

```json
{
  "nodes": [
    { "type": "webhook", "name": "Strategy Approved" },
    { "type": "function", "name": "Validate Blueprint" },
    { "type": "if", "name": "Allowed?" },
    { "type": "httpRequest", "name": "WhatsApp API" }
  ]
}
```

*(pronto para virar export real de N8N)*

---

# 3️⃣ RBAC — ROLE BASED ACCESS CONTROL (DETALHADO)

## 3.1 Papéis

### 🔴 Owner (Plataforma)

* Tudo
* Configura limites globais
* Acessa auditoria completa

---

### 🟠 Admin (Workspace)

* Aprova estratégias
* Define regras do CAL
* Gerencia contas WhatsApp
* Acessa relatórios completos

---

### 🟡 Gestor Estratégico

* Cria Planejamento
* Versiona estratégia
* NÃO executa
* NÃO altera limites globais

---

### 🟢 Operador de Captação

* Executa ações permitidas
* Visualiza leads
* NÃO cria estratégia
* NÃO altera regras do CAL

---

### 🔵 Auditor / Compliance

* Somente leitura
* Logs
* Consentimentos
* Exportações LGPD

---

## 3.2 Enforcement Técnico (Supabase + API)

* RLS por `workspace_id`
* Claims JWT:

```json
{
  "role": "manager",
  "permissions": ["strategy:create", "strategy:view"]
}
```

* Checagem obrigatória no backend + N8N

---

# 4️⃣ CHECKLIST DE COMPLIANCE AUTOMÁTICO

## 4.1 Checklist Estratégico (antes de aprovar)

* [ ] Público definido
* [ ] Jornada completa (sem saltos)
* [ ] Canal compatível com fase
* [ ] CAL respeitado
* [ ] Opt-in previsto
* [ ] Palavra de saída definida

❌ Falhou → **bloqueia aprovação**

---

## 4.2 Checklist Operacional (antes de enviar mensagem)

* [ ] Estratégia ativa
* [ ] Lead permitido
* [ ] Frequência respeitada
* [ ] Conta saudável
* [ ] Mensagem aprovada
* [ ] Consentimento não negado

❌ Falhou → **abort + log**

---

## 4.3 Checklist LGPD

* [ ] Origem do lead registrada
* [ ] Consentimento rastreável
* [ ] Opt-out funcional
* [ ] Exclusão definitiva disponível
* [ ] Exportação de dados disponível

---

## 4.4 Indicadores de Risco (monitorados por N8N)

* Taxa de opt-out ↑
* Tempo de resposta ↓
* Palavras negativas ↑
* Bloqueios por conta ↑

👉 Se risco ↑ → **modo conservador automático**

---

# 🧠 VISÃO FINAL (ARQUITETURA MADURA)

Com tudo isso você tem:

* Estratégia como **contrato**
* Captação como **executor cego**
* CAL como **guardião**
* WhatsApp como **canal seguro**
* N8N como **motor de verdade**
* Compliance como **camada estrutural**

Isso não é só um app.
É um **Operating System de Aquisição**.

---


