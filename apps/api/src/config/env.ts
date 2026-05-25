import 'dotenv/config';

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

  UPLOAD_DIR: optional('UPLOAD_DIR', './uploads'),
  MAX_UPLOAD_MB: int('MAX_UPLOAD_MB', 5),

  FRONTEND_URL: optional('FRONTEND_URL', 'http://localhost:5173'),
  ADMIN_URL: optional('ADMIN_URL', 'http://localhost:5174'),
  API_URL: optional('API_URL', 'http://localhost:3000'),

  RESERVATION_TTL_MINUTES: int('RESERVATION_TTL_MINUTES', 15),
};

export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
