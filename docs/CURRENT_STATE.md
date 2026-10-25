# Estado atual — 2026-10-25

Versão 1.1.0: lapidação do minecoord, preservando Express/CommonJS, frontend estático, identidade visual, endpoints e dados existentes.

Backend: fila de alterações por processo, UUID para novos registros, backup obrigatório e substituição atômica. Validação rejeita vazios/tipos indevidos/não finitos. Erros padronizados em JSON e encerramento gracioso.

Frontend: formulários protegidos contra repetição, mensagens e recuperação de erros, busca sem acentos, contagens/atualização, modais acessíveis e layout de pontos em blocos no celular. Tema e fluxos preservados.

Verificações aprovadas: sintaxe; seis testes Node; três testes Python; Chromium em larguras 320 a 1440, CRUD, edição com erro, busca/filtros, XSS, duplo envio e recuperação. Axe sem violações na tela principal e no modal móvel; capturas inspecionadas. Dados e backup reais preservados byte a byte. Dependências de execução não alteradas.

Código público: thegodKoDDa/minecoord. Dados, backups, configurações privadas, capturas e checkpoints permanecem fora do Git. Servidor local usa porta 3000; conferir HTTP ao retomar.

Próximo passo conforme demanda: testar em outros navegadores/dispositivos e avaliar autenticação ou persistência compartilhada caso o uso evolua. Hoje executar uma instância por pasta de dados. Registro histórico com Y=400 foi mantido; ver KNOWN_ISSUES.
