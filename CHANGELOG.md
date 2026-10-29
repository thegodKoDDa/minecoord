# Histórico de versões

## 1.5.0 — 2026-10-29

### Expansão Temática Minecraft

- **Múltiplos Mundos e Saves**: seletor de mundos no cabeçalho e modal de criação de novo mundo, permitindo isolar coordenadas de mundos vanilla, servidores multiplayer (SMP) e mundos hardcore sem misturar pontos.
- **Favoritos e Fixação no Topo**: botão de estrela ⭐ nas linhas da tabela e caixas de seleção nos formulários para manter bases e farms essenciais sempre no topo do inventário.
- **Bússola e Calculadora de Distância**: barra com a posição atual do jogador (com preenchimento via F3+C ou manual), calculando em tempo real a distância euclidiana em blocos e a direção cardeal (Norte, Sul, Leste, Oeste, Nordeste, Sudeste, Sudoeste, Noroeste), com ordenação por proximidade.
- **Mini Radar 2D Interativo**: visualização top-down desenvolvida em HTML5 Canvas, suportando navegação por arrasto (pan), zoom pela roda do mouse ou botões, grade dinâmica de blocos e indicação pulsante da posição do jogador.
- **Cores Personalizadas para Marcadores**: paleta temática de minérios de Minecraft (Diamante `#38bdf8`, Esmeralda `#10b981`, Redstone `#ef4444`, Ouro `#f59e0b`, Ametista `#a855f7`, The Sift `#f472b6` e Ardósia `#9ca3af`) exibidas na tabela e renderizadas no Radar.
- **Efeitos Sonoros Retrô Sintetizados**: efeitos sonoros em tempo real sintetizados via Web Audio API (sem dependências de rede ou arquivos pesados de áudio) com **botão de alternância e persistência** no cabeçalho.
- **Triangulador de Stronghold (Olhos do Fim)**: cálculo trigonométrico da coordenada da Fortaleza a partir de 2 lançamentos de Olhos do Fim com ângulos Yaw do Minecraft, com botão de inserção direta no atlas.
- **Compatibilidade com Mods**: exportação e importação diretas de waypoints para **Xaero's Minimap** (`.txt`) e **JourneyMap** (`.json`).
- **Compartilhamento Rápido**: botão para copiar coordenadas formatadas com emojis prontas para envio em chats e Discord.

### Qualidade e Confiabilidade

- Validação estendida no backend e frontend para os campos `mundo`, `favorito` e `cor`.
- 100% de conformidade com os testes automatizados de unidade, de ponta a ponta (Playwright) e acessibilidade WCAG 2.1 AA (Axe-core).
- Atualização do asset `docs/assets/preview.png` com preview completo e sem cortes.

## 1.4.0 — 2026-10-29

### Recursos e Usabilidade

- **Atalho Colar do Minecraft (F3+C)**: botão e diálogo de preenchimento inteligente a partir de comandos F3+C ou `/tp` do jogo, detectando dimensões (`Overworld`, `Nether`, `End`, `The Sift`) e coordenadas automaticamente.
- **Campo de Anotações**: suporte a anotações/descrições de até 500 caracteres nos formulários, API e tabela.
- **Cópia Rápida de Portais**: botão para copiar o comando `/tp` direto das coordenadas calculadas do portal no Nether ou Overworld.
- **Novas Opções de Ordenação**: ordenação por mais antigos, nome decrescente (Z–A) e coordenadas X e Z.
- **Paginação de Alto Desempenho**: controles de paginação (25, 50, 100 ou todos) para navegação fluida em grandes inventários de coordenadas sem sobrecarregar o DOM.

### Validação e Confiabilidade

- **Importação Flexível e Robusta**: suporte a coordenadas numéricas expressas como string ou número em backups e imports JSON.
- **Validação Unificada no Armazenamento Local**: validação completa de esquema e fronteiras de coordenadas também nas operações POST/PUT locais do `storage.js`.

## 1.3.0 — 2026-10-27

### Recursos

- Suporte à nova dimensão **The Sift** no cadastro, edição, filtros, contadores de resumo e importação/exportação de backups.
- Suporte a execução estática pelo **GitHub Pages** (`*.github.io`) com armazenamento no navegador e workflow de publicação automática.

### Segurança e confiabilidade

- Autenticação configurável para interface e API; senha obrigatória ao expor o servidor na rede.
- Reserva de uma aba editora no modo navegador com Web Locks, evitando gravações concorrentes. Sem suporte, consulta e exportação continuam disponíveis.
- Testes de autenticação e bloqueio de edição entre abas.

### Repositório

- README com prévia da interface atualizada, instruções de uso (online, offline e servidor) e configuração.
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
