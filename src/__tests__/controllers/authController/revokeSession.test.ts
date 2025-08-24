import {Request, Response} from 'express';
import {StatusCodes} from 'http-status-codes';
import {Types} from 'mongoose';
import {revokeSession} from '../../../controllers/auth.controller';
import {AuthService} from '../../../services/auth.service';

// Mock the AuthService
jest.mock('../../../services/auth.service');
const MockedAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('Auth Controller - revokeSession', () => {
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
      params: {
        tokenId: 'session-token-id',
      },
    };
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    jest.clearAllMocks();
  });

  it('should revoke session successfully', async () => {
    const mockResult = {
      success: true,
      message: 'Session revoked successfully',
    };

    MockedAuthService.revokeSession.mockResolvedValue(mockResult);

    await revokeSession(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(MockedAuthService.revokeSession).toHaveBeenCalledWith(
      mockRequest.user?._id?.toString(),
      'session-token-id',
    );
    expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'Session revoked successfully',
      success: true,
    });
  });

  it('should handle session not found', async () => {
    const mockResult = {
      success: false,
      message: 'Session not found',
    };

    MockedAuthService.revokeSession.mockResolvedValue(mockResult);

    await revokeSession(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(MockedAuthService.revokeSession).toHaveBeenCalledWith(
      mockRequest.user?._id?.toString(),
      'session-token-id',
    );
    expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'Session not found',
      success: false,
    });
  });

  it('should handle missing user authentication', async () => {
    mockRequest.user = undefined;

    await revokeSession(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockStatus).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'User not authenticated',
    });
    expect(MockedAuthService.revokeSession).not.toHaveBeenCalled();
  });

  it('should handle service errors', async () => {
    const error = new Error('Database connection failed');
    MockedAuthService.revokeSession.mockRejectedValue(error);

    await revokeSession(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(MockedAuthService.revokeSession).toHaveBeenCalledWith(
      mockRequest.user?._id?.toString(),
      'session-token-id',
    );

    // Wait for async error handling
    await new Promise(setImmediate);
    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockStatus).not.toHaveBeenCalled();
  });

  it('should handle missing tokenId parameter', async () => {
    mockRequest.params = {};
    const mockResult = {
      success: false,
      message: 'Invalid token ID',
    };

    MockedAuthService.revokeSession.mockResolvedValue(mockResult);

    await revokeSession(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(MockedAuthService.revokeSession).toHaveBeenCalledWith(
      mockRequest.user?._id?.toString(),
      undefined,
    );
    expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'Invalid token ID',
      success: false,
    });
  });
});
