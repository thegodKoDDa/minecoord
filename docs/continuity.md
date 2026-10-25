# Continuidade e recuperação

## Rotina

1. Retomar: ler CURRENT_STATE e PROJECT_MEMORY; executar `npm run retomar` para conferir instalações presentes, listas JSON padrão e último checkpoint.
2. Trabalhar: preservar dados e executar verificações proporcionais. `npm run check` verifica sintaxe; `npm test` verifica HTTP e persistência isolada; `npm run test:continuity` testa recuperação e exclusões. O teste opcional de navegador é descrito no README.
3. Encerrar: atualizar estado/histórico e executar `npm run checkpoint`. Conferir o resultado; `npm run checkpoint:verify` repete a restauração temporária.

O script não inicia serviços nem consulta GitHub. Não há sincronização remota ou automação de fundo. Não executar checkpoint durante gravações na aplicação: arquivos JSON são capturados individualmente.

## Conteúdo e verificação

`.checkpoints/before-organization.tar.gz` preserva os arquivos originais antes da mudança de estrutura. Exclui somente dependências e a própria pasta de checkpoints.

Os novos pontos contêm `source.zip` com código, documentação e dados padrão, além de `manifest.json` com hashes SHA-256. São extraídos para diretório temporário; inventário, hashes e estrutura de lista dos JSONs são conferidos antes de atualizar `.checkpoints/latest.json`. Checkpoint incompleto não substitui o ponteiro anterior. Dependências, Git, caches, capturas `.artifacts/` e configurações `.env` privadas ficam fora do ZIP. Diretórios excluídos não são percorridos e links simbólicos não são capturados. Os pontos e arquivos novos recebem permissões privadas.

`DATA_DIR` externo não entra no checkpoint. A rotina de retomada inspeciona somente `data/`. Dependências são recuperadas com `npm ci`; variáveis e dados externos requerem cópia própria. Checkpoints estão no mesmo disco e não são cópia externa.

## Recuperar sem sobrescrever

Execute `npm run checkpoint:verify`. Leia `latest.json`, abra o `source.zip` do ponto indicado e extraia para uma pasta nova. Confira os JSONs e instale dependências pelo lock nessa cópia, se necessário. Inicie em outra porta para validar. Preserve a pasta atual e os checkpoints antes de escolher a cópia recuperada.

Para o estado anterior à reorganização, extraia `before-organization.tar.gz` em pasta nova; ele usa os caminhos originais (`public/`, `server.js` e JSONs na raiz).
