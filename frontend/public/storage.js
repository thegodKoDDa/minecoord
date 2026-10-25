/* Adaptador sem dependências: arquivo local ou API, sem alternância silenciosa. */
(function (root) {
  'use strict';
  const KEY = 'minecoord.locais.v1';
  const BACKUP = 'minecoord.backup.v1';
  const local = root.location.protocol === 'file:';
  function ler() {
    const raw = root.localStorage.getItem(KEY);
    const rows = raw === null ? [] : JSON.parse(raw);
    if (!Array.isArray(rows)) throw new Error('Dados locais inválidos. Preserve seus backups antes de limpar o armazenamento.');
    return rows;
  }
  function gravar(rows) {
    const original = root.localStorage.getItem(KEY);
    if (original !== null) root.localStorage.setItem(BACKUP, original);
    root.localStorage.setItem(KEY, JSON.stringify(rows));
  }
  function validar(rows) {
    if (!Array.isArray(rows) || rows.length > 10000) throw new Error('O backup deve conter uma lista de até 10.000 pontos.');
    return rows.map(row => {
      if (!row || typeof row.nome !== 'string' || !row.nome.trim() || row.nome.trim().length > 120
        || !['Overworld', 'Nether', 'End'].includes(row.dimensao)
        || !['Base', 'Farm', 'Portal', 'Vila', 'Mina', 'Outros'].includes(row.categoria || 'Outros')
        || !['x', 'y', 'z'].every(axis => typeof row[axis] === 'number' && Number.isFinite(row[axis]))
        || Math.abs(row.x) > 30000000 || Math.abs(row.z) > 30000000) {
        throw new Error('O backup contém um ponto inválido. Nenhum ponto foi importado.');
      }
      return { nome: row.nome.trim(), x: row.x, y: row.y, z: row.z, dimensao: row.dimensao, categoria: row.categoria || 'Outros' };
    });
  }
  root.MinecoordStorage = {
    local, validar,
    async request(url, options = {}) {
      if (!local) return null;
      try {
        const rows = ler();
        const method = options.method || 'GET';
        if (method === 'GET') return rows;
        const body = options.body ? JSON.parse(options.body) : null;
        if (url === '/api/locais/importar') {
          const incoming = validar(body).map(row => ({ ...row, id: root.crypto.randomUUID(), criadoEm: new Date().toISOString() }));
          gravar([...rows, ...incoming]);
          return { importados: incoming.length };
        }
        const id = decodeURIComponent(url.split('/').pop());
        const index = rows.findIndex(row => row.id === id);
        if (method === 'POST') {
          const row = { ...body, id: root.crypto.randomUUID(), criadoEm: new Date().toISOString() };
          gravar([...rows, row]);
          return row;
        }
        if (index < 0) throw new Error('Ponto não encontrado. Atualize a lista.');
        if (method === 'DELETE') { rows.splice(index, 1); gravar(rows); return { id }; }
        if (method === 'PUT') {
          rows[index] = { ...rows[index], ...body, atualizadoEm: new Date().toISOString() };
          gravar(rows); return rows[index];
        }
        throw new Error('Operação desconhecida.');
      } catch (error) {
        if (error.name === 'QuotaExceededError' || error.name === 'SecurityError') {
          throw new Error('O navegador bloqueou o salvamento ou está sem espaço. Exporte seus pontos e confira as permissões de armazenamento.');
        }
        throw error;
      }
    }
  };
})(window);
