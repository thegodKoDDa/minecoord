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
    assert.equal((await request('/api/inexistente')).status, 404);
    assert.equal((await request('/data/coordenadas.json')).status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
    delete process.env.DATA_DIR;
    await fs.rm(directory, { recursive: true, force: true });
  }
});
