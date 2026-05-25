import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../lib/errors.js';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Dados inválidos',
      details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.name,
      message: err.message,
      details: err.details,
    });
  }

  console.error('[unhandled]', err);
  res.status(500).json({
    error: 'InternalServerError',
    message: 'Erro interno do servidor',
  });
};

export const notFound = (req: any, res: any) => {
  res.status(404).json({ error: 'NotFound', message: `Rota ${req.method} ${req.path} não existe` });
};
