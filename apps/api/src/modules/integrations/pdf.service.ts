import PDFDocument from 'pdfkit';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../../config/env.js';

interface TicketPdfData {
  ticketNumber: number;
  userName: string;
  userCedula: string;
  eventName: string;
  eventDate: Date;
  eventLocation: string;
  startTime: string;
  totalAmount: number;
  coupons: Array<{
    couponNumber: number;
    cards: Array<{
      cardNumber: number;
      imageUrl?: string | null;
      drawNumbers: Array<{ drawOrder: number; prizeName: string; prizeValue: number; numbers: number[] }>;
    }>;
  }>;
  sponsors: Array<{ name: string; logoUrl: string }>;
}

const GOLD = '#f5b800';
const DARK = '#0a0a0a';
const TEXT = '#1a1a1a';

function resolveUploadPath(url: string): string | null {
  if (!url) return null;
  const rel = url.startsWith('/uploads/') ? url.substring(9) : url;
  const full = path.join(env.UPLOAD_DIR, rel);
  return fs.existsSync(full) ? full : null;
}

const M = 40; // margem

export async function generateTicketPdf(data: TicketPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: M });
    const buffers: Buffer[] = [];
    doc.on('data', (b) => buffers.push(b));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const W = doc.page.width;
    const contentW = W - M * 2;

    // ===== Cabeçalho =====
    doc.rect(0, 0, W, 92).fill(DARK);
    doc.fillColor(GOLD).fontSize(20).font('Helvetica-Bold')
       .text('CATEDRAL SAGRADO CORAZÓN', M, 22, { width: contentW, align: 'center' });
    doc.fillColor('#999').fontSize(9).font('Helvetica')
       .text('KATUETÉ • PARAGUAY', M, 50, { width: contentW, align: 'center', characterSpacing: 4 });
    doc.fillColor(GOLD).fontSize(11).font('Helvetica-Bold')
       .text(`BILHETE Nº ${String(data.ticketNumber).padStart(6, '0')}`, M, 70, { width: contentW, align: 'center' });

    // ===== Cartão de dados (comprador, data, valor pago) =====
    let y = 108;
    const infoH = 124;
    doc.roundedRect(M, y, contentW, infoH, 8).fillAndStroke('#faf7ef', GOLD);

    // Bloco do valor pago (destaque à direita)
    const boxW = 160;
    const boxX = M + contentW - boxW - 14;
    doc.roundedRect(boxX, y + 16, boxW, 50, 6).fill(DARK);
    doc.fillColor('#bbb').fontSize(8).font('Helvetica-Bold')
       .text('VALOR PAGO', boxX, y + 24, { width: boxW, align: 'center', characterSpacing: 1 });
    doc.fillColor(GOLD).fontSize(18).font('Helvetica-Bold')
       .text(`Gs. ${data.totalAmount.toLocaleString('es-PY')}`, boxX, y + 38, { width: boxW, align: 'center' });

    // Dados à esquerda
    const ix = M + 16;
    const labelW = boxX - ix - 10;
    doc.fillColor(TEXT).fontSize(15).font('Helvetica-Bold').text(data.eventName, ix, y + 14, { width: labelW });
    const row = (label: string, value: string, yy: number) => {
      doc.fontSize(10).fillColor('#555').font('Helvetica-Bold').text(label, ix, yy, { continued: true });
      doc.fillColor(TEXT).font('Helvetica').text(value);
    };
    let ry = y + 42;
    row('Comprador: ', data.userName, ry); ry += 16;
    row('Cédula: ', data.userCedula, ry); ry += 16;
    row('Data do bingo: ', `${formatDate(data.eventDate)}  •  ${data.startTime}`, ry); ry += 16;
    row('Local: ', data.eventLocation, ry);

    y += infoH + 22;

    // ===== Cartelas =====
    doc.fillColor(GOLD).fontSize(14).font('Helvetica-Bold').text('SUAS CARTELAS', M, y);
    y += 24;

    renderCoupons(doc, data, y);
    renderSponsors(doc, data.sponsors);
    doc.end();
  });
}

function renderCoupons(doc: PDFKit.PDFDocument, data: TicketPdfData, startY: number) {
  const W = doc.page.width;
  const contentW = W - M * 2;
  const bottom = doc.page.height - M;
  let y = startY;

  for (const coupon of data.coupons) {
    // Barra do cupom
    if (y + 30 > bottom) { doc.addPage(); y = M; }
    doc.roundedRect(M, y, contentW, 26, 6).fillAndStroke(DARK, GOLD);
    doc.fillColor(GOLD).fontSize(11).font('Helvetica-Bold')
       .text(`CUPOM Nº ${coupon.couponNumber}`, M + 14, y + 8);
    doc.fillColor('#ccc').fontSize(9).font('Helvetica')
       .text(`${coupon.cards.length} cartelas`, M, y + 9, { width: contentW - 14, align: 'right' });
    y += 34;

    for (const card of coupon.cards) {
      const imgPath = card.imageUrl ? resolveUploadPath(card.imageUrl) : null;

      // Imagem em LARGURA TOTAL (números grandes e legíveis). Altura proporcional.
      let imgH = 130;
      let img: any = null;
      if (imgPath) {
        try {
          img = (doc as any).openImage(imgPath);
          imgH = contentW * (img.height / img.width);
        } catch { img = null; }
      }

      const blockH = 18 + imgH + 14;
      if (y + blockH > bottom) { doc.addPage(); y = M; }

      doc.fillColor(TEXT).fontSize(12).font('Helvetica-Bold')
         .text(`Cartão Nº ${card.cardNumber}`, M, y);
      y += 18;

      if (img) {
        // moldura suave ao redor da cartela
        doc.roundedRect(M, y, contentW, imgH, 4).stroke('#e6e1d5');
        try { doc.image(img, M, y, { width: contentW }); } catch {}
      } else {
        doc.roundedRect(M, y, contentW, imgH, 4).fillAndStroke('#f7f7f7', '#e6e1d5');
        doc.fillColor('#999').fontSize(10).font('Helvetica')
           .text('Cartela indisponível', M, y + imgH / 2 - 6, { width: contentW, align: 'center' });
      }
      y += imgH + 16;
    }
    y += 8;
  }
}

function renderSponsors(doc: PDFKit.PDFDocument, sponsors: Array<{ name: string; logoUrl: string }>) {
  if (sponsors.length === 0) return;
  doc.addPage();
  doc.rect(0, 0, doc.page.width, 60).fill(DARK);
  doc.fillColor(GOLD).fontSize(18).font('Helvetica-Bold')
     .text('NOSSOS PATROCINADORES', 40, 20, { width: doc.page.width - 80, align: 'center' });

  const cols = 5;
  const cellW = (doc.page.width - 80) / cols;
  const cellH = 70;
  let x = 40;
  let y = 80;

  for (const sp of sponsors) {
    const imgPath = resolveUploadPath(sp.logoUrl);
    if (imgPath) {
      try {
        doc.image(imgPath, x + 8, y + 8, { fit: [cellW - 16, cellH - 24] });
      } catch {}
    }
    doc.fillColor('#666').fontSize(7).font('Helvetica')
       .text(sp.name, x + 4, y + cellH - 14, { width: cellW - 8, align: 'center' });
    x += cellW;
    if (x + cellW > doc.page.width - 40) {
      x = 40;
      y += cellH;
      if (y + cellH > doc.page.height - 40) {
        doc.addPage();
        y = 40;
      }
    }
  }
}

function formatDate(d: Date): string {
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}
