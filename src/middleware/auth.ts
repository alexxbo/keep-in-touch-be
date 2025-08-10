import {NextFunction, Request, Response} from 'express';
import {StatusCodes} from 'http-status-codes';
import jwt from 'jsonwebtoken';
import User from '../models/user/user.model';
import {BaseError} from '../utils/BaseError';

interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

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

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next(
        new BaseError(
          'JWT secret is not configured',
          StatusCodes.INTERNAL_SERVER_ERROR,
        ),
      );
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    const user = await User.findById(decoded.userId).select('+password');

    if (!user) {
      return next(
        new BaseError(
          'Invalid token or user not found',
          StatusCodes.UNAUTHORIZED,
        ),
      );
    }

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
