/**
 * Importa os PDFs de cartelas de bingo de um diretório para um evento.
 *
 * Uso:
 *   npx tsx scripts/import-bingos.ts --dir ../../Bingos [--event <id>] [--base 1001] [--max-coupons 1000] [--force]
 *
 * Sem --event, usa o evento ativo (isActive=true) mais recente.
 * --max-coupons atualiza o maxCoupons do evento antes de importar.
 */
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../src/lib/prisma.js';
import { importBingoPdfs } from '../src/modules/cards/bingoPdf.service.js';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const hasFlag = (name: string) => process.argv.includes(`--${name}`);

async function main() {
  const dir = arg('dir');
  if (!dir) throw new Error('Informe --dir <pasta com os PDFs>');
  const absDir = path.resolve(dir);
  if (!fs.existsSync(absDir)) throw new Error(`Diretório não existe: ${absDir}`);

  let eventId = arg('event');
  if (!eventId) {
    const event = await prisma.event.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
    if (!event) throw new Error('Nenhum evento ativo encontrado; informe --event <id>');
    eventId = event.id;
    console.log(`Evento ativo: ${event.name} (${event.id})`);
  }

  const maxCoupons = arg('max-coupons');
  if (maxCoupons) {
    await prisma.event.update({ where: { id: eventId }, data: { maxCoupons: parseInt(maxCoupons, 10) } });
    console.log(`maxCoupons atualizado para ${maxCoupons}`);
  }

  const files = fs
    .readdirSync(absDir)
    .filter((f) => /^\d+-\d+\.pdf$/i.test(f))
    .map((f) => ({ filePath: path.join(absDir, f), originalName: f }));
  console.log(`${files.length} PDFs encontrados em ${absDir}`);
  if (files.length === 0) return;

  const started = Date.now();
  const report = await importBingoPdfs(eventId, files, {
    baseCardNumber: arg('base') ? parseInt(arg('base')!, 10) : undefined,
    force: hasFlag('force'),
  });

  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\n✅ Importados: ${report.imported}  ⏭️ Pulados: ${report.skipped}  ❌ Erros: ${report.failed}  (${secs}s)`);
  for (const r of report.results) {
    if (r.status === 'error') console.error(`  ❌ ${r.file}: ${r.reason}`);
  }
  if (report.failed > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
