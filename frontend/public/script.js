document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const form = $('form-coordenada');
  const formEditar = $('form-editar');
  const tabelaCorpo = $('tabela-corpo');
  const searchInput = $('search-input');
  const editModal = $('edit-modal');
  const deleteModal = $('delete-modal');
  const f3cModal = $('f3c-modal');
  const strongholdModal = $('stronghold-modal');
  const novoMundoModal = $('novo-mundo-modal');
  const modsModal = $('mods-modal');
  const feedback = $('feedback');
  const atualizar = $('btn-atualizar');
  const resumo = $('list-summary');
  const tabButtons = document.querySelectorAll('.tab-btn');

  // Constantes temáticas de Minecraft
  const EMOJIS = { Base: '🏠', Farm: '🌾', Portal: '🚪', Vila: '🏡', Mina: '⛏️', Outros: '📍' };
  const DIMENSOES = { Overworld: '🌲', Nether: '🔥', End: '🌌', 'The Sift': '🌀' };
  const slugDimensao = dim => dim.toLowerCase().replace(/\s+/g, '-');

  // Estado geral da aplicação
  let locaisCache = [];
  let dimensaoFiltro = 'Todos';
  let mundoFiltro = 'Todos';
  let mundosCustomizados = [];
  let paginaAtual = 1;
  let salvando = false;
  let carregamento = null;
  let carregou = false;
  let excluirPendente = null;
  let ultimoFoco = null;
  let f3cDestino = 'form'; // 'form' ou 'player'
  let posicaoJogador = null; // { x, z }
  let radarInstancia = null;
  let strongholdPendente = null;

  // Carrega mundos adicionais salvos localmente
  try {
    const mundosSalvos = localStorage.getItem('minecoord.mundos.v1');
    if (mundosSalvos) mundosCustomizados = JSON.parse(mundosSalvos);
  } catch {}

  // Inicializa o Radar Canvas se disponível
  try {
    if (window.MinecoordRadar && $('radar-canvas')) {
      radarInstancia = window.MinecoordRadar.criarRadar('radar-canvas');
    }
  } catch (err) {
    console.warn('Não foi possível inicializar o radar:', err);
  }

  function avisar(mensagem, erro = false) {
    if (erro && editModal?.open) {
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
    if (window.MinecoordStorage?.local) return window.MinecoordStorage.request(url, options);
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

  // Atualização de listas de mundos nos selects
  function atualizarListasDeMundos() {
    const mundosDosPontos = locaisCache.map(p => p.mundo || 'Principal').filter(Boolean);
    const conjuntoMundos = new Set(['Principal', ...mundosCustomizados, ...mundosDosPontos]);
    const listaOrdenada = Array.from(conjuntoMundos).sort((a, b) => {
      if (a === 'Principal') return -1;
      if (b === 'Principal') return 1;
      return a.localeCompare(b, 'pt-BR');
    });

    // Seletor principal do cabeçalho
    const seletorMundo = $('seletor-mundo');
    if (seletorMundo) {
      const valorAtual = seletorMundo.value || mundoFiltro;
      seletorMundo.innerHTML = '<option value="Todos">🌍 Todos os mundos</option>';
      listaOrdenada.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        seletorMundo.appendChild(opt);
      });
      seletorMundo.value = conjuntoMundos.has(valorAtual) || valorAtual === 'Todos' ? valorAtual : 'Todos';
      mundoFiltro = seletorMundo.value;
    }

    // Selects nos formulários de cadastro e edição
    ['mundo', 'edit-mundo'].forEach(selectId => {
      const select = $(selectId);
      if (!select) return;
      const valorAtual = select.value || 'Principal';
      select.innerHTML = '';
      listaOrdenada.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        select.appendChild(opt);
      });
      select.value = conjuntoMundos.has(valorAtual) ? valorAtual : 'Principal';
    });
  }

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
      atualizarListasDeMundos();
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

  function parsearComandoMinecraft(raw) {
    if (typeof raw !== 'string' || !raw.trim()) return null;
    const texto = raw.trim();
    let dimensao;
    if (/\b(?:the_nether|nether)\b/i.test(texto)) dimensao = 'Nether';
    else if (/\b(?:the_end|end)\b/i.test(texto)) dimensao = 'End';
    else if (/\b(?:the_sift|sift)\b/i.test(texto)) dimensao = 'The Sift';
    else if (/\b(?:overworld)\b/i.test(texto)) dimensao = 'Overworld';

    const regexTp = /(?:tp|teleport)(?:\s+@?[a-zA-Z0-9_]+)?\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)/i;
    let match = texto.match(regexTp);

    if (!match) {
      const regexXYZ = /X[:=]\s*([+-]?\d+(?:\.\d+)?).*?Y[:=]\s*([+-]?\d+(?:\.\d+)?).*?Z[:=]\s*([+-]?\d+(?:\.\d+)?)/i;
      match = texto.match(regexXYZ);
    }

    if (!match) {
      const regexXZ = /X[:=]\s*([+-]?\d+(?:\.\d+)?).*?Z[:=]\s*([+-]?\d+(?:\.\d+)?)/i;
      match = texto.match(regexXZ);
      if (match) {
        const x = Math.round(Number(match[1]) * 10) / 10;
        const z = Math.round(Number(match[2]) * 10) / 10;
        if (Number.isFinite(x) && Number.isFinite(z)) {
          return { x, y: 64, z, dimensao };
        }
      }
    }

    if (!match) {
      const regexRaw = /^[^0-9+-]*([+-]?\d+(?:\.\d+)?)[,\s]+([+-]?\d+(?:\.\d+)?)[,\s]+([+-]?\d+(?:\.\d+)?)/;
      match = texto.match(regexRaw);
    }

    if (!match) return null;
    const x = Math.round(Number(match[1]) * 10) / 10;
    const y = Math.round(Number(match[2]) * 10) / 10;
    const z = Math.round(Number(match[3]) * 10) / 10;
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
    return { x, y, z, dimensao };
  }

  function aplicarMinecraftF3C(texto, destino = 'form') {
    const parseado = parsearComandoMinecraft(texto);
    if (!parseado) {
      throw new Error('Não foi possível identificar coordenadas no texto. Copie com F3+C no jogo ou informe X Y Z.');
    }

    if (destino === 'player') {
      $('player-x').value = parseado.x;
      $('player-z').value = parseado.z;
      atualizarPosicaoJogador();
      avisar(`Sua posição atual foi definida: X: ${parseado.x}, Z: ${parseado.z}. Distâncias calculadas!`);
      return;
    }

    $('coord-x').value = parseado.x;
    $('coord-y').value = parseado.y;
    $('coord-z').value = parseado.z;
    if (parseado.dimensao) $('dimensao').value = parseado.dimensao;
    const dimTexto = parseado.dimensao ? ` Dimensão: ${parseado.dimensao},` : '';
    avisar(`Coordenadas preenchidas do Minecraft!${dimTexto} X: ${parseado.x}, Y: ${parseado.y}, Z: ${parseado.z}.`);
    $('coord-x').focus();
  }

  async function copiarComandoPortal(botao, x, z, dimNome) {
    const comando = `/tp @s ${x} ~ ${z}`;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard indisponível');
      await navigator.clipboard.writeText(comando);
      botao.classList.add('copied');
      const textSpan = botao.querySelector('.copy-portal-text');
      if (textSpan) textSpan.textContent = 'Copiado!';
      avisar(`Comando de teletransporte para o portal no ${dimNome} copiado (${comando}).`);
      setTimeout(() => {
        botao.classList.remove('copied');
        if (textSpan) textSpan.textContent = 'Copiar /tp portal';
      }, 2000);
    } catch {
      avisar(`Copie o comando do portal manualmente: ${comando}`);
    }
  }

  function normalizar(texto) {
    return String(texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function atualizarPosicaoJogador() {
    const valX = $('player-x')?.value?.trim();
    const valZ = $('player-z')?.value?.trim();
    const numX = Number(valX);
    const numZ = Number(valZ);

    if (valX !== '' && valZ !== '' && Number.isFinite(numX) && Number.isFinite(numZ)) {
      posicaoJogador = { x: numX, z: numZ };
      $('player-pos-status').textContent = `🧭 Calculando distâncias a partir de X: ${numX}, Z: ${numZ}.`;
    } else {
      posicaoJogador = null;
      $('player-pos-status').textContent = 'Informe X e Z para calcular distância em blocos e direção cardeal.';
    }

    if (radarInstancia) {
      radarInstancia.definirJogador(posicaoJogador);
    }
    if (carregou) {
      filtrarERenderizarLocais();
    }
  }

  function filtrarERenderizarLocais() {
    const termo = normalizar(searchInput.value.trim());
    const filtrados = locaisCache.filter(local =>
      (mundoFiltro === 'Todos' || (local.mundo || 'Principal') === mundoFiltro)
      && (!$('filtro-categoria').value || local.categoria === $('filtro-categoria').value)
      && (dimensaoFiltro === 'Todos' || local.dimensao === dimensaoFiltro)
      && [local.nome, local.dimensao, local.categoria, local.notas, local.mundo, local.x, local.y, local.z]
        .some(valor => normalizar(valor).includes(termo))
    );

    const ordem = $('ordenacao').value;
    filtrados.sort((a, b) => {
      const favA = a.favorito ? 1 : 0;
      const favB = b.favorito ? 1 : 0;
      if (favA !== favB) return favB - favA;

      if (ordem === 'distancia' && posicaoJogador) {
        const distA = Math.hypot(a.x - posicaoJogador.x, a.z - posicaoJogador.z);
        const distB = Math.hypot(b.x - posicaoJogador.x, b.z - posicaoJogador.z);
        return distA - distB;
      }
      if (ordem === 'nome') return a.nome.localeCompare(b.nome, 'pt-BR');
      if (ordem === 'nome-desc') return b.nome.localeCompare(a.nome, 'pt-BR');
      if (ordem === 'dimensao') return a.dimensao.localeCompare(b.dimensao);
      if (ordem === 'antigos') return String(a.criadoEm || '').localeCompare(String(b.criadoEm || ''));
      if (ordem === 'coord-x') return (Number(a.x) || 0) - (Number(b.x) || 0);
      if (ordem === 'coord-z') return (Number(a.z) || 0) - (Number(b.z) || 0);
      return String(b.criadoEm || '').localeCompare(String(a.criadoEm || ''));
    });

    const totalItens = filtrados.length;
    const paginacaoContainer = $('pagination-container');
    const selectSize = $('select-page-size');
    const tamanhoConfig = selectSize ? selectSize.value : '25';
    const limite = tamanhoConfig === 'todos' ? totalItens : (parseInt(tamanhoConfig, 10) || 25);
    const totalPaginas = Math.max(1, Math.ceil(totalItens / Math.max(1, limite)));
    if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
    if (paginaAtual < 1) paginaAtual = 1;

    const inicio = (paginaAtual - 1) * limite;
    const paginados = filtrados.slice(inicio, inicio + limite);

    if (totalItens > 25) {
      paginacaoContainer.hidden = false;
      $('pagination-info').textContent = `Página ${paginaAtual} de ${totalPaginas}`;
      $('btn-page-prev').disabled = paginaAtual <= 1;
      $('btn-page-next').disabled = paginaAtual >= totalPaginas;
    } else {
      paginacaoContainer.hidden = true;
    }

    $('stat-total').textContent = `${locaisCache.length} ${locaisCache.length === 1 ? 'ponto' : 'pontos'}`;
    for (const dim of Object.keys(DIMENSOES)) $('stat-' + slugDimensao(dim)).textContent = locaisCache.filter(row => row.dimensao === dim).length;
    resumo.textContent = `${totalItens} de ${locaisCache.length} ${locaisCache.length === 1 ? 'ponto' : 'pontos'}${totalItens > limite ? ` (exibindo ${paginados.length})` : ''}`;

    renderizarTabela(paginados);

    if (radarInstancia) {
      radarInstancia.atualizar(filtrados, dimensaoFiltro);
    }
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
        ? 'Nenhum ponto corresponde à busca, dimensão ou mundo selecionado.'
        : 'Seu próximo destino começa aqui. Cadastre o primeiro ponto ao lado.';
      tabelaCorpo.innerHTML = `<tr class="empty-row"><td colspan="4">${mensagem}</td></tr>`;
      return;
    }
    const fragment = document.createDocumentFragment();
    locais.forEach((local, index) => {
      const tr = document.createElement('tr');
      tr.className = 'fade-in-item';
      if (local.favorito) tr.classList.add('row-favorito');
      tr.style.animationDelay = `${Math.min(index, 8) * 0.03}s`;

      const categoria = local.categoria || 'Outros';
      const dimensaoClasse = Object.hasOwn(DIMENSOES, local.dimensao) ? slugDimensao(local.dimensao) : '';
      const corPonto = local.cor || '#38bdf8';

      // Calculadora de Portal
      let portal = '';
      if (local.dimensao === 'Overworld' || local.dimensao === 'Nether') {
        const nether = local.dimensao === 'Overworld';
        const x = nether ? Math.round(local.x / 8) : local.x * 8;
        const z = nether ? Math.round(local.z / 8) : local.z * 8;
        portal = `<div class="portal-calc-container ${nether ? 'to-nether' : 'to-overworld'}" title="Referência de X e Z pela proporção 1:8; a posição e a vinculação do portal dependem do mundo.">
          <div class="portal-calc-content">
            <span class="portal-calc-label">${nether ? '🔥 Nether' : '🌲 Overworld'}:</span>
            <span class="portal-calc-coords">X: <span>${x}</span>, Z: <span>${z}</span></span>
          </div>
          <button type="button" class="btn-copy-portal" title="Copiar /tp para o portal equivalente"><span class="copy-portal-text">Copiar /tp portal</span></button>
        </div>`;
      }

      // Distância a partir da posição do jogador
      let distanciaHTML = '';
      if (posicaoJogador && window.MinecoordTools) {
        const infoDist = window.MinecoordTools.calcularDistanciaEBussola(posicaoJogador, local);
        if (infoDist) {
          distanciaHTML = `<span class="badge-distancia" title="Distância em linha reta e direção">${infoDist.seta} <strong>${infoDist.distancia}</strong> blocos (${infoDist.direcao})</span>`;
        }
      }

      const notasHTML = local.notas
        ? `<div class="local-notas" title="Anotações do local">📝 ${escaparHTML(local.notas)}</div>`
        : '';

      const mundoBadge = local.mundo && local.mundo !== 'Principal'
        ? `<span class="badge-mundo" title="Mundo / Save">${escaparHTML(local.mundo)}</span>`
        : '';

      tr.innerHTML = `
        <td>
          <div class="nome-row">
            <button type="button" class="btn-star ${local.favorito ? 'favorito' : ''}" title="${local.favorito ? 'Remover dos favoritos' : 'Fixar nos favoritos'}" aria-label="${local.favorito ? 'Remover ' + local.nome + ' dos favoritos' : 'Fixar ' + local.nome + ' nos favoritos'}">
              ${local.favorito ? '⭐' : '☆'}
            </button>
            <span class="cor-marcador" style="background-color: ${escaparHTML(corPonto)}" title="Cor do marcador: ${escaparHTML(corPonto)}"></span>
            <div class="local-nome">${escaparHTML(local.nome)}</div>
            ${mundoBadge}
          </div>
          <div class="local-categoria">${Object.hasOwn(EMOJIS, categoria) ? EMOJIS[categoria] : '📍'} ${escaparHTML(categoria)}</div>
          ${notasHTML}
        </td>
        <td data-label="Dimensão"><span class="badge-dimensao ${dimensaoClasse}">${DIMENSOES[local.dimensao] || '📍'} ${escaparHTML(local.dimensao)}</span></td>
        <td data-label="Coordenadas">
          <div class="coordinate-details">
            <div class="coord-badge-container">
              ${['x', 'y', 'z'].map(axis => `<span class="coord-axis">${axis.toUpperCase()}: <span class="coord-axis-val">${escaparHTML(local[axis])}</span></span>`).join('')}
              ${distanciaHTML}
            </div>
            ${portal}
          </div>
        </td>
        <td class="actions-column">
          <div class="actions-wrapper">
            <button type="button" class="btn-copy" title="Copiar comando de teletransporte"><span class="copy-text">Copiar /tp</span><span class="copy-icon" aria-hidden="true">📋</span></button>
            <button type="button" class="btn-action btn-share" title="Compartilhar coordenadas formatadas">📤</button>
            <button type="button" class="btn-action btn-edit" title="Editar localização">✏️</button>
            <button type="button" class="btn-action btn-delete" title="Excluir localização">🗑️</button>
          </div>
        </td>`;

      // Alternar Favorito
      const starBtn = tr.querySelector('.btn-star');
      starBtn.addEventListener('click', async () => {
        if (salvando) return;
        const novoStatus = !local.favorito;
        local.favorito = novoStatus;
        starBtn.classList.toggle('favorito', novoStatus);
        starBtn.textContent = novoStatus ? '⭐' : '☆';
        starBtn.setAttribute('title', novoStatus ? 'Remover dos favoritos' : 'Fixar nos favoritos');
        try {
          await enviar(`/api/locais/${encodeURIComponent(local.id)}`, 'PUT', { ...local, favorito: novoStatus });
          avisar(`“${local.nome}” ${novoStatus ? 'fixado nos favoritos' : 'removido dos favoritos'}.`);
          filtrarERenderizarLocais();
        } catch (err) {
          avisar(err.message, true);
        }
      });

      // Copiar Teletransporte
      const copiar = tr.querySelector('.btn-copy');
      copiar.setAttribute('aria-label', `Copiar /tp para ${local.nome}`);
      copiar.addEventListener('click', () => copiarComando(copiar, local));

      // Compartilhar
      const shareBtn = tr.querySelector('.btn-share');
      shareBtn.setAttribute('aria-label', `Compartilhar ${local.nome}`);
      shareBtn.addEventListener('click', async () => {
        if (!window.MinecoordTools) return;
        const texto = window.MinecoordTools.formatarCompartilhamento(local);
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(texto);
            avisar(`Coordenadas de “${local.nome}” copiadas para compartilhar!`);
          } else {
            prompt('Copie as coordenadas formatadas:', texto);
          }
        } catch {
          prompt('Copie as coordenadas formatadas:', texto);
        }
      });

      // Copiar Portal
      const copiarPortal = tr.querySelector('.btn-copy-portal');
      if (copiarPortal) {
        const nether = local.dimensao === 'Overworld';
        const px = nether ? Math.round(local.x / 8) : local.x * 8;
        const pz = nether ? Math.round(local.z / 8) : local.z * 8;
        copiarPortal.setAttribute('aria-label', `Copiar /tp portal para ${local.nome}`);
        copiarPortal.addEventListener('click', () => copiarComandoPortal(copiarPortal, px, pz, nether ? 'Nether' : 'Overworld'));
      }

      // Editar
      const editar = tr.querySelector('.btn-edit');
      editar.setAttribute('aria-label', `Editar ${local.nome}`);
      editar.disabled = salvando;
      editar.addEventListener('click', () => abrirEdicao(local, editar));

      // Excluir
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

    const notas = campo('notas')?.value?.trim() || '';
    const mundo = campo('mundo')?.value?.trim() || 'Principal';
    const cor = campo('cor')?.value?.trim() || '#38bdf8';
    const favorito = Boolean(campo('favorito')?.checked);

    return {
      nome,
      x: numeros[0],
      y: numeros[1],
      z: numeros[2],
      dimensao: campo('dimensao').value,
      categoria: campo('categoria').value,
      mundo,
      cor,
      favorito,
      notas
    };
  }

  function ocupado(ativo, formulario) {
    salvando = ativo;
    if (ativo) {
      carregamento?.abort();
      tabelaCorpo.setAttribute('aria-busy', 'false');
    }
    document.querySelectorAll('form input, form select, form button, .btn-edit, .btn-delete, .btn-star, #btn-confirmar-exclusao, #btn-cancelar-exclusao')
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
        atualizarListasDeMundos();
        if (carregou) filtrarERenderizarLocais();
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
    $('edit-mundo').value = local.mundo || 'Principal';
    $('edit-cor').value = local.cor || '#38bdf8';
    $('edit-notas').value = local.notas || '';
    $('edit-favorito').checked = Boolean(local.favorito);
    editModal.showModal();
    $('edit-nome').focus();
  }

  // Acessibilidade e fechamento dos modais
  const todosModais = [editModal, deleteModal, f3cModal, strongholdModal, novoMundoModal, modsModal].filter(Boolean);
  todosModais.forEach(modal => {
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
  });

  // Botões de cancelamento de modais
  $('btn-cancelar-edicao')?.addEventListener('click', () => { if (!salvando) editModal.close(); });
  $('btn-cancelar-exclusao')?.addEventListener('click', () => { if (!salvando) deleteModal.close(); });
  $('btn-cancelar-f3c')?.addEventListener('click', () => { f3cModal.close(); });
  $('btn-cancelar-stronghold')?.addEventListener('click', () => { strongholdModal.close(); });
  $('btn-cancelar-mundo')?.addEventListener('click', () => { novoMundoModal.close(); });
  $('btn-fechar-mods')?.addEventListener('click', () => { modsModal.close(); });

  // Botão F3+C no Formulário Principal
  $('btn-colar-f3c')?.addEventListener('click', async () => {
    f3cDestino = 'form';
    ultimoFoco = $('btn-colar-f3c');
    try {
      if (navigator.clipboard?.readText) {
        const texto = await navigator.clipboard.readText();
        if (texto && texto.trim()) {
          aplicarMinecraftF3C(texto, 'form');
          return;
        }
      }
      throw new Error('Clipboard indisponível ou vazio');
    } catch {
      $('f3c-feedback').hidden = true;
      $('f3c-texto').value = '';
      f3cModal.showModal();
      $('f3c-texto').focus();
    }
  });

  // Botão F3+C na Barra do Jogador
  $('btn-player-f3c')?.addEventListener('click', async () => {
    f3cDestino = 'player';
    ultimoFoco = $('btn-player-f3c');
    try {
      if (navigator.clipboard?.readText) {
        const texto = await navigator.clipboard.readText();
        if (texto && texto.trim()) {
          aplicarMinecraftF3C(texto, 'player');
          return;
        }
      }
      throw new Error('Clipboard indisponível');
    } catch {
      $('f3c-feedback').hidden = true;
      $('f3c-texto').value = '';
      f3cModal.showModal();
      $('f3c-texto').focus();
    }
  });

  // Inputs da posição do jogador
  $('player-x')?.addEventListener('input', atualizarPosicaoJogador);
  $('player-z')?.addEventListener('input', atualizarPosicaoJogador);
  $('btn-player-limpar')?.addEventListener('click', () => {
    $('player-x').value = '';
    $('player-z').value = '';
    atualizarPosicaoJogador();
    avisar('Posição atual limpa.');
  });

  $('form-f3c')?.addEventListener('submit', event => {
    event.preventDefault();
    const texto = $('f3c-texto').value;
    try {
      aplicarMinecraftF3C(texto, f3cDestino);
      f3cModal.close();
    } catch (err) {
      $('f3c-feedback').textContent = err.message;
      $('f3c-feedback').hidden = false;
    }
  });

  // Confirmar Exclusão
  $('btn-confirmar-exclusao')?.addEventListener('click', async () => {
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
      atualizarListasDeMundos();
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

  // Abas de Dimensão
  tabButtons.forEach(button => button.addEventListener('click', () => {
    tabButtons.forEach(tab => {
      tab.classList.toggle('active', tab === button);
      tab.setAttribute('aria-pressed', String(tab === button));
    });
    dimensaoFiltro = button.dataset.filter;
    paginaAtual = 1;
    if (carregou) filtrarERenderizarLocais();
  }));

  // Seletor de Mundo
  $('seletor-mundo')?.addEventListener('change', e => {
    mundoFiltro = e.target.value;
    paginaAtual = 1;
    if ($('mundo') && mundoFiltro !== 'Todos') {
      $('mundo').value = mundoFiltro;
    }
    if (carregou) filtrarERenderizarLocais();
  });

  // Modal Novo Mundo
  $('btn-novo-mundo')?.addEventListener('click', () => {
    ultimoFoco = $('btn-novo-mundo');
    $('nome-novo-mundo').value = '';
    $('mundo-feedback').hidden = true;
    novoMundoModal.showModal();
    $('nome-novo-mundo').focus();
  });

  $('form-novo-mundo')?.addEventListener('submit', e => {
    e.preventDefault();
    const nome = $('nome-novo-mundo').value.trim();
    if (!nome) return;
    if (!mundosCustomizados.includes(nome)) {
      mundosCustomizados.push(nome);
      try {
        localStorage.setItem('minecoord.mundos.v1', JSON.stringify(mundosCustomizados));
      } catch {}
    }
    mundoFiltro = nome;
    atualizarListasDeMundos();
    $('seletor-mundo').value = nome;
    if ($('mundo')) $('mundo').value = nome;
    novoMundoModal.close();
    avisar(`Mundo “${nome}” criado e selecionado.`);
    if (carregou) filtrarERenderizarLocais();
  });

  // Modal Stronghold
  $('btn-abrir-stronghold')?.addEventListener('click', () => {
    ultimoFoco = $('btn-abrir-stronghold');
    $('stronghold-feedback').hidden = true;
    $('stronghold-resultado').hidden = true;
    strongholdPendente = null;
    strongholdModal.showModal();
    $('st-x1').focus();
  });

  $('form-stronghold')?.addEventListener('submit', e => {
    e.preventDefault();
    if (!window.MinecoordTools) return;
    try {
      const p1 = { x: $('st-x1').value, z: $('st-z1').value, angulo: $('st-ang1').value };
      const p2 = { x: $('st-x2').value, z: $('st-z2').value, angulo: $('st-ang2').value };
      const res = window.MinecoordTools.triangularStronghold(p1, p2);
      strongholdPendente = res;
      $('st-resultado-coords').textContent = `X: ${res.x}, Z: ${res.z} (Y estimado: ~32)`;
      $('stronghold-resultado').hidden = false;
      $('stronghold-feedback').hidden = true;
    } catch (err) {
      $('stronghold-feedback').textContent = err.message;
      $('stronghold-feedback').hidden = false;
      $('stronghold-resultado').hidden = true;
    }
  });

  $('btn-adicionar-stronghold')?.addEventListener('click', () => {
    if (!strongholdPendente) return;
    $('nome').value = 'Fortaleza do End (Stronghold)';
    $('coord-x').value = strongholdPendente.x;
    $('coord-y').value = strongholdPendente.y;
    $('coord-z').value = strongholdPendente.z;
    $('dimensao').value = 'Overworld';
    $('categoria').value = 'Outros';
    $('cor').value = '#a855f7';
    $('favorito').checked = true;
    strongholdModal.close();
    avisar('Coordenadas da Fortaleza inseridas no formulário! Clique em "Salvar Localização" para confirmar.');
    $('btn-submit').focus();
  });

  // Alternador de Visualização: Tabela vs Radar
  $('btn-view-table')?.addEventListener('click', () => {
    $('btn-view-table').classList.add('active');
    $('btn-view-table').setAttribute('aria-pressed', 'true');
    $('btn-view-radar').classList.remove('active');
    $('btn-view-radar').setAttribute('aria-pressed', 'false');
    document.querySelector('.table-container').hidden = false;
    if ($('pagination-container') && locaisCache.length > 25) $('pagination-container').hidden = false;
    $('radar-container').hidden = true;
  });

  $('btn-view-radar')?.addEventListener('click', () => {
    $('btn-view-radar').classList.add('active');
    $('btn-view-radar').setAttribute('aria-pressed', 'true');
    $('btn-view-table').classList.remove('active');
    $('btn-view-table').setAttribute('aria-pressed', 'false');
    document.querySelector('.table-container').hidden = true;
    if ($('pagination-container')) $('pagination-container').hidden = true;
    $('radar-container').hidden = false;
    if (radarInstancia) {
      radarInstancia.redimensionar();
      radarInstancia.centralizar();
    }
  });

  // Controles do Radar
  $('btn-radar-zoom-in')?.addEventListener('click', () => radarInstancia?.zoomIn());
  $('btn-radar-zoom-out')?.addEventListener('click', () => radarInstancia?.zoomOut());
  $('btn-radar-center')?.addEventListener('click', () => radarInstancia?.centralizar());

  // Modal Mods (Xaero & JourneyMap)
  $('btn-abrir-mods')?.addEventListener('click', () => {
    ultimoFoco = $('btn-abrir-mods');
    modsModal.showModal();
  });

  $('btn-export-xaero')?.addEventListener('click', () => {
    if (!window.MinecoordTools) return;
    const txt = window.MinecoordTools.exportarFormatoXaero(locaisCache);
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waypoints-xaero-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    avisar('Waypoints exportados no formato do Xaero’s Minimap!');
  });

  $('btn-export-journeymap')?.addEventListener('click', () => {
    if (!window.MinecoordTools) return;
    const json = window.MinecoordTools.exportarFormatoJourneyMap(locaisCache);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waypoints-journeymap-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    avisar('Waypoints exportados no formato do JourneyMap!');
  });

  // Busca e Ordenação
  searchInput.addEventListener('input', () => {
    paginaAtual = 1;
    if (carregou) filtrarERenderizarLocais();
  });

  atualizar.addEventListener('click', () => {
    feedback.hidden = true;
    carregarLocais();
  });

  $('btn-page-prev').addEventListener('click', () => {
    if (paginaAtual > 1) {
      paginaAtual--;
      filtrarERenderizarLocais();
    }
  });

  $('btn-page-next').addEventListener('click', () => {
    paginaAtual++;
    filtrarERenderizarLocais();
  });

  $('select-page-size').addEventListener('change', () => {
    paginaAtual = 1;
    filtrarERenderizarLocais();
  });

  const local = window.MinecoordStorage?.local;
  $('storage-mode').textContent = local ? 'Salvo neste navegador' : 'Salvo no servidor';
  $('storage-description').textContent = local
    ? 'Os pontos ficam neste navegador e neste caminho. Exporte um backup antes de mover a pasta ou limpar os dados.'
    : 'Seus pontos ficam na pasta de dados do servidor. Exporte um backup para levar para outro dispositivo.';

  for (const id of ['filtro-categoria', 'ordenacao']) $(id).addEventListener('change', () => {
    paginaAtual = 1;
    filtrarERenderizarLocais();
  });

  // Exportar Backup Padrão
  $('btn-exportar').addEventListener('click', async () => {
    try {
      const rows = await requisitar('/api/locais');
      const blob = new Blob([JSON.stringify({ formato: 'minecoord', versao: 2, exportadoEm: new Date().toISOString(), locais: rows }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `minecoord-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      avisar('Backup preparado. Confira o arquivo na pasta de downloads.');
    } catch (error) {
      avisar(error.message, true);
    }
  });

  // Importar Backup ou Waypoints de Mods
  $('btn-importar').addEventListener('click', () => $('arquivo-importar').click());
  $('arquivo-importar').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file || salvando) return;
    ocupado(true);
    $('btn-importar').disabled = true;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('O backup deve ter no máximo 5 MB.');
      const text = await file.text();

      // Verifica se é arquivo de mod (Xaero ou JourneyMap)
      if (window.MinecoordTools) {
        const modWaypoints = window.MinecoordTools.importarWaypointsMods(text);
        if (modWaypoints && modWaypoints.length > 0) {
          const rowsValidadas = window.MinecoordStorage.validar(modWaypoints);
          const result = await enviar('/api/locais/importar', 'POST', rowsValidadas);
          avisar(`${result.importados} waypoints de mod importados com sucesso!`);
          return;
        }
      }

      // Importação JSON padrão do minecoord
      const content = JSON.parse(text);
      const rows = window.MinecoordStorage.validar(Array.isArray(content) ? content : content.locais);
      const result = await enviar('/api/locais/importar', 'POST', rows);
      avisar(`${result.importados} pontos importados. Os pontos existentes foram preservados.`);
    } catch (error) {
      avisar(error instanceof SyntaxError ? 'Arquivo JSON inválido. Nenhum ponto foi importado.' : error.message, true);
    } finally {
      ocupado(false);
      $('btn-importar').disabled = false;
      event.target.value = '';
      await carregarLocais();
    }
  });

  window.addEventListener('storage', event => { if (local && event.key === 'minecoord.locais.v1') carregarLocais(); });

  registrarFormulario(form);
  registrarFormulario(formEditar, 'edit-');
  carregarLocais();
});
