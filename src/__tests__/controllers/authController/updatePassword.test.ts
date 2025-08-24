import {Request, Response} from 'express';
import {StatusCodes} from 'http-status-codes';
import {Types} from 'mongoose';

import {updatePassword} from '~controllers/auth.controller';

import {AuthService} from '~services/auth.service';

import {BaseError} from '~utils/BaseError';

// Mock the AuthService
jest.mock('~services/auth.service');
const MockedAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('Auth Controller - updatePassword', () => {
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
      user: {
        _id: new Types.ObjectId(),
      },
      body: {
        currentPassword: 'CurrentPassword123!',
        newPassword: 'NewPassword123!',
      },
    };
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    jest.clearAllMocks();
  });

  it('should update password successfully', async () => {
    MockedAuthService.updatePassword.mockResolvedValue(undefined);

    await updatePassword(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(MockedAuthService.updatePassword).toHaveBeenCalledWith(
      mockRequest.user?._id,
      'CurrentPassword123!',
      'NewPassword123!',
    );
    expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'success',
      message: 'Password updated successfully',
    });
  });

  it('should handle missing user authentication', async () => {
    mockRequest.user = undefined;

    await updatePassword(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(expect.any(BaseError));
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Authentication required',
        statusCode: StatusCodes.UNAUTHORIZED,
      }),
    );
    expect(MockedAuthService.updatePassword).not.toHaveBeenCalled();
  });

  it('should handle service errors', async () => {
    const error = new Error('Current password is incorrect');
    MockedAuthService.updatePassword.mockRejectedValue(error);

    await updatePassword(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(MockedAuthService.updatePassword).toHaveBeenCalledWith(
      mockRequest.user?._id,
      'CurrentPassword123!',
      'NewPassword123!',
    );

    // Wait for async error handling
    await new Promise(setImmediate);
    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockStatus).not.toHaveBeenCalled();
  });

  it('should handle weak new password error', async () => {
    mockRequest.body = {
      currentPassword: 'CurrentPassword123!',
      newPassword: 'weak',
    };
    const error = new Error('New password too weak');
    MockedAuthService.updatePassword.mockRejectedValue(error);

    await updatePassword(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(MockedAuthService.updatePassword).toHaveBeenCalledWith(
      mockRequest.user?._id,
      'CurrentPassword123!',
      'weak',
    );

    // Wait for async error handling
    await new Promise(setImmediate);
    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockStatus).not.toHaveBeenCalled();
  });
});
