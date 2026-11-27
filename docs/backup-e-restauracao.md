# Urbanize — Backup e recuperação

Roteiro dos requisitos RS26 a RS31 do [documento SEG](SEG%20-%20URBANIZE.md).

**Metas:** perder no máximo 24 horas de dados (RPO) e voltar a funcionar em até 4 horas (RTO).

## Quem age

| Papel | Responsabilidade | Pessoa |
| :---- | :---- | :---- |
| Responsável pelo backup | Configuração, teste mensal e registro | A definir |
| Responsável pela recuperação | Decide restaurar e executa o roteiro | A definir |
| Substituto | Assume na ausência dos anteriores | A definir |

## Configuração (uma vez)

No `backend/.env` do servidor:

```bash
BACKUP_ENCRYPTION_KEY=...            # openssl rand -hex 32
BACKUP_DIR=./backups
BACKUP_OFFSITE_DIR=/mnt/backup-urbanize   # outro servidor ou nuvem montada
```

- **Guarde a chave fora do servidor**, em um cofre de senhas com acesso dos responsáveis. Sem ela nenhum backup pode ser restaurado.
- `BACKUP_OFFSITE_DIR` precisa estar em outra máquina ou região. No Docker, monte essa pasta como volume do serviço `backend`.
- O backup roda todo dia às 2h dentro da API (`BACKUP_CRON`). A API precisa estar ligada. Falhas aparecem no log como `FALHA NO BACKUP DIÁRIO`, sem alerta automático.

## Comandos

Dentro de `backend/`. No Docker, prefixe com `docker compose -f docker/docker-compose.yml exec backend`.

```bash
npm run backup                      # cria um backup agora
npm run backup:verify               # testa a restauração do mais recente
npm run backup:verify -- <arquivo>  # testa um arquivo específico
```

## Recuperação

1. **Avaliar.** Registre a hora, o que falhou e quais dados podem ter sido afetados. Se houver suspeita de invasão ou vazamento, siga também a resposta a incidentes da Entrega 3 e troque o `JWT_SECRET`.
2. **Parar a API.** `docker compose -f docker/docker-compose.yml stop backend`, ou encerre o processo.
3. **Preparar o servidor.** Em máquina nova: clonar o repositório, recriar o `backend/.env` (incluindo a chave de backup) e montar o armazenamento externo.
4. **Escolher o backup.** O mais recente anterior ao problema, em `BACKUP_OFFSITE_DIR`. Teste com `npm run backup:verify -- <arquivo>`.
5. **Restaurar.**
   - Local: `npm run restore -- <arquivo> --force`
   - Docker: `docker compose -f docker/docker-compose.yml run --rm --no-deps backend npm run restore -- <arquivo> --force`

   O comando guarda o banco anterior como `*.antes-restauracao-*`, aplica as migrações, **exclui novamente as contas já excluídas**, anonimiza os contatos vencidos e encerra todas as sessões.
6. **Subir a API** e conferir `/api/health`, o login e a abertura de uma demanda com foto.
7. **Revisar o que o backup não sabe.** Mudanças feitas depois dele se perderam: conferir a lista de gestores (um descredenciado pode voltar como gestor), correções de dados pedidas por titulares e demandas do período.
8. **Limpar.** Depois de validar, apague os arquivos `*.antes-restauracao-*`, que contêm dados pessoais.
9. **Registrar** a data, a duração e o resultado abaixo.

## Cuidados com a LGPD

- Backups contêm dados pessoais. Só os responsáveis têm acesso à pasta e à chave.
- **Contas excluídas permanecem nos backups por até 28 dias.** A restauração as exclui de novo usando `contas-excluidas.log`. Não apague esse arquivo, e restaure sempre pelo comando acima, nunca copiando o banco à mão.
- Os arquivos antigos são removidos quando um novo backup é criado. Se o backup for desativado, apague manualmente os arquivos com mais de 28 dias.

## Registro dos testes de restauração (RS30)

Uma vez por mês, com `npm run backup:verify`.

| Data | Ambiente | Resultado | Responsável |
| :---- | :---- | :---- | :---- |
| 27/11/2026 | Desenvolvimento, cópia isolada com base de demonstração | Verificação íntegra (3 usuários, 3 demandas, 1 foto, nenhuma ausente). Restauração completa em cerca de 2 s; a conta excluída depois do backup foi excluída de novo | A definir |
