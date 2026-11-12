// Gera os ícones da extensão (16, 48, 128px) em PNG puro via zlib do Node.
// Desenha um quadrado arredondado escuro (tom WhatsApp) com "B" e "i" em pixel font 5x7.
// Uso: node scripts/gerar-icones.js

import zlib from 'node:zlib';
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------- PNG ----------

let tabelaCrc = null;
function crc32(buf) {
  if (!tabelaCrc) {
    tabelaCrc = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      tabelaCrc[n] = c;
    }
  }
  let c = 0xffffffff;
  for (const b of buf) c = tabelaCrc[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(tipo, dados) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([len, corpo, crc]);
}

function salvarPng(caminho, tam, rgba) {
  const bruto = Buffer.alloc((tam * 4 + 1) * tam);
  for (let y = 0; y < tam; y++) {
    const linha = y * (tam * 4 + 1);
    bruto[linha] = 0; // filtro "none"
    rgba.copy(bruto, linha + 1, y * tam * 4, (y + 1) * tam * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tam, 0);
  ihdr.writeUInt32BE(tam, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(bruto)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  writeFileSync(caminho, png);
}

// ---------- tela ----------

const TAM = (c) => [c[0] * 255, c[1] * 255, c[2] * 255, c[3] * 255];

class Tela {
  constructor(tam) {
    this.tam = tam;
    this.buf = Buffer.alloc(tam * tam * 4);
  }
  pixel(x, y, cor) {
    if (x < 0 || y < 0 || x >= this.tam || y >= this.tam) return;
    const i = (y * this.tam + x) * 4;
    const [r, g, b, a] = TAM(cor);
    this.buf[i] = r;
    this.buf[i + 1] = g;
    this.buf[i + 2] = b;
    this.buf[i + 3] = a;
  }
  arredondado(x0, y0, largura, altura, raio, cor) {
    for (let y = y0; y < y0 + altura; y++) {
      for (let x = x0; x < x0 + largura; x++) {
        const cx = Math.min(Math.max(x - x0, raio), largura - 1 - raio);
        const cy = Math.min(Math.max(y - y0, raio), altura - 1 - raio);
        const dx = x - x0 - cx;
        const dy = y - y0 - cy;
        if (dx * dx + dy * dy <= raio * raio) this.pixel(x, y, cor);
      }
    }
  }
  glifo(linhas, x0, y0, unidade, cor, inclinacao = 0) {
    linhas.forEach((linha, li) => {
      for (let ci = 0; ci < linha.length; ci++) {
        if (linha[ci] !== '#') continue;
        for (let uy = 0; uy < unidade; uy++) {
          const desl = Math.round((inclinacao * (linhas.length - 1 - li)) / 2);
          for (let ux = 0; ux < unidade; ux++) {
            this.pixel(x0 + (ci + desl) * unidade + ux, y0 + li * unidade + uy, cor);
          }
        }
      }
    });
  }
}

// pixel font 5x7
const LETRA_B = ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'];
const LETRA_i = ['..#..', '..#..', '.....', '..#..', '..#..', '..#..', '..#..'];

function gerarIcone(tam) {
  const t = new Tela(tam);
  const margem = Math.max(1, Math.round(tam * 0.1));
  const unidade = Math.max(1, Math.floor(Math.min((tam - 2 * margem) / 7, (tam - 2 * margem) / 11)));
  const alturaLetra = unidade * 7;
  const larguraTotal = unidade * 11;
  const x0 = Math.round((tam - larguraTotal) / 2);
  const y0 = Math.round((tam - alturaLetra) / 2);

  t.arredondado(0, 0, tam, tam, Math.round(tam * 0.22), [0.125, 0.17, 0.2, 1]); // #202c33
  t.glifo(LETRA_B, x0, y0, unidade, [0.914, 0.929, 0.937, 1]); // #e9edef
  t.glifo(LETRA_i, x0 + unidade * 6, y0, unidade, [0.914, 0.929, 0.937, 1], 1); // "i" levemente inclinado

  salvarPng(join(raiz, 'icons', `icon${tam}.png`), tam, t.buf);
}

for (const tam of [16, 48, 128]) gerarIcone(tam);

// Registra os ícones no manifest.json (se ainda não estiverem).
// O manifest do repo vai sem "icons": a extensão carrega com o ícone padrão,
// e este comando deixa o ícone custom pronto — depois recarregue no chrome://extensions.
const caminhoManifest = join(raiz, 'manifest.json');
const manifest = JSON.parse(readFileSync(caminhoManifest, 'utf8'));
manifest.icons = { '16': 'icons/icon16.png', '48': 'icons/icon48.png', '128': 'icons/icon128.png' };
writeFileSync(caminhoManifest, JSON.stringify(manifest, null, 2) + '\n');
console.log('Ícones gerados e registrados no manifest.json.');
