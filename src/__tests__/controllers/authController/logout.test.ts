import {Request, Response} from 'express';
import {StatusCodes} from 'http-status-codes';
import {Types} from 'mongoose';
import {logout} from '~controllers/auth.controller';
import {AuthService} from '~services/auth.service';

// Mock the AuthService
jest.mock('~services/auth.service');
const MockedAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('Auth Controller - logout', () => {
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
        refreshToken: 'valid-refresh-token',
        logoutAllDevices: false,
      },
    };
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    jest.clearAllMocks();
  });

  it('should logout user successfully from single device', async () => {
    MockedAuthService.logout.mockResolvedValue(undefined);

    await logout(mockRequest as Request, mockResponse as Response, mockNext);

    expect(MockedAuthService.logout).toHaveBeenCalledWith(
      mockRequest.user?._id?.toString(),
      'valid-refresh-token',
      false,
    );
    expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'Logged out successfully',
    });
  });

  it('should logout user from all devices', async () => {
    mockRequest.body = {
      refreshToken: 'valid-refresh-token',
      logoutAllDevices: true,
    };
    MockedAuthService.logout.mockResolvedValue(undefined);

    await logout(mockRequest as Request, mockResponse as Response, mockNext);

    expect(MockedAuthService.logout).toHaveBeenCalledWith(
      mockRequest.user?._id?.toString(),
      'valid-refresh-token',
      true,
    );
    expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'Logged out from all devices successfully',
    });
  });

  it('should get refresh token from header when not in body', async () => {
    mockRequest.body = {logoutAllDevices: false};
    mockRequest.headers = {'x-refresh-token': 'header-refresh-token'};
    MockedAuthService.logout.mockResolvedValue(undefined);

    await logout(mockRequest as Request, mockResponse as Response, mockNext);

    expect(MockedAuthService.logout).toHaveBeenCalledWith(
      mockRequest.user?._id?.toString(),
      'header-refresh-token',
      false,
    );
    expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
  });

  it('should handle logout without refresh token', async () => {
    mockRequest.body = {logoutAllDevices: false};
    mockRequest.headers = {};
    MockedAuthService.logout.mockResolvedValue(undefined);

    await logout(mockRequest as Request, mockResponse as Response, mockNext);

    expect(MockedAuthService.logout).toHaveBeenCalledWith(
      mockRequest.user?._id?.toString(),
      undefined,
      false,
    );
    expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
  });

  it('should handle missing user authentication', async () => {
    mockRequest.user = undefined;

    await logout(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'User not authenticated',
    });
    expect(MockedAuthService.logout).not.toHaveBeenCalled();
  });

  it('should handle service errors', async () => {
    const error = new Error('Invalid refresh token');
    MockedAuthService.logout.mockRejectedValue(error);

    await logout(mockRequest as Request, mockResponse as Response, mockNext);

    expect(MockedAuthService.logout).toHaveBeenCalledWith(
      mockRequest.user?._id?.toString(),
      'valid-refresh-token',
      false,
    );

    // Wait for async error handling
    await new Promise(setImmediate);
    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockStatus).not.toHaveBeenCalled();
  });
});
