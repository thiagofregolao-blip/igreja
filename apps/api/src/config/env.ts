import 'dotenv/config';
import path from 'node:path';

// Raiz do app da API (apps/api), independente do cwd de quem iniciou o processo
// (src/config em dev, dist/config no build — ../.. chega em apps/api nos dois casos)
const API_ROOT = path.resolve(__dirname, '../..');

// Em produção web+admin+api são a MESMA origem (serviço único). O Railway expõe
// automaticamente RAILWAY_PUBLIC_DOMAIN — usamos como default para FRONTEND/ADMIN/API
// URL, evitando localhost em emails/links/logs sem precisar setar variável manual.
const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN;
const publicOrigin = railwayDomain ? `https://${railwayDomain}` : undefined;

function required(key: string, fallback?: string): string {
  const v = process.env[key] ?? fallback;
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

function optional(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

function int(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return isNaN(n) ? fallback : n;
}

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: int('PORT', 3000),
  DATABASE_URL: required('DATABASE_URL'),

  JWT_SECRET: required('JWT_SECRET', 'dev-jwt-secret-change-me'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me'),
  JWT_ACCESS_EXPIRES: optional('JWT_ACCESS_EXPIRES', '15m'),
  JWT_REFRESH_EXPIRES: optional('JWT_REFRESH_EXPIRES', '7d'),

  ADMIN_NAME: optional('ADMIN_NAME', 'Administrador'),
  ADMIN_EMAIL: optional('ADMIN_EMAIL', 'admin@catedralkatuete.org'),
  ADMIN_CEDULA: optional('ADMIN_CEDULA', '0000000'),
  ADMIN_PHONE: optional('ADMIN_PHONE', '+595981000000'),
  ADMIN_PASSWORD: optional('ADMIN_PASSWORD', 'ChangeMe123!'),

  RESEND_API_KEY: optional('RESEND_API_KEY'),
  EMAIL_FROM: optional('EMAIL_FROM', 'Catedral Sagrado Corazón <no-reply@catedralkatuete.org>'),

  WHATSAPP_PROVIDER: optional('WHATSAPP_PROVIDER', 'zapi'),
  ZAPI_INSTANCE_ID: optional('ZAPI_INSTANCE_ID'),
  ZAPI_TOKEN: optional('ZAPI_TOKEN'),
  ZAPI_CLIENT_TOKEN: optional('ZAPI_CLIENT_TOKEN'),
  EVOLUTION_BASE_URL: optional('EVOLUTION_BASE_URL'),
  EVOLUTION_INSTANCE: optional('EVOLUTION_INSTANCE'),
  EVOLUTION_API_KEY: optional('EVOLUTION_API_KEY'),

  BANCARD_API_KEY: optional('BANCARD_API_KEY'),
  BANCARD_PRIVATE_KEY: optional('BANCARD_PRIVATE_KEY'),
  BANCARD_PUBLIC_KEY: optional('BANCARD_PUBLIC_KEY'),
  BANCARD_WEBHOOK_SECRET: optional('BANCARD_WEBHOOK_SECRET'),

  // ===== Dinelco — Embedded Checkout da Bepsa (cartão online) =====
  // DINELCO_SKEY: API key secreta do comércio (portal Bepsa).
  // DINELCO_BASE_URL: host do ambiente — dev/sandbox por padrão; troque pelo de produção quando a Bepsa liberar.
  DINELCO_SKEY: optional('DINELCO_SKEY'),
  DINELCO_BASE_URL: optional('DINELCO_BASE_URL', 'https://dev-sgwf-01.bepsa.com.py'),

  // Relativo -> resolvido a partir de apps/api (não do cwd); absoluto (ex. /data/uploads) fica como está
  UPLOAD_DIR: path.resolve(API_ROOT, optional('UPLOAD_DIR', './uploads')),
  MAX_UPLOAD_MB: int('MAX_UPLOAD_MB', 5),

  FRONTEND_URL: optional('FRONTEND_URL', publicOrigin ?? 'http://localhost:5173'),
  ADMIN_URL: optional('ADMIN_URL', publicOrigin ? `${publicOrigin}/admin` : 'http://localhost:5174'),
  API_URL: optional('API_URL', publicOrigin ?? 'http://localhost:3000'),

  RESERVATION_TTL_MINUTES: int('RESERVATION_TTL_MINUTES', 15),
};

export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
