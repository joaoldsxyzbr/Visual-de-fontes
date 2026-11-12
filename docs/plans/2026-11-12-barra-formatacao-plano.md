# Plano: barra de formatação universal

Spec: docs/specs/2026-11-12-barra-formatacao-design.md
Branch: ainda sem repo (decisão do João: repo depois que funcionar); git init na criação do repo

## Tarefas

### Tarefa 1: módulo de formatação de texto puro (TDD)

- Arquivos: `src/formatador.js`, `testes/formatador.test.js`
- Mudança: funções puras `alternarInline(texto, marcador)` (envolve/desenvolve trecho)
  e `prefixarLinhas(linhas, prefixo)` (lista/citação linha a linha)
- Verificação: `node --test testes/`
- Critério de pronto: toggle funciona nos dois sentidos, código sem dependência de DOM

### Tarefa 2: tabela de sintaxe por domínio (TDD)

- Arquivos: `src/dominios.js`, `testes/dominios.test.js`
- Mudança: mapeamento domínio → sintaxe (`whatsapp` | `markdown` | `html`), fallback markdown,
  lista de exclusão (`docs.google.com`, `notion.so`, `figma.com`, `office.com`, `canva.com`)
- Verificação: `node --test testes/`
- Critério de pronto: domínio conhecido devolve sintaxe certa; desconhecido devolve markdown; excluído devolve `null`

### Tarefa 3: manifest e ícones

- Arquivos: `manifest.json`, `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`
- Mudança: MV3, content script `<all_urls>` em `document_idle`, sem permissões extras; ícone gerado por script
- Verificação: `node scripts/gerar-icones.js && ls icons/` + revisão do manifest
- Critério de pronto: `chrome://extensions` carrega sem erro e sem aviso de permissão além de "ler e alterar sites"

### Tarefa 4: content script — detecção de seleção e ciclo de vida da bolha

- Arquivos: `src/conteudo.js`
- Mudança: detecta seleção em input/textarea/contenteditable, cria bolha em Shadow DOM,
  posiciona acima da seleção com clamp no viewport, esconde ao desselecionar
- Verificação: manual — passos no relatório final (não automatizável sem navegador aqui)
- Critério de pronto: bolha aparece/some corretamente em textarea e contenteditable de teste

### Tarefa 5: content script — aplicação de formatação

- Arquivos: `src/conteudo.js`
- Mudança: roteia campo rico (`execCommand`/insertHTML) vs texto puro (Tarefa 1 + Tarefa 2),
  mantém seleção após aplicar, toggle nos dois modos
- Verificação: manual — passos no relatório final; lógica pura já coberta pelos testes das Tarefas 1 e 2
- Critério de pronto: todos os 7 botões aplicam e alternam em `testes/pagina-teste.html`

### Tarefa 6: página de teste local e validação manual completa

- Arquivos: `testes/pagina-teste.html`, `testes/validacao-manual.md`
- Mudança: página com textarea, input, contenteditable e casos WhatsApp/GitHub simulados;
  checklist de validação por botão e campo
- Verificação: `node --test testes/` verde + checklist preenchido pelo João no Chrome
- Critério de pronto: checklist 100% no Chrome do João; problemas reportados viram ajuste ou item de backlog

## Ordem e dependências

Tarefa 1 e 2 independentes entre si; 3 independente; 4 depende de 3; 5 depende de 1, 2 e 4; 6 depende de 5.

## Validação final

`node --test testes/` verde → carregar pasta descompactada no Chrome → percorrer
`testes/validacao-manual.md` na página de teste e num site real (WhatsApp Web).
CI e push ficam para quando o repo for criado.
