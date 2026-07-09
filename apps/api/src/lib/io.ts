import type { Server as IOServer } from 'socket.io';

let io: IOServer | null = null;

export function setIO(server: IOServer) {
  io = server;
}

export function getIO(): IOServer | null {
  return io;
}

export function emitCouponUpdate(eventId: string, payload: unknown) {
  io?.to(`event:${eventId}`).emit('coupon:update', payload);
}

export function emitEventUpdate(eventId: string, payload: unknown) {
  io?.to(`event:${eventId}`).emit('event:update', payload);
}

/** Pede aos clientes conectados que recarreguem a lista de cupons (mudança em massa). */
export function emitCouponsRefresh(eventId: string) {
  io?.to(`event:${eventId}`).emit('coupon:update', { refresh: true, eventId });
}
