# Guia: Configuração do Central de Operações Dreamer no n8n

Este guia detalha como configurar os workflows no n8n para que o app Dreamer processe briefings e gere estratégias automaticamente.

---

## Pré-requisitos
- Instância do n8n rodando em `https://n8n.fbrapps.com`.
- Credenciais do Supabase configuradas no n8n.
- Edge Functions (`dispatch-webhook` e `agent-callback`) já em deploy no Supabase.

---

## Fluxo 1: Router (O Centralizador de Eventos)

Este workflow recebe todos os sinais do Supabase e os distribui para as aplicações corretas.

1. **Webhook Node**:
   - **Method**: `POST`
   - **Path**: `events` (Sua URL será: `https://n8n.fbrapps.com/webhook/events`)
   - **Authentication**: Nenhuma (Validaremos via código)

2. **Verify Secret (Code Node)**:
   - Adicione um nó de código para validar o header `x-webhook-secret`.
   - Verifique se `header['x-webhook-secret']` é igual ao seu token seguro.

3. **Switch Node (Roteador)**:
   - **Value**: `{{ $json.body.app_name }}`
   - **Rule 1**: Se for igual a `Dreamer` -> Direciona para o próximo nó.

4. **Execute Workflow Node**:
   - Selecione o workflow **"Dreamer: Estratégista de Tráfego"**.
   - Passe todos os dados recebidos.

---

## Fluxo 2: Dreamer - Estratégista de Tráfego (O Especialista)

Este workflow é acionado pelo Router quando um briefing é atualizado.

1. **Execute Workflow Trigger**: Recebe os dados do Router.

2. **Supabase Node (Get Briefing)**:
   - **Table**: `project_briefings`
   - **Action**: `Get` (ou Select `*`)
   - **Filter**: `project_id` igual ao enviado pelo webhook.

3. **OpenRouter / LLM Node (O Cérebro)**:
   - **Model**: Sugerido `google/gemini-2.0-flash-exp:free` ou `openai/gpt-4o-mini`.
   - **System Prompt**: 
     > "Você é o Agente Planner do Dreamer. Sua missão é criar um plano tático de tráfego pago de alta performance. Analise o nicho, as dores do cliente e o orçamento para sugerir canais (Meta/Google/LinkedIn)."
   - **Output Format**: JSON estrito.

4. **HTTP Request Node (O Callback)**:
   - **URL**: `https://hllewakzczxogunietzm.supabase.co/functions/v1/agent-callback`
   - **Method**: `POST`
   - **Header**: `x-webhook-secret` (Seu token)
   - **Body (JSON)**:
     ```json
     {
       "event_id": "{{ $json.event_id }}",
       "tenant_id": "{{ $json.tenant_id }}",
       "project_id": "{{ $json.project_id }}",
       "agent": { "name": "Planner", "stage": "planning" },
       "run": { "status": "completed", "output": {{ $json.llm_output }} },
       "rpc": [
         {
           "fn": "create_strategy_version",
           "args": {
             "p_tenant_id": "{{ $json.tenant_id }}",
             "p_project_id": "{{ $json.project_id }}",
             "p_strategy": {{ $json.ia_strategy_object }},
             "p_hypotheses": {{ $json.ia_hypotheses_array }},
             "p_status": "awaiting_approval"
           }
         }
       ]
     }
     ```

---

## Fluxo 3: Dreamer - SDR IA WhatsApp (O Conversador)

Este workflow é acionado quando uma mensagem de WhatsApp chega (Inbound) ou quando um lead novo precisa de prospecção.

1. **Webhook Node (WhatsApp Inbound)**: Recebe as mensagens da Cloud API ou 360Dialog.
2. **Supabase Node (Enriquecer Contexto)**: Busca o histórico de conversas e o **Playbook IA**.
3. **OpenRouter / LLM Node (O Vendedor)**:
   - **System Prompt**: "Você é o SDR IA do Dreamer. Siga o Playbook: {{ $playbook }}."
4. **HTTP Request Node (Callback/Send)**: Envia a resposta de volta e atualiza o Control Plane.

---

## Como Testar
1. Rode o script de massa de dados (`docs/GestordeTrafego/Massa_De_Dados.sql`) no SQL Editor do Supabase.
2. No app Dreamer, mude o orçamento de um dos projetos criados ou inicie uma conversa no WhatsApp.
3. Observe o nó Webhook do n8n receber o sinal.
4. Verifique as abas **Planning** e **Conversas** para acompanhar o trabalho das IAs.
