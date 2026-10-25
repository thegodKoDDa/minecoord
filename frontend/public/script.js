document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const form = $('form-coordenada');
  const formEditar = $('form-editar');
  const tabelaCorpo = $('tabela-corpo');
  const searchInput = $('search-input');
  const editModal = $('edit-modal');
  const deleteModal = $('delete-modal');
  const feedback = $('feedback');
  const atualizar = $('btn-atualizar');
  const resumo = $('list-summary');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const EMOJIS = { Base: '🏠', Farm: '🌾', Portal: '🚪', Vila: '🏡', Mina: '⛏️', Outros: '📍' };
  const DIMENSOES = { Overworld: '🌲', Nether: '🔥', End: '🌌' };
  let locaisCache = [];
  let dimensaoFiltro = 'Todos';
  let salvando = false;
  let carregamento;
  let carregou = false;
  let excluirPendente;
  let ultimoFoco;

  function avisar(mensagem, erro = false) {
    if (erro && editModal.open) {
      $('edit-feedback').textContent = mensagem;
      $('edit-feedback').hidden = false;
      return;
    }
    feedback.textContent = mensagem;
    feedback.classList.toggle('feedback-error', erro);
    feedback.setAttribute('role', erro ? 'alert' : 'status');
    feedback.hidden = false;
  }

  async function requisitar(url, options = {}) {
    if (MinecoordStorage.local) return MinecoordStorage.request(url, options);
    let response;
    try {
      response = await fetch(url, { cache: 'no-store', ...options });
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      throw new Error(options.method
        ? 'Não foi possível confirmar a operação. Confira a lista antes de enviar novamente.'
        : 'Não foi possível conectar ao servidor. Confira a conexão e tente novamente.');
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || 'Não foi possível concluir a operação. Tente novamente.');
    if (data === null) throw new Error('O servidor retornou uma resposta inválida. Atualize a lista.');
    return data;
  }

  const enviar = (url, method, body) => requisitar(url, {
    method, headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  async function carregarLocais() {
    carregamento?.abort();
    const controller = new AbortController();
    carregamento = controller;
    const timeout = setTimeout(() => controller.abort('timeout'), 12000);
    atualizar.disabled = true;
    atualizar.textContent = 'Atualizando…';
    tabelaCorpo.setAttribute('aria-busy', 'true');
    try {
      const locais = await requisitar('/api/locais', { signal: controller.signal });
      if (!Array.isArray(locais)) throw new Error('A lista recebida do servidor é inválida.');
      if (controller.signal.aborted) return;
      locaisCache = locais;
      carregou = true;
      filtrarERenderizarLocais();
    } catch (error) {
      if (error.name === 'AbortError' && controller.signal.reason !== 'timeout') return;
      avisar(controller.signal.reason === 'timeout' ? 'O servidor demorou para responder. Use “Atualizar lista” para tentar novamente.' : error.message, true);
      if (!carregou) {
        tabelaCorpo.innerHTML = '<tr class="empty-row"><td colspan="4">Não foi possível carregar os pontos. Use “Atualizar lista” para tentar novamente.</td></tr>';
        resumo.textContent = 'Lista indisponível';
      } else {
        resumo.textContent = 'Falha ao atualizar. A lista abaixo pode estar desatualizada.';
      }
    } finally {
      clearTimeout(timeout);
      if (carregamento === controller) {
        carregamento = null;
        atualizar.disabled = salvando;
        atualizar.textContent = 'Atualizar lista';
        tabelaCorpo.setAttribute('aria-busy', 'false');
      }
    }
  }

  function normalizar(texto) {
    return String(texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function filtrarERenderizarLocais() {
    const termo = normalizar(searchInput.value.trim());
    const filtrados = locaisCache.filter(local =>
      (!$('filtro-categoria').value || local.categoria === $('filtro-categoria').value)
      && (dimensaoFiltro === 'Todos' || local.dimensao === dimensaoFiltro)
      && [local.nome, local.dimensao, local.categoria, local.x, local.y, local.z]
        .some(valor => normalizar(valor).includes(termo))
    );
    const ordem = $('ordenacao').value;
    filtrados.sort((a, b) => ordem === 'nome' ? a.nome.localeCompare(b.nome, 'pt-BR') : ordem === 'dimensao' ? a.dimensao.localeCompare(b.dimensao) : String(b.criadoEm || '').localeCompare(String(a.criadoEm || '')));
    $('stat-total').textContent = `${locaisCache.length} ${locaisCache.length === 1 ? 'ponto' : 'pontos'}`;
    for (const dim of Object.keys(DIMENSOES)) $('stat-' + dim.toLowerCase()).textContent = locaisCache.filter(row => row.dimensao === dim).length;
    resumo.textContent = `${filtrados.length} de ${locaisCache.length} ${locaisCache.length === 1 ? 'ponto' : 'pontos'}`;
    renderizarTabela(filtrados);
  }

  function escaparHTML(texto) {
    const div = document.createElement('div');
    div.textContent = String(texto ?? '');
    return div.innerHTML;
  }

  function renderizarTabela(locais) {
    tabelaCorpo.replaceChildren();
    if (!locais.length) {
      const mensagem = locaisCache.length
        ? 'Nenhum ponto corresponde à busca ou dimensão selecionada.'
        : 'Seu próximo destino começa aqui. Cadastre o primeiro ponto ao lado.';
      tabelaCorpo.innerHTML = `<tr class="empty-row"><td colspan="4">${mensagem}</td></tr>`;
      return;
    }
    const fragment = document.createDocumentFragment();
    locais.forEach((local, index) => {
      const tr = document.createElement('tr');
      tr.className = 'fade-in-item';
      tr.style.animationDelay = `${Math.min(index, 8) * 0.03}s`;
      const categoria = local.categoria || 'Outros';
      const dimensaoClasse = Object.hasOwn(DIMENSOES, local.dimensao) ? local.dimensao.toLowerCase() : '';
      let portal = '';
      if (local.dimensao === 'Overworld' || local.dimensao === 'Nether') {
        const nether = local.dimensao === 'Overworld';
        const x = nether ? Math.round(local.x / 8) : local.x * 8;
        const z = nether ? Math.round(local.z / 8) : local.z * 8;
        portal = `<div class="portal-calc-container ${nether ? 'to-nether' : 'to-overworld'}" title="Referência de X e Z pela proporção 1:8; a posição e a vinculação do portal dependem do mundo.">
          <span class="portal-calc-label">${nether ? '🔥 Nether' : '🌲 Overworld'}:</span>
          <span class="portal-calc-coords">X: <span>${x}</span>, Z: <span>${z}</span></span>
        </div>`;
      }
      tr.innerHTML = `
        <td><div class="local-nome">${escaparHTML(local.nome)}</div>
          <div class="local-categoria">${Object.hasOwn(EMOJIS, categoria) ? EMOJIS[categoria] : '📍'} ${escaparHTML(categoria)}</div></td>
        <td data-label="Dimensão"><span class="badge-dimensao ${dimensaoClasse}">${DIMENSOES[local.dimensao] || '📍'} ${escaparHTML(local.dimensao)}</span></td>
        <td data-label="Coordenadas"><div class="coordinate-details"><div class="coord-badge-container">
          ${['x', 'y', 'z'].map(axis => `<span class="coord-axis">${axis.toUpperCase()}: <span class="coord-axis-val">${escaparHTML(local[axis])}</span></span>`).join('')}
        </div>${portal}</div></td>
        <td class="actions-column"><div class="actions-wrapper">
          <button type="button" class="btn-copy" title="Copiar comando de teletransporte"><span class="copy-text">Copiar /tp</span><span class="copy-icon" aria-hidden="true">📋</span></button>
          <button type="button" class="btn-action btn-edit" title="Editar localização">✏️</button>
          <button type="button" class="btn-action btn-delete" title="Excluir localização">🗑️</button>
        </div></td>`;
      const copiar = tr.querySelector('.btn-copy');
      copiar.setAttribute('aria-label', `Copiar /tp para ${local.nome}`);
      copiar.addEventListener('click', () => copiarComando(copiar, local));
      const editar = tr.querySelector('.btn-edit');
      editar.setAttribute('aria-label', `Editar ${local.nome}`);
      editar.disabled = salvando;
      editar.addEventListener('click', () => abrirEdicao(local, editar));
      const excluir = tr.querySelector('.btn-delete');
      excluir.setAttribute('aria-label', `Excluir ${local.nome}`);
      excluir.disabled = salvando;
      excluir.addEventListener('click', () => {
        if (salvando) return;
        excluirPendente = local;
        ultimoFoco = excluir;
        $('delete-description').textContent = `Excluir “${local.nome}”? O ponto será removido da lista.`;
        deleteModal.showModal();
        $('btn-cancelar-exclusao').focus();
      });
      fragment.appendChild(tr);
    });
    tabelaCorpo.appendChild(fragment);
  }

  function limparErros(formulario) {
    formulario.querySelectorAll('.invalid').forEach(input => {
      input.classList.remove('invalid');
      input.removeAttribute('aria-invalid');
    });
    formulario.querySelectorAll('.error-msg').forEach(error => { error.style.display = 'none'; });
  }

  function lerFormulario(formulario, prefixo = '') {
    limparErros(formulario);
    let valido = true;
    const campo = nome => $(prefixo + nome);
    const invalidar = (inputs, mensagem) => {
      for (const input of inputs) {
        input.classList.add('invalid');
        input.setAttribute('aria-invalid', 'true');
      }
      if (mensagem) mensagem.style.display = 'block';
      valido = false;
    };
    const nome = campo('nome').value.trim();
    if (!nome || nome.length > 120) invalidar([campo('nome')], campo('error-nome'));
    const coordenadas = ['x', 'y', 'z'].map(axis => campo('coord-' + axis));
    const numeros = coordenadas.map(input => Number(input.value));
    const invalidos = coordenadas.filter((input, index) => {
      const limite = index === 1 ? [-64, 320] : [-30000000, 30000000];
      return !input.value.trim() || !Number.isFinite(numeros[index]) || numeros[index] < limite[0] || numeros[index] > limite[1];
    });
    if (invalidos.length) invalidar(invalidos, campo('error-coords'));
    if (!Object.hasOwn(DIMENSOES, campo('dimensao').value)) invalidar([campo('dimensao')], campo('error-dimensao'));
    if (!Object.hasOwn(EMOJIS, campo('categoria').value)) invalidar([campo('categoria')], campo('error-categoria'));
    if (!valido) {
      formulario.querySelector('.invalid')?.focus();
      return null;
    }
    return { nome, x: numeros[0], y: numeros[1], z: numeros[2], dimensao: campo('dimensao').value, categoria: campo('categoria').value };
  }

  function ocupado(ativo, formulario) {
    salvando = ativo;
    if (ativo) {
      carregamento?.abort();
      tabelaCorpo.setAttribute('aria-busy', 'false');
    }
    document.querySelectorAll('form input, form select, form button, .btn-edit, .btn-delete, #btn-confirmar-exclusao, #btn-cancelar-exclusao')
      .forEach(element => { element.disabled = ativo; });
    atualizar.disabled = ativo;
    if (formulario) {
      formulario.setAttribute('aria-busy', String(ativo));
      const botao = formulario.querySelector('[type="submit"]');
      if (ativo) { botao.dataset.original = botao.innerHTML; botao.textContent = 'Salvando…'; }
      else if (botao.dataset.original) botao.innerHTML = botao.dataset.original;
    }
  }

  function registrarFormulario(formulario, prefixo = '') {
    formulario.addEventListener('submit', async event => {
      event.preventDefault();
      if (salvando) return;
      const dados = lerFormulario(formulario, prefixo);
      if (!dados) return;
      feedback.hidden = true;
      if (prefixo) $('edit-feedback').hidden = true;
      ocupado(true, formulario);
      try {
        const id = prefixo ? $('edit-id').value : null;
        const salvo = await enviar(id ? `/api/locais/${encodeURIComponent(id)}` : '/api/locais', id ? 'PUT' : 'POST', dados);
        if (id) locaisCache = locaisCache.map(local => local.id === id ? salvo : local);
        else locaisCache.push(salvo);
        formulario.reset();
        if (prefixo) editModal.close();
        avisar(`“${salvo.nome}” ${id ? 'atualizado' : 'cadastrado'} com sucesso.`);
      } catch (error) {
        avisar(error.message, true);
      } finally {
        ocupado(false, formulario);
        if (carregou) filtrarERenderizarLocais();
        // Reconciliar com o servidor também após resposta perdida ou conflito.
        await carregarLocais();
      }
    });
  }

  function abrirEdicao(local, botao) {
    if (salvando) return;
    ultimoFoco = botao;
    limparErros(formEditar);
    $('edit-feedback').hidden = true;
    $('edit-id').value = local.id;
    for (const key of ['nome', 'dimensao', 'categoria']) $('edit-' + key).value = local[key] || (key === 'categoria' ? 'Outros' : '');
    for (const axis of ['x', 'y', 'z']) $('edit-coord-' + axis).value = local[axis];
    editModal.showModal();
    $('edit-nome').focus();
  }

  for (const modal of [editModal, deleteModal]) {
    modal.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const campos = [...modal.querySelectorAll('input:not([type="hidden"]):not(:disabled), select:not(:disabled), button:not(:disabled)')];
      if (!campos.length) { event.preventDefault(); return; }
      const primeiro = campos[0];
      const ultimo = campos[campos.length - 1];
      if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault(); ultimo.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault(); primeiro.focus();
      }
    });
    modal.addEventListener('cancel', event => { if (salvando) event.preventDefault(); });
    modal.addEventListener('click', event => {
      if (event.target !== modal || salvando) return;
      const rect = modal.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) modal.close();
    });
    modal.addEventListener('close', () => {
      if (ultimoFoco?.isConnected) ultimoFoco.focus();
      else atualizar.focus();
    });
  }
  $('btn-cancelar-edicao').addEventListener('click', () => { if (!salvando) editModal.close(); });
  $('btn-cancelar-exclusao').addEventListener('click', () => { if (!salvando) deleteModal.close(); });
  $('btn-confirmar-exclusao').addEventListener('click', async () => {
    if (salvando || !excluirPendente) return;
    const local = excluirPendente;
    ocupado(true);
    const botao = $('btn-confirmar-exclusao');
    botao.textContent = 'Excluindo…';
    try {
      await enviar(`/api/locais/${encodeURIComponent(local.id)}`, 'DELETE');
      locaisCache = locaisCache.filter(item => item.id !== local.id);
      deleteModal.close();
      excluirPendente = null;
      avisar(`“${local.nome}” excluído com sucesso.`);
    } catch (error) {
      deleteModal.close();
      avisar(error.message, true);
    } finally {
      ocupado(false);
      botao.textContent = 'Excluir localização';
      if (carregou) filtrarERenderizarLocais();
      await carregarLocais();
    }
  });

  async function copiarComando(botao, local) {
    const comando = `/tp @s ${local.x} ${local.y} ${local.z}`;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard indisponível');
      await navigator.clipboard.writeText(comando);
      botao.classList.add('copied');
      botao.querySelector('.copy-text').textContent = 'Copiado!';
      botao.setAttribute('aria-label', `Copiado! Comando para ${local.nome}`);
      avisar('Comando de teletransporte copiado. Use na dimensão correspondente ao ponto.');
      setTimeout(() => {
        botao.classList.remove('copied');
        botao.querySelector('.copy-text').textContent = 'Copiar /tp';
        botao.setAttribute('aria-label', `Copiar /tp para ${local.nome}`);
      }, 2000);
    } catch {
      avisar(`Copie o comando manualmente: ${comando}`);
    }
  }

  tabButtons.forEach(button => button.addEventListener('click', () => {
    tabButtons.forEach(tab => {
      tab.classList.toggle('active', tab === button);
      tab.setAttribute('aria-pressed', String(tab === button));
    });
    dimensaoFiltro = button.dataset.filter;
    if (carregou) filtrarERenderizarLocais();
  }));
  searchInput.addEventListener('input', () => { if (carregou) filtrarERenderizarLocais(); });
  atualizar.addEventListener('click', () => {
    feedback.hidden = true;
    carregarLocais();
  });
  const local = MinecoordStorage.local;
  $('storage-mode').textContent = local ? 'Salvo neste navegador' : 'Salvo no servidor';
  $('storage-description').textContent = local
    ? 'Os pontos ficam neste navegador e neste caminho. Exporte um backup antes de mover a pasta ou limpar os dados.'
    : 'Seus pontos ficam na pasta de dados do servidor. Exporte um backup para levar para outro dispositivo.';
  for (const id of ['filtro-categoria', 'ordenacao']) $(id).addEventListener('change', filtrarERenderizarLocais);
  $('btn-exportar').addEventListener('click', async () => {
    try {
      const rows = await requisitar('/api/locais');
      const blob = new Blob([JSON.stringify({ formato: 'minecoord', versao: 1, exportadoEm: new Date().toISOString(), locais: rows }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `minecoord-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      avisar('Backup preparado. Confira o arquivo na pasta de downloads.');
    } catch (error) { avisar(error.message, true); }
  });
  $('btn-importar').addEventListener('click', () => $('arquivo-importar').click());
  $('arquivo-importar').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file || salvando) return;
    ocupado(true);
    $('btn-importar').disabled = true;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('O backup deve ter no máximo 5 MB.');
      const content = JSON.parse(await file.text());
      const rows = MinecoordStorage.validar(Array.isArray(content) ? content : content.locais);
      const result = await enviar('/api/locais/importar', 'POST', rows);
      avisar(`${result.importados} pontos importados. Os pontos existentes foram preservados.`);
    } catch (error) { avisar(error instanceof SyntaxError ? 'Arquivo JSON inválido. Nenhum ponto foi importado.' : error.message, true); }
    finally { ocupado(false); $('btn-importar').disabled = false; event.target.value = ''; await carregarLocais(); }
  });
  window.addEventListener('storage', event => { if (local && event.key === 'minecoord.locais.v1') carregarLocais(); });
  registrarFormulario(form);
  registrarFormulario(formEditar, 'edit-');
  carregarLocais();
});
