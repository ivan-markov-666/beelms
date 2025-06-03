import { Test, TestingModule } from '@nestjs/testing';
import { InputSanitizationInterceptor } from './input-sanitization.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('InputSanitizationInterceptor', () => {
  let interceptor: InputSanitizationInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InputSanitizationInterceptor],
    }).compile();

    interceptor = module.get<InputSanitizationInterceptor>(
      InputSanitizationInterceptor,
    );
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should sanitize request body', () => {
      const mockRequest = {
        body: {
          name: 'Test <script>alert("XSS")</script>',
          description: '<b>Bold text</b> <img src="javascript:alert(1)" />',
          nested: {
            html: '<iframe src="evil-site"></iframe>',
          },
        },
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const mockCallHandler = {
        handle: jest.fn(() => of({})),
      } as CallHandler;

      interceptor.intercept(mockContext, mockCallHandler);

      // Проверка за санитизирани данни
      expect(mockRequest.body.name).not.toContain('<script>');
      expect(mockRequest.body.description).toContain('<b>Bold text</b>'); // Позволен таг
      expect(mockRequest.body.description).not.toContain('javascript:alert');
      expect(mockRequest.body.nested.html).not.toContain('<iframe');
    });

    it('should sanitize request params', () => {
      const mockRequest = {
        params: {
          id: '123<script>alert("XSS")</script>',
        },
        body: {},
        query: {},
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const mockCallHandler = {
        handle: jest.fn(() => of({})),
      } as CallHandler;

      interceptor.intercept(mockContext, mockCallHandler);

      expect(mockRequest.params.id).not.toContain('<script>');
    });

    it('should sanitize request query', () => {
      const mockRequest = {
        query: {
          search: 'test<img src="javascript:alert(1)" />',
        },
        body: {},
        params: {},
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const mockCallHandler = {
        handle: jest.fn(() => of({})),
      } as CallHandler;

      interceptor.intercept(mockContext, mockCallHandler);

      expect(mockRequest.query.search).not.toContain('javascript:alert');
    });

    it('should sanitize arrays in request body', () => {
      const mockRequest = {
        body: {
          items: [
            '<script>alert("XSS")</script>',
            '<b>Allowed tag</b>',
            '<iframe src="evil"></iframe>',
          ],
        },
        params: {},
        query: {},
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const mockCallHandler = {
        handle: jest.fn(() => of({})),
      } as CallHandler;

      interceptor.intercept(mockContext, mockCallHandler);

      expect(mockRequest.body.items[0]).not.toContain('<script>');
      expect(mockRequest.body.items[1]).toContain('<b>');
      expect(mockRequest.body.items[2]).not.toContain('<iframe');
    });

    it('should handle null and undefined values', () => {
      const mockRequest = {
        body: {
          nullValue: null,
          undefinedValue: undefined,
          validValue: 'test',
        },
        params: {},
        query: {},
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const mockCallHandler = {
        handle: jest.fn(() => of({})),
      } as CallHandler;

      interceptor.intercept(mockContext, mockCallHandler);

      expect(mockRequest.body.nullValue).toBeNull();
      expect(mockRequest.body.undefinedValue).toBeUndefined();
      expect(mockRequest.body.validValue).toBe('test');
    });
  });

  describe('sanitizeString', () => {
    it('should keep allowed HTML tags', () => {
      const html =
        '<b>Bold</b> <i>Italic</i> <a href="https://example.com">Link</a>';
      const result = interceptor['sanitizeString'](html);

      expect(result).toContain('<b>Bold</b>');
      expect(result).toContain('<i>Italic</i>');
      expect(result).toContain('<a href="https://example.com">Link</a>');
    });

    it('should remove disallowed HTML tags', () => {
      const html = '<script>alert("XSS")</script><div>Content</div>';
      const result = interceptor['sanitizeString'](html);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<div>');
      expect(result).toContain('Content');
    });

    it('should filter out unsafe URL schemes', () => {
      const html = '<a href="javascript:alert(1)">Click me</a>';
      const result = interceptor['sanitizeString'](html);

      expect(result).not.toContain('javascript:');
      expect(result).toContain('Click me');
    });
  });
});
