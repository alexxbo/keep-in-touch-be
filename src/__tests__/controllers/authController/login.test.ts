import {Request, Response} from 'express';
import {StatusCodes} from 'http-status-codes';

import {login} from '~controllers/auth.controller';

import {AuthService} from '~services/auth.service';

// Mock the AuthService
jest.mock('~services/auth.service');
const MockedAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('Auth Controller - login', () => {
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
        identifier: 'test@example.com',
        password: 'Password123!',
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

  it('should login user successfully and return tokens', async () => {
    const mockResult = {
      user: {
        id: 'user123',
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    MockedAuthService.login.mockResolvedValue(mockResult);

    await login(mockRequest as Request, mockResponse as Response, mockNext);

    expect(MockedAuthService.login).toHaveBeenCalledWith(mockRequest.body, {
      deviceInfo: 'test-agent',
    });
    expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'Login successful',
      user: mockResult.user,
      accessToken: mockResult.accessToken,
      refreshToken: mockResult.refreshToken,
    });
  });

  it('should handle login with undefined user-agent', async () => {
    const mockResult = {
      user: {
        id: 'user123',
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    mockRequest.headers = {};
    MockedAuthService.login.mockResolvedValue(mockResult);

    await login(mockRequest as Request, mockResponse as Response, mockNext);

    expect(MockedAuthService.login).toHaveBeenCalledWith(mockRequest.body, {
      deviceInfo: undefined,
    });
    expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
  });

  it('should handle service errors', async () => {
    const error = new Error('Login failed');
    MockedAuthService.login.mockRejectedValue(error);

    await login(mockRequest as Request, mockResponse as Response, mockNext);

    // Wait an additional tick to ensure any async error handling completes
    await new Promise(resolve => setImmediate(resolve));

    expect(MockedAuthService.login).toHaveBeenCalledWith(mockRequest.body, {
      deviceInfo: 'test-agent',
    });
    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockStatus).not.toHaveBeenCalled();
  });
});
