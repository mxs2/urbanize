import { backupService } from "../src/services/backupService";

/**
 * Uso: npm run backup                      cria um backup
 *      npm run backup:verify [-- arquivo]  testa a restauração (padrão: o mais recente)
 *      npm run restore -- arquivo [--force]  restaura, com a API parada
 */
async function main() {
  const [command, ...args] = process.argv.slice(2);
  const file = args.find((arg) => !arg.startsWith("--"));

  if (command === "create") {
    const result = await backupService.create();
    console.log(`Backup criado: ${result.file} (${result.removed} antigo(s) removido(s)).`);
    if (!result.offsite) console.warn("BACKUP_OFFSITE_DIR não definido: não há cópia fora deste servidor.");
  } else if (command === "verify") {
    const target = file ?? (await backupService.latest());
    const result = await backupService.verify(target);
    console.log(`${new Date().toISOString()} ${target}`);
    console.log(JSON.stringify(result));
    if (!result.ok) process.exitCode = 1;
  } else if (command === "restore" && file) {
    await backupService.restore(file, { force: args.includes("--force") });
    // Importados só agora, para o banco ser aberto depois de substituído.
    const { execFileSync } = await import("child_process");
    execFileSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit", shell: process.platform === "win32" });
    const { recoveryService } = await import("../src/services/recoveryService");
    const { contas, demandas, sessoes } = await recoveryService.reapply();
    console.log(
      `Restaurado. Reaplicado: ${contas} conta(s) excluída(s), ${demandas} demanda(s) anonimizada(s), ` +
        `${sessoes} sessão(ões) encerrada(s).`
    );
  } else {
    console.error("Uso: backup.ts create | verify [arquivo] | restore <arquivo> [--force]");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
