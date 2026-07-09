import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { prisma } from '../../lib/prisma.js';
import { BadRequest, NotFound } from '../../lib/errors.js';
import { env } from '../../config/env.js';

const execFileAsync = promisify(execFile);

/**
 * Importação dos PDFs de cartelas de bingo.
 *
 * Cada PDF ("NNNN-MMMM.pdf") contém 1 página com 2 cartelas empilhadas
 * verticalmente (a de cima = NNNN, a de baixo = MMMM = NNNN+1).
 *
 * Para eliminar risco de divergência de numeração, NADA é assumido a partir
 * do nome do arquivo sozinho: o texto embutido no PDF é extraído
 * (pdftotext -bbox) e os números "Cartón N°" impressos em cada cartela são
 * conferidos contra o nome do arquivo E contra a posição vertical na página.
 * A linha de corte da imagem é calculada por arquivo, no vão entre as duas
 * cartelas, e só é aceita se o rótulo da cartela de cima ficar acima do corte
 * e o da de baixo ficar abaixo. Qualquer inconsistência rejeita o arquivo.
 */

export interface ParsedBingoPdf {
  topCardNumber: number;
  bottomCardNumber: number;
  pageWidthPt: number;
  pageHeightPt: number;
  cropYPt: number;
  topLabelYPt: number;
  bottomLabelYPt: number;
}

interface PdfWord {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  text: string;
}

const RENDER_DPI = 130;
// Números de cartela vêm impressos com separador de milhar: "1.001", "2.999"
const CARD_LABEL_RE = /^\d{1,2}\.\d{3}$/;
const FILENAME_RE = /^(\d{3,5})-(\d{3,5})\.pdf$/i;
const MIN_CARD_GAP_PT = 15;

export function parseBingoFilename(originalName: string): { first: number; second: number } {
  const m = path.basename(originalName).match(FILENAME_RE);
  if (!m) throw BadRequest(`Nome de arquivo inválido: "${originalName}" (esperado NNNN-MMMM.pdf)`);
  const first = parseInt(m[1], 10);
  const second = parseInt(m[2], 10);
  if (second !== first + 1) {
    throw BadRequest(`Nome de arquivo inválido: "${originalName}" (segunda cartela deve ser a primeira + 1)`);
  }
  return { first, second };
}

export async function parseBingoPdf(pdfPath: string): Promise<ParsedBingoPdf> {
  const { stdout } = await execFileAsync('pdftotext', ['-bbox', pdfPath, '-'], {
    maxBuffer: 10 * 1024 * 1024,
  });

  const pageMatch = stdout.match(/<page width="([\d.]+)" height="([\d.]+)">/);
  if (!pageMatch) throw BadRequest('PDF sem página legível');
  const pageWidthPt = parseFloat(pageMatch[1]);
  const pageHeightPt = parseFloat(pageMatch[2]);

  const words: PdfWord[] = [];
  const wordRe = /<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g;
  let m: RegExpExecArray | null;
  while ((m = wordRe.exec(stdout)) !== null) {
    words.push({ x1: parseFloat(m[1]), y1: parseFloat(m[2]), x2: parseFloat(m[3]), y2: parseFloat(m[4]), text: m[5] });
  }
  if (words.length === 0) throw BadRequest('PDF sem texto embutido — impossível verificar numeração');

  // Rótulos "Cartón N°" — únicos com formato d.ddd (números do grid vão só até 75)
  const labels = words.filter((w) => CARD_LABEL_RE.test(w.text));
  if (labels.length !== 2) {
    throw BadRequest(`Esperados exatamente 2 números de cartela no PDF, encontrados ${labels.length}`);
  }
  labels.sort((a, b) => a.y1 - b.y1);
  const topCardNumber = parseInt(labels[0].text.replace(/\./g, ''), 10);
  const bottomCardNumber = parseInt(labels[1].text.replace(/\./g, ''), 10);

  // Linha de corte: maior vão vertical sem texto entre os dois rótulos
  const sorted = [...words].sort((a, b) => a.y1 - b.y1);
  let coveredUntil = 0;
  let crop: { from: number; to: number } | null = null;
  for (const w of sorted) {
    if (coveredUntil > 0 && w.y1 - coveredUntil >= MIN_CARD_GAP_PT) {
      const mid = (coveredUntil + w.y1) / 2;
      if (mid > labels[0].y2 && mid < labels[1].y1 && (!crop || w.y1 - coveredUntil > crop.to - crop.from)) {
        crop = { from: coveredUntil, to: w.y1 };
      }
    }
    coveredUntil = Math.max(coveredUntil, w.y2);
  }
  if (!crop) throw BadRequest('Não foi possível localizar o vão entre as duas cartelas');
  const cropYPt = (crop.from + crop.to) / 2;

  // Verificação posicional: rótulo de cima acima do corte, o de baixo abaixo
  if (!(labels[0].y2 < cropYPt && labels[1].y1 > cropYPt)) {
    throw BadRequest('Posição dos números de cartela não confere com a linha de corte');
  }

  return {
    topCardNumber,
    bottomCardNumber,
    pageWidthPt,
    pageHeightPt,
    cropYPt,
    topLabelYPt: labels[0].y1,
    bottomLabelYPt: labels[1].y1,
  };
}

/** Renderiza as duas metades da página como imagens (uma por cartela). */
export async function renderCardHalves(
  pdfPath: string,
  parsed: ParsedBingoPdf,
  outDir: string,
): Promise<{ topImagePath: string; bottomImagePath: string }> {
  fs.mkdirSync(outDir, { recursive: true });
  const scale = RENDER_DPI / 72;
  const pageHpx = Math.round(parsed.pageHeightPt * scale);
  const pageWpx = Math.round(parsed.pageWidthPt * scale);
  const cropPx = Math.round(parsed.cropYPt * scale);

  const topBase = path.join(outDir, `card-${parsed.topCardNumber}`);
  const bottomBase = path.join(outDir, `card-${parsed.bottomCardNumber}`);

  const common = ['-png', '-r', String(RENDER_DPI), '-f', '1', '-l', '1', '-singlefile'];
  await execFileAsync('pdftoppm', [
    ...common, '-x', '0', '-y', '0', '-W', String(pageWpx), '-H', String(cropPx),
    pdfPath, topBase,
  ]);
  await execFileAsync('pdftoppm', [
    ...common, '-x', '0', '-y', String(cropPx), '-W', String(pageWpx), '-H', String(pageHpx - cropPx),
    pdfPath, bottomBase,
  ]);

  const topImagePath = `${topBase}.png`;
  const bottomImagePath = `${bottomBase}.png`;
  if (!fs.existsSync(topImagePath) || !fs.existsSync(bottomImagePath)) {
    throw BadRequest('Falha ao renderizar imagens das cartelas');
  }
  return { topImagePath, bottomImagePath };
}

export interface BingoImportOptions {
  /** Número da primeira cartela do lote inteiro (padrão 1001) — define o mapeamento cupom <-> PDF. */
  baseCardNumber?: number;
  /** Reprocessa cupons já importados (re-renderiza imagens e reassocia cartelas). */
  force?: boolean;
}

export interface BingoImportFileResult {
  file: string;
  couponNumber?: number;
  cardNumbers?: [number, number];
  status: 'imported' | 'skipped' | 'error';
  reason?: string;
}

export interface BingoImportReport {
  imported: number;
  skipped: number;
  failed: number;
  results: BingoImportFileResult[];
}

/**
 * Importa um lote de PDFs de cartelas para o evento.
 * Mapeamento determinístico: cupom N <- PDF cuja primeira cartela é
 * baseCardNumber + (N-1)*2. Ex.: base 1001 -> cupom 1 = 1001-1002.pdf.
 */
export async function importBingoPdfs(
  eventId: string,
  files: Array<{ filePath: string; originalName: string }>,
  opts: BingoImportOptions = {},
): Promise<BingoImportReport> {
  const base = opts.baseCardNumber ?? 1001;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw NotFound('Evento não encontrado');
  if (event.cardsPerCoupon !== 2) {
    throw BadRequest(`Evento tem cardsPerCoupon=${event.cardsPerCoupon}; a importação de PDFs exige 2`);
  }

  // Garante inventário de cupons até maxCoupons (idempotente)
  const existingCount = await prisma.coupon.count({ where: { eventId } });
  if (existingCount < event.maxCoupons) {
    const data = [];
    for (let i = 1; i <= event.maxCoupons; i++) data.push({ eventId, couponNumber: i });
    await prisma.coupon.createMany({ data, skipDuplicates: true });
  }

  const cardsDir = path.join(env.UPLOAD_DIR, 'cards');
  const pdfsDir = path.join(env.UPLOAD_DIR, 'coupons');
  fs.mkdirSync(cardsDir, { recursive: true });
  fs.mkdirSync(pdfsDir, { recursive: true });

  const results: BingoImportFileResult[] = [];
  const sortedFiles = [...files].sort((a, b) => a.originalName.localeCompare(b.originalName, undefined, { numeric: true }));

  for (const f of sortedFiles) {
    try {
      results.push(await importOneBingoPdf(event.id, event.maxCoupons, f, base, cardsDir, pdfsDir, opts.force ?? false));
    } catch (err: any) {
      results.push({ file: f.originalName, status: 'error', reason: err?.message ?? String(err) });
    }
  }

  return {
    imported: results.filter((r) => r.status === 'imported').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    failed: results.filter((r) => r.status === 'error').length,
    results,
  };
}

async function importOneBingoPdf(
  eventId: string,
  maxCoupons: number,
  file: { filePath: string; originalName: string },
  base: number,
  cardsDir: string,
  pdfsDir: string,
  force: boolean,
): Promise<BingoImportFileResult> {
  const { first, second } = parseBingoFilename(file.originalName);

  // Mapeamento determinístico para o cupom
  if ((first - base) % 2 !== 0 || first < base) {
    throw BadRequest(`Cartela ${first} incompatível com a base ${base} (esperado ${base}, ${base + 2}, ...)`);
  }
  const couponNumber = (first - base) / 2 + 1;
  if (couponNumber > maxCoupons) {
    throw BadRequest(`Cupom ${couponNumber} excede maxCoupons=${maxCoupons} do evento`);
  }

  const coupon = await prisma.coupon.findUnique({
    where: { eventId_couponNumber: { eventId, couponNumber } },
    include: { cards: { orderBy: { cardIndex: 'asc' } } },
  });
  if (!coupon) throw NotFound(`Cupom ${couponNumber} não existe no evento`);

  const alreadyImported =
    coupon.pdfUrl != null &&
    coupon.cards.length === 2 &&
    coupon.cards[0].cardNumber === first &&
    coupon.cards[1].cardNumber === second;
  if (alreadyImported && !force) {
    return { file: file.originalName, couponNumber, cardNumbers: [first, second], status: 'skipped', reason: 'já importado' };
  }
  if (coupon.cards.length > 0 && !alreadyImported) {
    const nums = coupon.cards.map((c) => c.cardNumber).join(',');
    if (!force) {
      throw BadRequest(`Cupom ${couponNumber} já tem cartelas divergentes (${nums}); use force para substituir`);
    }
    if (coupon.status !== 'AVAILABLE') {
      throw BadRequest(`Cupom ${couponNumber} (${coupon.status}) tem cartelas divergentes (${nums}) — não pode ser substituído`);
    }
  }

  // VERIFICAÇÃO CENTRAL: números impressos dentro do PDF vs nome do arquivo
  const parsed = await parseBingoPdf(file.filePath);
  if (parsed.topCardNumber !== first || parsed.bottomCardNumber !== second) {
    throw BadRequest(
      `DIVERGÊNCIA: arquivo diz ${first}/${second}, mas o PDF contém ` +
      `${parsed.topCardNumber} (cima) e ${parsed.bottomCardNumber} (baixo)`,
    );
  }

  const { topImagePath, bottomImagePath } = await renderCardHalves(file.filePath, parsed, cardsDir);

  const pdfDest = path.join(pdfsDir, `${first}-${second}.pdf`);
  if (path.resolve(file.filePath) !== path.resolve(pdfDest)) {
    fs.copyFileSync(file.filePath, pdfDest);
  }

  const pdfUrl = `/uploads/coupons/${first}-${second}.pdf`;
  const topUrl = `/uploads/cards/${path.basename(topImagePath)}`;
  const bottomUrl = `/uploads/cards/${path.basename(bottomImagePath)}`;

  await prisma.$transaction(async (tx) => {
    await tx.card.deleteMany({ where: { couponId: coupon.id } });
    await tx.card.create({ data: { couponId: coupon.id, cardNumber: first, cardIndex: 0, imageUrl: topUrl } });
    await tx.card.create({ data: { couponId: coupon.id, cardNumber: second, cardIndex: 1, imageUrl: bottomUrl } });
    await tx.coupon.update({ where: { id: coupon.id }, data: { pdfUrl } });
  });

  return { file: file.originalName, couponNumber, cardNumbers: [first, second], status: 'imported' };
}
