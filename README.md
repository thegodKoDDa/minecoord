# minecoord

Localizador de coordenadas de Minecraft com Express e interface HTML/CSS/JavaScript. Organização inspirada no EletroProjeto, mantendo a stack e a interface existentes.

## Executar

Requer Node.js 18 ou superior e npm. Na primeira instalação, execute `npm ci`; as dependências existentes foram preservadas nesta reorganização.

```sh
cd /home/gabriel/dev/minecoord
npm start
```

Acesse http://127.0.0.1:3000. `npm run dev` habilita reinício do backend. Para outra porta, use `PORT=3001 npm start`. Para acesso pela rede, use `HOST=0.0.0.0 npm start`; a aplicação não possui autenticação. `.env.example` documenta as opções; arquivos `.env` não são carregados automaticamente.

## O que foi lapidado na versão 1.1

A identidade original permanece: tema escuro, cores das dimensões, formulário, tabela e calculadora de portais. No celular, os mesmos pontos aparecem em blocos com ações acessíveis. Busca ignora acentos, a lista mostra contagens e permite atualização manual; erros e confirmações aparecem na página.

Gravações são serializadas dentro do processo e substituem o JSON por renomeação de um arquivo temporário sincronizado. O backup anterior é obrigatório antes de substituir um arquivo existente. Novos IDs usam UUID; IDs e registros antigos permanecem válidos. Números vazios, tipos indevidos e entradas não finitas são rejeitados.

Execute **uma única instância por pasta de dados**. A fila é local ao processo; várias instâncias compartilhando DATA_DIR não são suportadas. Os limites aceitos continuam X/Z de ±30.000.000 e Y de -64 a 320; são a política atual do aplicativo. Dados históricos fora desses limites são preservados e precisam ser ajustados pelo usuário para salvar uma edição.

## Estrutura

| Caminho | Responsabilidade |
| --- | --- |
| `backend/src/app.js` | Aplicação Express e arquivos estáticos |
| `backend/src/server.js` | Inicialização HTTP |
| `backend/src/routes/` | Rotas da API |
| `backend/src/services/` | Leitura, gravação e backup JSON |
| `backend/src/validation/` | Validação dos locais |
| `frontend/public/` | Interface preservada |
| `data/` | Coordenadas e backup privados, ignorados pelo Git |
| `tests/` | Teste HTTP com dados temporários |
| `scripts/` | Verificação e continuidade local |
| `docs/` | Estado, memória, arquitetura e histórico |
| `.checkpoints/` | Recuperação local, ignorada pelo Git |

`node server.js` continua funcionando como entrada compatível. As URLs da interface e da API não mudaram. O nome da pasta antiga `Minecoord` mudou para `minecoord`; atalhos externos precisam usar o caminho atual.

## Verificar e continuar

```sh
npm run check
npm test
npm run test:continuity
npm run retomar
npm run checkpoint
npm run checkpoint:verify
```

Consulte [o estado atual](docs/CURRENT_STATE.md), [a arquitetura](docs/architecture.md) e [a continuidade](docs/continuity.md). Os checkpoints incluem os dados locais padrão. O código público fica em `thegodKoDDa/minecoord`; checkpoints e dados não são enviados ao GitHub.

O teste opcional de navegador usa uma instalação de Playwright com Chromium disponível. Execute `PLAYWRIGHT_MODULE=/caminho/para/playwright npm run test:e2e`; se Playwright estiver instalado no projeto, basta `npm run test:e2e`. `AXE_MODULE=/caminho/para/@axe-core/playwright` habilita a análise de acessibilidade. Não há dependência nova de execução. Capturas de teste ficam em `.artifacts/`, ignorada pelo Git e pelos checkpoints.
