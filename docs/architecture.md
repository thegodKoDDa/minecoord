# Arquitetura

O servidor importa `app.js`, que publica `frontend/public` e monta o router em `/api`. As rotas usam a validação central e o serviço de persistência. A interface usa as mesmas URLs anteriores, sem build ou alteração visual.

| Método | Rota | Operação |
| --- | --- | --- |
| GET | `/api/locais` | Listar |
| POST | `/api/locais` | Cadastrar |
| PUT | `/api/locais/:id` | Editar |
| DELETE | `/api/locais/:id` | Excluir |

A persistência lê `data/coordenadas.json` e copia a versão anterior para `data/coordenadas.backup.json` antes da gravação. Arquivo ausente é inicializado como lista vazia. JSON inválido gera erro sem redefinir os dados. `DATA_DIR` permite isolar outra pasta; caminhos relativos são resolvidos pelo diretório de execução.

O servidor usa HOST=127.0.0.1 e PORT=3000 por padrão. Somente frontend/public é servido estaticamente. A raiz, docs e arquivos de dados não são publicados pelo Express.

O teste HTTP inicia app em porta efêmera e DATA_DIR temporário, exercitando interface, CRUD, erros e backup. Não depende da porta 3000 nem grava em dados reais.
