import {Request, Response} from 'express';
import {StatusCodes} from 'http-status-codes';
import {register} from '../../../controllers/auth.controller';
import {AuthService} from '../../../services/auth.service';

// Mock the AuthService
jest.mock('../../../services/auth.service');
const MockedAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('Auth Controller - register', () => {
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
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
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

  it('should register user successfully and return tokens', async () => {
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

    MockedAuthService.register.mockResolvedValue(mockResult);

    await register(mockRequest as Request, mockResponse as Response, mockNext);

    expect(MockedAuthService.register).toHaveBeenCalledWith(mockRequest.body, {
      deviceInfo: 'test-agent',
    });
    expect(mockStatus).toHaveBeenCalledWith(StatusCodes.CREATED);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'User registered successfully',
      user: mockResult.user,
      accessToken: mockResult.accessToken,
      refreshToken: mockResult.refreshToken,
    });
  });

  it('should handle registration with undefined user-agent', async () => {
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
    MockedAuthService.register.mockResolvedValue(mockResult);

    await register(mockRequest as Request, mockResponse as Response, mockNext);

    expect(MockedAuthService.register).toHaveBeenCalledWith(mockRequest.body, {
      deviceInfo: undefined,
    });
    expect(mockStatus).toHaveBeenCalledWith(StatusCodes.CREATED);
  });

  it('should handle service errors', async () => {
    const error = new Error('Registration failed');
    MockedAuthService.register.mockRejectedValue(error);

    // Call the wrapped function and wait for it to complete
    await register(mockRequest as Request, mockResponse as Response, mockNext);

    // Wait an additional tick to ensure any async error handling completes
    await new Promise(resolve => setImmediate(resolve));

    expect(MockedAuthService.register).toHaveBeenCalledWith(mockRequest.body, {
      deviceInfo: 'test-agent',
    });
    // The error should be passed to next by runCatching
    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockStatus).not.toHaveBeenCalled();
  });
});
