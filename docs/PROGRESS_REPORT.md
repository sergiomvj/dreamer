# Relatório de Progresso - GetLeads (15/01/2026)

## ✅ O que foi concluído hoje:

1.  **AI Helper (Onboarding)**:
    *   Integrado o ícone de assistente de IA nos campos de DNA do Projeto, ICP e Estratégias.
    *   Implementada a lógica de sugestão contextual baseada nos dados atuais do projeto.

2.  **Correção de Fluxo de Dados**:
    *   **Fim da Duplicação**: Corrigido o bug onde um novo projeto era criado toda vez que se clicava em "Continuar". Agora o sistema usa lógica de `saveProject` (Update se existir ID, Insert se for novo).
    *   **Carregamento de Dados**: Ao selecionar um projeto existente, todos os campos (Missão, Objetivos, Metas, Restrições) são preenchidos automaticamente.

3.  **Gestão de Produtos**:
    *   Adicionado filtro por projeto na tela de **Produtos & Ofertas**.
    *   Exibição do nome do projeto em cada card de produto.
    *   Correção na criação manual de produtos para garantir o vínculo com o projeto selecionado.

4.  **UX do Manual**:
    *   Adicionado o botão premium "Voltar ao Sistema" no cabeçalho do manual de operação.

---

## ⚠️ Pendências Críticas (Para Amanhã):

### 1. Erro de Diagnóstico (401 Unauthorized / non-2xx)
Apesar das melhorias no código, a Edge Function `llm` do Supabase continua rejeitando as chamadas com erro de autorização ou erro 500 do servidor.

**Possíveis causas a investigar:**
*   **Secrets do Supabase**: Verificar se as variáveis `OPENROUTER_API_KEY` ou `OPENAI_API_KEY` estão configuradas *dentro* do painel do Supabase (Edge Functions -> Secrets).
*   **JWT Enforcement**: Se a função exige JWT, o token pode estar chegando inválido ou a função precisa ser marcada como "Public" se for para chamadas anônimas (não recomendado).
*   **Log da Função**: Precisamos olhar os logs internos do Supabase (Dashboard -> Edge Functions -> llm -> Logs) para ver o erro exato que o Deno está disparando.

---

## 🚀 Próximos Passos (Brainstorm):
1.  **Fix Diagnóstico**: Resolver a comunicação com a Edge Function.
2.  **Geração Automática de Estratégias**: Usar a IA para não apenas sugerir campos, mas montar uma sugestão de "Strategic Hypothesis" completa baseada no DNA.
3.  **Dashboard Analytics**: Começar a wireframer os gráficos de performance de campanhas.

**Boa noite! Nos vemos amanhã.**
