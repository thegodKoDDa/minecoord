const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validarDadosLocal } = require('../backend/src/validation/local');
const base = { nome: 'Base', x: 0, y: 64, z: 0, dimensao: 'Overworld' };

test('rejeita campos ausentes, tipos indevidos, números não finitos e limites excedidos', () => {
  for (const payload of [null, undefined, [], 'texto', 1, true]) {
    assert.equal(validarDadosLocal(payload).valido, false);
  }
  for (const valor of [null, undefined, '', ' ', false, true, [], [1], {}, NaN, Infinity, -Infinity, 'Infinity', '0x10', '1,5']) {
    for (const axis of ['x', 'y', 'z']) {
      assert.equal(validarDadosLocal({ ...base, [axis]: valor }).valido, false, `${axis}: ${String(valor)}`);
    }
  }
  for (const patch of [{ x: 30000001 }, { z: -30000001 }, { y: -65 }, { y: 321 }, { nome: ' ' }, { nome: 'a'.repeat(121) }, { dimensao: 'Outro' }, { categoria: null }, { categoria: 'Outro' }, { notas: 123 }, { notas: 'n'.repeat(501) }, { mundo: 'm'.repeat(41) }, { mundo: 123 }, { cor: 'azul' }, { cor: '#fff' }, { cor: '#1234567' }, { favorito: 'sim' }]) {
    assert.equal(validarDadosLocal({ ...base, ...patch }).valido, false);
  }
});

test('aceita zero, decimais, fronteiras e normaliza textos sem perder o contrato', () => {
  for (const patch of [{ x: -30000000, y: -64, z: 30000000 }, { y: 320 }, { x: '-1.25', y: '0', z: ' 8 ' }, { dimensao: 'The Sift' }, { notas: ' Baú com diamantes ' }, { mundo: ' Hardcore 1.21 ' }, { cor: '#38bdf8' }, { favorito: true }]) {
    const resultado = validarDadosLocal({ ...base, ...patch });
    assert.equal(resultado.valido, true);
    assert.equal(typeof resultado.dadosFormatados.x, 'number');
    assert.equal(resultado.dadosFormatados.categoria, 'Outros');
  }
  assert.equal(validarDadosLocal({ ...base, nome: ' Base ' }).dadosFormatados.nome, 'Base');
  assert.equal(validarDadosLocal({ ...base, notas: ' Anotação ' }).dadosFormatados.notas, 'Anotação');
  assert.equal(validarDadosLocal({ ...base, mundo: ' Servidor ' }).dadosFormatados.mundo, 'Servidor');
  assert.equal(validarDadosLocal({ ...base, cor: '#EF4444' }).dadosFormatados.cor, '#ef4444');
  assert.equal(validarDadosLocal({ ...base, favorito: true }).dadosFormatados.favorito, true);
  assert.equal(validarDadosLocal({ ...base, favorito: false }).dadosFormatados.favorito, false);
});
