# Arquitetura

Node.js/Express 4 e CommonJS no backend; HTML, CSS e JavaScript no frontend, sem build. Os modos navegador e servidor preservam os mesmos campos de coordenadas.

`server.js` valida PORT, inicia HTTP e encerra de forma graciosa. `app.js` configura estáticos, respostas JSON de erro, cabeçalhos e a API. O router valida os campos e executa alterações pelo repositório; não manipula arquivos diretamente.

| Método | Rota | Operação |
| --- | --- | --- |
| GET | `/api/locais` | Listar |
| POST | `/api/locais` | Cadastrar; retorna 201 |
| PUT | `/api/locais/:id` | Editar preservando ID/criadoEm |
| DELETE | `/api/locais/:id` | Excluir |
| POST | `/api/locais/importar` | Importar uma lista; retorna 201 |

Erros mantêm `{ "error": "mensagem" }`: 400 para entrada/JSON inválidos, 404 para local/rota inexistente, 413 para corpo acima de 16 KiB e 500 para falha interna. A API usa `Cache-Control: no-store`. Novos IDs são UUID; os anteriores continuam aceitos.

## Persistência

`criarRepositorio(dataDir)` permite isolamento em testes. O repositório padrão usa `data/` ou DATA_DIR. Arquivo ausente é tratado como lista vazia, sem gravação durante GET. JSON inválido ou objeto em vez de lista gera erro e permanece intacto.

A fila de alterações engloba leitura, aplicação da operação e gravação. Após serializar a lista, grava bytes anteriores em backup temporário, sincroniza o arquivo e renomeia; repete esse processo para o arquivo principal. Temporários têm nomes UUID, permissões 0600 e são removidos em falhas normais. Falha de backup impede substituir o principal; falha em uma operação não bloqueia a fila. A fila atende um processo, sem bloqueio entre processos e sem promessa de durabilidade contra falha física do disco.

Nomes novos/editados aceitam até 120 caracteres. Coordenadas aceitam números finitos ou strings decimais não vazias, incluindo zero e decimais. Limites existentes são preservados como política do aplicativo; dados históricos não são migrados ou corrigidos automaticamente. Categoria ausente/em branco vira Outros; null e categorias desconhecidas são rejeitados. O campo opcional de anotações aceita até 500 caracteres de texto sanitizado.

## Interface

O frontend usa funções comuns para requisições, formulários e mensagens. Bloqueia envios repetidos enquanto aguarda resposta, preserva o formulário em falhas e reconcilia a lista após alterações. Requisições de listagem anteriores são canceladas; listagens têm tempo limite de 12 segundos. Busca ignora acentos, pesquisa por nome, dimensão, categoria e anotações, conservando filtros após atualizações.

Dados textuais são escapados antes de compor a tabela. Os modais nativos têm nomes acessíveis, foco inicial, ciclo de Tab, Escape e retorno de foco. Falhas de edição são mostradas dentro do modal. Cópia indisponível exibe o comando para copiar manualmente. A conversão 1:8 original é uma referência de X/Z com atalho de cópia direta do comando `/tp` do portal. Ações de colagem rápida processam comandos do Minecraft (F3+C ou `/tp`) preenchendo automaticamente dimensão e coordenadas. A tabela oferece paginação dinâmica (25, 50, 100 ou todos) para manter renderização veloz mesmo com milhares de pontos.

O desktop mantém a tabela; celular usa o mesmo conteúdo em blocos. Há foco visível, descrição de erros, anúncios de resultado e respeito a movimento reduzido. Fontes externas têm fallback do sistema.

## Verificação

`npm test` cobre HTTP, concorrência, corrupção, falha de backup e validação. `npm run test:continuity` cobre exclusões, integridade e falha de recuperação. `npm run test:e2e` usa Playwright opcional, dados temporários e porta efêmera. Nenhum teste modifica os JSONs reais.

## Atlas 1.2

`index.html` da raiz encaminha para a interface. `frontend/public/storage.js` escolhe o adaptador pelo ambiente: `file:` e hospedagem estática no GitHub Pages (`*.github.io`) usam `localStorage`; HTTP local/servidor mantém a API Express. A chave `minecoord.locais.v1` guarda a lista e `minecoord.backup.v1` guarda o conteúdo anterior antes de cada alteração. Falha de backup interrompe a gravação. Corrupção não é redefinida automaticamente. Web Locks reserva uma aba editora durante a vida da página. Abas adicionais recusam mutações; fechar a editora e recarregar outra aba transfere a edição. Isso evita cópias locais desatualizadas no modo navegador. Sem suporte, leitura/exportação continuam disponíveis e mutações são recusadas.

`POST /api/locais/importar` recebe uma lista, valida todo o lote e adiciona os pontos em uma única transação do repositório. Limite 5 MB e 10.000 pontos, IDs novos. Alturas legadas finitas são aceitas apenas nesse transporte. Endpoints CRUD mantêm contrato. Exportação usa GET existente e JSON versionado no cliente. Importações repetidas são aditivas.

## Proteção de acesso

Middleware antes dos estáticos e da API usa autenticação Basic quando AUTH_PASSWORD está definida (mínimo 16 caracteres). AUTH_USER tem padrão minecoord. Comparação usa hashes de tamanho fixo e timingSafeEqual. Acesso fora de loopback sem senha impede inicialização. Credenciais não são persistidas pelo aplicativo. HTTPS deve ser terminado em proxy para uso em rede; Basic não criptografa o transporte.
