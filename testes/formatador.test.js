import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aplicarInline, prefixarLinhas, numerarLinhas } from '../src/formatador.js';

// --- aplicarInline: envolver e alternar ---

test('envolve o trecho selecionado com o marcador e mantém o texto interno selecionado', () => {
  const r = aplicarInline('lorem ipsum dolor', 6, 11, '_', '_');
  assert.equal(r.valor, 'lorem _ipsum_ dolor');
  assert.deepEqual([r.ini, r.fim], [7, 12]);
});

test('remove o marcador quando o trecho interno está selecionado (toggle)', () => {
  const r = aplicarInline('lorem _ipsum_ dolor', 7, 12, '_', '_');
  assert.equal(r.valor, 'lorem ipsum dolor');
  assert.deepEqual([r.ini, r.fim], [6, 11]);
});

test('remove o marcador quando a seleção engloba marcador e texto', () => {
  const r = aplicarInline('lorem _ipsum_ dolor', 6, 13, '_', '_');
  assert.equal(r.valor, 'lorem ipsum dolor');
  assert.deepEqual([r.ini, r.fim], [6, 11]);
});

test('remove o marcador quando ele está colado fora da seleção', () => {
  const r = aplicarInline('_ipsum_', 1, 6, '_', '_');
  assert.equal(r.valor, 'ipsum');
  assert.deepEqual([r.ini, r.fim], [0, 5]);
});

test('marcadores assimétricos (~~risca~~) funcionam nos dois sentidos', () => {
  const ida = aplicarInline('risca isso', 0, 5, '~~', '~~');
  assert.equal(ida.valor, '~~risca~~ isso');
  const volta = aplicarInline(ida.valor, ida.ini, ida.fim, '~~', '~~');
  assert.equal(volta.valor, 'risca isso');
});

// --- prefixarLinhas: citação e lista com marcadores ---

test('prefixa todas as linhas do bloco tocado pela seleção', () => {
  const r = prefixarLinhas('aa\nbb\ncc', 2, 5, '> ');
  assert.equal(r.valor, '> aa\n> bb\ncc');
});

test('remove o prefixo quando todas as linhas já o têm (toggle)', () => {
  const r = prefixarLinhas('> aa\n> bb', 0, 7, '> ');
  assert.equal(r.valor, 'aa\nbb');
});

test('se só parte das linhas tem prefixo, aplica em todas (sem toggle parcial)', () => {
  const r = prefixarLinhas('aa\n> bb', 0, 7, '> ');
  assert.equal(r.valor, '> aa\n> bb');
});

// --- numerarLinhas: lista numerada ---

test('numera as linhas do bloco sequencialmente', () => {
  const r = numerarLinhas('aa\nbb\ncc', 3, 6);
  assert.equal(r.valor, 'aa\n1. bb\n2. cc');
});

test('renumera do 1 mesmo se o bloco começa no meio do texto', () => {
  const r = numerarLinhas('aa\nbb', 0, 5);
  assert.equal(r.valor, '1. aa\n2. bb');
});

test('remove a numeração existente ao clicar de novo (toggle)', () => {
  const r = numerarLinhas('1. aa\n2. bb', 0, 10);
  assert.equal(r.valor, 'aa\nbb');
});
