# Limitações conhecidas

- Executar somente uma instância por DATA_DIR: a fila serializa operações dentro do processo, sem trava entre processos. Edições de duas pessoas no mesmo ponto usam a última gravação concluída.
- Dados históricos fora dos limites atuais permanecem legíveis. Editar e salvar um ponto histórico fora da faixa aceita exige ajustar a altura. Nada foi corrigido automaticamente.
- Autenticação Basic configurável por AUTH_USER/AUTH_PASSWORD; senha obrigatória fora do loopback. HTTPS via proxy é necessário para proteger credenciais em trânsito; não há usuários separados ou logout na interface.
- A referência de portais mantém o arredondamento original e a proporção 1:8 de X/Z; não garante vinculação, segurança do destino ou equivalência de Y.
- Clipboard pode estar indisponível em HTTP por IP; a interface mostra o comando para cópia manual.
- Testes de navegador foram executados em Chromium, com fontes do sistema. Firefox, Safari e dispositivos físicos não foram verificados.
- Playwright/axe são ferramentas opcionais; não integram as dependências de execução. O runner aceita instalações existentes por variáveis de ambiente.
- Checkpoints não incluem Git, DATA_DIR externo, .env privado ou alterações não salvas. Exigem ausência de gravações concorrentes e ficam no mesmo disco. Sincronização Git não faz parte do script de continuidade.

- Modo navegador (`file:` e GitHub Pages em `*.github.io`) depende das regras de `localStorage` do navegador, perfil e origem/caminho. Dados privados ou removidos pelo navegador podem desaparecer; exportar backups regularmente. A cópia local anterior fica no mesmo armazenamento, não substitui backup externo e não tem restauração automática pela interface.
- Web Locks reserva a edição a uma aba do mesmo armazenamento; as demais permitem leitura/exportação. Feche a editora e recarregue outra aba para transferir a edição. Sem suporte, gravações são bloqueadas e leitura/exportação continuam disponíveis. Edições no mesmo ponto usam a última gravação; eventos de armazenamento atualizam a lista quando disponíveis.
- Importação adiciona registros com novos IDs; repetir o arquivo duplica pontos. Modos servidor e navegador não sincronizam automaticamente.
