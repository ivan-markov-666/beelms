import { AdminSettingsController } from './admin-settings.controller';
import type { SocialLoginAvailabilityService } from '../auth/social-login-availability.service';
import type { SettingsService } from './settings.service';
import type { SocialProviderDiagnosticsService } from './social-provider-diagnostics.service';
import * as fs from 'fs';
import * as path from 'path';

type BrandingUploadedFile = {
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
  originalname?: string;
};

type FontUploadHarness = {
  handleBrandingFontUpload: (file: BrandingUploadedFile) => Promise<string>;
  handleBrandingLicenseUpload: (file: BrandingUploadedFile) => Promise<string>;
};

type CursorUploadHarness = {
  uploadCursor: (file: BrandingUploadedFile) => Promise<{ url: string }>;
  uploadCursorLight: (
    file: BrandingUploadedFile,
    previousUrl?: string,
  ) => Promise<{ url: string }>;
  uploadCursorDark: (
    file: BrandingUploadedFile,
    previousUrl?: string,
  ) => Promise<{ url: string }>;
  uploadCursorPointer: (
    file: BrandingUploadedFile,
    previousUrl?: string,
  ) => Promise<{ url: string }>;
  uploadCursorPointerLight: (
    file: BrandingUploadedFile,
    previousUrl?: string,
  ) => Promise<{ url: string }>;
  uploadCursorPointerDark: (
    file: BrandingUploadedFile,
    previousUrl?: string,
  ) => Promise<{ url: string }>;
};

describe('AdminSettingsController – branding font uploads', () => {
  let controller: AdminSettingsController;

  const mockSettingsService = {} as unknown as SettingsService;
  const mockSocialAvailability = {
    getProviderStatuses: jest.fn(),
  } as unknown as SocialLoginAvailabilityService;
  const mockSocialDiagnostics = {
    testConnection: jest.fn(),
  } as unknown as SocialProviderDiagnosticsService;

  const buildFile = (
    overrides: Partial<BrandingUploadedFile> = {},
  ): BrandingUploadedFile => ({
    originalname: 'font.woff2',
    buffer: Buffer.from('font-data'),
    size: 128,
    ...overrides,
  });

  const getHarness = () => controller as unknown as FontUploadHarness;
  const uploadFont = (overrides: Partial<BrandingUploadedFile>) =>
    getHarness().handleBrandingFontUpload(buildFile(overrides));

  beforeEach(() => {
    controller = new AdminSettingsController(
      mockSettingsService,
      mockSocialAvailability,
      mockSocialDiagnostics,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.MEDIA_ROOT;
  });

  it('(FT-B1) Accepts only woff2/woff/ttf/otf and enforces 2MB limit', async () => {
    await expect(uploadFont({ originalname: 'font.exe' })).rejects.toThrow(
      'Unsupported font type. Use WOFF2, WOFF, TTF or OTF.',
    );

    await expect(uploadFont({ size: 2 * 1024 * 1024 + 1 })).rejects.toThrow(
      'File is too large',
    );
  });

  it('(FT-B2) Rejects uploads without buffer or with zero bytes', async () => {
    await expect(uploadFont({ buffer: undefined })).rejects.toThrow(
      'File buffer is missing',
    );

    await expect(
      uploadFont({ buffer: Buffer.from(''), size: 0 }),
    ).rejects.toThrow('File is empty');
  });

  it('(FT-B3) Saves file with font- prefix and returns branding media URL', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
    const mkdirSpy = jest
      .spyOn(fs.promises, 'mkdir')
      .mockResolvedValue(undefined);
    const writeSpy = jest
      .spyOn(fs.promises, 'writeFile')
      .mockResolvedValue(undefined);

    const file = buildFile();
    const url = await getHarness().handleBrandingFontUpload(file);

    const expectedDir = path.join(process.cwd(), 'media', 'branding');
    const expectedPath = path.join(expectedDir, 'font-1700000000000.woff2');

    expect(mkdirSpy).toHaveBeenCalledWith(expectedDir, { recursive: true });
    expect(writeSpy).toHaveBeenCalledWith(expectedPath, file.buffer);
    expect(url).toBe('/branding/media/font-1700000000000.woff2');

    nowSpy.mockRestore();
  });
});

describe('AdminSettingsController – branding cursor uploads', () => {
  let controller: AdminSettingsController;

  const mockSettingsService = {} as unknown as SettingsService;
  const mockSocialAvailability = {
    getProviderStatuses: jest.fn(),
  } as unknown as SocialLoginAvailabilityService;
  const mockSocialDiagnostics = {
    testConnection: jest.fn(),
  } as unknown as SocialProviderDiagnosticsService;

  const buildFile = (
    overrides: Partial<BrandingUploadedFile> = {},
  ): BrandingUploadedFile => ({
    originalname: 'cursor.png',
    buffer: Buffer.from('cursor-data'),
    size: 128,
    mimetype: 'image/png',
    ...overrides,
  });

  const getHarness = () => controller as unknown as CursorUploadHarness;

  beforeEach(() => {
    controller = new AdminSettingsController(
      mockSettingsService,
      mockSocialAvailability,
      mockSocialDiagnostics,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.MEDIA_ROOT;
  });

  it('(CS-B1) Accepts PNG/WebP and enforces 256KB limit', async () => {
    await expect(
      getHarness().uploadCursor(buildFile({ mimetype: 'image/gif' })),
    ).rejects.toThrow('Unsupported file type');

    await expect(
      getHarness().uploadCursor(
        buildFile({ size: 256 * 1024 + 1, buffer: Buffer.alloc(1) }),
      ),
    ).rejects.toThrow('File is too large');
  });

  it('(CS-B3) Stores separate URLs for cursor variants', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
    jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);

    const harness = getHarness();

    await expect(harness.uploadCursor(buildFile())).resolves.toEqual({
      url: '/branding/media/cursor-1700000000000.png',
    });
    await expect(harness.uploadCursorLight(buildFile())).resolves.toEqual({
      url: '/branding/media/cursor-light-1700000000000.png',
    });
    await expect(harness.uploadCursorDark(buildFile())).resolves.toEqual({
      url: '/branding/media/cursor-dark-1700000000000.png',
    });
    await expect(harness.uploadCursorPointer(buildFile())).resolves.toEqual({
      url: '/branding/media/cursor-pointer-1700000000000.png',
    });
    const cursorPointerLightUpload =
      harness.uploadCursorPointerLight(buildFile());
    const cursorPointerDarkUpload =
      harness.uploadCursorPointerDark(buildFile());

    await expect(cursorPointerLightUpload).resolves.toEqual({
      url: '/branding/media/cursor-pointer-light-1700000000000.png',
    });
    await expect(cursorPointerDarkUpload).resolves.toEqual({
      url: '/branding/media/cursor-pointer-dark-1700000000000.png',
    });

    nowSpy.mockRestore();
  });

  it('(CS-B6) Rejects animated cursor uploads (GIF)', async () => {
    await expect(
      getHarness().uploadCursor(
        buildFile({ mimetype: 'image/gif', originalname: 'cursor.gif' }),
      ),
    ).rejects.toThrow('Unsupported file type');
  });
});

describe('AdminSettingsController – branding font license uploads', () => {
  let controller: AdminSettingsController;

  const mockSettingsService = {} as unknown as SettingsService;
  const mockSocialAvailability = {
    getProviderStatuses: jest.fn(),
  } as unknown as SocialLoginAvailabilityService;
  const mockSocialDiagnostics = {
    testConnection: jest.fn(),
  } as unknown as SocialProviderDiagnosticsService;

  const buildFile = (
    overrides: Partial<BrandingUploadedFile> = {},
  ): BrandingUploadedFile => ({
    originalname: 'license.pdf',
    buffer: Buffer.from('license-data'),
    size: 512,
    ...overrides,
  });

  const getHarness = () => controller as unknown as FontUploadHarness;
  const uploadLicense = (overrides: Partial<BrandingUploadedFile>) =>
    getHarness().handleBrandingLicenseUpload(buildFile(overrides));

  beforeEach(() => {
    controller = new AdminSettingsController(
      mockSettingsService,
      mockSocialAvailability,
      mockSocialDiagnostics,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.MEDIA_ROOT;
  });

  it('(FL-B1) Allows approved extensions and enforces 5MB limit', async () => {
    await expect(
      uploadLicense({ originalname: 'license.exe' }),
    ).rejects.toThrow(
      'Unsupported license type. Use PDF/TXT/DOC/DOCX/ODT/PNG/JPG/WEBP/ZIP.',
    );

    await expect(uploadLicense({ size: 5 * 1024 * 1024 + 1 })).rejects.toThrow(
      'File is too large',
    );
  });

  it('(FL-B2) Rejects missing buffer or empty license files', async () => {
    await expect(uploadLicense({ buffer: undefined })).rejects.toThrow(
      'File buffer is missing',
    );

    await expect(
      uploadLicense({ buffer: Buffer.from(''), size: 0 }),
    ).rejects.toThrow('File is empty');
  });

  it('(FL-B4) Sanitizes filename and avoids script injection via document name', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
    jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);

    const url = await uploadLicense({ originalname: 'license<script>.pdf' });

    expect(url).toBe('/branding/media/font-license-1700000000000.pdf');
    expect(url).not.toContain('script');

    nowSpy.mockRestore();
  });
});
