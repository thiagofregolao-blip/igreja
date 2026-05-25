import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { prisma } from '../../lib/prisma.js';

export interface ReportFilters {
  eventId?: string;
  startDate?: Date;
  endDate?: Date;
}

async function fetchReportData(filters: ReportFilters) {
  return prisma.ticket.findMany({
    where: {
      ...(filters.eventId && { eventId: filters.eventId }),
      ...((filters.startDate || filters.endDate) && {
        createdAt: {
          ...(filters.startDate && { gte: filters.startDate }),
          ...(filters.endDate && { lte: filters.endDate }),
        },
      }),
    },
    orderBy: [{ event: { name: 'asc' } }, { ticketNumber: 'asc' }],
    include: {
      user: true,
      event: { select: { name: true } },
      payment: true,
      coupons: {
        select: { couponNumber: true, cards: { select: { cardNumber: true } } },
        orderBy: { couponNumber: 'asc' },
      },
    },
  });
}

export async function generateExcelReport(filters: ReportFilters): Promise<Buffer> {
  const tickets = await fetchReportData(filters);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Catedral Sagrado Corazón';
  wb.created = new Date();
  const ws = wb.addWorksheet('Bilhetes', { properties: { tabColor: { argb: 'FFF5B800' } } });

  ws.columns = [
    { header: 'Evento', key: 'event', width: 30 },
    { header: 'Bilhete Nº', key: 'ticketNumber', width: 12 },
    { header: 'Nome', key: 'name', width: 28 },
    { header: 'Cédula', key: 'cedula', width: 14 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Telefone', key: 'phone', width: 16 },
    { header: 'Cupons', key: 'coupons', width: 20 },
    { header: 'Cartões', key: 'cards', width: 30 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Valor (Gs.)', key: 'amount', width: 14 },
    { header: 'Confirmado em', key: 'confirmedAt', width: 18 },
  ];

  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A0A0A' } };
  ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 24;

  let totalRevenue = 0;
  let totalPaid = 0;

  for (const t of tickets) {
    const coupons = t.coupons.map((c) => c.couponNumber).join(', ');
    const cards = t.coupons.flatMap((c) => c.cards.map((card) => card.cardNumber)).join(', ');
    ws.addRow({
      event: t.event.name,
      ticketNumber: t.ticketNumber,
      name: t.user.name,
      cedula: t.user.cedula,
      email: t.user.email,
      phone: t.user.phone,
      coupons,
      cards,
      status: t.status,
      amount: t.totalAmount,
      confirmedAt: t.payment?.confirmedAt ? new Date(t.payment.confirmedAt).toLocaleString('pt-BR') : '',
    });
    if (t.status === 'PAID') {
      totalRevenue += t.totalAmount;
      totalPaid++;
    }
  }

  ws.addRow([]);
  const totalRow = ws.addRow({
    event: 'TOTAL ARRECADADO',
    ticketNumber: `${totalPaid} bilhetes pagos`,
    amount: totalRevenue,
  });
  totalRow.font = { bold: true, size: 12 };
  totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5B800' } };

  ws.getColumn('amount').numFmt = '#,##0';

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function generatePdfReport(filters: ReportFilters): Promise<Buffer> {
  const tickets = await fetchReportData(filters);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 30, layout: 'landscape' });
    const buffers: Buffer[] = [];
    doc.on('data', (b) => buffers.push(b));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.rect(0, 0, doc.page.width, 60).fill('#0a0a0a');
    doc.fillColor('#f5b800').fontSize(18).font('Helvetica-Bold')
       .text('RELATÓRIO DE BILHETES — CATEDRAL SAGRADO CORAZÓN', 30, 20, { width: doc.page.width - 60, align: 'center' });
    doc.fillColor('#888').fontSize(9)
       .text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 30, 44, { width: doc.page.width - 60, align: 'center' });

    doc.y = 80;
    doc.fillColor('#000');

    const headers = ['Evento', 'Nº', 'Cliente', 'Cédula', 'Cupons', 'Status', 'Gs.'];
    const widths = [180, 40, 150, 70, 100, 60, 80];

    drawRow(doc, headers, widths, true);
    let totalRevenue = 0;
    let totalPaid = 0;
    for (const t of tickets) {
      if (doc.y > doc.page.height - 60) {
        doc.addPage();
        drawRow(doc, headers, widths, true);
      }
      drawRow(doc, [
        t.event.name,
        String(t.ticketNumber),
        t.user.name,
        t.user.cedula,
        t.coupons.map((c) => c.couponNumber).join(', '),
        t.status,
        t.totalAmount.toLocaleString('es-PY'),
      ], widths, false);
      if (t.status === 'PAID') {
        totalRevenue += t.totalAmount;
        totalPaid++;
      }
    }

    doc.moveDown(1);
    doc.rect(30, doc.y, doc.page.width - 60, 30).fill('#f5b800');
    doc.fillColor('#0a0a0a').fontSize(13).font('Helvetica-Bold')
       .text(`TOTAL ARRECADADO: Gs. ${totalRevenue.toLocaleString('es-PY')} (${totalPaid} bilhetes)`,
         40, doc.y - 22, { width: doc.page.width - 80, align: 'center' });

    doc.end();
  });
}

function drawRow(doc: PDFKit.PDFDocument, cols: string[], widths: number[], header: boolean) {
  let x = 30;
  const y = doc.y;
  const rowH = 20;
  if (header) {
    doc.rect(30, y, doc.page.width - 60, rowH).fill('#0a0a0a');
    doc.fillColor('#f5b800').fontSize(9).font('Helvetica-Bold');
  } else {
    doc.fillColor('#000').fontSize(9).font('Helvetica');
  }
  for (let i = 0; i < cols.length; i++) {
    doc.text(cols[i] ?? '', x + 4, y + 6, { width: widths[i] - 8, ellipsis: true, lineBreak: false });
    x += widths[i];
  }
  doc.y = y + rowH;
}
