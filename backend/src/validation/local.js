const CATEGORIAS_VALIDAS = ['Base', 'Farm', 'Portal', 'Vila', 'Mina', 'Outros'];

function validarDadosLocal(dados) {
  const { nome, x, y, z, dimensao, categoria } = dados;

  // 1. Validação do Nome
  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    return { valido: false, erro: 'O campo "nome" é obrigatório e deve ser um texto válido.' };
  }

  // 2. Validação numérica das coordenadas
  const coordX = Number(x);
  const coordY = Number(y);
  const coordZ = Number(z);

  if (isNaN(coordX) || isNaN(coordY) || isNaN(coordZ)) {
    return { valido: false, erro: 'As coordenadas X, Y e Z devem ser números válidos.' };
  }

  // 3. Validação dos limites físicos mundiais do Minecraft (Build limits e World border)
  if (coordX < -30000000 || coordX > 30000000 || coordZ < -30000000 || coordZ > 30000000) {
    return { valido: false, erro: 'As coordenadas X e Z não podem ultrapassar a barreira de 30.000.000 de blocos.' };
  }
  if (coordY < -64 || coordY > 320) {
    return { valido: false, erro: 'A coordenada Y (altura) deve estar dentro dos limites do jogo: entre -64 e 320.' };
  }

  // 4. Validação da Dimensão
  const dimensoesValidas = ['Overworld', 'Nether', 'End'];
  if (!dimensao || !dimensoesValidas.includes(dimensao)) {
    return { valido: false, erro: 'Dimensão inválida. Escolha entre: Overworld, Nether ou End.' };
  }

  // 5. Validação da Categoria
  if (categoria && !CATEGORIAS_VALIDAS.includes(categoria)) {
    return { valido: false, erro: `Categoria inválida. Escolha entre: ${CATEGORIAS_VALIDAS.join(', ')}` };
  }

  return {
    valido: true,
    dadosFormatados: {
      nome: nome.trim(),
      x: coordX,
      y: coordY,
      z: coordZ,
      dimensao,
      categoria: categoria || 'Outros'
    }
  };
}


module.exports = { validarDadosLocal };
