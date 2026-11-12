# Spec de design: barra de formatação universal

Data: 2026-11-12
Status: aprovado
Classificação: mudança delimitada (projeto novo, escopo fechado, sem dependências)

## Problema

Campos de texto na web não têm formatação rápida: ou o site não oferece botões,
ou exige decorar sintaxe (`_texto_`, `**texto**`). Custo atual: o João digita
marcadores à mão ou abre editores só para riscar/negritar um trecho.

## Decisões

| # | Decisão | Alternativa rejeitada | Motivo |
| --- | --- | --- | --- |
| 1 | Extensão Chrome MV3, JS puro, sem build | Userscript Tampermonkey | Mesmo padrão das outras extensões do João; sem dependência de terceiros |
| 2 | Bolha flutuante aparece ao selecionar texto dentro de campo editável (input, textarea, contenteditable), some ao desselecionar | Botão fixo / atalho global | É o comportamento da referência (WhatsApp Desktop) aprovado pelo João |
| 3 | Botões: negrito, itálico, riscado, código, lista numerada, lista com marcadores, citação | Conjunto mínimo | João escolheu a barra completa, igual à imagem de referência |
| 4 | Campo rico (contenteditable) → comandos nativos (`execCommand`) e inserção de HTML para código | Forçar sintaxe de texto puro | O site já renderiza rich text; é o resultado correto |
| 5 | Texto puro → sintaxe por tabela de domínios (WhatsApp, GitHub, Discord, Slack, Reddit…), fallback markdown | Tags HTML fixas | João pediu detecção automática; em texto puro não existe detecção infalível, a tabela + fallback é a melhor aproximação honesta |
| 6 | Toggle: se o trecho já está formatado, o botão remove a formatação | Só adicionar | Paridade com o comportamento esperado de um botão B/i |
| 7 | Bolha renderizada em Shadow DOM, pill escura estilo WhatsApp, alvos de 28px | Injetar CSS no documento da página | Evita conflito de estilo com qualquer site e atendimento a WCAG de alvo/foco |
| 8 | Lista de exclusão de domínios com editores que têm DOM/barra própria (Google Docs, Notion, Figma, Office) | Funcionar em todos sem exceção | Interferir nesses editores quebra a experiência deles |
| 9 | Sem background/service worker, sem permissões além de content script em `<all_urls>` | activeTab + message | Não há nada para o background fazer; menos permissão = menos aviso na instalação |
| 10 | Sintaxe WhatsApp aplicada como TEXTO mesmo em campo rico: o editor do WhatsApp Web é contenteditable que rejeita formatação HTML e só renderiza `*texto*` ao enviar | `execCommand` nativo no editor do WhatsApp | João reportou botões sem efeito no WhatsApp; inserir os marcadores literalmente é o único comportamento que o editor aceita (v0.1.1) |
| 11 | Posição da bolha em textarea/input medida por div espelho (mesmos estilos de fonte/padding), ancorada no trecho selecionado | Ancorar no retângulo do elemento | João reportou: a bolha deve abrir perto de onde selecionou; fallback para o elemento se a medição falhar (v0.1.1) |

## Comportamento esperado

- Selecionar texto em um campo editável em qualquer site (fora a lista de
  exclusão) mostra a bolha ancorada acima da seleção, limitada ao viewport.
- Clique em negrito/itálico/riscado/código: formata o trecho **e mantém o
  trecho selecionado** com a mesma extensão anterior (permite encadear).
- Clique em listas/citação: aplica prefixo linha a linha no bloco de linhas
  tocado pela seleção (texto puro) ou comando de bloco (campo rico).
- Toggle: clicar de novo no mesmo botão remove a formatação do trecho.
- Colapsar a seleção, clicar fora ou trocar de campo esconde a bolha.
- Sintaxe por site, exemplos da tabela inicial:
  - `web.whatsapp.com` → WhatsApp (`*b*`, `_i_`, `~s~`, ``` `code` ```)
  - `github.com`, `gitlab.com`, `reddit.com`, `discord.com`, `app.slack.com`, `trello.com` → markdown (`**b**`, `*i*`, `~~s~~`, `` `code` ``)
  - demais → markdown
- Erro esperado: site com editor canvas (Google Docs) não mostra bolha — exclusão.

## Impacto

Novo projeto local `Extensao-formatar/`. Arquivos: `manifest.json`, content
script, módulo de formatação, tabela de domínios, ícones, testes. Nada além
disso; nenhum contrato externo.

## Riscos e mitigações

| Risco | Mitigação |
| --- | --- |
| `execCommand` deprecado | Suportado em todo Chromium até hoje; envolvido em um único ponto do código para troca futura |
| Site com CSP restritivo ou CSS agressivo | Bolha em Shadow DOM; content script opera no DOM, não carrega recursos da página |
| Editores com seleção virtual (ProseMirror, Lexical) podem ignorar `execCommand` | Teste manual nos principais (Gmail, Outlook Web); registry de exclusão cresce conforme reportado |
| Sintaxe errada em site fora da tabela | Fallback markdown + tabela editável em arquivo único e comentado |
| Bolha sobre elemento `fixed`/iframe aninhado | Âncora recalculada no scroll/resize; iframes aninhados ficam para v2 (registro na spec) |
