import {Request, Response} from 'express';
import {register} from '../../../controllers/auth.controller';
import {AuthService} from '../../../services/auth.service';

// Mock the AuthService
jest.mock('../../../services/auth.service');
const MockedAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('Auth Controller - register debug', () => {
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

  it('should debug error handling', async () => {
    const error = new Error('Registration failed');
    MockedAuthService.register.mockRejectedValue(error);

    // Call the wrapped function
    const registerPromise = register(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    // Wait for the promise to resolve/reject
    await registerPromise;

    // Wait an additional tick to ensure any async error handling completes
    await new Promise(resolve => setImmediate(resolve));

    expect(MockedAuthService.register).toHaveBeenCalledWith(mockRequest.body, {
      deviceInfo: 'test-agent',
    });
    expect(mockNext).toHaveBeenCalledWith(error);
  });
});
