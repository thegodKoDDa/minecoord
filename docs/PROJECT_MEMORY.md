# Memória do projeto

- Nome e caminho: `minecoord`, `/home/gabriel/dev/minecoord`.
- Pedido de 25/10/2026: reorganizar o projeto seguindo o padrão de organização do EletroProjeto e colocar a inicial em minúscula.
- Adotados separação por responsabilidade, dados privados, documentação de continuidade, histórico e recuperação verificável. A stack elétrica, regras normativas e autorizações de GitHub do outro projeto não se aplicam aqui.
- Stack preservada: Node.js, Express 4, CommonJS e frontend estático sem build.
- Dados JSON locais mantêm formato e conteúdo originais. O backup anterior à migração também foi preservado.
- Sem Git ou remoto preexistentes na inspeção inicial; não foi criado destino externo.
- Usar Python 3.9+ para continuidade e Node 18+ para execução/testes.

- Pedido posterior em 25/10/2026: publicar o código em repositório público `thegodKoDDa/minecoord`. Autorização não inclui dados locais ou backups.

- Lapidação 1.1 solicitada na mesma sessão: preservar raiz, código e interface; corrigir problemas internos e melhorar acabamento sem trocar stack nem redesenhar a identidade.
- Persistência usa fila por processo, gravação atômica de arquivo e backup obrigatório. Uma instância por DATA_DIR. Novos IDs UUID, anteriores preservados.
- Limites de coordenadas são política herdada do aplicativo. Registros legados fora dela permanecem; não alterar dados reais para fazer passar testes.
- Navegador validado em Chromium; ferramentas existentes reutilizadas via PLAYWRIGHT_MODULE/AXE_MODULE, sem reinstalação de dependências.
