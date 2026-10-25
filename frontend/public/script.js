document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // SELEÇÃO DE ELEMENTOS DO DOM
  // =========================================================================
  const form = document.getElementById('form-coordenada');
  const tabelaCorpo = document.getElementById('tabela-corpo');
  const searchInput = document.getElementById('search-input');
  
  // Elementos do formulário de Cadastro
  const inputNome = document.getElementById('nome');
  const inputX = document.getElementById('coord-x');
  const inputY = document.getElementById('coord-y');
  const inputZ = document.getElementById('coord-z');
  const selectDimensao = document.getElementById('dimensao');
  const selectCategoria = document.getElementById('categoria');

  // Elementos de mensagem de erro do Cadastro
  const errorNome = document.getElementById('error-nome');
  const errorCoords = document.getElementById('error-coords');
  const errorDimensao = document.getElementById('error-dimensao');
  const errorCategoria = document.getElementById('error-categoria');

  // Elementos do Modal de Edição
  const editModal = document.getElementById('edit-modal');
  const formEditar = document.getElementById('form-editar');
  const editId = document.getElementById('edit-id');
  const editNome = document.getElementById('edit-nome');
  const editX = document.getElementById('edit-coord-x');
  const editY = document.getElementById('edit-coord-y');
  const editZ = document.getElementById('edit-coord-z');
  const editDimensao = document.getElementById('edit-dimensao');
  const editCategoria = document.getElementById('edit-categoria');
  const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');

  const editErrorNome = document.getElementById('edit-error-nome');
  const editErrorCoords = document.getElementById('edit-error-coords');

  // Abas de Dimensão
  const tabButtons = document.querySelectorAll('.tab-btn');

  // Cache local e Filtro Selecionado
  let locaisCache = [];
  let dimensaoFiltro = 'Todos';

  // Dicionário de Emojis das Categorias
  const CATEGORIA_EMOJIS = {
    Base: '🏠',
    Farm: '🌾',
    Portal: '🚪',
    Vila: '🏡',
    Mina: '⛏️',
    Outros: '📍'
  };

  // =========================================================================
  // CARREGAR E RENDERIZAR LOCAIS
  // =========================================================================

  /**
   * Busca a lista de locais do backend (GET /api/locais)
   */
  async function carregarLocais() {
    try {
      const response = await fetch('/api/locais');
      if (!response.ok) {
        throw new Error('Falha ao carregar as coordenadas do servidor.');
      }
      locaisCache = await response.json();
      filtrarERenderizarLocais();
    } catch (error) {
      console.error('Erro na requisição GET:', error);
      tabelaCorpo.innerHTML = `
        <tr class="empty-row">
          <td colspan="4" style="color: var(--color-error)">❌ Erro ao carregar pontos. Tente novamente mais tarde.</td>
        </tr>
      `;
    }
  }

  /**
   * Filtra os locais do cache baseado no termo de busca e na dimensão ativa (abas)
   */
  function filtrarERenderizarLocais() {
    const termo = searchInput.value.toLowerCase().trim();

    const locaisFiltrados = locaisCache.filter(local => {
      // 1. Filtro da Aba de Dimensão
      const matchesDimensao = (dimensaoFiltro === 'Todos' || local.dimensao === dimensaoFiltro);

      // 2. Filtro da Barra de Pesquisa (Nome, Coordenadas, Categoria ou Dimensão)
      const matchesBusca = 
        local.nome.toLowerCase().includes(termo) || 
        local.dimensao.toLowerCase().includes(termo) ||
        local.categoria.toLowerCase().includes(termo) ||
        local.x.toString().includes(termo) ||
        local.y.toString().includes(termo) ||
        local.z.toString().includes(termo);

      return matchesDimensao && matchesBusca;
    });

    renderizarTabela(locaisFiltrados);
  }

  /**
   * Injeta o HTML dos locais na tabela
   */
  function renderizarTabela(listaLocais) {
    tabelaCorpo.innerHTML = '';

    if (listaLocais.length === 0) {
      tabelaCorpo.innerHTML = `
        <tr class="empty-row">
          <td colspan="4">Nenhum ponto de interesse encontrado.</td>
        </tr>
      `;
      return;
    }

    listaLocais.forEach((local, index) => {
      const tr = document.createElement('tr');
      tr.className = 'fade-in-item';
      tr.style.animationDelay = `${index * 0.04}s`;

      const dimensaoClasse = local.dimensao.toLowerCase();

      // Definir emoji da dimensão
      let emojiDimensao = '🌲';
      if (local.dimensao === 'Nether') emojiDimensao = '🔥';
      if (local.dimensao === 'End') emojiDimensao = '🌌';

      // Definir emoji da categoria
      const emojiCategoria = CATEGORIA_EMOJIS[local.categoria] || '📍';

      // Lógica da Calculadora do Portal (1:8)
      let portalCalculadoraHTML = '';
      if (local.dimensao === 'Overworld') {
        const netherX = Math.round(local.x / 8);
        const netherZ = Math.round(local.z / 8);
        portalCalculadoraHTML = `
          <div class="portal-calc-container to-nether" title="Coordenada equivalente ideal para criar portal no Nether">
            <span class="portal-calc-label">🔥 Nether Link:</span>
            <span class="portal-calc-coords">X: <span>${netherX}</span>, Z: <span>${netherZ}</span></span>
          </div>
        `;
      } else if (local.dimensao === 'Nether') {
        const overworldX = local.x * 8;
        const overworldZ = local.z * 8;
        portalCalculadoraHTML = `
          <div class="portal-calc-container to-overworld" title="Coordenada equivalente ideal para criar portal no Overworld">
            <span class="portal-calc-label">🌲 Overworld Link:</span>
            <span class="portal-calc-coords">X: <span>${overworldX}</span>, Z: <span>${overworldZ}</span></span>
          </div>
        `;
      }

      tr.innerHTML = `
        <td>
          <div class="local-nome">${escaparHTML(local.nome)}</div>
          <div class="local-categoria">${emojiCategoria} ${local.categoria}</div>
        </td>
        <td>
          <span class="badge-dimensao ${dimensaoClasse}">
            ${emojiDimensao} ${local.dimensao}
          </span>
        </td>
        <td>
          <div class="coord-badge-container">
            <span class="coord-axis">X: <span class="coord-axis-val">${local.x}</span></span>
            <span class="coord-axis">Y: <span class="coord-axis-val">${local.y}</span></span>
            <span class="coord-axis">Z: <span class="coord-axis-val">${local.z}</span></span>
          </div>
          ${portalCalculadoraHTML}
        </td>
        <td class="actions-column">
          <div class="actions-wrapper">
            <button class="btn-copy" title="Copiar comando de teleport para chat">
              <span class="copy-text">Copiar /tp</span>
              <span class="copy-icon">📋</span>
            </button>
            <button class="btn-action btn-edit" title="Editar Localização">✏️</button>
            <button class="btn-action btn-delete" title="Excluir Localização">🗑️</button>
          </div>
        </td>
      `;

      // Evento: Copiar comando /tp
      const btnCopy = tr.querySelector('.btn-copy');
      btnCopy.addEventListener('click', () => {
        copiarComandoTeletransporte(btnCopy, local.x, local.y, local.z);
      });

      // Evento: Editar
      const btnEdit = tr.querySelector('.btn-edit');
      btnEdit.addEventListener('click', () => {
        abrirModalEdicao(local);
      });

      // Evento: Deletar
      const btnDelete = tr.querySelector('.btn-delete');
      btnDelete.addEventListener('click', () => {
        deletarLocal(local.id, local.nome);
      });

      tabelaCorpo.appendChild(tr);
    });
  }

  // =========================================================================
  // MANIPULAÇÃO DAS TABS (FILTRO POR DIMENSÃO)
  // =========================================================================
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove classe ativa de todos
      tabButtons.forEach(btn => btn.classList.remove('active'));
      
      // Adiciona classe ativa ao botão clicado
      button.classList.add('active');

      // Aplica o filtro de dimensão
      dimensaoFiltro = button.getAttribute('data-filter');
      filtrarERenderizarLocais();
    });
  });

  // =========================================================================
  // CADASTRO DE NOVO LOCAL
  // =========================================================================

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    limparErros();

    const nome = inputNome.value.trim();
    const x = inputX.value.trim();
    const y = inputY.value.trim();
    const z = inputZ.value.trim();
    const dimensao = selectDimensao.value;
    const categoria = selectCategoria.value;

    let formValido = true;

    // 1. Validação do Nome
    if (!nome) {
      inputNome.classList.add('invalid');
      errorNome.style.display = 'block';
      formValido = false;
    }

    // 2. Validação numérica das coordenadas e limites físicos do Minecraft
    const numX = Number(x);
    const numY = Number(y);
    const numZ = Number(z);

    const coordsInvalidas = 
      x === '' || isNaN(numX) || numX < -30000000 || numX > 30000000 ||
      y === '' || isNaN(numY) || numY < -64 || numY > 320 ||
      z === '' || isNaN(numZ) || numZ < -30000000 || numZ > 30000000;

    if (coordsInvalidas) {
      inputX.classList.add('invalid');
      inputY.classList.add('invalid');
      inputZ.classList.add('invalid');
      errorCoords.style.display = 'block';
      formValido = false;
    }

    // 3. Validação de Dimensão
    if (!dimensao) {
      selectDimensao.classList.add('invalid');
      errorDimensao.style.display = 'block';
      formValido = false;
    }

    // 4. Validação de Categoria
    if (!categoria) {
      selectCategoria.classList.add('invalid');
      errorCategoria.style.display = 'block';
      formValido = false;
    }

    if (!formValido) return;

    try {
      const response = await fetch('/api/locais', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome,
          x: numX,
          y: numY,
          z: numZ,
          dimensao,
          categoria
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao cadastrar coordenadas.');
      }

      form.reset();
      limparErros();
      await carregarLocais();

    } catch (error) {
      console.error('Erro na requisição POST:', error);
      alert(`Erro: ${error.message}`);
    }
  });

  // =========================================================================
  // LOGICA DO MODAL DE EDIÇÃO E EXCLUSÃO (PUT E DELETE)
  // =========================================================================

  function abrirModalEdicao(local) {
    limparErros();
    
    editId.value = local.id;
    editNome.value = local.nome;
    editX.value = local.x;
    editY.value = local.y;
    editZ.value = local.z;
    editDimensao.value = local.dimensao;
    editCategoria.value = local.categoria || 'Outros';

    editModal.style.display = 'flex';
  }

  function fecharModalEdicao() {
    editModal.style.display = 'none';
    formEditar.reset();
    limparErros();
  }

  btnCancelarEdicao.addEventListener('click', fecharModalEdicao);

  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
      fecharModalEdicao();
    }
  });

  formEditar.addEventListener('submit', async (e) => {
    e.preventDefault();
    limparErros();

    const id = editId.value;
    const nome = editNome.value.trim();
    const x = editX.value.trim();
    const y = editY.value.trim();
    const z = editZ.value.trim();
    const dimensao = editDimensao.value;
    const categoria = editCategoria.value;

    let modalValido = true;

    if (!nome) {
      editNome.classList.add('invalid');
      editErrorNome.style.display = 'block';
      modalValido = false;
    }

    const numX = Number(x);
    const numY = Number(y);
    const numZ = Number(z);

    const coordsInvalidas = 
      x === '' || isNaN(numX) || numX < -30000000 || numX > 30000000 ||
      y === '' || isNaN(numY) || numY < -64 || numY > 320 ||
      z === '' || isNaN(numZ) || numZ < -30000000 || numZ > 30000000;

    if (coordsInvalidas) {
      editX.classList.add('invalid');
      editY.classList.add('invalid');
      editZ.classList.add('invalid');
      editErrorCoords.style.display = 'block';
      modalValido = false;
    }

    if (!modalValido) return;

    try {
      const response = await fetch(`/api/locais/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome,
          x: numX,
          y: numY,
          z: numZ,
          dimensao,
          categoria
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar coordenadas.');
      }

      fecharModalEdicao();
      await carregarLocais();
    } catch (error) {
      console.error('Erro na requisição PUT:', error);
      alert(`Erro: ${error.message}`);
    }
  });

  async function deletarLocal(id, nome) {
    const confirmar = confirm(`Deseja realmente excluir o local "${nome}"?`);
    if (!confirmar) return;

    try {
      const response = await fetch(`/api/locais/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir coordenadas.');
      }

      await carregarLocais();
    } catch (error) {
      console.error('Erro na requisição DELETE:', error);
      alert(`Erro: ${error.message}`);
    }
  }

  // =========================================================================
  // FUNCIONALIDADES EXTRA / AUXILIARES
  // =========================================================================

  async function copiarComandoTeletransporte(botao, x, y, z) {
    const comando = `/tp @s ${x} ${y} ${z}`;
    
    try {
      await navigator.clipboard.writeText(comando);

      botao.classList.add('copied');
      const textSpan = botao.querySelector('.copy-text');
      const iconSpan = botao.querySelector('.copy-icon');

      textSpan.textContent = 'Copiado!';
      iconSpan.textContent = '✔';

      setTimeout(() => {
        botao.classList.remove('copied');
        textSpan.textContent = 'Copiar /tp';
        iconSpan.textContent = '📋';
      }, 2000);

    } catch (error) {
      console.error('Falha ao copiar comando:', error);
      alert('Não foi possível copiar automaticamente. Comando: ' + comando);
    }
  }

  // Barra de Pesquisa
  searchInput.addEventListener('input', filtrarERenderizarLocais);

  function limparErros() {
    inputNome.classList.remove('invalid');
    inputX.classList.remove('invalid');
    inputY.classList.remove('invalid');
    inputZ.classList.remove('invalid');
    selectDimensao.classList.remove('invalid');
    selectCategoria.classList.remove('invalid');

    errorNome.style.display = 'none';
    errorCoords.style.display = 'none';
    errorDimensao.style.display = 'none';
    errorCategoria.style.display = 'none';

    editNome.classList.remove('invalid');
    editX.classList.remove('invalid');
    editY.classList.remove('invalid');
    editZ.classList.remove('invalid');
    editErrorNome.style.display = 'none';
    editErrorCoords.style.display = 'none';
  }

  function escaparHTML(texto) {
    const div = document.createElement('div');
    div.innerText = texto;
    return div.innerHTML;
  }

  // =========================================================================
  // EXECUÇÃO INICIAL
  // =========================================================================
  carregarLocais();
});
