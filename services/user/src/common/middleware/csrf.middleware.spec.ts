import { Test, TestingModule } from '@nestjs/testing';
import { CsrfMiddleware } from './csrf.middleware';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';

// Import the RequestWithUser interface or define it here
interface RequestWithUser extends Request {
  user?: { id: string };
  csrfToken(): string;
}

// Define ResponseWithLocals to handle local properties
interface ResponseWithLocals extends Response {
  locals: {
    [key: string]: any;
  };
}

describe('CsrfMiddleware', () => {
  let middleware: CsrfMiddleware;
  let mockRequest: Partial<RequestWithUser>;
  let mockResponse: Partial<ResponseWithLocals>;
  let mockNext: NextFunction;
  let mockLogger: Partial<Logger>;

  beforeEach(async () => {
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CsrfMiddleware,
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    middleware = module.get<CsrfMiddleware>(CsrfMiddleware);

    mockRequest = {
      method: 'GET',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      path: '/api/users' as any, // Type assertion to handle readonly property
      csrfToken: jest.fn().mockReturnValue('valid-csrf-token'),
    };

    mockResponse = {
      cookie: jest.fn(),
      locals: {},
      setHeader: jest.fn(),
    };

    mockNext = jest.fn();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should call next function for non-excluded paths', () => {
    // Type cast to RequestWithUser since it has the csrfToken method
    middleware.use(
      mockRequest as unknown as RequestWithUser,
      mockResponse as Response,
      mockNext,
    );
    expect(mockNext).toHaveBeenCalled();
  });

  it('should set CSRF token in response for non-excluded paths', () => {
    // Type cast to RequestWithUser since it has the csrfToken method
    middleware.use(
      mockRequest as unknown as RequestWithUser,
      mockResponse as Response,
      mockNext,
    );
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'XSRF-TOKEN',
      'valid-csrf-token',
      expect.objectContaining({
        httpOnly: false,
      }),
    );
  });

  it('should set secure cookie flag when in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    // Type cast to RequestWithUser since it has the csrfToken method
    middleware.use(
      mockRequest as unknown as RequestWithUser,
      mockResponse as Response,
      mockNext,
    );

    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'XSRF-TOKEN',
      'valid-csrf-token',
      expect.objectContaining({
        secure: true,
      }),
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('should skip CSRF protection for excluded paths', () => {
    // Create a new request object with the modified path instead of trying to reassign readonly property
    mockRequest = {
      ...mockRequest,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      path: '/auth/oauth/callback' as any,
    };
    middleware.use(
      mockRequest as RequestWithUser,
      mockResponse as ResponseWithLocals,
      mockNext,
    );
    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.cookie).not.toHaveBeenCalled();
  });

  it('should handle CSRF validation errors', () => {
    const mockError = new Error('invalid csrf token');
    mockError['code'] = 'EBADCSRFTOKEN';

    // Type cast to RequestWithUser since it has the csrfToken method
    middleware.use(
      mockRequest as unknown as RequestWithUser,
      mockResponse as Response,
      mockNext,
    );

    // Simulate the CSRF validation error
    type ErrorHandler = (err: Error) => void;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const errorHandler: ErrorHandler = (mockNext as jest.Mock).mock.calls[0][0];
    // Now we can safely call the error handler with the properly typed error
    errorHandler(mockError);

    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockResponse.locals?.['csrfValidationFailed']).toBe(true);
  });
});
