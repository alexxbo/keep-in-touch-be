import {Request, Response} from 'express';
import {StatusCodes} from 'http-status-codes';
import {Types} from 'mongoose';

import {getSessions} from '~controllers/auth.controller';

import {AuthService} from '~services/auth.service';

// Mock the AuthService
jest.mock('~services/auth.service');
const MockedAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('Auth Controller - getSessions', () => {
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
    };
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    jest.clearAllMocks();
  });

  it('should get user sessions successfully', async () => {
    const mockSessions = [
      {
        tokenId: 'session1',
        deviceInfo: 'Chrome on Windows',
        createdAt: new Date(),
        expiresAt: new Date(),
      },
      {
        tokenId: 'session2',
        deviceInfo: 'Safari on iOS',
        createdAt: new Date(),
        expiresAt: new Date(),
      },
    ];

    MockedAuthService.getUserSessions.mockResolvedValue(mockSessions);

    await getSessions(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(MockedAuthService.getUserSessions).toHaveBeenCalledWith(
      mockRequest.user?._id?.toString(),
    );
    expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'User sessions retrieved successfully',
      sessions: mockSessions,
    });
  });

  it('should handle missing user authentication', async () => {
    mockRequest.user = undefined;

    await getSessions(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockStatus).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'User not authenticated',
    });
    expect(MockedAuthService.getUserSessions).not.toHaveBeenCalled();
  });

  it('should handle service errors', async () => {
    const error = new Error('Database connection failed');
    MockedAuthService.getUserSessions.mockRejectedValue(error);

    await getSessions(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(MockedAuthService.getUserSessions).toHaveBeenCalledWith(
      mockRequest.user?._id?.toString(),
    );

    // Wait for async error handling
    await new Promise(setImmediate);
    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockStatus).not.toHaveBeenCalled();
  });

  it('should handle empty sessions list', async () => {
    MockedAuthService.getUserSessions.mockResolvedValue([]);

    await getSessions(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(MockedAuthService.getUserSessions).toHaveBeenCalledWith(
      mockRequest.user?._id?.toString(),
    );
    expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'User sessions retrieved successfully',
      sessions: [],
    });
  });
});
