Fechado — **Supabase** encaixa perfeito pro seu “Acquisition OS” porque te entrega **Auth + Postgres + RLS + Storage + Realtime + Edge Functions** num pacote só.

Abaixo vai a **Arquitetura (conceitual + técnica)** já pronta para você implementar, com **modelo multi-tenant**, **tabelas**, **RLS**, **eventos**, **webhooks pro n8n** e **camadas do sistema**.

---

# 🏗️ Arquitetura Supabase — Gestor de Tráfego IA (Multiagente)

## 1) Visão de Camadas

**Frontend (App/Console)**

* Painéis: Projetos, Planejamento, Testes, Execução, Análise, Aprendizado, Agentes

**Supabase Core**

* Postgres (dados + logs + inteligência)
* Auth (usuários)
* RLS (multi-tenant seguro)
* Storage (criativos, relatórios, anexos)
* Realtime (status e alertas)
* Edge Functions (webhooks + automações + regras)

**Orquestração (n8n)**

* Webhooks de entrada (eventos do app)
* Workflows por agente (planejar/testar/executar/analisar/aprender)
* Chamadas de volta (callback) para Supabase (atualizar status/resultados)

---

## 2) Multi-tenant (Base do Produto)

### Entidades principais

* **tenant** = conta/empresa/agência
* **project** = cliente/marca/projeto dentro do tenant
* **workspace access** = usuários e permissões dentro do tenant

### Estratégia

✅ *Um único banco*, múltiplos tenants com **RLS** por `tenant_id` (padrão SaaS robusto).

---

# 🗃️ 3) Modelo de Dados (Supabase / Postgres)

## 3.1 Tabelas de Identidade e Acesso

### `tenants`

* `id` uuid pk
* `name` text
* `plan` text (free/pro/agency)
* `created_at` timestamptz

### `tenant_members`

* `id` uuid pk
* `tenant_id` uuid fk
* `user_id` uuid (auth.users)
* `role` text (`owner`, `admin`, `manager`, `analyst`, `viewer`)
* `is_active` bool
* `created_at`

### `projects`

* `id` uuid pk
* `tenant_id` uuid fk
* `name` text
* `niche` text
* `status` text (`active`, `paused`, `archived`)
* `monthly_budget` numeric
* `timezone` text
* `created_at`

---

## 3.2 Estratégia e Planejamento

### `project_briefings`

* `id` uuid pk
* `tenant_id` uuid
* `project_id` uuid
* `product` text
* `offer` text
* `value_prop` text
* `audience` jsonb (ICP/personas)
* `constraints` jsonb (compliance, brand rules)
* `notes` text
* `updated_at`

### `strategy_versions`

* `id` uuid pk
* `tenant_id`
* `project_id`
* `version` int
* `strategy` jsonb (funil, canais, KPIs, orçamento, pacing)
* `hypotheses` jsonb (lista)
* `status` text (`draft`, `awaiting_approval`, `approved`, `rejected`)
* `created_by` uuid
* `created_at`

---

## 3.3 Testes e Experimentos

### `experiments`

* `id` uuid pk
* `tenant_id`
* `project_id`
* `strategy_version_id` uuid
* `name` text
* `hypothesis` text
* `variables` jsonb (ex: criativo/público/oferta)
* `success_criteria` jsonb
* `budget_cap` numeric
* `start_at` timestamptz
* `end_at` timestamptz
* `status` text (`planned`, `running`, `passed`, `failed`, `killed`)
* `created_at`

### `experiment_variants`

* `id` uuid pk
* `tenant_id`
* `experiment_id`
* `variant_key` text
* `payload` jsonb (copy, creative_id, audience)
* `status` text
* `metrics` jsonb (atualizado pelo agente de análise)

---

## 3.4 Execução (Campanhas / Operação)

### `channels`

* `id` uuid pk
* `tenant_id`
* `name` text (Meta, Google, TikTok, LinkedIn)
* `status` text

### `campaigns`

* `id` uuid pk
* `tenant_id`
* `project_id`
* `channel_id`
* `external_id` text (id na plataforma)
* `objective` text
* `status` text (`active`, `paused`, `ended`)
* `budget_daily` numeric
* `budget_lifetime` numeric
* `targeting` jsonb
* `created_at`

### `campaign_actions`

* `id` uuid pk
* `tenant_id`
* `project_id`
* `campaign_id`
* `action_type` text (`pause`, `scale_budget`, `swap_creative`, etc.)
* `requested_by` text (`agent`, `human`)
* `requires_approval` bool
* `approval_status` text (`pending`, `approved`, `rejected`)
* `payload` jsonb
* `executed_at` timestamptz
* `created_at`

---

## 3.5 Métricas e Analytics

### `metrics_daily`

* `id` uuid pk
* `tenant_id`
* `project_id`
* `campaign_id` uuid null
* `experiment_id` uuid null
* `date` date
* `spend` numeric
* `clicks` int
* `impressions` int
* `conversions` int
* `revenue` numeric
* `cpa` numeric
* `roas` numeric
* `raw` jsonb (dump da API)

---

## 3.6 Agentes, Execuções e Orquestração (n8n)

### `agents`

* `id` uuid pk
* `tenant_id`
* `name` text (Planner, Tester, Operator, Analyst, Learner)
* `stage` text (`planning`, `testing`, `execution`, `analysis`, `learning`)
* `autonomy_level` text (`low`, `medium`, `high`)
* `is_enabled` bool
* `config` jsonb (limites, regras, templates)
* `created_at`

### `agent_runs`

* `id` uuid pk
* `tenant_id`
* `project_id`
* `agent_id`
* `trigger_event` text
* `input` jsonb
* `output` jsonb
* `status` text (`queued`, `running`, `completed`, `failed`)
* `started_at`
* `finished_at`
* `error` text

### `webhook_events`

* `id` uuid pk
* `tenant_id`
* `project_id`
* `event_type` text (ex: `strategy.approved`, `experiment.created`)
* `payload` jsonb
* `status` text (`new`, `sent`, `acked`, `failed`)
* `sent_at`
* `acked_at`

---

## 3.7 Inteligência e Memória (Playbooks)

### `insights`

* `id` uuid pk
* `tenant_id`
* `project_id`
* `source` text (`analysis_agent`, `human`, `import`)
* `summary` text
* `tags` text[]
* `evidence` jsonb (links p/ métricas/campanhas)
* `created_at`

### `playbooks`

* `id` uuid pk
* `tenant_id`
* `niche` text
* `channel` text
* `objective` text
* `rules` jsonb (heurísticas, padrões, recomendações)
* `confidence` numeric
* `updated_at`

---

## 3.8 Notificações e Auditoria

### `notifications`

* `id` uuid pk
* `tenant_id`
* `user_id` uuid
* `type` text
* `title` text
* `message` text
* `meta` jsonb
* `read_at` timestamptz null
* `created_at`

### `audit_logs`

* `id` uuid pk
* `tenant_id`
* `actor_user_id` uuid null
* `actor_agent_id` uuid null
* `action` text
* `entity` text
* `entity_id` uuid
* `before` jsonb
* `after` jsonb
* `created_at`

---

# 🔐 4) Segurança (RLS) — padrão recomendado

## Regra base (todas as tabelas multi-tenant)

**Um usuário só enxerga dados se for membro ativo do tenant.**

Conceito de policy:

* `tenant_members.user_id = auth.uid()`
* `tenant_members.tenant_id = table.tenant_id`
* `tenant_members.is_active = true`

**Papéis**

* `owner/admin`: CRUD geral
* `manager`: CRUD projeto + aprova ações
* `analyst`: leitura + análises
* `viewer`: somente leitura

> Dica: implemente uma função `is_tenant_member(tenant_id)` e `tenant_role(tenant_id)` para simplificar policies.

---

# ⚡ 5) Eventos e Automação (Supabase → n8n)

## 5.1 Padrão de eventos

Sempre que algo “importante” ocorrer, você grava em `webhook_events`.

**Exemplos de `event_type`:**

* `project.created`
* `briefing.updated`
* `strategy.awaiting_approval`
* `strategy.approved`
* `experiment.created`
* `experiment.window_reached`
* `metrics.ingested`
* `action.pending_approval`
* `action.approved`
* `insight.created`

## 5.2 Como enviar pro n8n (recomendado)

Use uma **Edge Function** `dispatch-webhook`:

Fluxo:

1. App cria/atualiza algo
2. Trigger (DB) ou Edge Function registra em `webhook_events`
3. Cron (n8n) ou Edge Function dispara HTTP POST para `N8N_WEBHOOK_URL`
4. n8n processa
5. n8n chama Edge Function `agent-callback` com resultados

**Por quê Edge Function?**

* Você esconde o segredo do webhook do n8n
* Você controla retry/backoff
* Você mantém auditoria

---

# 🔁 6) Workflows n8n (por agente) — visão operacional

## Agente 1 — Planejamento (Planner)

**Trigger:** `briefing.updated` ou `project.created`

**Pipeline:**

* Webhook (n8n) recebe payload
* Enriquecimento (buscar dados no Supabase: métricas recentes, campanhas, insights)
* LLM: gerar `strategy_versions` (draft)
* Salvar no Supabase (`strategy_versions.status = awaiting_approval`)
* Criar `notification` pro gestor aprovar

## Agente 2 — Testes (Tester)

**Trigger:** `strategy.approved`

**Pipeline:**

* Gerar `experiments` + `experiment_variants`
* Criar tarefas de execução (se canal conectado)
* Agendar janela de análise (ex: 24–72h)
* Escrever `webhook_events`: `experiment.created`

## Agente 3 — Execução (Operator)

**Trigger:** `experiment.passed` ou `action.approved`

**Pipeline:**

* Ajustar campanhas (via integrações)
* Registrar `campaign_actions.executed_at`
* Atualizar `campaigns.status/budgets`
* Se estourar limites → `action.pending_approval`

## Agente 4 — Análise (Analyst)

**Trigger:** `experiment.window_reached` ou `metrics.ingested`

**Pipeline:**

* Agregar `metrics_daily`
* Calcular deltas por variante
* Gerar diagnóstico e recomendações
* Salvar `insights`
* Atualizar `experiments.status` (passed/failed/killed)

## Agente 5 — Aprendizado (Learner)

**Trigger:** `insight.created` ou “fechamento de ciclo”

**Pipeline:**

* Classificar insight (tags/nicho/canal/objetivo)
* Atualizar `playbooks.rules` e `confidence`
* Ajustar configs do agente (ex: kill rules, budgets)
* Registrar `audit_logs`

---

# 🧰 7) Storage (criativos e relatórios)

Buckets sugeridos:

* `creatives/` (imagens, vídeos, variações)
* `reports/` (PDF, CSV)
* `attachments/` (briefings, documentos)

Cada arquivo com metadados:

* `tenant_id`, `project_id`, `type`, `experiment_id`

---

# ✅ 8) Realtime (para “OS feeling”)

Use Realtime para:

* `agent_runs` (status ao vivo)
* `campaign_actions` (pendências de aprovação)
* `notifications`

---

# 9) Edge Functions essenciais (mínimo viável)

1. `dispatch-webhook`

* Pega eventos `status=new`, envia ao n8n e marca `sent/failed`

2. `agent-callback`

* Recebe retorno do n8n e atualiza:

  * `agent_runs`
  * tabelas-alvo (`strategy_versions`, `experiments`, `insights`, etc.)

3. `approve-action`

* Confirma ação pendente e gera evento `action.approved`

4. `ingest-metrics`

* Endpoint para n8n/ETL salvar métricas normalizadas em `metrics_daily`

