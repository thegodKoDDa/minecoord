const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');

test('modo local preserva dados se backup falha e rejeita importação inválida inteira', async () => {
  const values = new Map();
  let failBackup = false;
  const window = { location: { protocol: 'file:' }, crypto: { randomUUID }, navigator: { locks: { request: async (name, options, callback) => callback({}) } }, localStorage: {
    getItem: key => values.get(key) ?? null,
    setItem(key, value) { if (failBackup && key.includes('backup')) throw Object.assign(new Error(), { name: 'QuotaExceededError' }); values.set(key, value); }
  } };
  vm.runInNewContext(fs.readFileSync('frontend/public/storage.js', 'utf8'), { window });
  const store = window.MinecoordStorage;
  const point = { nome: 'Base', x: 0, y: 64, z: 0, dimensao: 'The Sift', categoria: 'Base' };
  await store.request('/api/locais', { method: 'POST', body: JSON.stringify(point) });
  const original = values.get('minecoord.locais.v1');
  failBackup = true;
  await assert.rejects(store.request('/api/locais', { method: 'POST', body: JSON.stringify(point) }), /sem espaço/);
  assert.equal(values.get('minecoord.locais.v1'), original);
  failBackup = false;
  await assert.rejects(store.request('/api/locais/importar', { method: 'POST', body: JSON.stringify([point, { ...point, x: true }]) }), /inválido/);
  assert.equal(values.get('minecoord.locais.v1'), original);
  values.set('minecoord.locais.v1', '{corrompido');
  await assert.rejects(store.request('/api/locais', { method: 'POST', body: JSON.stringify(point) }));
  assert.equal(values.get('minecoord.locais.v1'), '{corrompido');
});


test('segunda aba e navegador sem Web Locks não podem gravar', async () => {
  const values = new Map();
  let held = false;
  const locks = { request(name, options, callback) { const available = !held; held = true; return Promise.resolve(callback(available ? {} : null)); } };
  function tab(navigator) {
    const window = { location: { protocol: 'file:' }, crypto: { randomUUID }, navigator, localStorage: {
      getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value)
    } };
    vm.runInNewContext(fs.readFileSync('frontend/public/storage.js', 'utf8'), { window });
    return window.MinecoordStorage;
  }
  const a = tab({ locks });
  const b = tab({ locks });
  const options = { method: 'POST', body: JSON.stringify({ nome: 'Base', x: 0, y: 64, z: 0, dimensao: 'Overworld' }) };
  await a.request('/api/locais', options);
  await assert.rejects(b.request('/api/locais', options), /Outra aba/);
  const unsupported = tab({});
  await assert.rejects(unsupported.request('/api/locais', options), /bloqueio seguro/);
  assert.equal((await unsupported.request('/api/locais')).length, 1);
  const pagesWindow = { location: { protocol: 'https:', hostname: 'thegodkodda.github.io' }, crypto: { randomUUID }, navigator: { locks }, localStorage: {
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value)
  } };
  vm.runInNewContext(fs.readFileSync('frontend/public/storage.js', 'utf8'), { window: pagesWindow });
  assert.equal(pagesWindow.MinecoordStorage.local, true);
});
