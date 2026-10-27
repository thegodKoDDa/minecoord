# Histórico de versões

## Não lançado

### Recursos

- Suporte à nova dimensão **The Sift** no cadastro, edição, filtros, contadores de resumo e importação/exportação de backups.
- Suporte a execução estática pelo **GitHub Pages** (`*.github.io`) com armazenamento no navegador e workflow de publicação automática.

### Segurança e confiabilidade

- Autenticação configurável para interface e API; senha obrigatória ao expor o servidor na rede.
- Reserva de uma aba editora no modo arquivo com Web Locks, evitando gravações concorrentes. Sem suporte, consulta e exportação continuam disponíveis.
- Testes de autenticação e bloqueio de edição entre abas.

### Repositório

- README com prévia da interface, instruções de uso e configuração.
- Guia de contribuição, licença ISC e verificações no GitHub Actions.
- Documentação pública separada dos registros operacionais locais.

## 1.2.0 — 2026-10-25

- Abertura sem instalação pelo `index.html` da raiz e persistência no navegador.
- Exportação JSON e importação aditiva com validação integral e gravação atômica no servidor.
- Resumo por dimensão, filtros de categoria e ordenação de pontos.
- Interface sem dependência de fontes externas.
- Atualizações compatíveis de dependências e testes de portabilidade e armazenamento.

## 1.1.0 — 2026-10-25

- Serialização de gravações, IDs UUID e validação de coordenadas e tipos.
- Escrita atômica e backup obrigatório antes de substituir dados existentes.
- Respostas de erro JSON, limites de requisição e encerramento gracioso.
- Busca sem acentos, estados de envio e mensagens de erro nos formulários.
- Diálogos acessíveis, confirmação de exclusão e alternativa para copiar comandos.
- Layout responsivo, foco visível e suporte a movimento reduzido.
- Testes de API, persistência, validação, recuperação e navegador.

## Organização inicial — 2026-10-25

- Separação de backend, frontend, validação e dados locais.
- Preservação dos endpoints e da entrada `server.js`.
- Servidor restrito ao loopback por padrão.
- Documentação de arquitetura, continuidade e checkpoints verificáveis.
