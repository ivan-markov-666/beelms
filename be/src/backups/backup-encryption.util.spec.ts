import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  decryptFileToPath,
  encryptFileInPlace,
} from './backup-encryption.util';

describe('backup-encryption.util', () => {
  it('encrypts in place and decrypts back to original plaintext', async () => {
    const dir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'beelms-backup-enc-'),
    );

    const inputPath = path.join(dir, 'backup.sql');
    const outputPath = path.join(dir, 'backup.decrypted.sql');

    const plaintext = `CREATE TABLE example(id INT);
INSERT INTO example(id) VALUES (1);
`;

    await fs.promises.writeFile(inputPath, plaintext, 'utf8');

    const meta = await encryptFileInPlace(inputPath, 'pass123', {
      iterations: 5_000,
    });

    await decryptFileToPath(inputPath, outputPath, 'pass123', meta);

    const decrypted = await fs.promises.readFile(outputPath, 'utf8');
    expect(decrypted).toBe(plaintext);

    await fs.promises.rm(dir, { recursive: true, force: true });
  });

  it('rejects when password is invalid', async () => {
    const dir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'beelms-backup-enc-'),
    );

    const inputPath = path.join(dir, 'backup.sql');
    const outputPath = path.join(dir, 'backup.decrypted.sql');

    await fs.promises.writeFile(inputPath, 'SELECT 1;\n', 'utf8');

    const meta = await encryptFileInPlace(inputPath, 'correct', {
      iterations: 5_000,
    });

    await expect(
      decryptFileToPath(inputPath, outputPath, 'wrong', meta),
    ).rejects.toBeInstanceOf(Error);

    await fs.promises.rm(dir, { recursive: true, force: true });
  });
});
