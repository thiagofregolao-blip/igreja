import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { prisma } from '../../lib/prisma.js';
import { BadRequest, Conflict, Forbidden, Unauthorized } from '../../lib/errors.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './tokens.js';
import { sendPasswordResetEmail } from '../integrations/email.service.js';
import type { RegisterInput, LoginInput } from './auth.schemas.js';

const SALT_ROUNDS = 12;

export function toPublicUser(u: { id: string; name: string; cedula: string; phone: string; email: string; role: string; preferredLanguage: string }) {
  return {
    id: u.id,
    name: u.name,
    cedula: u.cedula,
    phone: u.phone,
    email: u.email,
    role: u.role as 'ADMIN' | 'CUSTOMER',
    preferredLanguage: u.preferredLanguage as 'pt' | 'es',
  };
}

export async function registerUser(input: RegisterInput) {
  const existsEmail = await prisma.user.findUnique({ where: { email: input.email } });
  if (existsEmail) throw Conflict('Email já cadastrado');

  const existsCedula = await prisma.user.findUnique({ where: { cedula: input.cedula } });
  if (existsCedula) throw Conflict('Cédula já cadastrada');

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      cedula: input.cedula,
      phone: input.phone,
      email: input.email,
      passwordHash,
      preferredLanguage: input.preferredLanguage,
    },
  });

  return issueTokens(user);
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw Unauthorized('Credenciais inválidas');
  if (user.isBlocked) throw Forbidden('Conta bloqueada. Entre em contato com a paróquia.');

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw Unauthorized('Credenciais inválidas');

  return issueTokens(user);
}

export async function refreshTokens(refreshToken: string) {
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw Unauthorized('Refresh token inválido');
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw Unauthorized();
  if (user.isBlocked) throw Forbidden('Conta bloqueada');
  return issueTokens(user);
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // não revela existência da conta
  if (!user) return;

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpires: expires },
  });

  await sendPasswordResetEmail(user.email, user.name, token, user.preferredLanguage as 'pt' | 'es');
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: { resetToken: token, resetTokenExpires: { gt: new Date() } },
  });
  if (!user) throw BadRequest('Token inválido ou expirado');
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpires: null },
  });
}

function issueTokens(user: { id: string; name: string; cedula: string; phone: string; email: string; role: string; preferredLanguage: string }) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role as any, email: user.email });
  const refreshToken = signRefreshToken({ sub: user.id });
  return { accessToken, refreshToken, user: toPublicUser(user) };
}
