

# 1️⃣ CONTRATO DE INTEGRAÇÃO

## **Planejamento Estratégico → Captação**

> **Objetivo do contrato**
> Garantir que **NENHUMA ação de captação** seja criada, ativada ou executada sem:

* estratégia validada
* regras claras
* limites definidos
* eventos padronizados

---

## 1.1 Conceito do Contrato

A aba **Planejamento Estratégico** gera um **Execution Blueprint**.

A aba **Captação**:

* **não pensa**
* **não decide**
* **não valida**
* apenas **executa o blueprint aprovado**

---

## 1.2 Estrutura do Execution Blueprint (payload oficial)

```json
{
  "strategy_id": "str_123",
  "strategy_version": "v1.0",
  "workspace_id": "ws_001",
  "client_id": "cl_789",
  "approved": true,
  "approval_timestamp": "2026-01-17T12:00:00Z",

  "global_limits": {
    "max_daily_contacts": 50,
    "allowed_channels": ["whatsapp", "content"],
    "cal_mode": "balanced"
  },

  "actions": [
    {
      "action_id": "act_001",
      "type": "warming",
      "product_id": "prod_x",
      "audience": "cold",
      "journey_stage": "awareness",
      "channel": "whatsapp",
      "dependencies": [],
      "limits": {
        "messages_per_week": 2
      },
      "events": {
        "entry": "warming.enter",
        "success": "warming.advance",
        "fail": "warming.pause"
      }
    }
  ]
}
```

---

## 1.3 Regras do Contrato (Hard Rules)

* ❌ Captação **não pode criar ações**

* ❌ Captação **não pode alterar limites**

* ❌ Captação **não pode pular etapas**

* ❌ Captação **não pode operar sem `approved = true`**

* ✅ Captação **consome blueprint**

* ✅ Captação **executa eventos**

* ✅ Captação **reporta resultados**

---

## 1.4 Eventos Planejamento → Captação

* `strategy.approved`
* `strategy.updated`
* `strategy.revoked`

Captação **escuta apenas esses eventos**.

---

# 2️⃣ BACKLOG TÉCNICO

## **ÉpICS & STORIES**

---

## 🧩 EPIC 1 — Planejamento Estratégico (Core)

### Story 1.1

Como gestor, quero cadastrar a visão estratégica do cliente para limitar ações possíveis.

### Story 1.2

Como sistema, quero classificar automaticamente o cliente e sugerir estratégias permitidas.

### Story 1.3

Como gestor, quero bloquear estratégias incompatíveis com o estágio do cliente.

---

## 🧩 EPIC 2 — Arquitetura de Produtos & Públicos

### Story 2.1

Cadastrar produtos com dor, fricção e prioridade.

### Story 2.2

Mapear públicos e níveis de consciência.

### Story 2.3

Validar automaticamente produto ↔ público.

---

## 🧩 EPIC 3 — Jornada & Funil

### Story 3.1

Criar jornadas com estágios e eventos.

### Story 3.2

Bloquear saltos lógicos no funil.

### Story 3.3

Gerar eventos padronizados automaticamente.

---

## 🧩 EPIC 4 — Orquestrador Estratégico

### Story 4.1

Criar ações estratégicas (não executáveis).

### Story 4.2

Definir dependências e limites por ação.

### Story 4.3

Pré-gerar automações N8N em modo draft.

---

## 🧩 EPIC 5 — Validação & Aprovação

### Story 5.1

Rodar checklist automático de validação.

### Story 5.2

Bloquear aprovação se houver erro crítico.

### Story 5.3

Versionar estratégias aprovadas.

---

## 🧩 EPIC 6 — Integração Planejamento → Captação

### Story 6.1

Gerar Execution Blueprint.

### Story 6.2

Publicar blueprint via webhook.

### Story 6.3

Bloquear execução fora do blueprint.

---

## 🧩 EPIC 7 — Observabilidade & Auditoria

### Story 7.1

Registrar logs estratégicos.

### Story 7.2

Auditar quem aprovou o quê e quando.

---

# 3️⃣ SCHEMAS SUPABASE + RLS

---

## 3.1 Tabela `strategies`

```sql
create table strategies (
  id uuid primary key,
  workspace_id uuid,
  client_id uuid,
  version text,
  status text, -- draft | approved | revoked
  created_at timestamptz,
  approved_at timestamptz
);
```

---

## 3.2 Tabela `strategy_actions`

```sql
create table strategy_actions (
  id uuid primary key,
  strategy_id uuid references strategies(id),
  type text,
  product_id uuid,
  audience text,
  channel text,
  journey_stage text,
  limits jsonb,
  dependencies jsonb
);
```

---

## 3.3 Tabela `execution_blueprints`

```sql
create table execution_blueprints (
  id uuid primary key,
  strategy_id uuid,
  payload jsonb,
  published boolean default false
);
```

---

## 3.4 RLS (exemplo simplificado)

```sql
create policy "strategy_workspace_access"
on strategies
for all
using (workspace_id = auth.jwt()->>'workspace_id');
```

---

## 3.5 Tabela `strategy_events`

```sql
create table strategy_events (
  id uuid primary key,
  strategy_id uuid,
  event_type text,
  payload jsonb,
  created_at timestamptz
);
```

---

# 4️⃣ DIAGRAMA DE EVENTOS & FLUXOS N8N

## (descrição lógica)

---

## 4.1 Fluxo Macro

```
[Planejamento]
   ↓ strategy.approved
[Webhook → N8N]
   ↓ valida blueprint
[N8N]
   ↓ cria workflows draft
[Captação]
   ↓ executa somente ações permitidas
```

---

## 4.2 Workflows N8N

### WF-STR-01 — Strategy Approved

**Trigger**: Webhook `strategy.approved`
→ Validar payload
→ Salvar blueprint
→ Criar workflows filhos (draft)
→ Notificar Captação

---

### WF-STR-02 — Strategy Updated

→ Comparar versões
→ Atualizar automações
→ Pausar ações incompatíveis

---

### WF-STR-03 — Strategy Revoked

→ Pausar TODAS as execuções
→ Notificar gestores
→ Bloquear novos eventos

---

### WF-STR-04 — Execution Guard (CRÍTICO)

Executado antes de qualquer ação de captação:

* Confere `strategy_id`
* Confere `approved = true`
* Confere limites
* Se falhar → aborta execução

---

## 🧠 FECHAMENTO (VISÃO DE ARQUITETURA)

Com isso você tem:

* **Separação absoluta de responsabilidade**
* **Estratégia como código**
* **Execução sem improviso**
* **N8N como orquestrador confiável**
* **Base pronta para escalar para múltiplos clientes**

---


