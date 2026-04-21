import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'payment-proofs',
      format: 'jpg',
      public_id: `payment-${Date.now()}`,
    };
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak valid. Hanya JPG, PNG, dan PDF yang diperbolehkan'));
  }
};

export const uploadProofMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
});

// ── Avatar upload ──────────────────────────────────────────────────────────────
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (_req, _file) => ({
    folder: 'avatars',
    format: 'jpg',
    public_id: `avatar-${Date.now()}`,
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  }),
});

const avatarFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Format tidak valid. Gunakan JPG, PNG, atau WEBP'));
};

export const uploadAvatarMiddleware = multer({
  storage: avatarStorage,
  fileFilter: avatarFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});
