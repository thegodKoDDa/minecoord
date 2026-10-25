const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');

test('interface e ciclo completo da API com dados isolados', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'minecoord-test-'));
  process.env.DATA_DIR = directory;
  const app = require('../backend/src/app');
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (url, method, body) => fetch(base + url, {
    method, headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  try {
    for (const url of ['/', '/script.js', '/style.css']) {
      assert.equal((await request(url)).status, 200);
    }
    assert.deepEqual(await (await request('/api/locais')).json(), []);
    const local = { nome: ' Base teste ', x: 100, y: 64, z: -200, dimensao: 'Overworld', categoria: 'Base' };
    const created = await request('/api/locais', 'POST', local);
    assert.equal(created.status, 201);
    const saved = await created.json();
    assert.equal(saved.nome, 'Base teste');
    assert.equal((await (await request('/api/locais')).json()).length, 1);
    const updated = await request(`/api/locais/${saved.id}`, 'PUT', { ...local, nome: 'Portal' });
    assert.equal(updated.status, 200);
    assert.equal((await updated.json()).id, saved.id);
    const backup = JSON.parse(await fs.readFile(path.join(directory, 'coordenadas.backup.json'), 'utf8'));
    assert.equal(backup[0].nome, 'Base teste');
    assert.equal((await request('/api/locais', 'POST', { ...local, dimensao: 'inexistente' })).status, 400);
    assert.equal((await request('/api/locais', 'POST', { ...local, x: 30000001 })).status, 400);
    assert.equal((await request('/api/locais/ausente', 'PUT', local)).status, 404);
    assert.equal((await request(`/api/locais/${saved.id}`, 'DELETE')).status, 200);
    assert.equal((await request(`/api/locais/${saved.id}`, 'DELETE')).status, 404);
    assert.deepEqual(await (await request('/api/locais')).json(), []);
    const invalid = await fetch(base + '/api/locais', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{invalid' });
    assert.equal(invalid.status, 400);
    assert.match(invalid.headers.get('content-type'), /application\/json/);
    assert.match((await invalid.json()).error, /JSON inválido/);
    const large = await request('/api/locais', 'POST', { ...local, nome: 'x'.repeat(20000) });
    assert.equal(large.status, 413);
    const legacy = { id: '1780511849953', nome: 'Legado', x: 0, y: 400, z: 0, dimensao: 'Overworld', criadoEm: '2026-06-03T18:37:29.953Z', detalhe: 'preservar' };
    await fs.writeFile(path.join(directory, 'coordenadas.json'), JSON.stringify([legacy]));
    assert.deepEqual(await (await request('/api/locais')).json(), [legacy]);
    const repaired = await request(`/api/locais/${legacy.id}`, 'PUT', { ...legacy, y: 64 });
    assert.equal(repaired.status, 200);
    const repairedData = await repaired.json();
    assert.equal(repairedData.id, legacy.id);
    assert.equal(repairedData.criadoEm, legacy.criadoEm);
    assert.equal(repairedData.detalhe, 'preservar');
    assert.equal(repairedData.categoria, 'Outros');
    assert.equal((await request(`/api/locais/${legacy.id}`, 'DELETE')).status, 200);
    const responses = await Promise.all(Array.from({ length: 20 }, (_, index) => request('/api/locais', 'POST', { ...local, nome: `Local ${index}` })));
    assert.ok(responses.every(response => response.status === 201));
    const registros = await (await request('/api/locais')).json();
    assert.equal(registros.length, 20);
    assert.equal(new Set(registros.map(local => local.id)).size, 20);
    const list = await request('/api/locais');
    assert.equal(list.headers.get('cache-control'), 'no-store');
    assert.equal(list.headers.get('x-powered-by'), null);
    assert.equal((await request('/api/inexistente')).status, 404);
    assert.equal((await request('/data/coordenadas.json')).status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
    delete process.env.DATA_DIR;
    await fs.rm(directory, { recursive: true, force: true });
  }
});
