# Histórico de sessões

## 2026-10-25 — Organização inicial

Pedido: reorganizar todo o projeto como o EletroProjeto e usar inicial minúscula. Consultados estrutura, regras e documentação de continuidade do projeto de referência.

Criado snapshot original; pasta renomeada para minecoord; separadas responsabilidades do servidor e frontend/dados. Criadas regras locais, documentação, teste HTTP e continuidade. Preservados os arquivos da interface, JSONs e dependências. A mudança de host padrão para loopback foi documentada.

Validação: check de sintaxe e teste CRUD HTTP aprovados; preservação dos arquivos originais conferida por comparação com o snapshot; recuperação dos novos checkpoints testada em diretório temporário. Sem publicação ou sincronização remota.

## 2026-10-25 — Publicação do código

Usuário solicitou repositório público. Destino: `thegodKoDDa/minecoord`. Revisão do conteúdo versionável mantém dados, checkpoints, configurações privadas e dependências fora do Git. Autenticação existente usada sem gravar credenciais no projeto.

## 2026-10-25 — Lapidação 1.1.0

Pedido: retrabalhar e lapidar o projeto preservando suas raízes, código e interface. Snapshot verificado criado antes das alterações.

Causas corrigidas: leitura e escrita fora de transação perdiam alterações concorrentes; Number convertia vazios/booleanos em coordenadas; timestamp não garantia ID exclusivo. A correção usa fila por processo, backup obrigatório, substituição atômica, validação explícita e UUID. JSON inválido não é redefinido.

Interface mantém tema, cores e componentes; recebe mensagens, estados de envio, busca sem acentos, contagens e atualização. Diálogos acessíveis substituem alertas de edição/exclusão; foco, Escape e Tab verificados. Versão móvel usa blocos para evitar ações fora da tela. Falha de edição permanece visível dentro do modal.

Verificações: seis testes Node, três testes Python, runner Chromium com CRUD, duplo envio, filtros, XSS, erros/recuperação e larguras 320/390/768/1024/1440. Axe sem violações nos cenários principal e modal móvel. Capturas inspecionadas; ferramentas instaladas reutilizadas. JSONs reais e backup comparados com snapshot; preservados sem mudança. Limitações atualizadas em KNOWN_ISSUES.

Conferência do encerramento: o primeiro checkpoint pós-lapidação foi íntegro, mas recebeu nome de arquivo por reutilização de variável no percurso. Separado o identificador temporal da variável de arquivo e acrescentado teste de formato. O ponto íntegro anterior foi preservado; o ponteiro final usa novo identificador temporal verificado.
