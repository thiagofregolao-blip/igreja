import { env } from '../../config/env.js';

/**
 * Integração Dinelco — Embedded Checkout da Bepsa.
 * Docs: https://dev-sgwf-01.bepsa.com.py/dinelco-checkout/docs/es/
 *
 * Fluxo:
 *  1. createCheckoutSession() -> POST /dinelco-checkout/api/v1/checkout-session
 *     (Authorization: Bearer <SKEY>) devolve { integrityToken, sessionId }.
 *  2. O front embute o checkout num iframe: form POST oculto com input name="JWT"
 *     (o integrityToken) para <base>/d/api/checkout-session/validate, target no iframe.
 *  3. O iframe emite postMessage 'payment.success' | 'payment.failed'.
 *  4. O servidor SEMPRE confirma via getCheckoutSession(sessionId) antes de marcar
 *     o bilhete como pago — o callback/postMessage não tem assinatura, não é confiável.
 */

export function isDinelcoConfigured(): boolean {
  return Boolean(env.DINELCO_SKEY);
}

function baseUrl(): string {
  return env.DINELCO_BASE_URL.replace(/\/$/, '');
}

/** URL que o form oculto do front deve postar (target = iframe). */
export function checkoutFormUrl(): string {
  return `${baseUrl()}/d/api/checkout-session/validate`;
}

async function dinelcoRequest<T = any>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  if (!isDinelcoConfigured()) throw new Error('DINELCO_NOT_CONFIGURED');
  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.DINELCO_SKEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: any;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    const msg = data?.message || data?.error || `Dinelco ${res.status}`;
    throw new Error(`DINELCO_ERROR: ${msg}`);
  }
  return data as T;
}

export interface CreateSessionInput {
  amount: number; // guaranis, sem centavos
  clientReferenceId: string; // ex.: id do Payment
  customer?: { customerId?: string; name?: string; lastname?: string; email?: string; phone?: string };
  metadata?: Record<string, string>;
}

export interface CheckoutSession {
  integrityToken: string;
  sessionId: number | string;
  expirationDate?: string;
}

/**
 * @param origin origem real da requisição (ex.: https://catedralkatuete.com.py),
 *        derivada do request em produção — a Bepsa valida o targetOrigin contra o
 *        domínio que embute o iframe. Fallback: env.FRONTEND_URL.
 */
export async function createCheckoutSession(input: CreateSessionInput, origin?: string): Promise<CheckoutSession> {
  const targetOrigin = origin || env.FRONTEND_URL;
  const body: Record<string, unknown> = {
    amount: input.amount,
    currency: 'PYG',
    targetOrigin,
    clientReferenceId: input.clientReferenceId,
    customer: input.customer,
    metadata: input.metadata,
  };
  // callbackUrl não aceita localhost — só envia quando a origem é https (produção)
  if (targetOrigin.startsWith('https://')) {
    body.callbackUrl = `${targetOrigin.replace(/\/$/, '')}/api/payments/dinelco/callback`;
  }
  return dinelcoRequest<CheckoutSession>('POST', '/dinelco-checkout/api/v1/checkout-session', body);
}

export type DinelcoSessionStatus = 'SUCCESS' | 'PENDING' | 'FAILED';
export type DinelcoPaymentStatus = 'APPROVED' | 'REJECTED' | 'PROCESSING';

export interface SessionState {
  sessionStatus: DinelcoSessionStatus;
  paymentStatus?: DinelcoPaymentStatus;
  operationNumber?: string;
  authorizationCode?: string;
  raw: any;
}

/** Fonte da verdade: consulta o estado da sessão/pagamento na Bepsa. */
export async function getCheckoutSession(sessionId: string | number): Promise<SessionState> {
  const data = await dinelcoRequest<any>('GET', `/dinelco-checkout/api/v1/checkout-session/${sessionId}`);
  return {
    sessionStatus: data?.sessionStatus ?? 'PENDING',
    paymentStatus: data?.payment?.status,
    operationNumber: data?.payment?.operationNumber != null ? String(data.payment.operationNumber) : undefined,
    authorizationCode: data?.payment?.authorizationCode,
    raw: data,
  };
}
