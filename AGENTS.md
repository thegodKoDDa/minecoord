# Regras permanentes do minecoord

- Ao retomar, ler `docs/CURRENT_STATE.md` e `docs/PROJECT_MEMORY.md`; executar `npm run retomar`.
- Preservar coordenadas, backups, interface e contratos da API. Não trocar a stack sem necessidade do pedido.
- Backend Express/CommonJS em `backend/src`; frontend estático em `frontend/public`; dados locais em `data`.
- Não versionar coordenadas, backups, `.env`, dependências nem checkpoints. Não copiar regras elétricas ou autorizações remotas do EletroProjeto.
- Antes de mudanças estruturais, criar checkpoint. Não apagar pontos únicos de recuperação.
- Testar a API somente com `DATA_DIR` temporário. Executar `npm run check` e `npm test` após mudanças relevantes.
- Atualizar o documento responsável e CURRENT_STATE; acrescentar SESSION_HISTORY e CHANGELOG para entregas.
- Ao encerrar, criar checkpoint com `npm run checkpoint`, conferir o resultado e informar limitações reais.
- Checkpoints exigem ausência de gravações concorrentes; dados em DATA_DIR externo precisam de backup próprio.
- O usuário autorizou em 25/10/2026 publicar o código em repositório público `thegodKoDDa/minecoord`. Dados, backups, credenciais e checkpoints permanecem locais. A rotina de continuidade não sincroniza Git automaticamente.
