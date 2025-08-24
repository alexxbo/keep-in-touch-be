import {Request, Response} from 'express';
import {StatusCodes} from 'http-status-codes';

import {forgotPassword} from '~controllers/auth.controller';

import {AuthService} from '~services/auth.service';

// Mock the AuthService
jest.mock('~services/auth.service');
const MockedAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('Auth Controller - forgotPassword', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({json: mockJson});
    mockNext = jest.fn();
    mockRequest = {
      body: {
        email: 'test@example.com',
      },
    };
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    jest.clearAllMocks();
  });

  it('should send password reset instructions successfully', async () => {
    MockedAuthService.forgotPassword.mockResolvedValue(undefined);

    await forgotPassword(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(MockedAuthService.forgotPassword).toHaveBeenCalledWith(
      mockRequest.body,
    );
    expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'Password reset instructions sent to your email',
    });
  });

  it('should handle service errors', async () => {
    const error = new Error('Email service unavailable');
    MockedAuthService.forgotPassword.mockRejectedValue(error);

    await forgotPassword(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(MockedAuthService.forgotPassword).toHaveBeenCalledWith(
      mockRequest.body,
    );

    // Wait for async error handling
    await new Promise(setImmediate);
    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockStatus).not.toHaveBeenCalled();
  });

  it('should handle invalid email format', async () => {
    mockRequest.body = {email: 'invalid-email'};
    const error = new Error('Invalid email format');
    MockedAuthService.forgotPassword.mockRejectedValue(error);

    await forgotPassword(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(MockedAuthService.forgotPassword).toHaveBeenCalledWith(
      mockRequest.body,
    );

    // Wait for async error handling
    await new Promise(setImmediate);
    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockStatus).not.toHaveBeenCalled();
  });
});
