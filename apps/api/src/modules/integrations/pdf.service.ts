import PDFDocument from 'pdfkit';
import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';
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

export async function generateTicketPdf(data: TicketPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const buffers: Buffer[] = [];
    doc.on('data', (b) => buffers.push(b));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header
    doc.rect(0, 0, doc.page.width, 90).fill(DARK);
    doc.fillColor(GOLD).fontSize(20).font('Helvetica-Bold')
       .text('CATEDRAL SAGRADO CORAZÓN', 40, 24, { width: doc.page.width - 80, align: 'center' });
    doc.fillColor('#999').fontSize(9).font('Helvetica')
       .text('KATUETÉ • PARAGUAY', 40, 52, { width: doc.page.width - 80, align: 'center', characterSpacing: 4 });
    doc.fillColor(GOLD).fontSize(11).font('Helvetica-Bold')
       .text(`BILHETE Nº ${String(data.ticketNumber).padStart(6, '0')}`, 40, 70, { width: doc.page.width - 80, align: 'center' });

    doc.y = 110;
    doc.fillColor(TEXT);

    // Event info card
    doc.roundedRect(40, doc.y, doc.page.width - 80, 80, 8).fillAndStroke('#f9f9f9', GOLD);
    doc.fillColor(TEXT).fontSize(16).font('Helvetica-Bold').text(data.eventName, 56, doc.y - 70);
    doc.fontSize(10).font('Helvetica').fillColor('#444')
       .text(`📍 ${data.eventLocation}`, 56, doc.y - 50)
       .text(`📅 ${formatDate(data.eventDate)} • ⏰ ${data.startTime}`, 56, doc.y - 36);
    doc.fontSize(11).fillColor(TEXT).font('Helvetica-Bold')
       .text(`Comprador: ${data.userName}`, 56, doc.y - 20)
       .text(`Cédula: ${data.userCedula}`, doc.page.width - 250, doc.y - 32, { width: 200, align: 'right' });

    doc.y += 20;

    // QR Code
    QRCode.toBuffer(`${env.FRONTEND_URL}/ticket/verify/${data.ticketNumber}`, { width: 100, margin: 0 })
      .then((qrBuffer) => {
        doc.image(qrBuffer, doc.page.width - 130, 200, { width: 80 });
        renderCoupons(doc, data, () => {
          renderSponsors(doc, data.sponsors);
          doc.end();
        });
      })
      .catch(() => {
        renderCoupons(doc, data, () => {
          renderSponsors(doc, data.sponsors);
          doc.end();
        });
      });
  });
}

function renderCoupons(doc: PDFKit.PDFDocument, data: TicketPdfData, done: () => void) {
  let y = 300;
  doc.fillColor(GOLD).fontSize(14).font('Helvetica-Bold').text('SUAS CARTELAS', 40, y);
  y += 24;

  for (const coupon of data.coupons) {
    if (y > doc.page.height - 200) {
      doc.addPage();
      y = 40;
    }
    doc.roundedRect(40, y, doc.page.width - 80, 28, 6).fillAndStroke(DARK, GOLD);
    doc.fillColor(GOLD).fontSize(12).font('Helvetica-Bold')
       .text(`CUPOM Nº ${coupon.couponNumber}`, 56, y + 8);
    doc.fillColor('#ccc').fontSize(9).font('Helvetica')
       .text(`${coupon.cards.length} cartões`, doc.page.width - 120, y + 10, { width: 70, align: 'right' });
    y += 36;

    for (const card of coupon.cards) {
      if (y > doc.page.height - 160) {
        doc.addPage();
        y = 40;
      }
      doc.fillColor(TEXT).fontSize(11).font('Helvetica-Bold')
         .text(`Cartão Nº ${card.cardNumber}`, 40, y);
      y += 16;

      // Imagem da cartela se existir
      const imgPath = card.imageUrl ? resolveUploadPath(card.imageUrl) : null;
      if (imgPath) {
        try {
          doc.image(imgPath, 40, y, { fit: [200, 120] });
        } catch {}
      }

      // Grade de números por sorteio
      let nx = imgPath ? 260 : 40;
      let ny = y;
      for (const draw of card.drawNumbers) {
        if (nx + 140 > doc.page.width - 40) { nx = imgPath ? 260 : 40; ny += 90; }
        doc.fillColor(GOLD).fontSize(8).font('Helvetica-Bold')
           .text(`${draw.drawOrder}º SORTEIO`, nx, ny, { width: 130 });
        doc.fillColor('#666').fontSize(7).font('Helvetica')
           .text(`Gs. ${draw.prizeValue.toLocaleString('es-PY')}`, nx, ny + 10, { width: 130 });
        doc.fillColor(TEXT).fontSize(9).font('Courier-Bold')
           .text(draw.numbers.join('  '), nx, ny + 24, { width: 130 });
        nx += 145;
      }
      y += 130;
    }
    y += 8;
  }
  done();
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
