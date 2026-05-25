export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = 'HttpError';
  }
}

export const BadRequest = (msg: string, details?: unknown) => new HttpError(400, msg, details);
export const Unauthorized = (msg = 'Não autorizado') => new HttpError(401, msg);
export const Forbidden = (msg = 'Acesso negado') => new HttpError(403, msg);
export const NotFound = (msg = 'Não encontrado') => new HttpError(404, msg);
export const Conflict = (msg: string, details?: unknown) => new HttpError(409, msg, details);
export const TooMany = (msg = 'Muitas requisições') => new HttpError(429, msg);
