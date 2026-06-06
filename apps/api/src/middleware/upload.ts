import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env.js';
import { BadRequest } from '../lib/errors.js';

if (!fs.existsSync(env.UPLOAD_DIR)) {
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
}

const subdir = (sub: string) => {
  const full = path.join(env.UPLOAD_DIR, sub);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
  return full;
};

function storageFor(sub: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, subdir(sub)),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      cb(null, safe);
    },
  });
}

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const RECEIPT_MIMES = ['image/jpeg', 'image/png', 'application/pdf'];
const CSV_MIMES = ['text/csv', 'application/vnd.ms-excel', 'application/csv', 'text/plain'];

export const uploadReceipt = multer({
  storage: storageFor('receipts'),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!RECEIPT_MIMES.includes(file.mimetype)) {
      return cb(BadRequest('Tipo de arquivo inválido. Permitidos: jpeg, png, pdf'));
    }
    cb(null, true);
  },
}).single('receipt');

export const uploadSponsorLogo = multer({
  storage: storageFor('sponsors'),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!IMAGE_MIMES.includes(file.mimetype)) {
      return cb(BadRequest('Logo deve ser jpeg, png ou webp'));
    }
    cb(null, true);
  },
}).single('logo');

export const uploadEventHero = multer({
  storage: storageFor('events'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!IMAGE_MIMES.includes(file.mimetype)) {
      return cb(BadRequest('Imagem inválida'));
    }
    cb(null, true);
  },
}).single('hero');

export const uploadBanner = multer({
  storage: storageFor('banners'),
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!IMAGE_MIMES.includes(file.mimetype)) {
      return cb(BadRequest('Banner deve ser jpeg, png ou webp'));
    }
    cb(null, true);
  },
}).single('image');

export const uploadCardImages = multer({
  storage: storageFor('cards'),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 500 },
  fileFilter: (_req, file, cb) => {
    if (!IMAGE_MIMES.includes(file.mimetype)) {
      return cb(BadRequest('Cartelas devem ser jpeg, png ou webp'));
    }
    cb(null, true);
  },
}).array('cards', 500);

export const uploadCsv = multer({
  storage: storageFor('csv'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!CSV_MIMES.includes(file.mimetype) && !file.originalname.endsWith('.csv')) {
      return cb(BadRequest('Arquivo deve ser CSV'));
    }
    cb(null, true);
  },
}).single('csv');

export function publicUrl(filePath: string): string {
  const rel = path.relative(env.UPLOAD_DIR, filePath);
  return `/uploads/${rel.replace(/\\/g, '/')}`;
}
