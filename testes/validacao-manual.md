# Validação manual — Barra de Formatação v0.1.0

Data: ____/____/______  Navegador: Chrome ____  Resultado de cada item: ✅ / ❌ (+ observação)

## Instalação

1. `chrome://extensions` → ativar "Modo do desenvolvedor" → "Carregar descompactada" → selecionar a pasta `Extensao-formatar/`.
2. Para a página de teste local (`pagina-teste.html` via `file://`): no card da extensão → "Detalhes" → ativar **"Permitir acesso a URLs deste arquivo"**.
3. Alternativa sem file://: `node -e "..."` servidor local ou testar direto nos sites do bloco 5.

## Bloco 1 — Ciclo de vida da bolha (pagina-teste.html)

| # | Passo | Esperado | OK? |
| --- | --- | --- | --- |
| 1.1 | Selecionar palavra no textarea | Bolha escura aparece acima da seleção, centralizada, com 7 botões | ☐ |
| 1.2 | Clicar em ponto vazio da página | Bolha some | ☐ |
| 1.3 | Selecionar texto no input de linha única | Bolha aparece ancorada ao campo | ☐ |
| 1.4 | Selecionar texto no campo rico | Bolha aparece acima do trecho selecionado | ☐ |
| 1.5 | Rolar a página com texto selecionado | Bolha acompanha a seleção, não fica "solta" | ☐ |
| 1.6 | Apertar Esc com bolha visível | Bolha some | ☐ |
| 1.7 | Visitar docs.google.com e selecionar texto em doc | Bolha NÃO aparece (exclusão) | ☐ |
| 1.8 | Selecionar um trecho no MEIO do textarea alto | Bolha abre acima do TRECHO selecionado, não no topo do campo | ☐ |
| 1.9 | Rolar o textarea (não a página) com a bolha visível | Bolha acompanha o trecho selecionado sem travar | ☐ |

## Bloco 2 — Botões em texto puro (textarea da seção 1)

| # | Botão | Esperado no texto | OK? |
| --- | --- | --- | --- |
| 2.1 | B | `**trecho**` e o trecho continua selecionado | ☐ |
| 2.2 | B de novo | Remove `**` (toggle) | ☐ |
| 2.3 | i | `*trecho*`; segunda vez remove | ☐ |
| 2.4 | S | `~~trecho~~`; segunda vez remove | ☐ |
| 2.5 | </> | `` `trecho` ``; segunda vez remove | ☐ |
| 2.6 | 1. | Cada linha do bloco vira `1.` `2.` `3.`…; segunda vez remove | ☐ |
| 2.7 | • | Cada linha ganha `- `; segunda vez remove | ☐ |
| 2.8 | ❝ | Cada linha ganha `> `; segunda vez remove | ☐ |
| 2.9 | Encadear B + i no mesmo trecho | `***trecho***` (um dentro do outro) | ☐ |
| 2.10 | Ctrl+Z após aplicar | Formatação desfeita em UMA etapa (undo preservado) | ☐ |

## Bloco 3 — Botões em campo rico (contenteditable da seção 3)

| # | Botão | Esperado | OK? |
| --- | --- | --- | --- |
| 3.1 | B / i / S | Negrito, itálico e riscado REAIS renderizados; segunda vez remove | ☐ |
| 3.2 | </> | Trecho vira código monoespaçado; segunda vez remove | ☐ |
| 3.3 | 1. / • | Lista real do editor; segunda vez remove | ☐ |
| 3.4 | ❝ | Bloco vira blockquote; segunda vez volta a parágrafo | ☐ |

## Bloco 4 — Robustez

| # | Passo | Esperado | OK? |
| --- | --- | --- | --- |
| 4.1 | Campo que perde foco ao clicar na bolha | Seleção e texto digitado preservados (bolha não rouba foco) | ☐ |
| 4.2 | Campo no topo da janela | Bolha aparece ABAIXO da seleção em vez de sair da tela | ☐ |
| 4.3 | Bolha em site de tema claro | Estilo da bolha inalterado (Shadow DOM isola do CSS da página) | ☐ |

## Bloco 5 — Sites reais

| # | Site | Esperado | OK? |
| --- | --- | --- | --- |
| 5.1 | web.whatsapp.com → campo de mensagem (é contenteditable) | Botões inserem a sintaxe WhatsApp como texto: `*b*`, `_i_`, `~s~`, ``` ```code``` ``` — vira negrito/itálico real ao ENVIAR | ☐ |
| 5.2 | github.com → comentário em issue | Markdown: `**b**`, `*i*`, `~~s~~` | ☐ |
| 5.3 | Gmail → corpo do e-mail | Formatação rica real (campo contenteditable) | ☐ |

## Problemas encontrados

> Anotar aqui o site, o campo e o que aconteceu. Cada item vira ajuste na tabela `src/dominios.js` ou correção no content script.
