import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sintaxeDe, ricosComoTexto } from '../src/dominios.js';

// --- domínios conhecidos ---

test('WhatsApp devolve a sintaxe própria (*b*, _i_, ~s~)', () => {
  assert.equal(sintaxeDe('https://web.whatsapp.com/'), 'whatsapp');
});

test('GitHub devolve markdown', () => {
  assert.equal(sintaxeDe('https://github.com/joaoldsxyzbr'), 'markdown');
});

test('subdomínio casa com a regra do domínio-mãe', () => {
  assert.equal(sintaxeDe('https://old.reddit.com/r/brasil'), 'markdown');
});

// --- fallback ---

test('domínio desconhecido devolve markdown (fallback)', () => {
  assert.equal(sintaxeDe('https://exemplo-desconhecido.net'), 'markdown');
});

// --- exclusões: editores com DOM/barra própria ---

test('Google Docs devolve null (nunca mostra a bolha)', () => {
  assert.equal(sintaxeDe('https://docs.google.com/document/d/xyz'), null);
});

test('Notion, Figma, Office e Canva devolvem null', () => {
  assert.equal(sintaxeDe('https://www.notion.so/Pagina-123'), null);
  assert.equal(sintaxeDe('https://www.figma.com/file/abc/Design'), null);
  assert.equal(sintaxeDe('https://www.office.com/launch/word'), null);
  assert.equal(sintaxeDe('https://www.canva.com/design/DAF'), null);
});

// --- sintaxe aplicada como texto mesmo em campo rico ---

test('sintaxe WhatsApp aplica marcadores como texto até em contenteditable', () => {
  // WhatsApp Web tem campo rico que rejeita formatação HTML
  assert.equal(ricosComoTexto('whatsapp'), true);
});

test('sintaxe markdown e html usam formatação nativa em campo rico', () => {
  assert.equal(ricosComoTexto('markdown'), false);
  assert.equal(ricosComoTexto('html'), false);
});

test('sintaxe de exclusão nunca chega a aplicar nada', () => {
  assert.equal(ricosComoTexto(null), false);
});
