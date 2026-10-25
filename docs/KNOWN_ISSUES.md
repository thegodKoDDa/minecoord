# Limitações conhecidas

- Persistência original faz leitura/alteração/gravação sem fila ou escrita atômica; acessos concorrentes podem perder alterações. Reorganização preservou esse comportamento.
- IDs continuam baseados em timestamp; chamadas simultâneas podem colidir.
- Validação numérica herdada converte certos valores vazios para zero. Revisão funcional fica como próximo passo.
- Não há autenticação; acesso pela rede deve ser configurado conscientemente com HOST.
- Interface foi preservada e servida via HTTP nos testes; interação visual completa não foi testada em navegador.
- A rotina de checkpoints é local e não sincroniza commits Git automaticamente.
- Continuidade não captura dados de DATA_DIR externo, buffers não salvos nem gravações ainda em andamento.
