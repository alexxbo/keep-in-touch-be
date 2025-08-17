import {NextFunction, Request, Response} from 'express';
import {StatusCodes} from 'http-status-codes';
import {AuthService} from '../services/auth.service';
import {BaseError} from '../utils/BaseError';

export const authenticateToken = async (
  req: Request,
  _: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(
        new BaseError(
          'Access token is required. Please login to continue',
          StatusCodes.UNAUTHORIZED,
        ),
      );
    }

    const user = await AuthService.validateAccessToken(token);
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: Array<'user' | 'admin'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new BaseError('Authentication required', StatusCodes.UNAUTHORIZED),
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new BaseError(
          `Role: ${req.user?.role} is not allowed to access this resource`,
          StatusCodes.FORBIDDEN,
        ),
      );
    }

    next();
  };
};
