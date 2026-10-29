const { chromium } = require('/home/gabriel/dev/littletec-studio/node_modules/playwright');
const path = require('node:path');
const fs = require('node:fs/promises');

async function gerarPreview() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1600 },
    deviceScaleFactor: 2 // Alta resolução nítida Retina
  });
  const page = await context.newPage();

  const filePath = 'file://' + path.resolve(__dirname, '../frontend/public/index.html');
  await page.goto(filePath, { waitUntil: 'networkidle' });

  // Popula localStorage com dados fictícios elegantes
  const pontosExemplo = [
    {
      id: 'ex-1',
      nome: 'Base Principal (Castelo)',
      x: 120,
      y: 68,
      z: -250,
      dimensao: 'Overworld',
      categoria: 'Base',
      mundo: 'Principal',
      cor: '#38bdf8',
      favorito: true,
      notas: 'Baú de diamantes, beacon nível 4 e sala de encantamento',
      criadoEm: '2026-10-25T14:00:00.000Z'
    },
    {
      id: 'ex-2',
      nome: 'Fortaleza do Nether (Blaze)',
      x: 15,
      y: 58,
      z: -31,
      dimensao: 'Nether',
      categoria: 'Portal',
      mundo: 'Principal',
      cor: '#ef4444',
      favorito: true,
      notas: 'Farm de varas de blaze e cabeças de wither skeleton',
      criadoEm: '2026-10-25T14:10:00.000Z'
    },
    {
      id: 'ex-3',
      nome: 'Vila dos Aldeões',
      x: 480,
      y: 71,
      z: 120,
      dimensao: 'Overworld',
      categoria: 'Vila',
      mundo: 'Principal',
      cor: '#f59e0b',
      favorito: false,
      notas: 'Ferreiro com armaduras e biblioteca Mending por 10 esmeraldas',
      criadoEm: '2026-10-25T14:20:00.000Z'
    },
    {
      id: 'ex-4',
      nome: 'Mega Mina de Diamantes',
      x: -210,
      y: -58,
      z: 64,
      dimensao: 'Overworld',
      categoria: 'Mina',
      mundo: 'Principal',
      cor: '#10b981',
      favorito: false,
      notas: 'Caverna aberta com ardósia profunda e fósseis',
      criadoEm: '2026-10-25T14:30:00.000Z'
    },
    {
      id: 'ex-5',
      nome: 'Portal do End (Stronghold)',
      x: 1240,
      y: 32,
      z: -880,
      dimensao: 'Overworld',
      categoria: 'Outros',
      mundo: 'Principal',
      cor: '#a855f7',
      favorito: false,
      notas: 'Triangulado com Olhos do Fim; portal ativo com 12 olhos',
      criadoEm: '2026-10-25T14:40:00.000Z'
    }
  ];

  await page.evaluate(dados => {
    localStorage.setItem('minecoord.locais.v1', JSON.stringify(dados));
    localStorage.setItem('minecoord.mundos.v1', JSON.stringify(['Principal', 'Hardcore 1.21', 'SMP dos Amigos']));
  }, pontosExemplo);

  // Recarrega a página para carregar o estado
  await page.reload({ waitUntil: 'networkidle' });

  // Define a posição do jogador para exibir os badges de bússola e distância
  await page.locator('#player-x').fill('100');
  await page.locator('#player-z').fill('-200');

  // Aguarda a renderização das linhas e dados
  await page.waitForSelector('.badge-distancia');
  await page.waitForTimeout(400);

  // Calcula bounding box exato do container principal da aplicação
  const appContainer = page.locator('.app-container');
  const box = await appContainer.boundingBox();

  const outputPath = path.resolve(__dirname, '../docs/assets/preview.png');
  await page.screenshot({
    path: outputPath,
    clip: {
      x: Math.max(0, box.x - 20),
      y: Math.max(0, box.y - 20),
      width: box.width + 40,
      height: box.height + 40
    }
  });

  console.log('Preview gerado com sucesso em:', outputPath);
  console.log('Dimensões:', box.width + 40, 'x', box.height + 40);

  await browser.close();
}

gerarPreview().catch(err => {
  console.error(err);
  process.exit(1);
});
