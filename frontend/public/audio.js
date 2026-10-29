/* =========================================================================
   Módulo de Áudio (Web Audio API) - Efeitos Sonoros Retrô estilo Minecraft
   Totalmente sintetizado em código, sem arquivos externos e com controle mudo.
   ========================================================================= */
(function (root) {
  'use strict';

  const STORAGE_KEY = 'minecoord.audio.ativo';
  let audioCtx = null;

  function obterContexto() {
    if (!audioCtx) {
      const AudioContextClass = root.AudioContext || root.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  const estado = {
    ativo: root.localStorage ? root.localStorage.getItem(STORAGE_KEY) !== 'false' : true,

    isAtivo() {
      return this.ativo;
    },

    toggle() {
      this.ativo = !this.ativo;
      try {
        if (root.localStorage) root.localStorage.setItem(STORAGE_KEY, String(this.ativo));
      } catch {}
      if (this.ativo) this.play('click');
      return this.ativo;
    },

    play(tipo) {
      if (!this.ativo) return;
      try {
        const ctx = obterContexto();
        if (!ctx) return;
        const agora = ctx.currentTime;

        if (tipo === 'click') {
          // Clique de botão de madeira
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320, agora);
          osc.frequency.exponentialRampToValueAtTime(120, agora + 0.04);
          gain.gain.setValueAtTime(0.2, agora);
          gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.04);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(agora);
          osc.stop(agora + 0.05);
        } else if (tipo === 'save' || tipo === 'xp') {
          // Som de experiência (chime ascendente agradável)
          const notas = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
          notas.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const inicio = agora + idx * 0.04;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, inicio);
            gain.gain.setValueAtTime(0.12, inicio);
            gain.gain.exponentialRampToValueAtTime(0.001, inicio + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(inicio);
            osc.stop(inicio + 0.16);
          });
        } else if (tipo === 'favorite') {
          // Brilho de estrela
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, agora);
          osc.frequency.exponentialRampToValueAtTime(1760, agora + 0.12);
          gain.gain.setValueAtTime(0.15, agora);
          gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.14);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(agora);
          osc.stop(agora + 0.15);
        } else if (tipo === 'delete') {
          // Thud suave ao remover
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(140, agora);
          osc.frequency.exponentialRampToValueAtTime(40, agora + 0.1);
          gain.gain.setValueAtTime(0.15, agora);
          gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(agora);
          osc.stop(agora + 0.13);
        } else if (tipo === 'teleport') {
          // Som místico de teletransporte
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(400, agora);
          osc.frequency.linearRampToValueAtTime(800, agora + 0.08);
          osc.frequency.linearRampToValueAtTime(250, agora + 0.2);
          gain.gain.setValueAtTime(0.15, agora);
          gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(agora);
          osc.stop(agora + 0.23);
        } else if (tipo === 'chest') {
          // Som de baú (duplo clique)
          [0, 0.06].forEach((delay, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = agora + delay;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(idx === 0 ? 180 : 260, t);
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.09);
          });
        }
      } catch {
        // Silencioso se o navegador bloquear ou não tiver áudio
      }
    }
  };

  root.MinecoordAudio = estado;
})(typeof window !== 'undefined' ? window : globalThis);
