import crypto from "crypto";
import multer from "multer";
import fs from "fs";
import { AppError } from "../utils/appError";
import { UPLOAD_DIR } from "./uploadAccessMiddleware";

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // A extensão vem do mimetype validado, não do nome enviado: evita gravar `.html` com mimetype de imagem.
    const ext = EXTENSIONS[file.mimetype] ?? "";
    // Nome imprevisível: o nome é o que separa uma foto da outra, então não pode ser adivinhável.
    const unique = `${crypto.randomUUID()}${ext}`;
    cb(null, unique);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Formato de imagem não suportado. Use JPEG, PNG ou WebP.", 400, "INVALID_FILE_TYPE"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});
