# Limitações conhecidas

- Executar somente uma instância por DATA_DIR: a fila serializa operações dentro do processo, sem trava entre processos. Edições de duas pessoas no mesmo ponto usam a última gravação concluída.
- Dados históricos fora dos limites atuais permanecem legíveis. Há um registro local com Y=400; editar e salvar exige ajustar a altura ao intervalo aceito. Nada foi corrigido automaticamente.
- Não há autenticação. O servidor usa loopback por padrão; HOST permite acesso pela rede.
- A referência de portais mantém o arredondamento original e a proporção 1:8 de X/Z; não garante vinculação, segurança do destino ou equivalência de Y.
- Clipboard pode estar indisponível em HTTP por IP; a interface mostra o comando para cópia manual.
- Testes de navegador foram executados em Chromium, com fontes do sistema. Firefox, Safari e dispositivos físicos não foram verificados.
- Playwright/axe são ferramentas opcionais; não integram as dependências de execução. O runner aceita instalações existentes por variáveis de ambiente.
- Checkpoints não incluem Git, DATA_DIR externo, .env privado ou alterações não salvas. Exigem ausência de gravações concorrentes e ficam no mesmo disco. Sincronização Git não faz parte do script de continuidade.
