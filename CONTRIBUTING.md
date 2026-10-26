# Contribuir

Para relatar um problema, abra uma issue com os passos para reproduzir, o resultado esperado e o navegador ou versão do Node.js usados. Use dados fictícios em exemplos e capturas.

## Preparar o projeto

```sh
npm ci
npm run dev
```

O backend usa Express/CommonJS e o frontend é estático, sem build. Preserve as rotas existentes e os formatos dos arquivos de dados.

## Validar uma alteração

```sh
npm run check
npm test
npm run test:continuity
```

Testes da API devem usar um `DATA_DIR` temporário. Não inclua coordenadas pessoais, backups, credenciais, dependências ou checkpoints em commits.

O teste opcional de navegador requer Playwright com Chromium disponível:

```sh
PLAYWRIGHT_MODULE=/caminho/para/playwright npm run test:e2e
```

Se Playwright estiver instalado no projeto, execute `npm run test:e2e`. A variável opcional `AXE_MODULE` aponta para uma instalação de `@axe-core/playwright` e habilita a análise de acessibilidade. Capturas ficam em `.artifacts/`, ignorada pelo Git.

Envie um pull request descrevendo o problema, a alteração e as verificações executadas. Atualize a documentação afetada e o changelog quando houver mudança de comportamento.
