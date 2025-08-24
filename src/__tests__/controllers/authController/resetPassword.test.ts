import {Request, Response} from 'express';
import {StatusCodes} from 'http-status-codes';
import {resetPassword} from '~controllers/auth.controller';
import {AuthService} from '~services/auth.service';

// Mock the AuthService
jest.mock('~services/auth.service');
const MockedAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('Auth Controller - resetPassword', () => {
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
        token: 'valid-reset-token',
        newPassword: 'NewPassword123!',
      },
    };
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    jest.clearAllMocks();
  });

  it('should reset password successfully', async () => {
    MockedAuthService.resetPassword.mockResolvedValue(undefined);

    await resetPassword(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(MockedAuthService.resetPassword).toHaveBeenCalledWith(
      mockRequest.body,
    );
    expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'Password reset successfully',
    });
  });

  it('should handle service errors', async () => {
    const error = new Error('Invalid or expired token');
    MockedAuthService.resetPassword.mockRejectedValue(error);

    await resetPassword(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(MockedAuthService.resetPassword).toHaveBeenCalledWith(
      mockRequest.body,
    );

    // Wait for async error handling
    await new Promise(setImmediate);
    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockStatus).not.toHaveBeenCalled();
  });

  it('should handle weak password error', async () => {
    mockRequest.body = {
      token: 'valid-reset-token',
      newPassword: 'weak',
    };
    const error = new Error('Password too weak');
    MockedAuthService.resetPassword.mockRejectedValue(error);

    await resetPassword(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(MockedAuthService.resetPassword).toHaveBeenCalledWith(
      mockRequest.body,
    );

    // Wait for async error handling
    await new Promise(setImmediate);
    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockStatus).not.toHaveBeenCalled();
  });
});
