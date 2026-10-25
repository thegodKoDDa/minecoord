const CATEGORIAS_VALIDAS = ['Base', 'Farm', 'Portal', 'Vila', 'Mina', 'Outros'];
const DIMENSOES_VALIDAS = ['Overworld', 'Nether', 'End'];
const LIMITE_NOME = 120;

function numeroValido(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor);
  if (typeof valor !== 'string' || !valor.trim()) return false;
  return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(valor.trim())
    && Number.isFinite(Number(valor));
}

function validarDadosLocal(dados) {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    return { valido: false, erro: 'Envie um objeto com os dados da localização.' };
  }
  const { nome, x, y, z, dimensao, categoria } = dados;
  if (typeof nome !== 'string' || !nome.trim() || nome.trim().length > LIMITE_NOME) {
    return { valido: false, erro: `O nome é obrigatório e deve ter até ${LIMITE_NOME} caracteres.` };
  }
  if (![x, y, z].every(numeroValido)) {
    return { valido: false, erro: 'Preencha X, Y e Z com números válidos.' };
  }
  const [coordX, coordY, coordZ] = [x, y, z].map(Number);
  if (Math.abs(coordX) > 30000000 || Math.abs(coordZ) > 30000000) {
    return { valido: false, erro: 'X e Z devem estar entre -30.000.000 e 30.000.000.' };
  }
  if (coordY < -64 || coordY > 320) {
    return { valido: false, erro: 'Y deve estar entre -64 e 320.' };
  }
  if (!DIMENSOES_VALIDAS.includes(dimensao)) {
    return { valido: false, erro: 'Dimensão inválida. Escolha entre: Overworld, Nether ou End.' };
  }
  if (categoria !== undefined && categoria !== '' && !CATEGORIAS_VALIDAS.includes(categoria)) {
    return { valido: false, erro: `Categoria inválida. Escolha entre: ${CATEGORIAS_VALIDAS.join(', ')}` };
  }
  return {
    valido: true,
    dadosFormatados: {
      nome: nome.trim(), x: coordX, y: coordY, z: coordZ,
      dimensao, categoria: categoria || 'Outros'
    }
  };
}

module.exports = { validarDadosLocal };
