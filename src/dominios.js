// Sintaxe de formatação esperada por site, em campos de texto puro.
// Campo rico (contenteditable) não passa por aqui: usa comandos nativos.
//
// Em texto puro não existe detecção infalível — o campo não declara o que
// entende. Esta tabela é a aproximação: domínios conhecidos + fallback markdown.
// Site errado? Adiciona/corrige aqui. Erro reportado → tabela cresce.

const SINTAXES = {
  // sintaxe própria do WhatsApp: *b*, _i_, ~s~, ```code```
  whatsapp: [
    'whatsapp.com',
  ],
  // markdown: **b**, *i*, ~~s~~, `code`, "> " citação, "- " e "1. " listas
  markdown: [
    'github.com',
    'gitlab.com',
    'reddit.com',
    'discord.com',
    'slack.com',
    'trello.com',
    'stackexchange.com',
    'stackoverflow.com',
  ],
};

// Editores com DOM próprio/barra própria: a bolha nunca aparece neles.
const EXCLUSOES = [
  'docs.google.com',
  'drive.google.com',
  'notion.so',
  'notion.com',
  'notion.site',
  'figma.com',
  'office.com',
  'canva.com',
];

function nomeDoHost(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return String(url).replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }
}

function casaSufixo(host, dominio) {
  return host === dominio || host.endsWith('.' + dominio);
}

// Devolve 'whatsapp' | 'markdown' | 'html' para exibir a bolha,
// ou null quando o site está excluído.
export function sintaxeDe(url) {
  const host = nomeDoHost(url);
  if (EXCLUSOES.some((d) => casaSufixo(host, d))) return null;
  for (const [sintaxe, dominios] of Object.entries(SINTAXES)) {
    if (dominios.some((d) => casaSufixo(host, d))) return sintaxe;
  }
  return 'markdown'; // fallback: melhor aposta padrão
}
