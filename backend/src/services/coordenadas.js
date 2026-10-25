const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

// Cada processo atende uma única pasta. A fila engloba leitura, alteração e gravação.
function criarRepositorio(dataDir) {
  const arquivo = path.join(dataDir, 'coordenadas.json');
  const backup = path.join(dataDir, 'coordenadas.backup.json');
  let fila = Promise.resolve();

  async function lerArquivo() {
    try {
      const original = await fs.readFile(arquivo, 'utf8');
      const locais = JSON.parse(original);
      if (!Array.isArray(locais)) throw new Error('O arquivo de coordenadas deve conter uma lista.');
      return { locais, original };
    } catch (error) {
      if (error.code === 'ENOENT') return { locais: [], original: null };
      throw error;
    }
  }

  async function gravarAtomico(destino, conteudo) {
    const temporario = path.join(dataDir, `.${path.basename(destino)}.${randomUUID()}.tmp`);
    let handle;
    try {
      handle = await fs.open(temporario, 'wx', 0o600);
      await handle.writeFile(conteudo, 'utf8');
      await handle.sync();
      await handle.close();
      handle = null;
      await fs.rename(temporario, destino);
    } finally {
      if (handle) await handle.close();
      await fs.rm(temporario, { force: true });
    }
  }

  async function atualizarCoordenadas(alterar) {
    const operacao = fila.then(async () => {
      const { locais, original } = await lerArquivo();
      const resultado = alterar(locais);
      const conteudo = JSON.stringify(locais, null, 2) + '\n';
      await fs.mkdir(dataDir, { recursive: true, mode: 0o700 });
      // Falha de backup interrompe a operação antes de substituir o arquivo principal.
      if (original !== null) await gravarAtomico(backup, original);
      await gravarAtomico(arquivo, conteudo);
      return resultado;
    });
    // Uma falha não bloqueia as próximas operações.
    fila = operacao.catch(() => {});
    return operacao;
  }

  async function lerCoordenadas() {
    await fila;
    return (await lerArquivo()).locais;
  }

  return { lerCoordenadas, atualizarCoordenadas };
}

const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(__dirname, '../../../data');
module.exports = { ...criarRepositorio(dataDir), criarRepositorio };
