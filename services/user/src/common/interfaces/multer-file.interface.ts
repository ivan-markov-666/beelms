/**
 * Интерфейс за типизация на файлове от Multer
 * Използва се за осигуряване на типова безопасност при работа с качени файлове
 */
export interface MulterFile {
  /** Име на полето във формата */
  fieldname: string;
  /** Оригинално име на файла от клиента */
  originalname: string;
  /** MIME тип според заявката */
  mimetype: string;
  /** Размер на файла в байтове */
  size: number;
  /** Буфер със съдържанието на файла */
  buffer: Buffer;
  /** Кодиране на файла */
  encoding: string;
}

/**
 * Разширява типа Express.Request с поле за файл
 * Използва се за типизиране на заявки с файлове
 */
export interface RequestWithFile extends Express.Request {
  file?: MulterFile;
  files?: { [fieldname: string]: MulterFile[] };
}
