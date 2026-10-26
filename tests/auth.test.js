const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { criarAutenticacao } = require('../backend/src/auth');

test('acesso remoto exige senha e credenciais protegem interface e API', async () => {
  assert.throws(() => criarAutenticacao({ HOST: '0.0.0.0' }), /AUTH_PASSWORD/);
  assert.throws(() => criarAutenticacao({ AUTH_PASSWORD: 'curta' }), /16 caracteres/);
  const app = express();
  app.use(criarAutenticacao({ HOST: '0.0.0.0', AUTH_USER: 'atlas', AUTH_PASSWORD: 'senha-de-teste-123456' }));
  app.get(['/', '/api/locais'], (req, res) => res.json([]));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    for (const route of ['/', '/api/locais']) {
      const url = `http://127.0.0.1:${server.address().port}${route}`;
      for (const authorization of ['', 'Basic !!!', 'Basic ' + Buffer.from('atlas:errada').toString('base64')]) {
        const response = await fetch(url, { headers: { authorization } });
        assert.equal(response.status, 401);
        assert.match(response.headers.get('www-authenticate'), /Basic/);
        assert.equal(response.headers.get('cache-control'), 'no-store');
      }
      const response = await fetch(url, { headers: { authorization: 'Basic ' + Buffer.from('atlas:senha-de-teste-123456').toString('base64') } });
      assert.equal(response.status, 200);
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
});
