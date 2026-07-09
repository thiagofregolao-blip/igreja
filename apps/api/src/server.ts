import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server as IOServer } from 'socket.io';

// Em Node 25, unhandledRejection/uncaughtException matam o processo por padrão.
// Logamos para o servidor não cair em caso de algum middleware async escapar do error handler.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

import { env, isDev } from './config/env.js';
import { errorHandler, notFound } from './middleware/error.js';
import { setIO } from './lib/io.js';

import authRoutes from './modules/auth/auth.routes.js';
import eventsPublicRoutes from './modules/events/events.public.routes.js';
import eventsAdminRoutes from './modules/events/events.admin.routes.js';
import cardsAdminRoutes from './modules/cards/cards.admin.routes.js';
import couponsRoutes from './modules/coupons/coupons.routes.js';
import ticketsRoutes from './modules/tickets/tickets.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import bannersPublicRoutes from './modules/banners/banners.public.routes.js';
import bannersAdminRoutes from './modules/banners/banners.admin.routes.js';
import radioPublicRoutes from './modules/radio/radio.public.routes.js';
import radioAdminRoutes from './modules/radio/radio.admin.routes.js';
import dinelcoRoutes from './modules/payments/dinelco.routes.js';
import bancardWebhookRoutes from './modules/webhooks/bancard.routes.js';

const app = express();
const server = http.createServer(app);

// Atrás de proxy (Railway): confia no primeiro hop para que req.ip/req.protocol
// venham do X-Forwarded-For/Proto. Sem isso o express-rate-limit erra
// (ERR_ERL_UNEXPECTED_X_FORWARDED_FOR) e agrupa todos os usuários no IP do proxy.
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  }),
);

// Em dev tem CORS por causa dos dev servers do Vite. Em prod tudo é mesma origem.
if (isDev) {
  app.use(
    cors({
      origin: [env.FRONTEND_URL, env.ADMIN_URL, 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
      credentials: true,
    }),
  );
}

// Webhook precisa de body raw — registrado antes do parser JSON
app.use('/api/webhooks', bancardWebhookRoutes);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (isDev) app.use(morgan('dev'));

// Uploads (estáticos)
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

// Health
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsPublicRoutes);
app.use('/api/banners', bannersPublicRoutes);
app.use('/api/radio', radioPublicRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/payments/dinelco', dinelcoRoutes);
app.use('/api/admin/events', eventsAdminRoutes);
app.use('/api/admin/banners', bannersAdminRoutes);
app.use('/api/admin/radio', radioAdminRoutes);
app.use('/api/admin', cardsAdminRoutes);
app.use('/api/admin', adminRoutes);

// --- SERVE FRONTENDS BUILDADOS NO MESMO SERVIDOR ---
// /admin → painel administrativo (build de apps/admin)
// /     → site cliente (build de apps/web)
const webDist = path.resolve(__dirname, '../../web/dist');
const adminDist = path.resolve(__dirname, '../../admin/dist');

function serveStaticSPA(distPath: string, mountPath: string) {
  if (!fs.existsSync(distPath)) {
    console.warn(`⚠  Static build not found at ${distPath} — rode "npm run build" para gerar`);
    return;
  }
  app.use(mountPath, express.static(distPath, { index: false }));
  // Fallback SPA: qualquer path não-API serve o index.html
  app.get(`${mountPath === '/' ? '' : mountPath}/*`, (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

serveStaticSPA(adminDist, '/admin');
serveStaticSPA(webDist, '/');

app.use('/api/*', notFound);
app.use(errorHandler);

// Socket.io
const io = new IOServer(server, {
  cors: isDev ? { origin: [env.FRONTEND_URL, env.ADMIN_URL, 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'], credentials: true } : undefined,
});
setIO(io);

io.on('connection', (socket) => {
  socket.on('event:subscribe', (eventId: string) => {
    if (typeof eventId === 'string') socket.join(`event:${eventId}`);
  });
  socket.on('event:unsubscribe', (eventId: string) => {
    if (typeof eventId === 'string') socket.leave(`event:${eventId}`);
  });
});

server.listen(env.PORT, () => {
  // URL pública real (Railway) ou localhost em dev. A porta é só a de escuta interna.
  const base = isDev ? `http://localhost:${env.PORT}` : env.FRONTEND_URL.replace(/\/$/, '');
  console.log(`\n🎰 Catedral Bingo — escutando na porta ${env.PORT} (${env.NODE_ENV})`);
  console.log(`   🌐 Cliente:  ${base}/`);
  console.log(`   🛠  Admin:    ${base}/admin`);
  console.log(`   🔌 API:      ${base}/api/health`);
  if (isDev) {
    console.log(`\n   📍 Em DEV use os Vite dev servers para hot reload:`);
    console.log(`      Web:    http://localhost:5173`);
    console.log(`      Admin:  http://localhost:5174/admin\n`);
  } else {
    console.log('');
  }
});
