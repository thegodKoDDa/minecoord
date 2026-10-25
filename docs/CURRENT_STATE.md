# Estado atual — 2026-10-25

Versão 1.2.0: atlas local e servidor. Express/CommonJS, frontend sem build e contratos CRUD preservados.

Abra index.html na raiz após extrair o ZIP para usar sem servidor: localStorage com cópia anterior obrigatória. Modo HTTP usa exclusivamente a API; sem fallback silencioso. Dados separados por modo. Exportação JSON e importação aditiva (5 MB / 10.000 pontos), novos IDs, validação integral antes da gravação. Alturas legadas preservadas na importação; edição mantém política herdada.

Interface com resumo por dimensão, filtro de categoria, ordenação e painel de armazenamento/backups. Tema escuro e cores das dimensões preservados. Fontes do sistema; sem chamadas externas obrigatórias.

Verificações: sete testes Node, três testes de continuidade, sintaxe, Chromium em 320–1440 px, axe sem violações nos cenários principal e modal. Modo file validado com CRUD, reload, exportação/importação e filtros. Auditoria npm sem vulnerabilidades após atualizações compatíveis.

Dados reais e backup comparados com o checkpoint anterior: idênticos byte a byte. Entrega 1.2 publicada na branch main de thegodKoDDa/minecoord a pedido do usuário. Dados, backups, credenciais e checkpoints continuam locais. Documentação e instruções de abertura pelo ZIP atualizadas. Ao retomar, executar npm run retomar e iniciar o servidor com npm start se necessário.

Limitações: armazenamento file depende do navegador/perfil/caminho; exportar antes de mover ou limpar. Uma aba editora por vez no modo local; uma instância por DATA_DIR no servidor. Sem autenticação. Firefox/Safari não validados.
