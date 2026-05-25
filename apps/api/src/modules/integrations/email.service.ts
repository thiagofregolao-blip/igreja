import { Resend } from 'resend';
import { env } from '../../config/env.js';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}

async function send(opts: EmailOptions): Promise<void> {
  if (!resend) {
    console.warn(`[email:disabled] -> ${opts.to} :: ${opts.subject}`);
    return;
  }
  try {
    await resend.emails.send({
      from: env.EMAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      attachments: opts.attachments?.map((a) => ({ filename: a.filename, content: a.content })),
    });
  } catch (e) {
    console.error('[email:error]', e);
  }
}

export async function sendPasswordResetEmail(email: string, name: string, token: string, lang: 'pt' | 'es') {
  const url = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  const subject = lang === 'es' ? 'Recuperación de contraseña' : 'Recuperação de senha';
  const greeting = lang === 'es' ? `Hola ${name}` : `Olá ${name}`;
  const body = lang === 'es'
    ? 'Recibimos una solicitud para restablecer tu contraseña. El enlace expira en 1 hora.'
    : 'Recebemos uma solicitação para redefinir sua senha. O link expira em 1 hora.';
  const cta = lang === 'es' ? 'Restablecer contraseña' : 'Redefinir senha';

  await send({
    to: email,
    subject,
    html: brandedTemplate(greeting, body, cta, url),
  });
}

export async function sendTicketConfirmationEmail(
  email: string,
  name: string,
  eventName: string,
  ticketNumber: number,
  pdfBuffer: Buffer,
  lang: 'pt' | 'es',
) {
  const subject = lang === 'es'
    ? `Compra confirmada — Bingo #${ticketNumber}`
    : `Compra confirmada — Bingo #${ticketNumber}`;
  const greeting = lang === 'es' ? `¡Hola ${name}!` : `Olá ${name}!`;
  const body = lang === 'es'
    ? `Tu pago fue confirmado. Adjuntamos tu boleto del evento "${eventName}". ¡Buena suerte!`
    : `Seu pagamento foi confirmado. Em anexo está seu bilhete do evento "${eventName}". Boa sorte!`;

  await send({
    to: email,
    subject,
    html: brandedTemplate(greeting, body, '', ''),
    attachments: [{ filename: `bingo-${ticketNumber}.pdf`, content: pdfBuffer }],
  });
}

export async function sendPendingPaymentEmail(
  email: string,
  name: string,
  ticketNumber: number,
  amount: number,
  lang: 'pt' | 'es',
) {
  const subject = lang === 'es'
    ? `Boleto reservado — pendiente de pago #${ticketNumber}`
    : `Bilhete reservado — aguardando pagamento #${ticketNumber}`;
  const greeting = lang === 'es' ? `Hola ${name}` : `Olá ${name}`;
  const body = lang === 'es'
    ? `Tu boleto #${ticketNumber} fue reservado por Gs. ${amount.toLocaleString('es-PY')}. Envíanos el comprobante de pago.`
    : `Seu bilhete #${ticketNumber} foi reservado por Gs. ${amount.toLocaleString('es-PY')}. Envie o comprovante para confirmação.`;

  await send({
    to: email,
    subject,
    html: brandedTemplate(greeting, body, lang === 'es' ? 'Ver mi boleto' : 'Ver meu bilhete', `${env.FRONTEND_URL}/my-tickets`),
  });
}

function brandedTemplate(greeting: string, body: string, cta: string, url: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;color:#fff;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#f5b800;font-size:24px;margin:0;letter-spacing:2px;">CATEDRAL SAGRADO CORAZÓN</h1>
      <p style="color:#888;font-size:12px;margin:4px 0 0;letter-spacing:4px;">KATUETÉ • PARAGUAY</p>
    </div>
    <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:16px;padding:32px;">
      <p style="font-size:18px;margin:0 0 16px;color:#f5b800;">${greeting}</p>
      <p style="font-size:15px;line-height:1.6;color:#ddd;margin:0 0 24px;">${body}</p>
      ${cta && url ? `<a href="${url}" style="display:inline-block;background:#f5b800;color:#000;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;">${cta}</a>` : ''}
    </div>
    <p style="text-align:center;color:#666;font-size:12px;margin-top:24px;">
      Você está recebendo este email da Catedral Sagrado Corazón de Katueté, Paraguay.
    </p>
  </div>
</body>
</html>
`.trim();
}
