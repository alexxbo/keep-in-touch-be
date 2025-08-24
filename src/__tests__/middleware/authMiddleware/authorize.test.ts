import {NextFunction, Request, Response} from 'express';
import {StatusCodes} from 'http-status-codes';
import {authorize} from '~middleware/auth';

describe('authorize middleware', () => {
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

  describe('Error cases', () => {
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
  });
});
