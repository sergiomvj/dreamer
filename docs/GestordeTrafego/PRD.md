
---

# 📘 PRD — **Gestor de Tráfego IA (Multiagente)**

---

## 🧠 Visão Geral do Sistema (Resumo Executivo)

O **Gestor de Tráfego IA** é uma **plataforma de orquestração estratégica e operacional de tráfego pago**, baseada em **agentes especialistas**, cada um responsável por uma etapa específica do ciclo de aquisição:

> **Planejar → Testar → Executar → Analisar → Aprender**

O sistema tem como objetivo **reduzir trabalho operacional**, **padronizar decisões estratégicas**, **preservar inteligência acumulada** e **escalar a atuação de gestores humanos**, utilizando automações, dados e aprendizado contínuo.

⚠️ Importante:
O sistema **não é apenas um CRM**, nem apenas um gerenciador de campanhas.
Ele é um **Acquisition Intelligence System**.

---

## 🎯 Objetivos do Produto

### Objetivos Principais

* Centralizar estratégia, execução e inteligência de tráfego
* Transformar decisões em processos reaplicáveis
* Criar memória estratégica por nicho
* Aumentar ROAS com redução de desperdício
* Permitir escala com controle humano

### Objetivos Secundários

* Delegar tarefas repetitivas a agentes
* Acelerar testes e validações
* Criar playbooks vivos
* Suportar múltiplas contas/projetos

---

# 🧭 Estrutura Global do Sistema (Menus)

```
Dashboard
Projetos / Contas
Planejamento Estratégico
Testes & Experimentos
Execução de Campanhas
Análise & Relatórios
Aprendizado & Playbooks
Agentes & Automações
Integrações
Configurações
```

---

# 📊 1. Dashboard (Visão Geral)

### Objetivo

Visão executiva e operacional em tempo real.

### Componentes

* KPIs globais (CPA, ROAS, Spend, Conversões)
* Status dos agentes (ativo / aguardando / erro)
* Alertas inteligentes
* Últimas decisões automatizadas
* Projetos com pior/melhor performance

### Ações

* Aprovar decisões críticas
* Pausar campanhas
* Entrar em um projeto específico

---

# 🗂️ 2. Projetos / Contas

### Objetivo

Gerenciar múltiplos clientes, marcas ou projetos.

### Telas

#### Lista de Projetos

* Nome
* Nicho
* Status
* Orçamento mensal
* Responsável humano
* Última otimização

#### Detalhe do Projeto

* Briefing
* Objetivos
* Público-alvo
* Histórico de decisões
* Agentes ativos no projeto

### Ações

* Criar novo projeto
* Clonar projeto
* Arquivar projeto

---

# 🧠 3. Planejamento Estratégico

### Objetivo

Definir **o que será testado e por quê**.

### Telas

#### Briefing Estratégico

* Produto / Serviço
* Proposta de valor
* Dores do público
* Diferenciais
* Restrições

#### Estratégia de Aquisição

* Funil proposto
* Canais (Meta, Google, etc.)
* Hipóteses estratégicas
* KPIs definidos
* Orçamento e pacing

#### Mapa de Testes

* Hipótese
* Variável testada
* Critério de sucesso
* Duração

### Outputs

* Plano Estratégico Versionado
* Payload para Agente de Testes

---

# 🧪 4. Testes & Experimentos

### Objetivo

Validar hipóteses com controle.

### Telas

#### Matriz de Testes

* Criativos
* Públicos
* Ofertas
* Copys
* Landing pages

#### Status dos Testes

* Em andamento
* Aprovado
* Reprovado
* Escalável

### Regras

* Kill rules
* Tempo mínimo
* Orçamento máximo

---

# 🚀 5. Execução de Campanhas

### Objetivo

Operar campanhas com precisão.

### Telas

#### Campanhas Ativas

* Canal
* Objetivo
* Orçamento
* Status
* Última ação do agente

#### Log Operacional

* Alterações automáticas
* Ajustes manuais
* Alertas disparados

### Ações

* Pausar
* Escalar
* Ajustar orçamento
* Solicitar revisão humana

---

# 📈 6. Análise & Relatórios

### Objetivo

Transformar dados em decisões.

### Telas

#### Relatório Geral

* Performance por canal
* Performance por público
* Performance por criativo

#### Diagnóstico Inteligente

* Gargalos detectados
* Causas prováveis
* Recomendações

---

# 🧬 7. Aprendizado & Playbooks

### Objetivo

Criar memória estratégica.

### Telas

#### Base de Aprendizado

* O que funcionou
* O que não funcionou
* Contexto
* Aplicabilidade

#### Playbooks

* Por nicho
* Por canal
* Por objetivo

---

# 🤖 8. Agentes & Automações

### Objetivo

Gerenciar agentes especialistas.

### Telas

* Lista de agentes
* Função
* Entradas
* Saídas
* Nível de autonomia
* Histórico de decisões

---

# 🔌 9. Integrações

* Meta Ads
* Google Ads
* Analytics
* CRM
* Webhooks
* n8n
* APIs externas

---

# ⚙️ 10. Configurações

* Usuários e permissões
* Níveis de autonomia
* Limites de automação
* Notificações
* Logs e auditoria

---

# 🔁 FLUXOS DE AUTOMAÇÃO — **Agentes via Webhook + n8n**

---

## 🔗 Arquitetura Base

```
App → Webhook → n8n → Agente IA → Processamento → Resposta → App
```

---

## 🧠 Agente 1 — Planejamento Estratégico

### Trigger

* Novo projeto criado
* Briefing atualizado

### Webhook Payload

```json
{
  "project_id": "uuid",
  "briefing": {},
  "historico": {},
  "objetivos": {}
}
```

### Fluxo n8n

1. Webhook Trigger
2. Normalização de dados
3. Prompt Estratégico (LLM)
4. Geração de hipóteses
5. Geração de mapa de testes
6. Salvar plano estratégico
7. Enviar para Agente de Testes

---

## 🧪 Agente 2 — Testes & Experimentação

### Trigger

* Plano estratégico aprovado

### Fluxo

1. Recebe hipóteses
2. Cria matriz de testes
3. Define critérios
4. Dispara criação de campanhas teste
5. Agenda análise automática

---

## 🚀 Agente 3 — Execução

### Trigger

* Teste aprovado
* Campanha escalável

### Fluxo

1. Recebe parâmetros validados
2. Cria/ajusta campanhas
3. Monitora métricas
4. Ajusta orçamento
5. Gera alertas

---

## 📊 Agente 4 — Análise

### Trigger

* Janela de tempo
* Evento crítico (CPA alto, ROAS baixo)

### Fluxo

1. Coleta dados
2. Normaliza métricas
3. Executa análise comparativa
4. Gera diagnóstico
5. Envia recomendações

---

## 🧬 Agente 5 — Aprendizado

### Trigger

* Análise finalizada
* Feedback humano

### Fluxo

1. Recebe resultados
2. Classifica aprendizado
3. Atualiza base de conhecimento
4. Atualiza playbooks
5. Ajusta pesos de decisão

---

# 🧠 Nível de Autonomia (Controlável)

| Ação              | Autonomia |
| ----------------- | --------- |
| Criar testes      | Alta      |
| Ajustar orçamento | Média     |
| Escalar campanha  | Média     |
| Pausar tudo       | Baixa     |
| Mudar estratégia  | Humano    |

---

