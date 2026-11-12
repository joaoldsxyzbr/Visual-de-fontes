// Lógica pura de formatação de texto puro.
// Sem DOM: recebe o valor completo do campo e a seleção [ini, fim),
// devolve o novo valor e a nova seleção. O content script cuida da parte de DOM.

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Envolve (ou desenvolve, se já estiver envolvido) o trecho selecionado.
export function aplicarInline(valor, ini, fim, esq, dir) {
  const sel = valor.slice(ini, fim);

  // Seleção engloba marcadores e texto: "_texto_" → "texto"
  if (
    sel.startsWith(esq) &&
    sel.endsWith(dir) &&
    sel.length >= esq.length + dir.length
  ) {
    const interno = sel.slice(esq.length, sel.length - dir.length);
    return { valor: valor.slice(0, ini) + interno + valor.slice(fim), ini, fim: ini + interno.length };
  }

  // Marcadores colados fora da seleção: "..._texto_..." com seleção em "texto"
  const antes = valor.slice(Math.max(0, ini - esq.length), ini);
  const depois = valor.slice(fim, Math.min(valor.length, fim + dir.length));
  if (antes === esq && depois === dir) {
    return {
      valor: valor.slice(0, ini - esq.length) + valor.slice(ini, fim) + valor.slice(fim + dir.length),
      ini: ini - esq.length,
      fim: fim - esq.length,
    };
  }

  // Envolve
  return {
    valor: valor.slice(0, ini) + esq + valor.slice(ini, fim) + dir + valor.slice(fim),
    ini: ini + esq.length,
    fim: fim + esq.length,
  };
}

function blocoDeLinhas(valor, ini, fim) {
  const iniLinha = valor.lastIndexOf('\n', ini - 1) + 1;
  let fimLinha = valor.indexOf('\n', fim);
  if (fimLinha === -1) fimLinha = valor.length;
  return { iniLinha, fimLinha, linhas: valor.slice(iniLinha, fimLinha).split('\n') };
}

function remontar(valor, iniLinha, fimLinha, linhas) {
  const resultado = linhas.join('\n');
  return {
    valor: valor.slice(0, iniLinha) + resultado + valor.slice(fimLinha),
    ini: iniLinha,
    fim: iniLinha + resultado.length,
  };
}

// Prefixa (ou remove o prefixo de) todas as linhas do bloco tocado pela seleção.
// Toggle só quando TODAS as linhas já têm o prefixo; linha já prefixada não recebe outro.
export function prefixarLinhas(valor, ini, fim, prefixo) {
  const { iniLinha, fimLinha, linhas } = blocoDeLinhas(valor, ini, fim);
  const re = new RegExp('^' + escapar(prefixo));
  const todas = linhas.every((l) => re.test(l));
  return remontar(
    valor, iniLinha, fimLinha,
    linhas.map((l) => {
      if (todas) return l.replace(re, '');
      return re.test(l) ? l : prefixo + l;
    })
  );
}

// Lista numerada: numera sequencialmente a partir de 1; toggle remove.
export function numerarLinhas(valor, ini, fim) {
  const { iniLinha, fimLinha, linhas } = blocoDeLinhas(valor, ini, fim);
  const re = /^\s*\d+\.\s/;
  const todas = linhas.every((l) => re.test(l));
  return remontar(
    valor, iniLinha, fimLinha,
    todas
      ? linhas.map((l) => l.replace(re, ''))
      : linhas.map((l, i) => l.replace(re, '')).map((l, i) => `${i + 1}. ${l}`)
  );
}
