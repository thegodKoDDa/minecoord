const express = require('express');
const path = require('node:path');
const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use('/api/locais/importar', express.json({ limit: '5mb' }));
app.use(express.json({ limit: '16kb' }));
app.use(express.static(path.resolve(__dirname, '../../frontend/public')));
app.use('/api', require('./routes/locais'));
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Rota da API não encontrada.' });
});
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido. Confira os dados enviados.' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Os dados enviados excedem o tamanho permitido.' });
  }
  if (error.status === 404) return res.status(404).json({ error: error.message });
  console.error('Falha na operação de coordenadas:', error);
  res.status(500).json({ error: 'Não foi possível concluir a operação. Seus dados não foram redefinidos.' });
});
module.exports = app;
