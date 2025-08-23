import {NextFunction, Request, Response} from 'express';
import {StatusCodes} from 'http-status-codes';
import {authenticateToken, authorize} from '../../middleware/auth';
import {IUser} from '../../models/user/user.model';
import {AuthService} from '../../services';
import {BaseError} from '../../utils/BaseError';

// Mock dependencies
jest.mock('../../services/auth.service');

const MockedAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('Auth Middleware', () => {
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

  describe('authenticateToken', () => {
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

  describe('authorize', () => {
    it('should allow access for user with correct role', () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        role: 'admin' as const,
      };

      req.user = mockUser;

      const adminAuthorize = authorize('admin');
      adminAuthorize(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should allow access for user with any of the allowed roles', () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        role: 'user' as const,
      };

      req.user = mockUser;

      const multiRoleAuthorize = authorize('user', 'admin');
      multiRoleAuthorize(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny access when user not authenticated', () => {
      req.user = undefined;

      const adminAuthorize = authorize('admin');
      adminAuthorize(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required',
          statusCode: StatusCodes.UNAUTHORIZED,
        }),
      );
    });

    it('should deny access for user with wrong role', () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        role: 'user' as const,
      };

      req.user = mockUser;

      const adminAuthorize = authorize('admin');
      adminAuthorize(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Role: user is not allowed to access this resource',
          statusCode: StatusCodes.FORBIDDEN,
        }),
      );
    });

    it('should work with multiple role requirements', () => {
      const userWithUserRole = {
        _id: 'user123',
        username: 'testuser',
        role: 'user' as const,
      };

      const userWithAdminRole = {
        _id: 'admin123',
        username: 'adminuser',
        role: 'admin' as const,
      };

      const multiRoleAuthorize = authorize('user', 'admin');

      // Test user role
      req.user = userWithUserRole;
      multiRoleAuthorize(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith();

      // Reset mock
      (next as jest.Mock).mockClear();

      // Test admin role
      req.user = userWithAdminRole;
      multiRoleAuthorize(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith();
    });
  });
});
