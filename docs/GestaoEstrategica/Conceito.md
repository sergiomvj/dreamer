Perfeito. Vou tratar essa aba como **camada de arquitetura estratégica**, não de execução — com **automação máxima**, **validações duras** e **outputs estruturados** para alimentar a aba seguinte (**Captação / Execução**) sem ruído, achismo ou risco.

Abaixo está o **PRD COMPLETO da aba “Planejamento Estratégico de Marketing”**, já pensado para **orquestração via N8N**, **multi-cliente**, **multi-produto** e **multi-canal**.

---

# 📘 PRD — ABA

## **Planejamento Estratégico de Marketing**

> **Missão da aba**
> Criar, validar, versionar e estruturar **estratégias de marketing completas**, transformando objetivos de negócio em **planos executáveis**, **automatizáveis** e **auditáveis**, entregando **dados 100% confiáveis** para a aba de Captação.

Essa aba **não executa campanhas**.
Ela **define o que pode, deve e não deve ser executado**.

---

## 1️⃣ PRINCÍPIOS DE DESIGN DA ABA

1. **Planejamento ≠ Execução**
2. **Nada segue sem validação**
3. **Tudo vira estrutura**
4. **Automação primeiro**
5. **Erro estratégico deve ser bloqueado**
6. **Saídas sempre padronizadas**
7. **Pensada para N8N desde o início**

---

## 2️⃣ ESTRUTURA GERAL DA ABA (VISÃO DO USUÁRIO)

### Sub-seções principais:

1. Visão Estratégica do Cliente
2. Arquitetura de Produtos & Ofertas
3. Mapeamento de Público & Consciência
4. Arquitetura da Jornada & Funil
5. Planejamento de Canais & Papéis
6. Orquestrador de Ações Estratégicas
7. Linha do Tempo & Sequenciamento
8. Validações & Diagnósticos Automáticos
9. Outputs Estruturados para Execução
10. Versionamento & Aprovação

---

## 3️⃣ TELAS E FUNCIONALIDADES (DETALHADAS)

---

## 3.1 Visão Estratégica do Cliente

### Objetivo

Definir **limites reais** do que pode ser planejado.

### Componentes

* Estágio do negócio (validação / crescimento / escala)
* Tipo de venda (impulso / consultiva / recorrente)
* Ticket médio
* Ciclo de venda
* Capacidade operacional
* Histórico de marketing

### Automações

* Classificação automática do cliente
* Sugestão de complexidade máxima de funil
* Bloqueio de estratégias incompatíveis

### Output

```json
{
  "client_maturity": "growth",
  "sales_type": "consultive",
  "allowed_strategies": ["warming", "content", "inbound"],
  "restricted_strategies": ["direct_conversion"]
}
```

---

## 3.2 Arquitetura de Produtos & Ofertas

### Objetivo

Evitar o erro clássico: **tentar vender tudo ao mesmo tempo**.

### Componentes

* Cadastro de produtos/ofertas
* Dor principal resolvida
* Grau de fricção
* Tipo de oferta (entrada / core / upsell)
* Prioridade estratégica

### Automações

* Priorizador automático de ofertas
* Sugestão de produto inicial
* Detecção de conflito entre ofertas

### Output

```json
{
  "product_id": "prod_x",
  "priority": "high",
  "recommended_entry_point": true
}
```

---

## 3.3 Mapeamento de Público & Consciência

### Objetivo

Definir **quem pode receber o quê**, em qual estágio.

### Componentes

* Público alvo
* Nível de consciência
* Dores principais
* Urgência real vs latente

### Automações

* Classificação automática de público
* Alerta de desalinhamento produto ↔ público
* Geração de tags estratégicas

### Output

```json
{
  "audience_type": "cold",
  "awareness_level": "problem_aware",
  "allowed_actions": ["warming", "content"]
}
```

---

## 3.4 Arquitetura da Jornada & Funil

### Objetivo

Construir **a espinha dorsal da estratégia**.

### Componentes

* Etapas da jornada
* Objetivo de cada etapa
* Evento de avanço
* Critério de sucesso
* Critério de falha

### Automações

* Validação de coerência da jornada
* Bloqueio de saltos lógicos
* Geração automática de eventos

### Output

```json
{
  "journey_stage": "consideration",
  "conversion_event": "opt_in_confirmed",
  "next_stage": "conversion"
}
```

---

## 3.5 Planejamento de Canais & Papéis

### Objetivo

Definir **função exata de cada canal**.

### Componentes

* Canal
* Papel estratégico
* Tipo de conteúdo/mensagem
* Métrica esperada
* Limites do canal

### Automações

* Detecção de uso indevido de canal
* Alertas de expectativa irreal
* Mapeamento canal → jornada

### Output

```json
{
  "channel": "whatsapp",
  "role": "conversion",
  "restricted_for": ["cold_leads"]
}
```

---

## 3.6 Orquestrador de Ações Estratégicas

### Objetivo

Criar o **esqueleto completo das ações**, sem executá-las.

### Componentes

Cada ação contém:

* Produto
* Público
* Canal
* Objetivo
* Fase da jornada
* Dependências
* Status

### Automações

* Geração de dependências automáticas
* Validação de ordem lógica
* Pré-criação de fluxos N8N (draft)

### Output

```json
{
  "action_id": "act_01",
  "type": "warming",
  "dependencies": ["content_ready"],
  "execution_allowed": false
}
```

---

## 3.7 Linha do Tempo & Sequenciamento

### Objetivo

Evitar **caos operacional**.

### Componentes

* Timeline visual
* Marcos estratégicos
* Janelas de execução
* Ações paralelas permitidas

### Automações

* Detecção de sobrecarga
* Ajuste automático de sequências
* Alertas de conflito

---

## 3.8 Validações & Diagnósticos Automáticos (CRÍTICO)

### Validações obrigatórias

* Produto compatível com público
* Jornada lógica
* Canal apropriado
* CAL respeitado
* LGPD / opt-in respeitado

### Diagnósticos

* Risco de rejeição
* Risco de bloqueio
* Complexidade excessiva
* Falta de etapa intermediária

📌 **Sem 100% verde → não passa para execução**

---

## 3.9 Outputs Estruturados para Execução

### Objetivo

Entregar **dados limpos, claros e acionáveis**.

### Geração automática de:

* Blueprint de campanhas
* Eventos e webhooks
* Estrutura de automações N8N
* Tags e status de leads
* Regras do Ciclo de Aquecimento

### Exemplo de Output Final

```json
{
  "strategy_version": "v1.2",
  "approved": true,
  "execution_payload": {
    "actions": [],
    "events": [],
    "limits": {}
  }
}
```

---

## 3.10 Versionamento & Aprovação

### Funcionalidades

* Versionamento completo
* Comparação entre versões
* Aprovação manual ou automática
* Rollback estratégico

---

## 4️⃣ AUTOMAÇÃO TOTAL COM N8N

### Eventos disparados:

* `strategy.created`
* `strategy.validated`
* `strategy.approved`
* `strategy.blocked`
* `strategy.versioned`

### Workflows N8N:

* Validação automática
* Geração de estrutura de execução
* Criação de fluxos draft
* Bloqueio de execução fora da estratégia

---

## 🧠 CONCLUSÃO (VISÃO DE GESTOR)

Essa aba:

* **Protege o gestor**
* **Educa o cliente**
* **Padroniza o pensamento**
* **Reduz erro humano**
* **Transforma estratégia em sistema**

> **Nada entra na Captação sem passar aqui.**
> **Nada executa sem estar validado aqui.**

---


