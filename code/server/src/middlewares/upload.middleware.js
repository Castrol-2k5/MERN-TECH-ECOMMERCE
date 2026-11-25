import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { AppError } from '../utils/appError.js';

const UPLOAD_DIR = path.resolve('uploads', 'products');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const extMap = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp'
    };
    const ext = extMap[file.mimetype] || path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const rand = Math.random().toString(36).slice(2, 8);
    cb(null, `prod-${Date.now()}-${rand}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Chỉ hỗ trợ định dạng ảnh JPG, PNG hoặc WebP.', 400, 'INVALID_IMAGE_TYPE'), false);
  }
};

export const uploadProductImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB / ảnh
    files: 10 // Tối đa 10 ảnh / lần upload
  }
}).array('images', 10);
