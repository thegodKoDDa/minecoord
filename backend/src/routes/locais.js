const router = require('express').Router();
const { lerCoordenadas, salvarCoordenadas } = require('../services/coordenadas');
const { validarDadosLocal } = require('../validation/local');

// ROTA 1: GET /locais - Retorna todos os locais cadastrados
router.get('/locais', async (req, res) => {
  try {
    const locais = await lerCoordenadas();
    res.json(locais);
  } catch (error) {
    console.error('Erro ao ler coordenadas do arquivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao carregar os dados.' });
  }
});

// ROTA 2: POST /locais - Cadastra uma nova localização
router.post('/locais', async (req, res) => {
  try {
    const validacao = validarDadosLocal(req.body);
    if (!validacao.valido) {
      return res.status(400).json({ error: validacao.erro });
    }

    const locais = await lerCoordenadas();

    const novoLocal = {
      id: Date.now().toString(), // ID único baseado em timestamp
      ...validacao.dadosFormatados,
      criadoEm: new Date().toISOString()
    };

    locais.push(novoLocal);
    await salvarCoordenadas(locais);

    res.status(201).json(novoLocal);
  } catch (error) {
    console.error('Erro ao salvar coordenadas no arquivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao salvar os dados.' });
  }
});

// ROTA 3: PUT /locais/:id - Atualiza uma localização existente
router.put('/locais/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validacao = validarDadosLocal(req.body);
    if (!validacao.valido) {
      return res.status(400).json({ error: validacao.erro });
    }

    const locais = await lerCoordenadas();
    const indice = locais.findIndex(l => l.id === id);

    if (indice === -1) {
      return res.status(404).json({ error: 'Localização não encontrada.' });
    }

    // Atualiza mantendo dados invariáveis
    locais[indice] = {
      ...locais[indice],
      ...validacao.dadosFormatados,
      atualizadoEm: new Date().toISOString()
    };

    await salvarCoordenadas(locais);
    res.json(locais[indice]);
  } catch (error) {
    console.error('Erro ao atualizar coordenadas no arquivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao atualizar os dados.' });
  }
});

// ROTA 4: DELETE /locais/:id - Remove um local
router.delete('/locais/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const locais = await lerCoordenadas();
    const indice = locais.findIndex(l => l.id === id);

    if (indice === -1) {
      return res.status(404).json({ error: 'Localização não encontrada.' });
    }

    const [removido] = locais.splice(indice, 1);
    await salvarCoordenadas(locais);

    res.json({ message: `Local "${removido.nome}" removido com sucesso.`, id });
  } catch (error) {
    console.error('Erro ao deletar coordenadas no arquivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao deletar os dados.' });
  }
});


module.exports = router;
