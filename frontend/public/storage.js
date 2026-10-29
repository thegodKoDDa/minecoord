/* Adaptador sem dependências: arquivo local ou API, sem alternância silenciosa. */
(function (root) {
  'use strict';
  const KEY = 'minecoord.locais.v1';
  const BACKUP = 'minecoord.backup.v1';
  const local = root.location.protocol === 'file:' || /\.github\.io$/i.test(root.location.hostname || '');
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
  function validarPonto(row, opcoes = {}) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error('O backup contém um ponto inválido. Nenhum ponto foi importado.');
    }
    if (typeof row.nome !== 'string' || !row.nome.trim() || row.nome.trim().length > 120) {
      throw new Error('O backup contém um ponto inválido. Nenhum ponto foi importado.');
    }
    const num = v => (typeof v === 'number' && Number.isFinite(v))
      || (typeof v === 'string' && v.trim() && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(v.trim()) && Number.isFinite(Number(v)));
    if (!['x', 'y', 'z'].every(axis => num(row[axis]))) {
      throw new Error('O backup contém um ponto inválido. Nenhum ponto foi importado.');
    }
    const [x, y, z] = [Number(row.x), Number(row.y), Number(row.z)];
    if (Math.abs(x) > 30000000 || Math.abs(z) > 30000000) {
      throw new Error('O backup contém um ponto inválido. Nenhum ponto foi importado.');
    }
    if (!opcoes.permitirAlturaLegada && (y < -64 || y > 320)) {
      throw new Error('O backup contém um ponto inválido. Nenhum ponto foi importado.');
    }
    if (!['Overworld', 'Nether', 'End', 'The Sift'].includes(row.dimensao)) {
      throw new Error('O backup contém um ponto inválido. Nenhum ponto foi importado.');
    }
    if (row.categoria && !['Base', 'Farm', 'Portal', 'Vila', 'Mina', 'Outros'].includes(row.categoria)) {
      throw new Error('O backup contém um ponto inválido. Nenhum ponto foi importado.');
    }
    if (row.favorito !== undefined && row.favorito !== null && typeof row.favorito !== 'boolean') {
      throw new Error('O backup contém um ponto inválido. Nenhum ponto foi importado.');
    }
    const item = {
      nome: row.nome.trim(), x, y, z,
      dimensao: row.dimensao,
      categoria: row.categoria || 'Outros',
      mundo: typeof row.mundo === 'string' && row.mundo.trim() ? row.mundo.trim().slice(0, 40) : 'Principal',
      favorito: Boolean(row.favorito)
    };
    if (typeof row.notas === 'string' && row.notas.trim()) {
      item.notas = row.notas.trim().slice(0, 500);
    }
    if (typeof row.cor === 'string' && /^#[0-9a-fA-F]{6}$/.test(row.cor.trim())) {
      item.cor = row.cor.trim().toLowerCase();
    }
    return item;
  }
  function validar(rows) {
    if (!Array.isArray(rows) || rows.length > 10000) throw new Error('O backup deve conter uma lista de até 10.000 pontos.');
    return rows.map(row => validarPonto(row, { permitirAlturaLegada: true }));
  }
  let editor = false;
  const ready = local && root.navigator?.locks?.request
    ? new Promise(resolve => {
      root.navigator.locks.request(KEY, { ifAvailable: true }, lock => {
        editor = Boolean(lock);
        resolve();
        if (lock) return new Promise(() => {});
      }).catch(() => resolve());
    }) : Promise.resolve();
  root.MinecoordStorage = {
    local, validar,
    async request(url, options = {}) {
      if (!local) return null;
      if ((options.method || 'GET') === 'GET') return executar(url, options);
      if (!root.navigator?.locks?.request) {
        throw new Error('Este navegador não oferece bloqueio seguro entre abas. Use o modo servidor para salvar; seus pontos continuam disponíveis para exportação.');
      }
      await ready;
      if (!editor) throw new Error('Outra aba está editando estes pontos. Feche a aba editora e recarregue esta página para salvar.');
      return executar(url, options);
    }
  };
  async function executar(url, options) {
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
          const validated = validarPonto(body);
          const row = { ...validated, id: root.crypto.randomUUID(), criadoEm: new Date().toISOString() };
          gravar([...rows, row]);
          return row;
        }
        if (index < 0) throw new Error('Ponto não encontrado. Atualize a lista.');
        if (method === 'DELETE') { rows.splice(index, 1); gravar(rows); return { id }; }
        if (method === 'PUT') {
          const validated = validarPonto(body);
          const anterior = { ...rows[index] };
          if (body.notas === '' || body.notas === null) delete anterior.notas;
          if (body.cor === '' || body.cor === null) delete anterior.cor;
          rows[index] = { ...anterior, ...validated, atualizadoEm: new Date().toISOString() };
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
})(window);
