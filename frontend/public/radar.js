/* =========================================================================
   Módulo de Radar 2D Interativo (HTML5 Canvas)
   Visualização cartográfica top-down dos pontos no plano X/Z com pan e zoom.
   ========================================================================= */
(function (root) {
  'use strict';

  function criarRadar(canvasId, opcoes = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');

    let pontos = [];
    let dimensaoAtiva = 'Todos';
    let posicaoJogador = null; // { x, z }
    let pontoSelecionado = null;

    // Estado da câmera (coordenadas do mundo no centro da tela e escala em pixels/bloco)
    let centroX = 0;
    let centroZ = 0;
    let escala = 0.5; // 1 bloco = 0.5px
    let arrastando = false;
    let ultimoMouseX = 0;
    let ultimoMouseY = 0;

    function redimensionar() {
      const rect = canvas.getBoundingClientRect();
      const dpr = root.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      desenhar();
    }

    function mundoParaTela(x, z) {
      const rect = canvas.getBoundingClientRect();
      const telaX = rect.width / 2 + (x - centroX) * escala;
      const telaY = rect.height / 2 + (z - centroZ) * escala;
      return { x: telaX, y: telaY };
    }

    function telaParaMundo(telaX, telaY) {
      const rect = canvas.getBoundingClientRect();
      const x = (telaX - rect.width / 2) / escala + centroX;
      const z = (telaY - rect.height / 2) / escala + centroZ;
      return { x, z };
    }

    function desenhar() {
      const rect = canvas.getBoundingClientRect();
      const largura = rect.width;
      const altura = rect.height;

      // Fundo escuro premium
      ctx.fillStyle = '#0d0e12';
      ctx.fillRect(0, 0, largura, altura);

      // Grade sutil (calcula passo da grade baseado no zoom)
      let passoMundo = 500;
      if (escala > 2) passoMundo = 50;
      else if (escala > 0.8) passoMundo = 100;
      else if (escala < 0.1) passoMundo = 2000;
      else if (escala < 0.02) passoMundo = 10000;

      const minMundo = telaParaMundo(0, 0);
      const maxMundo = telaParaMundo(largura, altura);

      ctx.strokeStyle = '#1d1e27';
      ctx.lineWidth = 1;
      ctx.beginPath();

      const inicioX = Math.floor(minMundo.x / passoMundo) * passoMundo;
      for (let gx = inicioX; gx <= maxMundo.x; gx += passoMundo) {
        const p = mundoParaTela(gx, 0);
        ctx.moveTo(p.x, 0);
        ctx.lineTo(p.x, altura);
      }
      const inicioZ = Math.floor(minMundo.z / passoMundo) * passoMundo;
      for (let gz = inicioZ; gz <= maxMundo.z; gz += passoMundo) {
        const p = mundoParaTela(0, gz);
        ctx.moveTo(0, p.y);
        ctx.lineTo(largura, p.y);
      }
      ctx.stroke();

      // Eixos principais (X = 0 e Z = 0)
      const origem = mundoParaTela(0, 0);
      ctx.strokeStyle = '#272936';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, origem.y);
      ctx.lineTo(largura, origem.y);
      ctx.moveTo(origem.x, 0);
      ctx.lineTo(origem.x, altura);
      ctx.stroke();

      // Rótulos de coordenadas no canto
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText(`Zoom: ${(escala * 100).toFixed(0)}% · 1 quadrado = ${passoMundo} blocos`, 12, altura - 14);

      // Pontos visíveis
      const filtrados = pontos.filter(p => dimensaoAtiva === 'Todos' || p.dimensao === dimensaoAtiva);

      // Linha entre jogador e pontos se jogador estiver definido
      if (posicaoJogador) {
        const posJ = mundoParaTela(posicaoJogador.x, posicaoJogador.z);
        filtrados.forEach(p => {
          if (p.dimensao === 'Overworld') {
            const telaP = mundoParaTela(p.x, p.z);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(posJ.x, posJ.y);
            ctx.lineTo(telaP.x, telaP.y);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        });
      }

      // Desenhar pontos
      filtrados.forEach(p => {
        const pos = mundoParaTela(p.x, p.z);
        if (pos.x < -30 || pos.x > largura + 30 || pos.y < -30 || pos.y > altura + 30) return;

        const isSelecionado = pontoSelecionado && pontoSelecionado.id === p.id;
        const raio = isSelecionado ? 8 : 6;

        let cor = p.cor || '#38bdf8';
        if (!p.cor) {
          if (p.dimensao === 'Nether') cor = '#f87171';
          else if (p.dimensao === 'End') cor = '#c084fc';
          else if (p.dimensao === 'The Sift') cor = '#f472b6';
          else cor = '#34d399';
        }

        // Halo de destaque
        if (isSelecionado || p.favorito) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, raio + 5, 0, Math.PI * 2);
          ctx.fillStyle = p.favorito ? 'rgba(245, 158, 11, 0.25)' : 'rgba(56, 189, 248, 0.25)';
          ctx.fill();
        }

        // Ponto principal
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, raio, 0, Math.PI * 2);
        ctx.fillStyle = cor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Rótulo de texto do ponto
        ctx.font = isSelecionado ? 'bold 12px sans-serif' : '11px sans-serif';
        ctx.fillStyle = isSelecionado ? '#ffffff' : '#e2e8f0';
        const txt = (p.favorito ? '⭐ ' : '') + p.nome;
        ctx.fillText(txt, pos.x + raio + 4, pos.y + 4);
      });

      // Desenhar marcador do Jogador
      if (posicaoJogador) {
        const pos = mundoParaTela(posicaoJogador.x, posicaoJogador.z);
        // Pulso
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.fill();

        // Ponto vermelho (jogador)
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#f87171';
        ctx.fillText('Você', pos.x + 8, pos.y + 4);
      }
    }

    // Eventos de mouse e toque
    canvas.addEventListener('mousedown', e => {
      arrastando = true;
      ultimoMouseX = e.clientX;
      ultimoMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => { arrastando = false; });

    canvas.addEventListener('mousemove', e => {
      if (arrastando) {
        const dx = e.clientX - ultimoMouseX;
        const dy = e.clientY - ultimoMouseY;
        centroX -= dx / escala;
        centroZ -= dy / escala;
        ultimoMouseX = e.clientX;
        ultimoMouseY = e.clientY;
        desenhar();
        return;
      }

      // Hover sobre pontos
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const mundo = telaParaMundo(mouseX, mouseY);

      let encontrado = null;
      for (const p of pontos) {
        if (dimensaoAtiva !== 'Todos' && p.dimensao !== dimensaoAtiva) continue;
        const distTela = Math.hypot(p.x - mundo.x, p.z - mundo.z) * escala;
        if (distTela <= 12) {
          encontrado = p;
          break;
        }
      }

      if (encontrado !== pontoSelecionado) {
        pontoSelecionado = encontrado;
        canvas.style.cursor = encontrado ? 'pointer' : 'grab';
        desenhar();
        if (opcoes.aoSelecionar) opcoes.aoSelecionar(pontoSelecionado);
      }
    });

    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const fator = e.deltaY < 0 ? 1.2 : 0.833;
      escala = Math.max(0.005, Math.min(10, escala * fator));
      desenhar();
    }, { passive: false });

    // Centralizar visualização em todos os pontos
    function centralizar() {
      const visiveis = pontos.filter(p => dimensaoAtiva === 'Todos' || p.dimensao === dimensaoAtiva);
      if (!visiveis.length) {
        centroX = 0;
        centroZ = 0;
        escala = 0.5;
        desenhar();
        return;
      }
      const xs = visiveis.map(p => p.x);
      const zs = visiveis.map(p => p.z);
      if (posicaoJogador) {
        xs.push(posicaoJogador.x);
        zs.push(posicaoJogador.z);
      }
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minZ = Math.min(...zs), maxZ = Math.max(...zs);
      centroX = (minX + maxX) / 2;
      centroZ = (minZ + maxZ) / 2;

      const rect = canvas.getBoundingClientRect();
      const spanX = Math.max(200, maxX - minX + 200);
      const spanZ = Math.max(200, maxZ - minZ + 200);
      escala = Math.min(rect.width / spanX, rect.height / spanZ, 2);
      desenhar();
    }

    window.addEventListener('resize', redimensionar);
    redimensionar();

    return {
      atualizar(novosPontos, dim = 'Todos') {
        pontos = novosPontos || [];
        dimensaoAtiva = dim;
        desenhar();
      },
      definirJogador(pos) {
        posicaoJogador = pos;
        desenhar();
      },
      centralizar,
      zoomIn() { escala = Math.min(10, escala * 1.3); desenhar(); },
      zoomOut() { escala = Math.max(0.005, escala / 1.3); desenhar(); },
      redimensionar
    };
  }

  root.MinecoordRadar = { criarRadar };
})(typeof window !== 'undefined' ? window : globalThis);
