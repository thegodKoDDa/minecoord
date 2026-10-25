const fs = require('node:fs/promises');
const path = require('node:path');
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.resolve(__dirname, '../../../data');
const DATA_FILE = path.join(DATA_DIR, 'coordenadas.json');
const BACKUP_FILE = path.join(DATA_DIR, 'coordenadas.backup.json');

async function lerCoordenadas() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const dataInicial = [];
      await fs.writeFile(DATA_FILE, JSON.stringify(dataInicial, null, 2), 'utf-8');
      return dataInicial;
    }
    throw error;
  }
}

/**
 * Salva a lista de coordenadas atualizada no arquivo coordenadas.json.
 * Gera automaticamente um arquivo de backup antes de salvar, evitando corrupções.
 */
async function salvarCoordenadas(coordenadas) {
  try {
    // Tenta fazer cópia preventiva (backup) do arquivo atual antes de sobrescrevê-lo
    await fs.copyFile(DATA_FILE, BACKUP_FILE);
  } catch (error) {
    // Se o arquivo original não existir (primeira execução), ignora o erro de backup
    if (error.code !== 'ENOENT') {
      console.error('Falha ao criar backup do arquivo coordenadas.json:', error);
    }
  }
  await fs.writeFile(DATA_FILE, JSON.stringify(coordenadas, null, 2), 'utf-8');
}


module.exports = { lerCoordenadas, salvarCoordenadas };
