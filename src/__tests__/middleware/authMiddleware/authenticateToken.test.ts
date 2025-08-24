import {NextFunction, Request, Response} from 'express';
import {StatusCodes} from 'http-status-codes';

import {authenticateToken} from '~middleware/auth';

import {AuthService} from '~services/auth.service';

import {IUser} from '~models/user/user.model';

import {BaseError} from '~utils/BaseError';

// Mock dependencies
jest.mock('~services/auth.service');

const MockedAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('authenticateToken middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('Success cases', () => {
    it('should authenticate user with valid token', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        role: 'user' as const,
      } as IUser;

      MockedAuthService.validateAccessToken.mockResolvedValue(mockUser);

      req.headers = {
        authorization: 'Bearer valid-token',
      };

      await authenticateToken(req as Request, res as Response, next);

      expect(MockedAuthService.validateAccessToken).toHaveBeenCalledWith(
        'valid-token',
      );
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('Error cases', () => {
    it('should handle missing authorization header', async () => {
      req.headers = {};

      await authenticateToken(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access token is required. Please login to continue',
          statusCode: StatusCodes.UNAUTHORIZED,
        }),
      );
    });

    it('should handle missing token in Bearer header', async () => {
      req.headers = {
        authorization: 'Bearer',
      };

      await authenticateToken(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access token is required. Please login to continue',
          statusCode: StatusCodes.UNAUTHORIZED,
        }),
      );
    });

    it('should handle invalid token', async () => {
      const authError = new BaseError(
        'Invalid token',
        StatusCodes.UNAUTHORIZED,
      );
      MockedAuthService.validateAccessToken.mockRejectedValue(authError);

      req.headers = {
        authorization: 'Bearer invalid-token',
      };

      await authenticateToken(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(authError);
    });

    it('should handle service errors', async () => {
      const serviceError = new Error('Service unavailable');
      MockedAuthService.validateAccessToken.mockRejectedValue(serviceError);

      req.headers = {
        authorization: 'Bearer some-token',
      };

      await authenticateToken(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });
});
