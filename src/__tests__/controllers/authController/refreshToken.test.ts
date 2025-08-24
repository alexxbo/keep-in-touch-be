import {Request, Response} from 'express';
import {StatusCodes} from 'http-status-codes';

import {refreshToken} from '~controllers/auth.controller';

import {AuthService} from '~services/auth.service';

// Mock the AuthService
jest.mock('~services/auth.service');
const MockedAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('Auth Controller - refreshToken', () => {
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
        refreshToken: 'existing-refresh-token',
      },
      headers: {
        'user-agent': 'test-agent',
      },
    };
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    jest.clearAllMocks();
  });

  it('should refresh token successfully and return new tokens', async () => {
    const mockResult = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    MockedAuthService.refreshToken.mockResolvedValue(mockResult);

    await refreshToken(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(MockedAuthService.refreshToken).toHaveBeenCalledWith(
      mockRequest.body,
      {
        deviceInfo: 'test-agent',
      },
    );
    expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'Token refreshed successfully',
      accessToken: mockResult.accessToken,
      refreshToken: mockResult.refreshToken,
    });
  });

  it('should handle refresh token with undefined user-agent', async () => {
    const mockResult = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    mockRequest.headers = {};
    MockedAuthService.refreshToken.mockResolvedValue(mockResult);

    await refreshToken(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(MockedAuthService.refreshToken).toHaveBeenCalledWith(
      mockRequest.body,
      {
        deviceInfo: undefined,
      },
    );
    expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
  });

  it('should handle service errors', async () => {
    const error = new Error('Invalid refresh token');
    MockedAuthService.refreshToken.mockRejectedValue(error);

    await refreshToken(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    // Wait an additional tick to ensure any async error handling completes
    await new Promise(resolve => setImmediate(resolve));

    expect(MockedAuthService.refreshToken).toHaveBeenCalledWith(
      mockRequest.body,
      {
        deviceInfo: 'test-agent',
      },
    );
    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockStatus).not.toHaveBeenCalled();
  });
});
