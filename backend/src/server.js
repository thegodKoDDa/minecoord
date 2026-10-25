const app = require('./app');
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
if (!Number.isInteger(port) || port < 0 || port > 65535) {
  console.error('PORT deve ser um número inteiro entre 0 e 65535.');
  process.exit(1);
}
const server = app.listen(port, host, () => {
  console.log(`minecoord: http://${host}:${server.address().port}`);
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE'
    ? `A porta ${port} já está em uso. Defina outra com PORT.`
    : `Não foi possível iniciar o servidor: ${error.message}`);
  process.exitCode = 1;
});
let encerrando = false;
function encerrar() {
  if (encerrando) return;
  encerrando = true;
  console.log('Encerrando minecoord e aguardando requisições em andamento…');
  server.close(error => {
    if (error) { console.error(error.message); process.exitCode = 1; }
  });
}
process.on('SIGTERM', encerrar);
process.on('SIGINT', encerrar);
