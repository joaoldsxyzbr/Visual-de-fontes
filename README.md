# Barra de Formatação

Extensão Chrome (MV3) que mostra uma barra flutuante estilo WhatsApp Desktop — **B**, *i*, riscado, código, lista numerada, lista com marcadores e citação — ao selecionar texto em qualquer campo editável de qualquer site.

## Instalação

1. Clone este repositório.
2. `chrome://extensions` → ative **Modo do desenvolvedor** → **Carregar descompactada** → selecione a pasta.
3. (Opcional) Ícone custom: `node scripts/gerar-icones.js` — gera os PNGs e os registra no `manifest.json`; depois recarregue a extensão. Sem esse passo, a extensão carrega normalmente com o ícone padrão.

## Testes e CI

```bash
node --test "testes/*.test.js"
```

17 testes de lógica pura (formatação, toggles, listas, tabela de domínios). O CI roda a cada push e PR na main.

## Como funciona

- **Campo rico** (contenteditable: Gmail, Outlook Web, editores de blog) → comandos nativos de rich text; a formatação é real. Exceção: editores que só entendem marcadores (WhatsApp Web) recebem a sintaxe do site inserida como texto — é o único formato que o editor deles aceita.
- **Posicionamento**: a bolha abre junto do trecho selecionado — em textarea/input a posição é medida por div espelho; acompanha scroll e resize.
- **Texto puro** (textarea/input) → sintaxe detectada por domínio em `src/dominios.js`: WhatsApp usa `*b*`, `_i_`, `~s~`; GitHub, Discord, Slack, Reddit, Trello e o fallback usam markdown (`**b**`, `*i*`, `~~s~~`). Site que formatar errado ou site novo: edite a tabela — é um arquivo único e comentado.
- **Toggle em tudo**: clicar de novo no mesmo botão remove a formatação; dá pra encadear (negrito + itálico no mesmo trecho) e o trecho continua selecionado.
- **Ctrl+Z preservado** nos campos de texto (`execCommand('insertText')`).
- **Bolha em Shadow DOM**: imune ao CSS de qualquer página; alvos de clique de 28px, foco visível.
- **Exclusões**: Google Docs/Drive, Notion, Figma, Office, Canva — editores com DOM próprio onde a bolha não deve interferir.

## Documentação

- Spec de design: `docs/specs/2026-11-12-barra-formatacao-design.md`
- Plano de implementação: `docs/plans/2026-11-12-barra-formatacao-plano.md`
- Página de teste: `testes/pagina-teste.html`
- Checklist de validação manual: `testes/validacao-manual.md`
