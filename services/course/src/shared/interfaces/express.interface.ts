import { Request } from 'express';

// Дефиниране на типа за Multer File
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer: Buffer;
}

// Разширяване на Express Request за работа с JWT потребителски данни

export interface RequestWithUser extends Request {
  user?: {
    id: number;
    username: string;
    roles: string[];
  };
}
