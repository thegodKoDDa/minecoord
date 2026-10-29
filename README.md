# minecoord

Seu mundo, bem localizado. Um atlas de coordenadas para organizar bases, portais e descobertas no Minecraft.

[![Verificações](https://github.com/thegodKoDDa/minecoord/actions/workflows/ci.yml/badge.svg)](https://github.com/thegodKoDDa/minecoord/actions/workflows/ci.yml)
[![Licença ISC](https://img.shields.io/badge/licen%C3%A7a-ISC-blue.svg)](LICENSE)

![Interface do minecoord com pontos de exemplo](docs/assets/preview.png?v=1.5.0)

## Recursos

- **Múltiplos Mundos e Saves:** organize pontos isolados por mundos (ex: Principal, Hardcore, Servidor SMP) com troca instantânea no cabeçalho.
- **Favoritos e Fixação no Topo:** destaque suas bases e farms essenciais com estrela ⭐ para mantê-las sempre no topo da lista.
- **Bússola e Calculadora de Distância:** informe sua posição atual (manualmente ou colando F3+C) para ver a distância euclidiana em blocos, direção cardeal (N, NE, L, SE, S, SO, O, NO) e ordenar por proximidade.
- **Mini Radar 2D Interativo:** visualização cartográfica no Canvas do navegador com zoom, pan, grade de coordenadas e marcador pulsante do jogador.
- **Cores Personalizadas:** escolha temas visuais de minérios do Minecraft (Diamante, Esmeralda, Redstone, Ouro, Ametista, The Sift e Ardósia) para identificar seus marcadores.
- **Efeitos Sonoros Retrô Minecraft:** áudio sintetizado em tempo real via Web Audio API (sem downloads externos de áudio) com **botão de alternância (ativar/desativar persistido)** no cabeçalho.
- **Triangulador de Stronghold (Olhos do Fim):** calcule a posição X e Z exata da Fortaleza jogando dois Olhos do Fim e inserindo os ângulos Yaw do F3.
- **Compatibilidade com Mods:** exporte e importe waypoints compatíveis com **Xaero’s Minimap** e **JourneyMap**.
- **Compartilhamento Rápido:** copie as coordenadas formatadas com emojis e comando `/tp` prontas para enviar no Discord ou chat.
- **Atalho F3+C:** preenchimento automático colando comandos copiados direto do jogo.
- **Calculadora de Portais (1:8):** conversão automática de coordenadas e cópia de `/tp` entre Overworld e Nether.
- **Acessibilidade e Usabilidade:** 100% aderente ao padrão WCAG 2.1 AA / Axe, navegação por teclado e design responsivo para desktop e celular.
- **Modo Offline e Online:** funciona como arquivo estático local (`index.html`), online pelo GitHub Pages ou como servidor Node.js/Express.

## Começar

### Online pelo navegador (GitHub Pages)

Acesse diretamente **[https://thegodkodda.github.io/minecoord/](https://thegodkodda.github.io/minecoord/)** para usar o atlas sem baixar ou instalar nada. Os pontos ficam salvos localmente no navegador do seu dispositivo, com exportação e importação de backups JSON.

### Sem instalação (Offline / ZIP)

[Baixe o projeto em ZIP](https://github.com/thegodKoDDa/minecoord/archive/refs/heads/main.zip), extraia a pasta e abra o **`index.html` da raiz**. Não precisa de Node.js nem internet.

Os pontos ficam no armazenamento desse navegador. Exporte um backup antes de mover a pasta, trocar de navegador ou limpar os dados. Apenas uma aba pode editar por vez; feche a editora e recarregue outra aba para transferir a edição. Navegadores sem Web Locks permitem consulta e exportação; para salvar, use o modo servidor.

### Com servidor

Requer Node.js 18 ou superior e npm.

```sh
git clone https://github.com/thegodKoDDa/minecoord.git
cd minecoord
npm ci
npm start
```

Abra **http://127.0.0.1:3000**. Os pontos ficam em `data/`, com cópia da versão anterior antes de cada alteração. Execute uma única instância por pasta de dados.

## Backups

**Exportar backup** baixa um JSON com todos os pontos. **Importar pontos** aceita esse backup ou uma lista JSON antiga e adiciona os registros sem apagar os existentes. O lote inteiro é validado antes de gravar: até 5 MB e 10.000 pontos por importação.

Importações geram novos IDs; importar o mesmo arquivo novamente duplica os pontos. Os modos navegador e servidor têm dados independentes. Para transferir entre eles, exporte de um e importe no outro.

## Configuração do servidor

Defina as variáveis no ambiente do processo. O arquivo [`.env.example`](.env.example) serve de referência; `.env` não é carregado automaticamente.

| Variável | Padrão | Uso |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP |
| `HOST` | `127.0.0.1` | Endereço de escuta |
| `DATA_DIR` | `data/` | Diretório de coordenadas e backup |
| `AUTH_USER` | `minecoord` | Usuário da autenticação Basic |
| `AUTH_PASSWORD` | Sem senha local | Senha com pelo menos 16 caracteres; obrigatória fora do loopback |

```sh
PORT=3001 npm start
```

Ao configurar uma senha, o navegador solicita as credenciais para abrir a aplicação. Para acesso pela rede, configure `HOST` e `AUTH_PASSWORD` e use HTTPS por proxy reverso para proteger as credenciais em trânsito. A autenticação usa uma conta compartilhada, sem perfis individuais.

## Desenvolvimento

Express/CommonJS no backend e HTML, CSS e JavaScript no frontend.

```sh
npm run dev              # Reinício automático do servidor
npm run check            # Verificação de sintaxe JavaScript
npm test                 # API, persistência, validação e autenticação
npm run test:continuity  # Integridade dos checkpoints locais
```

Os testes da API usam diretórios temporários e não alteram os dados da aplicação. As verificações também rodam no GitHub Actions. Consulte [o guia de contribuição](CONTRIBUTING.md) para testes de navegador.

| Diretório | Conteúdo |
| --- | --- |
| `backend/src/` | Servidor, rotas, autenticação, validação e persistência |
| `frontend/public/` | Interface e adaptador de armazenamento |
| `data/` | Dados privados, ignorados pelo Git |
| `tests/` | Testes automatizados |
| `scripts/` | Verificações e continuidade local |
| `docs/` | Documentação e prévia da interface |

## Documentação

- [Arquitetura e API](docs/architecture.md)
- [Limitações conhecidas](docs/KNOWN_ISSUES.md)
- [Checkpoints e recuperação](docs/continuity.md)
- [Histórico de versões](CHANGELOG.md)

## Licença

[ISC](LICENSE).
