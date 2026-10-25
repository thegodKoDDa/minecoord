const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { criarRepositorio } = require('../backend/src/services/coordenadas');

async function isolado(run) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'minecoord-store-'));
  try { await run(dir, criarRepositorio(dir)); }
  finally { await fs.rm(dir, { recursive: true, force: true }); }
}

test('serializa alterações concorrentes sem perder dados e mantém backup anterior', async () => {
  await isolado(async (dir, store) => {
    await Promise.all(Array.from({ length: 30 }, (_, id) => store.atualizarCoordenadas(locais => locais.push({ id }))));
    assert.equal((await store.lerCoordenadas()).length, 30);
    const backup = JSON.parse(await fs.readFile(path.join(dir, 'coordenadas.backup.json'), 'utf8'));
    assert.equal(backup.length, 29);
    assert.equal(new Set((await store.lerCoordenadas()).map(local => local.id)).size, 30);
    assert.deepEqual((await fs.readdir(dir)).sort(), ['coordenadas.backup.json', 'coordenadas.json']);
  });
});

test('preserva bytes inválidos e backup sem redefinir dados; fila se recupera após erro', async () => {
  await isolado(async (dir, store) => {
    const arquivo = path.join(dir, 'coordenadas.json');
    const backup = path.join(dir, 'coordenadas.backup.json');
    await fs.writeFile(backup, '[{"id":"recuperavel"}]');
    for (const original of ['{invalido', '{}']) {
      await fs.writeFile(arquivo, original);
      await assert.rejects(store.atualizarCoordenadas(locais => locais.push({ id: 'novo' })));
      assert.equal(await fs.readFile(arquivo, 'utf8'), original);
      assert.equal(await fs.readFile(backup, 'utf8'), '[{"id":"recuperavel"}]');
    }
    await fs.writeFile(arquivo, '[]');
    await assert.rejects(store.atualizarCoordenadas(() => { throw new Error('cancelado'); }));
    await store.atualizarCoordenadas(locais => locais.push({ id: 'ok' }));
    assert.deepEqual(await store.lerCoordenadas(), [{ id: 'ok' }]);
  });
});

test('falha ao criar backup interrompe a gravação principal', async () => {
  await isolado(async (dir, store) => {
    const arquivo = path.join(dir, 'coordenadas.json');
    await fs.writeFile(arquivo, '[]');
    await fs.mkdir(path.join(dir, 'coordenadas.backup.json'));
    await assert.rejects(store.atualizarCoordenadas(locais => locais.push({ id: 'novo' })));
    assert.equal(await fs.readFile(arquivo, 'utf8'), '[]');
    assert.deepEqual((await fs.readdir(dir)).sort(), ['coordenadas.backup.json', 'coordenadas.json']);
  });
});
