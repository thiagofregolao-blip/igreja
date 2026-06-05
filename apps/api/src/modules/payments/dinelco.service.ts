import crypto from 'node:crypto';
import { env } from '../../config/env.js';

/**
 * Integração Dinelco (Cybersource) — pagamento com cartão no próprio checkout.
 *
 * Modelo (Microform v2 / Flex):
 *  1. createCaptureContext()  -> servidor gera um capture context (JWT) p/ o front montar
 *     os campos seguros do cartão (hospedados pela Cybersource/Dinelco).
 *  2. O front tokeniza o cartão e devolve um "transient token".
 *  3. processPayment()        -> servidor cobra usando o transient token.
 *
 * Autenticação Cybersource REST = HTTP Signature (Merchant ID + key id + shared secret).
 *
 * ⚠️ Pré-requisito: cadastrar o comércio na Dinelco/Bepsa e obter as credenciais
 * (CYBS_MERCHANT_ID, CYBS_API_KEY_ID, CYBS_SECRET_KEY) para sandbox e produção.
 * Confirmar com a Bepsa qual produto foi habilitado (Microform/Flex, Unified Checkout
 * ou Secure Acceptance) — pode exigir pequenos ajustes nos endpoints abaixo.
 */

const HOSTS = {
  sandbox: 'apitest.cybersource.com',
  production: 'api.cybersource.com',
} as const;

export function isCybsConfigured(): boolean {
  return Boolean(env.CYBS_MERCHANT_ID && env.CYBS_API_KEY_ID && env.CYBS_SECRET_KEY);
}

function host(): string {
  return env.CYBS_RUN_ENV === 'production' ? HOSTS.production : HOSTS.sandbox;
}

/** Assina e executa uma requisição REST autenticada na Cybersource. */
async function cybsRequest<T = any>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  if (!isCybsConfigured()) {
    throw new Error('CYBS_NOT_CONFIGURED');
  }
  const h = host();
  const merchantId = env.CYBS_MERCHANT_ID;
  const keyId = env.CYBS_API_KEY_ID;
  const secret = env.CYBS_SECRET_KEY;
  const date = new Date().toUTCString();
  const payload = body ? JSON.stringify(body) : '';

  const headers: Record<string, string> = {
    'v-c-merchant-id': merchantId,
    Date: date,
    Host: h,
    'User-Agent': 'catedral-bingo/1.0',
  };

  // Cabeçalhos que entram na assinatura
  let signedHeaders = 'host date (request-target) v-c-merchant-id';
  const lines = [
    `host: ${h}`,
    `date: ${date}`,
    `(request-target): ${method.toLowerCase()} ${path}`,
  ];

  if (method === 'POST') {
    const digest = 'SHA-256=' + crypto.createHash('sha256').update(payload, 'utf8').digest('base64');
    headers['Digest'] = digest;
    headers['Content-Type'] = 'application/json';
    signedHeaders = 'host date (request-target) digest v-c-merchant-id';
    lines.push(`digest: ${digest}`);
  }
  lines.push(`v-c-merchant-id: ${merchantId}`);

  const signingString = lines.join('\n');
  const signature = crypto
    .createHmac('sha256', Buffer.from(secret, 'base64'))
    .update(signingString, 'utf8')
    .digest('base64');

  headers['Signature'] =
    `keyid="${keyId}", algorithm="HmacSHA256", headers="${signedHeaders}", signature="${signature}"`;

  const res = await fetch(`https://${h}${path}`, { method, headers, body: payload || undefined });
  const text = await res.text();
  let data: any;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    const msg = data?.message || data?.responseStatus?.message || `Cybersource ${res.status}`;
    throw new Error(`CYBS_ERROR: ${msg}`);
  }
  return data as T;
}

/**
 * Gera o capture context (JWT) para inicializar o Microform no front.
 * @param targetOrigin origem do site (ex.: https://catedralkatuete.com.py)
 */
export async function createCaptureContext(targetOrigin: string): Promise<string> {
  const data = await cybsRequest<any>('POST', '/microform/v2/sessions', {
    targetOrigins: [targetOrigin],
    clientVersion: 'v2.0',
    allowedCardNetworks: ['VISA', 'MASTERCARD'],
  });
  // A resposta pode vir como string (JWT) ou objeto com o JWT em keyId/captureContext.
  if (typeof data === 'string') return data;
  return data.captureContext || data.keyId || data.jwt || JSON.stringify(data);
}

export interface PayInput {
  transientTokenJwt: string;
  amount: number; // em guaranis (sem centavos)
  currency?: string; // PYG por padrão
  reference: string; // ex.: número do bilhete
  billTo?: { firstName?: string; lastName?: string; email?: string };
}

export interface PayResult {
  approved: boolean;
  status: string; // AUTHORIZED, DECLINED, ...
  transactionId?: string;
  approvalCode?: string;
  raw: any;
}

/** Cobra um pagamento com o transient token gerado pelo Microform. */
export async function processPayment(input: PayInput): Promise<PayResult> {
  const currency = input.currency || 'PYG';
  const data = await cybsRequest<any>('POST', '/pts/v2/payments', {
    clientReferenceInformation: { code: input.reference },
    processingInformation: { commerceIndicator: 'internet', capture: true },
    orderInformation: {
      amountDetails: { totalAmount: String(input.amount), currency },
      billTo: input.billTo
        ? {
            firstName: input.billTo.firstName,
            lastName: input.billTo.lastName,
            email: input.billTo.email,
            country: 'PY',
          }
        : undefined,
    },
    tokenInformation: { transientTokenJwt: input.transientTokenJwt },
  });

  const status = data?.status ?? 'UNKNOWN';
  const approved = status === 'AUTHORIZED' || status === 'PENDING';
  return {
    approved,
    status,
    transactionId: data?.id,
    approvalCode: data?.processorInformation?.approvalCode,
    raw: data,
  };
}
