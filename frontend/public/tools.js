/* =========================================================================
   Módulo de Ferramentas e Utilitários de Minecraft
   Triangulação de Stronghold, Bússola/Distâncias e Compatibilidade de Mods
   ========================================================================= */
(function (root) {
  'use strict';

  // Triangulação matemática para achar a fortaleza do End com 2 Olhos do Fim
  function triangularStronghold(ponto1, ponto2) {
    const x1 = Number(ponto1.x), z1 = Number(ponto1.z), ang1 = Number(ponto1.angulo);
    const x2 = Number(ponto2.x), z2 = Number(ponto2.z), ang2 = Number(ponto2.angulo);

    if (![x1, z1, ang1, x2, z2, ang2].every(Number.isFinite)) {
      throw new Error('Informe X, Z e o ângulo (Yaw) dos dois lançamentos.');
    }

    const rad1 = (ang1 * Math.PI) / 180;
    const rad2 = (ang2 * Math.PI) / 180;

    // No Minecraft: Yaw 0 = Sul (+Z), 180 = Norte (-Z), -90 = Leste (+X), 90 = Oeste (-X)
    const dx1 = -Math.sin(rad1);
    const dz1 = Math.cos(rad1);
    const dx2 = -Math.sin(rad2);
    const dz2 = Math.cos(rad2);

    const det = dx1 * dz2 - dz1 * dx2;
    if (Math.abs(det) < 0.0001) {
      throw new Error('As retas são paralelas. Desloque-se pelo menos 150 blocos para o lado antes de fazer o segundo lançamento.');
    }

    // Interseção de duas retas paramétricas:
    // P1 + t1 * d1 = P2 + t2 * d2
    const t1 = ((x2 - x1) * dz2 - (z2 - z1) * dx2) / det;
    const xInter = x1 + t1 * dx1;
    const zInter = z1 + t1 * dz1;

    return {
      x: Math.round(xInter),
      y: 32, // Altura média estimada da fortaleza
      z: Math.round(zInter)
    };
  }

  // Cálculo de distância euclidiana e direção cardeal no plano X/Z
  function calcularDistanciaEBussola(posAtual, ponto) {
    if (!posAtual || !Number.isFinite(posAtual.x) || !Number.isFinite(posAtual.z)) return null;
    const dx = ponto.x - posAtual.x;
    const dz = ponto.z - posAtual.z;
    const distancia = Math.round(Math.hypot(dx, dz));

    // Ângulo em relação ao Norte (Z decrescente é Norte no Minecraft)
    let angulo = (Math.atan2(dx, -dz) * 180) / Math.PI;
    if (angulo < 0) angulo += 360;

    const direcoes = [
      { nome: 'Norte', seta: '⬆️' },
      { nome: 'Nordeste', seta: '↗️' },
      { nome: 'Leste', seta: '➡️' },
      { nome: 'Sudeste', seta: '↘️' },
      { nome: 'Sul', seta: '⬇️' },
      { nome: 'Sudoeste', seta: '↙️' },
      { nome: 'Oeste', seta: '⬅️' },
      { nome: 'Noroeste', seta: '↖️' }
    ];
    const indice = Math.round(angulo / 45) % 8;
    return {
      distancia,
      direcao: direcoes[indice].nome,
      seta: direcoes[indice].seta
    };
  }

  // Formatação de texto para Discord / WhatsApp
  function formatarCompartilhamento(local) {
    const dimEmoji = { Overworld: '🌲', Nether: '🔥', End: '🌌', 'The Sift': '🌀' }[local.dimensao] || '📍';
    const notas = local.notas ? `\n> 📝 *${local.notas}*` : '';
    return `📍 **${local.nome}** (${dimEmoji} ${local.dimensao})
🗺️ Coordenadas: **X:** \`${local.x}\`, **Y:** \`${local.y}\`, **Z:** \`${local.z}\`
💬 Comando: \`/tp @s ${local.x} ${local.y} ${local.z}\`${notas}`;
  }

  // Exportação compatível com Xaero's Minimap
  function exportarFormatoXaero(locais) {
    const linhas = ['# Xaero\'s Minimap Waypoints exportados via minecoord'];
    locais.forEach(local => {
      const inicial = local.nome.trim().charAt(0).toUpperCase() || 'P';
      const cor = local.cor ? Math.abs(parseInt(local.cor.replace('#', ''), 16)) % 16 : 2;
      // Formato oficial do Xaero: waypoint:nome:initials:x:y:z:color:disabled:type:set:rotate_on_tp:tp_yaw:visibility_type
      linhas.push(`waypoint:${local.nome.replace(/:/g, '_')}:${inicial}:${local.x}:${local.y}:${local.z}:${cor}:false:0:gui.xaero_default:false:0:0`);
    });
    return linhas.join('\n');
  }

  // Exportação compatível com JourneyMap
  function exportarFormatoJourneyMap(locais) {
    const jmWaypoints = locais.map(local => {
      let dimId = 0;
      if (local.dimensao === 'Nether') dimId = -1;
      else if (local.dimensao === 'End') dimId = 1;

      return {
        id: local.id || `minecoord_${local.x}_${local.y}_${local.z}`,
        name: local.nome,
        icon: 'waypoint-normal.png',
        x: local.x,
        y: local.y,
        z: local.z,
        r: 56, g: 189, b: 248,
        enable: true,
        type: 'Normal',
        origin: 'minecoord',
        dimensions: [dimId]
      };
    });
    return JSON.stringify(jmWaypoints, null, 2);
  }

  // Parser para ler formatos de mods (Xaero ou JourneyMap)
  function importarWaypointsMods(texto) {
    if (typeof texto !== 'string' || !texto.trim()) return null;
    const limpo = texto.trim();

    // Tenta formato JourneyMap (JSON com array de objetos contendo x, y, z)
    if (limpo.startsWith('[') || limpo.startsWith('{')) {
      try {
        const json = JSON.parse(limpo);
        const lista = Array.isArray(json) ? json : [json];
        const encontrados = [];
        for (const item of lista) {
          if (item && item.name && Number.isFinite(Number(item.x)) && Number.isFinite(Number(item.z))) {
            let dim = 'Overworld';
            if (Array.isArray(item.dimensions)) {
              if (item.dimensions.includes(-1)) dim = 'Nether';
              else if (item.dimensions.includes(1)) dim = 'End';
            }
            encontrados.push({
              nome: String(item.name).trim(),
              x: Number(item.x),
              y: Number.isFinite(Number(item.y)) ? Number(item.y) : 64,
              z: Number(item.z),
              dimensao: dim,
              categoria: 'Outros'
            });
          }
        }
        if (encontrados.length) return encontrados;
      } catch {}
    }

    // Tenta formato Xaero's Minimap (linhas começando com waypoint:)
    const linhas = limpo.split('\n');
    const waypointsXaero = [];
    for (const linha of linhas) {
      const partes = linha.trim().split(':');
      if (partes[0] === 'waypoint' && partes.length >= 7) {
        const nome = partes[1].replace(/_/g, ' ');
        const x = Number(partes[3]);
        const y = Number(partes[4]);
        const z = Number(partes[5]);
        if (nome && Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
          waypointsXaero.push({
            nome, x, y, z,
            dimensao: 'Overworld',
            categoria: 'Outros'
          });
        }
      }
    }
    if (waypointsXaero.length) return waypointsXaero;

    return null;
  }

  root.MinecoordTools = {
    triangularStronghold,
    calcularDistanciaEBussola,
    formatarCompartilhamento,
    exportarFormatoXaero,
    exportarFormatoJourneyMap,
    importarWaypointsMods
  };
})(typeof window !== 'undefined' ? window : globalThis);
