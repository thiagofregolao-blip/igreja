import { env } from '../../config/env.js';

interface WhatsAppMessage {
  to: string;
  text: string;
  pdfBase64?: string;
  pdfFilename?: string;
}

export async function sendWhatsApp(msg: WhatsAppMessage): Promise<void> {
  if (env.WHATSAPP_PROVIDER === 'zapi') {
    return sendViaZApi(msg);
  }
  if (env.WHATSAPP_PROVIDER === 'evolution') {
    return sendViaEvolution(msg);
  }
  console.warn('[whatsapp:disabled] no provider configured');
}

async function sendViaZApi(msg: WhatsAppMessage): Promise<void> {
  if (!env.ZAPI_INSTANCE_ID || !env.ZAPI_TOKEN) {
    console.warn(`[zapi:disabled] -> ${msg.to}`);
    return;
  }
  const base = `https://api.z-api.io/instances/${env.ZAPI_INSTANCE_ID}/token/${env.ZAPI_TOKEN}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (env.ZAPI_CLIENT_TOKEN) headers['Client-Token'] = env.ZAPI_CLIENT_TOKEN;

  try {
    await fetch(`${base}/send-text`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ phone: normalize(msg.to), message: msg.text }),
    });
    if (msg.pdfBase64 && msg.pdfFilename) {
      await fetch(`${base}/send-document/pdf`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          phone: normalize(msg.to),
          document: `data:application/pdf;base64,${msg.pdfBase64}`,
          fileName: msg.pdfFilename,
        }),
      });
    }
  } catch (e) {
    console.error('[zapi:error]', e);
  }
}

async function sendViaEvolution(msg: WhatsAppMessage): Promise<void> {
  if (!env.EVOLUTION_BASE_URL || !env.EVOLUTION_INSTANCE || !env.EVOLUTION_API_KEY) {
    console.warn(`[evolution:disabled] -> ${msg.to}`);
    return;
  }
  const headers = {
    'Content-Type': 'application/json',
    apikey: env.EVOLUTION_API_KEY,
  };
  try {
    await fetch(`${env.EVOLUTION_BASE_URL}/message/sendText/${env.EVOLUTION_INSTANCE}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ number: normalize(msg.to), text: msg.text }),
    });
    if (msg.pdfBase64 && msg.pdfFilename) {
      await fetch(`${env.EVOLUTION_BASE_URL}/message/sendMedia/${env.EVOLUTION_INSTANCE}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          number: normalize(msg.to),
          mediatype: 'document',
          media: msg.pdfBase64,
          fileName: msg.pdfFilename,
        }),
      });
    }
  } catch (e) {
    console.error('[evolution:error]', e);
  }
}

function normalize(phone: string): string {
  return phone.replace(/\D/g, '');
}

export async function sendTicketWhatsApp(
  phone: string,
  name: string,
  eventName: string,
  ticketNumber: number,
  pdfBuffer: Buffer,
  lang: 'pt' | 'es',
) {
  const text = lang === 'es'
    ? `*¡Hola ${name}!* 🎉\n\nTu compra del *Bingo "${eventName}"* fue confirmada.\n\n*Boleto Nº ${ticketNumber}*\n\nAdjuntamos tu cartón en PDF. ¡Mucha suerte!\n\n_Catedral Sagrado Corazón — Katueté_`
    : `*Olá ${name}!* 🎉\n\nSua compra do *Bingo "${eventName}"* foi confirmada.\n\n*Bilhete Nº ${ticketNumber}*\n\nEm anexo, sua cartela em PDF. Boa sorte!\n\n_Catedral Sagrado Corazón — Katueté_`;

  await sendWhatsApp({
    to: phone,
    text,
    pdfBase64: pdfBuffer.toString('base64'),
    pdfFilename: `bingo-${ticketNumber}.pdf`,
  });
}
