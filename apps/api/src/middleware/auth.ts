import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Forbidden, Unauthorized } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';

export interface AuthPayload {
  sub: string;
  role: 'ADMIN' | 'CUSTOMER';
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export async function authRequired(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next(Unauthorized('Token ausente'));

    const token = header.substring(7);
    let payload: AuthPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    } catch {
      return next(Unauthorized('Token inválido ou expirado'));
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return next(Unauthorized('Usuário não encontrado'));
    if (user.isBlocked) return next(Forbidden('Conta bloqueada'));
    req.user = { sub: user.id, role: user.role as 'ADMIN' | 'CUSTOMER', email: user.email };
    next();
  } catch (e) {
    next(e);
  }
}

export function requireRole(role: 'ADMIN' | 'CUSTOMER') {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(Unauthorized());
    if (req.user.role !== role) return next(Forbidden(`Requer perfil ${role}`));
    next();
  };
}

export const requireAdmin = requireRole('ADMIN');
