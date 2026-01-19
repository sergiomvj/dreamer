# 🤖 Integração de Automações: Dreamer + n8n + Antigravity

Este documento detalha o plano estratégico para a criação da nova seção de **AUTOMAÇÕES** no projeto Dreamer, utilizando as tecnologias de ponta `n8n-mcp` e `n8n-skills`.

## 🎯 Objetivo
Criar no Dreamer um novo item AUTOMAÇOES QUE INTEGRE um hub centralizado de automação, onde a IA (Antigravity) não apenas sugere estratégias, mas **executa e gerencia fluxos operacionais completos** utilizando o n8n.

---

## 🔍 Análise Tecnológica

### 1. n8n-mcp (Infraestrutura de Controle)
O projeto [n8n-mcp](https://github.com/czlonkowski/n8n-mcp) é um servidor de Protocolo de Contexto de Modelo (MCP) que permite que o Antigravity se conecte diretamente à sua instância do n8n (seja ela na nuvem ou self-hosted).

**Contribuição Efetiva:**
- **Ferramentas de Gestão:** Permite listar, criar, atualizar, ativar/desativar e deletar workflows programaticamente.
- **Execução em Tempo Real:** Capacidade de ler logs de execução para depurar erros de automação instantaneamente.
- **Interação Direta:** O Antigravity pode "escrever" o código do workflow diretamente no seu n8n.

### 2. n8n-skills (Inteligência e Padrões)
O projeto [n8n-skills](https://github.com/czlonkowski/n8n-skills) é uma biblioteca de conhecimento especializada em n8n para IAs.

**Contribuição Efetiva:**
- **Sintaxe de Expressões:** Garante que a IA escreva expressões de nó (ex: `{{ $json.data }}`) sem erros.
- **Padrões de Projeto:** Conhecimento sobre as melhores práticas de design de fluxos (error handling, loops, branches).
- **Validação:** Capacidade de validar se um workflow é funcional antes mesmo de tentar ativá-lo.

---

## 🚀 Como Antigravity e estas ferramentas trabalham em conjunto

A união dessas tecnologias cria um fluxo de trabalho revolucionário:

1. **Briefing:** Você pede no chat: *"Antigravity, crie uma automação que pegue os leads com score > 80 do Supabase e envie para o n8n para disparar um e-mail personalizado via SendGrid"*.
2. **Construção (n8n-skills):** Eu consulto meus conhecimentos de `n8n-skills` para projetar o fluxo perfeito, garantindo que a lógica de decisão e os nós estejam configurados corretamente.
3. **Deploy (n8n-mcp):** Utilizo as ferramentas do `n8n-mcp` para criar o workflow na sua instância do n8n, configurar as credenciais necessárias e ativá-lo.
4. **Monitoramento:** Caso o fluxo falhe, eu posso ler os logs via MCP e sugerir/aplicar a correção imediatamente.

---

## 🛠️ Plano de Implementação no Dreamer

### Fase 1: Interface de Automação
- Criar a aba **"Automações"** no Dashboard principal.
- Exibir uma lista de workflows ativos/inativos consumida via API do n8n.
- Adicionar botões de "Executar Agora" e "Editar na IA".

### Fase 2: Configuração de MCP
- Instalar e configurar o `n8n-mcp` no ambiente de desenvolvimento.
- Adicionar as chaves de API do n8n ao arquivo `.env` e ao Supabase Secrets.

### Fase 3: Agentes Especialistas
- Criar um agente no Antigravity especializado em "Workflow Engineering", treinado com as diretrizes do `n8n-skills`.

---

## 💎 Valor Agregado ao Projeto Dreamer

- **Redução de Atrito:** O usuário não precisa saber mexer no n8n. Ele descreve o desejo e a automação nasce pronta.
- **Escalabilidade:** Permite que o Dreamer gerencie milhares de leads de forma autônoma.
- **Diferencial Competitivo:** Poucas plataformas de CRM/Marketing oferecem criação de automação nativa via IA com esse nível de profundidade.

---

**Autor:** Antigravity AI
**Data:** 17 de Janeiro de 2026
**Status:** Proposta Técnica em Análise
