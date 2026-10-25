# minecoord

Localizador de coordenadas de Minecraft com Express e interface HTML/CSS/JavaScript. Organização inspirada no EletroProjeto, mantendo a stack e a interface existentes.

## Executar

Requer Node.js 18 ou superior e npm. Na primeira instalação, execute `npm ci`; as dependências existentes foram preservadas nesta reorganização.

```sh
cd /home/gabriel/dev/minecoord
npm start
```

Acesse http://127.0.0.1:3000. `npm run dev` habilita reinício do backend. Para outra porta, use `PORT=3001 npm start`. Para acesso pela rede, use `HOST=0.0.0.0 npm start`; a aplicação não possui autenticação. `.env.example` documenta as opções; arquivos `.env` não são carregados automaticamente.

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
npm run retomar
npm run checkpoint
npm run checkpoint:verify
```

Consulte [o estado atual](docs/CURRENT_STATE.md), [a arquitetura](docs/architecture.md) e [a continuidade](docs/continuity.md). Os checkpoints incluem os dados locais padrão. O código público fica em `thegodKoDDa/minecoord`; checkpoints e dados não são enviados ao GitHub.
