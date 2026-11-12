// Barra de Formatação — content script (ponto de entrada clássico, módulos via import).
// Bolha flutuante estilo WhatsApp Desktop: aparece ao selecionar texto em
// campo editável; some ao desselecionar. Spec: docs/specs/2026-11-12-barra-formatacao-design.md

(async () => {
  const base = chrome.runtime.getURL('src/');

  let dominios, formatador;
  try {
    dominios = await import(base + 'dominios.js');
    formatador = await import(base + 'formatador.js');
  } catch (e) {
    console.warn('[Barra de Formatação] falha ao carregar módulos:', e);
    return;
  }

  const sintaxe = dominios.sintaxeDe(location.href); // 'whatsapp' | 'markdown' | 'html' | null
  if (sintaxe === null) return; // site excluído (Google Docs, Notion, Figma…)

  // --- marcadores por sintaxe (campos de texto puro) ---
  const MARCADORES = {
    whatsapp: {
      negrito: ['*', '*'],
      italico: ['_', '_'],
      riscado: ['~', '~'],
      codigo: ['```', '```'],
    },
    markdown: {
      negrito: ['**', '**'],
      italico: ['*', '*'],
      riscado: ['~~', '~~'],
      codigo: ['`', '`'],
    },
    html: {
      negrito: ['<b>', '</b>'],
      italico: ['<i>', '</i>'],
      riscado: ['<s>', '</s>'],
      codigo: ['<code>', '</code>'],
    },
  };

  const BOTOES = [
    { id: 'negrito', glifo: 'B', aria: 'Negrito' },
    { id: 'italico', glifo: 'i', aria: 'Itálico' },
    { id: 'riscado', glifo: 'S', aria: 'Riscado' },
    { id: 'codigo', glifo: '</>', aria: 'Código' },
    { id: 'lista-numerada', glifo: '1.', aria: 'Lista numerada' },
    { id: 'lista-marcadores', glifo: '•', aria: 'Lista com marcadores' },
    { id: 'citacao', glifo: '❝', aria: 'Citação' },
  ];

  // --- estado ---
  let alvo = null; // { tipo: 'rico' | 'texto', el } | null
  let host, bolha, botoel = {};

  // --- construção da bolha em Shadow DOM (isolada do CSS da página) ---
  function criarBolha() {
    host = document.createElement('div');
    host.style.cssText = 'all:initial !important; position:fixed; left:0; top:0; z-index:2147483647;';
    const raiz = host.attachShadow({ mode: 'closed' });

    const estilo = document.createElement('style');
    estilo.textContent = `
      .bolha {
        position: fixed; display: none; gap: 2px; padding: 4px;
        background: #202c33; border-radius: 10px;
        box-shadow: 0 4px 16px rgba(0,0,0,.35);
        font: 13px/1 system-ui, -apple-system, 'Segoe UI', sans-serif;
        user-select: none; -webkit-user-select: none;
      }
      button {
        all: unset; box-sizing: border-box;
        width: 28px; height: 28px; border-radius: 8px;
        display: grid; place-items: center;
        color: #e9edef; cursor: pointer; font: inherit;
      }
      button:hover { background: #2a3942; }
      button:active { background: #3b4a54; }
      button:focus-visible { outline: 2px solid #00a884; outline-offset: 1px; }
      #negrito { font-weight: 700; }
      #italico { font-style: italic; font-family: Georgia, 'Times New Roman', serif; }
      #riscado { text-decoration: line-through; }
      #codigo { font-family: ui-monospace, Consolas, monospace; font-size: 11px; }
      #citacao { font-size: 15px; }
    `;
    raiz.appendChild(estilo);

    bolha = document.createElement('div');
    bolha.className = 'bolha';
    bolha.setAttribute('role', 'toolbar');
    bolha.setAttribute('aria-label', 'Formatação de texto');
    bolha.addEventListener('mousedown', (e) => e.preventDefault()); // não rouba foco/seleção
    bolha.addEventListener('keydown', (e) => { if (e.key === 'Escape') esconder(); });

    for (const b of BOTOES) {
      const el = document.createElement('button');
      el.id = b.id;
      el.textContent = b.glifo;
      el.setAttribute('aria-label', b.aria);
      el.title = b.aria;
      el.addEventListener('click', () => aplicar(b.id));
      bolha.appendChild(el);
      botoel[b.id] = el;
    }
    raiz.appendChild(bolha);
    document.documentElement.appendChild(host);
  }

  // --- helpers de DOM ---
  function campoRico(node) {
    let el = node && (node.nodeType === 1 ? node : node.parentElement);
    while (el) {
      if (el.isContentEditable) return el;
      el = el.parentElement;
    }
    return null;
  }

  function ancestralComTag(node, tag) {
    let el = node && (node.nodeType === 1 ? node : node.parentElement);
    while (el) {
      if (el.tagName === tag && el.isContentEditable) return el;
      el = el.parentElement;
    }
    return null;
  }

  const escaparHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Retângulo aproximado da seleção dentro de input/textarea, via div espelho
  // com os mesmos estilos de fonte/padding do campo. Retorna null se falhar.
  const PROPS_ESPELHO = [
    'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing', 'lineHeight',
    'textTransform', 'wordSpacing', 'textIndent', 'paddingTop', 'paddingRight',
    'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderLeftWidth', 'boxSizing', 'width',
  ];

  function retanguloSelecaoTexto(el) {
    let espelho = null;
    try {
      espelho = document.createElement('div');
      const estilos = getComputedStyle(el);
      for (const p of PROPS_ESPELHO) espelho.style[p] = estilos[p];
      espelho.style.cssText += 'position:absolute; visibility:hidden; left:-9999px; top:0; height:auto; overflow:hidden;';
      espelho.style.whiteSpace = el instanceof HTMLTextAreaElement ? 'pre-wrap' : 'pre';
      espelho.style.wordWrap = 'break-word';
      espelho.style.overflowWrap = 'break-word';
      document.body.appendChild(espelho);

      const marcar = (pos) => {
        espelho.textContent = '';
        espelho.appendChild(document.createTextNode(el.value.slice(0, pos)));
        const m = document.createElement('span');
        m.textContent = '\u200b';
        espelho.appendChild(m);
        return m;
      };
      const ini = marcar(el.selectionStart);
      const rIni = { left: ini.offsetLeft, top: ini.offsetTop, altura: ini.offsetHeight || parseFloat(estilos.lineHeight) || 20 };
      const fim = marcar(el.selectionEnd);
      const rFim = { left: fim.offsetLeft };

      const rect = el.getBoundingClientRect();
      const esquerda = Math.min(rIni.left, rFim.left);
      const direita = Math.max(rIni.left, rFim.left);
      return {
        left: rect.left + esquerda - el.scrollLeft,
        right: rect.left + direita - el.scrollLeft,
        top: rect.top + rIni.top - el.scrollTop,
        bottom: rect.top + rIni.top + rIni.altura - el.scrollTop,
        width: direita - esquerda,
        height: rIni.altura,
      };
    } catch {
      return null;
    } finally {
      if (espelho && espelho.parentNode) espelho.parentNode.removeChild(espelho);
    }
  }

  function retanguloDaSelecao() {
    if (alvo.tipo === 'texto') return retanguloSelecaoTexto(alvo.el) || alvo.el.getBoundingClientRect();
    const sel = document.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    let r = sel.getRangeAt(0).getBoundingClientRect();
    if (!r || (r.width === 0 && r.height === 0)) r = alvo.el.getBoundingClientRect();
    return r;
  }

  // --- ciclo de vida da bolha ---
  function mostrar() {
    bolha.style.display = 'flex';
    reposicionar();
  }

  function reposicionar() {
    if (!alvo) return esconder();
    const r = retanguloDaSelecao();
    if (!r) return esconder();
    const largura = bolha.offsetWidth, altura = bolha.offsetHeight;
    let esquerda = r.left + r.width / 2 - largura / 2;
    esquerda = Math.min(Math.max(8, esquerda), window.innerWidth - largura - 8);
    let topo = r.top - altura - 8;
    if (topo < 8) topo = Math.min(r.bottom + 8, window.innerHeight - altura - 8);
    bolha.style.left = esquerda + 'px';
    bolha.style.top = topo + 'px';
  }

  function esconder() {
    if (bolha) bolha.style.display = 'none';
    alvo = null;
  }

  // --- seleção em campo rico (contenteditable) ---
  function aoMudarSelecao() {
    const sel = document.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    if (sel.isCollapsed || sel.toString() === '') {
      if (!alvo || alvo.tipo === 'rico') esconder();
      return;
    }
    const el = campoRico(sel.anchorNode);
    if (!el) {
      if (!alvo || alvo.tipo === 'rico') esconder();
      return;
    }
    alvo = { tipo: 'rico', el, rangeSalvo: sel.getRangeAt(0).cloneRange() };
    mostrar();
  }

  // --- seleção em campo de texto puro (input/textarea) ---
  function aoSelecionarTextoPuro(e) {
    const el = e.target;
    const tiposOk = ['text', 'search', 'url', 'tel', ''];
    if (el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && tiposOk.includes(el.type))) {
      if (el.selectionEnd > el.selectionStart) {
        alvo = { tipo: 'texto', el };
        mostrar();
      } else if (alvo && alvo.el === el) {
        esconder();
      }
    }
  }

  // --- aplicação de formatação ---
  function aplicar(id) {
    if (!alvo) return;
    if (alvo.tipo === 'rico') aplicarRico(id);
    else aplicarTexto(id);
  }

  const COMANDOS_RICOS = {
    negrito: 'bold',
    italico: 'italic',
    riscado: 'strikeThrough',
    'lista-numerada': 'insertOrderedList',
    'lista-marcadores': 'insertUnorderedList',
  };

  function aplicarRico(id) {
    // Editores que só entendem marcadores (ex.: WhatsApp Web é contenteditable,
    // mas rejeita formatação HTML): aplica a sintaxe como texto.
    if (dominios.ricosComoTexto(sintaxe)) return aplicarRicoComoTexto(id);

    const el = alvo.el;
    el.focus();
    const sel = document.getSelection();
    if ((!sel || sel.isCollapsed) && alvo.rangeSalvo) {
      sel.removeAllRanges();
      sel.addRange(alvo.rangeSalvo);
    }
    if (!sel || sel.isCollapsed) return esconder();

    if (COMANDOS_RICOS[id]) {
      document.execCommand(COMANDOS_RICOS[id], false, null);
    } else if (id === 'codigo') {
      const existente = ancestralComTag(sel.anchorNode, 'CODE');
      if (existente) {
        const pai = existente.parentNode;
        while (existente.firstChild) pai.insertBefore(existente.firstChild, existente);
        pai.removeChild(existente);
        pai.normalize();
      } else {
        document.execCommand('insertHTML', false, '<code data-bf-novo>' + escaparHtml(sel.toString()) + '</code>');
        const code = el.querySelector('code[data-bf-novo]');
        if (code) {
          code.removeAttribute('data-bf-novo');
          const r = document.createRange();
          r.selectNodeContents(code);
          sel.removeAllRanges();
          sel.addRange(r);
        }
      }
    } else if (id === 'citacao') {
      const emQuote = !!ancestralComTag(sel.anchorNode, 'BLOCKQUOTE');
      document.execCommand('formatBlock', false, emQuote ? '<p>' : '<blockquote>');
    }

    aoMudarSelecao(); // bolha acompanha: reposiciona se ainda há seleção, esconde se não
  }

  // Campo rico de editor que só entende marcadores (ex.: WhatsApp Web):
  // formata o texto selecionado com a sintaxe do site e insere como texto puro.
  // Limitação v0.1.1: a seleção colapsa após aplicar (a bolha some).
  function aplicarRicoComoTexto(id) {
    const el = alvo.el;
    el.focus();
    const sel = document.getSelection();
    if (!sel || sel.isCollapsed) return esconder();
    const texto = sel.toString();
    if (!texto) return esconder();

    let novo = null;
    const m = MARCADORES[sintaxe][id];
    if (m) {
      novo = formatador.aplicarInline(texto, 0, texto.length, m[0], m[1]).valor;
    } else if (id === 'citacao') {
      novo = formatador.prefixarLinhas(texto, 0, texto.length, '> ').valor;
    } else if (id === 'lista-marcadores') {
      novo = formatador.prefixarLinhas(texto, 0, texto.length, '- ').valor;
    } else if (id === 'lista-numerada') {
      novo = formatador.numerarLinhas(texto, 0, texto.length).valor;
    }
    if (novo === null) return;

    let ok = false;
    try { ok = document.execCommand('insertText', false, novo); } catch { ok = false; }
    if (!ok) {
      // Fallback: substitui o range pelo texto formatado
      const r = sel.getRangeAt(0);
      r.deleteContents();
      r.insertNode(document.createTextNode(novo));
    }
    aoMudarSelecao(); // seleção colapsa → bolha some
  }

  function aplicarTexto(id) {
    const el = alvo.el;
    el.focus();
    const ini = el.selectionStart, fim = el.selectionEnd;
    if (fim === ini) return esconder();

    const valor = el.value;
    let r = null;
    const m = MARCADORES[sintaxe][id];
    if (m) r = formatador.aplicarInline(valor, ini, fim, m[0], m[1]);
    else if (id === 'citacao') r = formatador.prefixarLinhas(valor, ini, fim, '> ');
    else if (id === 'lista-marcadores') r = formatador.prefixarLinhas(valor, ini, fim, '- ');
    else if (id === 'lista-numerada') r = formatador.numerarLinhas(valor, ini, fim);
    if (!r) return;

    // insertText preserva a pilha de desfazer do campo; fallback direto se falhar
    el.setSelectionRange(0, valor.length);
    let ok = false;
    try { ok = document.execCommand('insertText', false, r.valor); } catch { ok = false; }
    if (!ok) {
      el.value = r.valor;
      el.dispatchEvent(new InputEvent('input', { bubbles: true }));
    }
    el.setSelectionRange(r.ini, r.fim); // mantém o trecho selecionado (encadear formatos)
    reposicionar();
  }

  // --- eventos ---
  criarBolha();
  document.addEventListener('selectionchange', aoMudarSelecao);
  document.addEventListener('select', aoSelecionarTextoPuro, true);
  document.addEventListener('focusout', (e) => {
    if (alvo && alvo.tipo === 'texto' && e.target === alvo.el) esconder();
  });

  // Reposiciona com throttle de rAF: scroll/resize podem disparar dezenas de
  // vezes por segundo, e a medição por espelho recria nós do DOM.
  let reposicionarAgendado = false;
  function agendarReposicionar() {
    if (!alvo || reposicionarAgendado) return;
    reposicionarAgendado = true;
    requestAnimationFrame(() => {
      reposicionarAgendado = false;
      reposicionar();
    });
  }
  document.addEventListener('scroll', agendarReposicionar, true);
  window.addEventListener('resize', agendarReposicionar);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && alvo) esconder(); });
})();
