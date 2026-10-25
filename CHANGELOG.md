# Histórico de entregas

## 1.1.0 — 2026-10-25

- Corrigidas perda de alterações concorrentes, colisão de IDs e aceitação de coordenadas vazias/tipos indevidos.
- Escrita por substituição atômica e backup obrigatório; falhas preservam o arquivo principal.
- Erros HTTP em JSON, limite de corpo, controle de cache e encerramento gracioso.
- Formulários com estado de envio, mensagens na página, erro de edição no modal e reconciliação da lista.
- Busca sem acentos, contagens, atualização manual e estados de erro recuperáveis.
- Modais acessíveis, foco e teclado, confirmação de exclusão e alternativa para copiar comandos.
- Layout móvel em blocos, campos e contraste ajustados, suporte a movimento reduzido.
- Testes de API/persistência, validação, recuperação e navegador com dados isolados.
- Checkpoint ignora capturas e não percorre dependências; restauração rejeita inventário duplicado.

## 2026-10-25

- Pasta e pacote padronizados como `minecoord`.
- Separação de frontend, backend, validação, persistência e dados locais.
- Mantidos os endpoints, arquivos da interface e entrada legada `server.js`.
- Servidor usa loopback por padrão; HOST permite configurar acesso pela rede.
- Criados documentação, regras do projeto, verificações e checkpoints locais verificáveis.
- Preservados dados e backup originais, dependências e snapshot anterior à reorganização.

## 1.2.0 — 2026-10-25

- Uso sem instalação pelo index.html da raiz e persistência no navegador.
- Exportação de backup e importação aditiva, integralmente validada e atômica no servidor.
- Resumo por dimensão, filtro de categorias, ordenação e painel de armazenamento.
- Tipografia offline, atualizações de segurança compatíveis e testes de portabilidade/armazenamento.
