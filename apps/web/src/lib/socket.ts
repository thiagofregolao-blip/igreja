import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const url = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') ?? '';
    socket = io(url || undefined, { transports: ['websocket', 'polling'] });
  }
  return socket;
}

export function subscribeToEvent(eventId: string, onUpdate: (payload: any) => void) {
  const s = getSocket();
  s.emit('event:subscribe', eventId);
  s.on('coupon:update', onUpdate);
  return () => {
    s.emit('event:unsubscribe', eventId);
    s.off('coupon:update', onUpdate);
  };
}
