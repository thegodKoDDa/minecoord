// Runner opcional: usa uma instalação de Playwright indicada sem alterar dependências da aplicação.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

async function main() {
  let chromium;
  try { ({ chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')); }
  catch { throw new Error('Indique uma instalação de Playwright com PLAYWRIGHT_MODULE para executar o teste de navegador.'); }
  const root = path.resolve(__dirname, '..');
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'minecoord-browser-'));
  const server = spawn(process.execPath, ['backend/src/server.js'], {
    cwd: root, env: { ...process.env, DATA_DIR: directory, PORT: '0', HOST: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe']
  });
  let browser;
  try {
    const base = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Servidor de teste não iniciou.')), 10000);
      server.stdout.on('data', chunk => {
        const match = chunk.toString().match(/http:\/\/127\.0\.0\.1:\d+/);
        if (match) { clearTimeout(timeout); resolve(match[0]); }
      });
      server.once('exit', code => { clearTimeout(timeout); reject(new Error(`Servidor encerrou: ${code}`)); });
      server.once('error', error => { clearTimeout(timeout); reject(error); });
    });
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Fontes externas não são necessárias à verificação; evita depender da rede.
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.route('https://fonts.gstatic.com/**', route => route.abort());
    await page.goto(base);
    await page.getByText('0 de 0 pontos', { exact: true }).waitFor();
    await page.locator('#btn-submit').click();
    assert.equal(await page.locator('#nome').getAttribute('aria-invalid'), 'true');
    assert.equal(await page.locator('#nome').evaluate(element => document.activeElement === element), true);
    await page.locator('#nome').fill('Vila do Coração');
    await page.locator('#coord-x').fill('-80');
    await page.locator('#coord-y').fill('64');
    await page.locator('#coord-z').fill('160');
    await page.locator('#dimensao').selectOption('Overworld');
    await page.locator('#categoria').selectOption('Vila');
    await page.locator('#notas').fill('Perto do ferreiro');
    // Atrasa a resposta para conferir proteção contra submissões repetidas.
    await page.route('**/api/locais', async route => {
      if (route.request().method() === 'POST') {
        const response = await route.fetch();
        await new Promise(resolve => setTimeout(resolve, 250));
        await route.fulfill({ response });
      } else await route.continue();
    });
    await page.locator('#btn-submit').click();
    await page.waitForFunction(() => document.querySelector('#btn-submit').disabled);
    await page.locator('#form-coordenada').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await page.getByText('1 de 1 ponto', { exact: true }).waitFor();
    assert.equal(await page.locator('.local-nome').count(), 1);
    assert.match(await page.locator('.local-notas').innerText(), /Perto do ferreiro/);
    assert.match(await page.locator('.portal-calc-coords').innerText(), /X: -10, Z: 20/);
    await page.locator('.btn-copy-portal').click();
    await page.locator('#feedback').filter({ hasText: '/tp @s -10 ~ 20' }).waitFor();

    // Testa ação F3+C via diálogo de colagem
    await page.locator('#btn-colar-f3c').click();
    await page.locator('#f3c-texto').fill('/execute in minecraft:the_nether run tp @s 100 70 -50 0 0');
    await page.locator('#btn-confirmar-f3c').click();
    assert.equal(await page.locator('#coord-x').inputValue(), '100');
    assert.equal(await page.locator('#coord-y').inputValue(), '70');
    assert.equal(await page.locator('#coord-z').inputValue(), '-50');
    assert.equal(await page.locator('#dimensao').inputValue(), 'Nether');
    await page.locator('#form-coordenada').evaluate(form => form.reset());
    await page.locator('#search-input').fill('coracao');
    assert.equal(await page.locator('.local-nome').count(), 1);
    await page.locator('[data-filter="Nether"]').click();
    await page.getByText('Nenhum ponto corresponde', { exact: false }).waitFor();
    assert.equal(await page.locator('[data-filter="Nether"]').getAttribute('aria-pressed'), 'true');
    await page.locator('[data-filter="Todos"]').click();
    await page.locator('#search-input').fill('');
    await page.getByRole('button', { name: 'Editar Vila do Coração', exact: true }).click();
    assert.equal(await page.locator('#edit-nome').evaluate(element => document.activeElement === element), true);
    for (let index = 0; index < 12; index++) {
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.querySelector('#edit-modal').contains(document.activeElement)), true);
    }
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#edit-modal').evaluate(element => element.open), false);
    await page.getByRole('button', { name: 'Editar Vila do Coração', exact: true }).click();
    await page.locator('#edit-nome').fill('<img src=x onerror=alert(1)>');
    await page.locator('#btn-salvar-edicao').click();
    await page.getByText('<img src=x onerror=alert(1)>', { exact: true }).waitFor();
    assert.equal(await page.locator('#tabela-corpo img').count(), 0);
    await page.waitForFunction(() => !document.querySelector('#btn-atualizar').disabled);
    await page.locator('.btn-edit').click();
    // Erro ao salvar permanece visível dentro do diálogo e preserva o formulário.
    await page.route('**/api/locais/*', route => route.request().method() === 'PUT'
      ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Edição indisponível no teste.' }) })
      : route.continue());
    await page.locator('#edit-nome').fill('Nome preservado');
    await page.locator('#btn-salvar-edicao').click();
    await page.locator('#edit-feedback').filter({ hasText: 'Edição indisponível' }).waitFor();
    assert.equal(await page.locator('#edit-nome').inputValue(), 'Nome preservado');
    assert.equal(await page.locator('#edit-modal').evaluate(element => element.open), true);
    await page.waitForFunction(() => !document.querySelector('#btn-salvar-edicao').disabled);
    await page.unroute('**/api/locais/*');
    await page.locator('#edit-nome').fill('Portal da Vila');
    await page.locator('#btn-salvar-edicao').click();
    await page.getByText('Portal da Vila', { exact: true }).waitFor();
    await page.waitForFunction(() => !document.querySelector('#btn-atualizar').disabled);
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }));
    await page.locator('.btn-copy').click();
    await page.locator('#feedback').filter({ hasText: '/tp @s -80 64 160' }).waitFor();
    await fs.mkdir(path.join(root, '.artifacts'), { recursive: true });
    await page.screenshot({ path: path.join(root, '.artifacts/desktop.png'), fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);

    if (process.env.AXE_MODULE) {
      const { default: AxeBuilder } = require(process.env.AXE_MODULE);
      const results = await new AxeBuilder({ page }).analyze();
      assert.deepEqual(results.violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(node => node.target) })), []);
      console.log('Acessibilidade automatizada: sem violações na tela principal.');
    }
    for (const width of [320, 768, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Largura ${width}`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: path.join(root, '.artifacts/mobile.png'), fullPage: true });
    await page.locator('.btn-edit').click();
    assert.equal(await page.locator('#edit-modal').evaluate(element => element.getBoundingClientRect().height < innerHeight), true);
    await page.screenshot({ path: path.join(root, '.artifacts/mobile-edit.png') });
    if (process.env.AXE_MODULE) {
      const { default: AxeBuilder } = require(process.env.AXE_MODULE);
      const results = await new AxeBuilder({ page }).analyze();
      assert.deepEqual(results.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) })), []);
      console.log('Acessibilidade automatizada: sem violações no diálogo em celular.');
    }
    await page.keyboard.press('Escape');
    await page.locator('.btn-delete').click();
    assert.equal(await page.locator('#btn-cancelar-exclusao').evaluate(element => document.activeElement === element), true);
    await page.locator('#btn-cancelar-exclusao').click();
    assert.equal(await page.locator('.local-nome').count(), 1);
    await page.locator('.btn-delete').click();
    await page.locator('#btn-confirmar-exclusao').click();
    await page.getByText('0 de 0 pontos', { exact: true }).waitFor();
    await page.waitForFunction(() => !document.querySelector('#btn-atualizar').disabled);
    await page.reload();
    await page.getByText('0 de 0 pontos', { exact: true }).waitFor();

    // Falha inicial e recuperação pelo botão da própria interface.
    await page.route('**/api/locais', route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Falha simulada no teste.' }) }));
    await page.reload();
    await page.getByText('Lista indisponível', { exact: true }).waitFor();
    await page.locator('#feedback').filter({ hasText: 'Falha simulada' }).waitFor();
    await page.unroute('**/api/locais');
    await page.locator('#btn-atualizar').click();
    await page.getByText('0 de 0 pontos', { exact: true }).waitFor();
    // Abrir o index da raiz sem servidor: CRUD, reload e transporte de backup.
    await page.goto('file://' + path.join(root, 'index.html'));
    await page.getByText('Salvo neste navegador', { exact: true }).waitFor();
    await page.locator('#nome').fill('Base offline');
    for (const [axis, value] of [['x', '80'], ['y', '64'], ['z', '-160']]) await page.locator('#coord-' + axis).fill(value);
    await page.locator('#dimensao').selectOption('Overworld');
    await page.locator('#categoria').selectOption('Base');
    await page.locator('#btn-submit').click();
    await page.getByText('Base offline', { exact: true }).waitFor();
    await page.reload();
    await page.getByText('Base offline', { exact: true }).waitFor();
    const secondTab = await context.newPage();
    await secondTab.goto(page.url());
    const blocked = await secondTab.evaluate(async () => {
      try {
        await window.MinecoordStorage.request('/api/locais', { method: 'POST', body: '{}' });
        return false;
      } catch (error) { return error.message.includes('Outra aba'); }
    });
    assert.equal(blocked, true);
    assert.equal((await page.evaluate(() => window.MinecoordStorage.request('/api/locais'))).length, 1);
    await secondTab.close();
    await page.reload();
    await page.getByText('Base offline', { exact: true }).waitFor();
    const downloadEvent = page.waitForEvent('download');
    await page.locator('#btn-exportar').click();
    const download = await downloadEvent;
    const exported = JSON.parse(await fs.readFile(await download.path(), 'utf8'));
    assert.equal(exported.locais[0].nome, 'Base offline');
    await page.locator('#arquivo-importar').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) });
    await page.getByText('2 de 2 pontos', { exact: true }).waitFor();
    await page.locator('#filtro-categoria').selectOption('Farm');
    await page.getByText('0 de 2 pontos', { exact: true }).waitFor();
    await page.locator('#filtro-categoria').selectOption('');
    await page.locator('.btn-edit').first().click();
    await page.locator('#edit-nome').fill('Base editada offline');
    await page.locator('#btn-salvar-edicao').click();
    await page.getByText('Base editada offline', { exact: true }).waitFor();
    await page.locator('.btn-delete').first().click();
    await page.locator('#btn-confirmar-exclusao').click();
    await page.getByText('1 de 1 ponto', { exact: true }).waitFor();
    assert.deepEqual(errors, []);
    console.log('Navegador: cadastro, duplo envio, busca, filtros, edição, teclado, exclusão, cópia alternativa, XSS, recuperação e layouts aprovados.');
    console.log('Capturas locais: .artifacts/desktop.png, mobile.png e mobile-edit.png');
  } finally {
    if (browser) await browser.close();
    if (server.exitCode === null) { const closed = once(server, 'exit'); server.kill('SIGTERM'); await closed; }
    await fs.rm(directory, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
