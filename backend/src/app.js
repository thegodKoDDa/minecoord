const express = require('express');
const path = require('node:path');
const app = express();
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../../frontend/public')));
app.use('/api', require('./routes/locais'));
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Rota da API não encontrada.' });
});
module.exports = app;
