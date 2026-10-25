const router = require('express').Router();
const { randomUUID } = require('node:crypto');
const { lerCoordenadas, atualizarCoordenadas } = require('../services/coordenadas');
const { validarDadosLocal } = require('../validation/local');

const tratar = (handler) => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
function naoEncontrado() {
  const error = new Error('Localização não encontrada.');
  error.status = 404;
  return error;
}

router.get('/locais', tratar(async (req, res) => {
  res.json(await lerCoordenadas());
}));

// Importação aditiva: valida o lote inteiro antes de entrar na transação.
router.post('/locais/importar', tratar(async (req, res) => {
  if (!Array.isArray(req.body) || req.body.length > 10000) {
    return res.status(400).json({ error: 'Envie uma lista com até 10.000 pontos.' });
  }
  const novos = [];
  for (const row of req.body) {
    // Backups históricos podem conter alturas fora da política atual.
    const validacao = validarDadosLocal(row && { ...row, y: 64 });
    if (!validacao.valido || typeof row.y !== 'number' || !Number.isFinite(row.y)
      || !['x', 'z'].every(axis => typeof row[axis] === 'number' && Number.isFinite(row[axis]))) {
      return res.status(400).json({ error: 'O backup contém um ponto inválido. Nenhum ponto foi importado.' });
    }
    novos.push({ ...validacao.dadosFormatados, y: row.y, id: randomUUID(), criadoEm: new Date().toISOString() });
  }
  if (novos.length) await atualizarCoordenadas(locais => { locais.push(...novos); });
  res.status(201).json({ importados: novos.length });
}));

router.post('/locais', tratar(async (req, res) => {
  const validacao = validarDadosLocal(req.body);
  if (!validacao.valido) return res.status(400).json({ error: validacao.erro });
  const novoLocal = {
    id: randomUUID(),
    ...validacao.dadosFormatados,
    criadoEm: new Date().toISOString()
  };
  await atualizarCoordenadas(locais => {
    locais.push(novoLocal);
    return novoLocal;
  });
  res.status(201).json(novoLocal);
}));

router.put('/locais/:id', tratar(async (req, res) => {
  const validacao = validarDadosLocal(req.body);
  if (!validacao.valido) return res.status(400).json({ error: validacao.erro });
  const atualizado = await atualizarCoordenadas(locais => {
    const indice = locais.findIndex(local => local.id === req.params.id);
    if (indice === -1) throw naoEncontrado();
    locais[indice] = {
      ...locais[indice], ...validacao.dadosFormatados,
      atualizadoEm: new Date().toISOString()
    };
    return locais[indice];
  });
  res.json(atualizado);
}));

router.delete('/locais/:id', tratar(async (req, res) => {
  const removido = await atualizarCoordenadas(locais => {
    const indice = locais.findIndex(local => local.id === req.params.id);
    if (indice === -1) throw naoEncontrado();
    return locais.splice(indice, 1)[0];
  });
  res.json({ message: `Local "${removido.nome}" removido com sucesso.`, id: req.params.id });
}));

module.exports = router;
