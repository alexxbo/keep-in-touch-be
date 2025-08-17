import {NextFunction, Request, Response} from 'express';
import {StatusCodes} from 'http-status-codes';
import z from 'zod';
import {BaseError} from '../utils/BaseError';
import {logger} from '../utils/logger';

const errorHandler = (
  err: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  req: Request,
  res: Response,
  next: NextFunction, // eslint-disable-line @typescript-eslint/no-unused-vars
) => {
  const isProduction = process.env.NODE_ENV === 'production';
  let needToLogStack = false;

  if (!(err instanceof Error)) {
    err = new Error(err);
  }

  err.statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  err.message = err.message || 'Internal server error';

  // Wrong MongoDB ID error
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid ${err.path}`;
    err = new BaseError(message, StatusCodes.BAD_REQUEST);
  }

  // Duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate entry for ${Object.keys(err.keyValue)}`;
    err = new BaseError(message, StatusCodes.BAD_REQUEST);
  }

  // Wrong JWT error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Auth failed. Please try again.';
    err = new BaseError(message, StatusCodes.UNAUTHORIZED);
  }

  // JWT expired error
  if (err.name === 'TokenExpiredError') {
    const message = 'Auth failed. Please log in again.';
    err = new BaseError(message, StatusCodes.UNAUTHORIZED);
  }

  // Zod validation error
  if (err instanceof z.ZodError) {
    err = new BaseError(z.prettifyError(err), StatusCodes.BAD_REQUEST);
  }

  // Operational errors should not leak details in production
  if (!(err instanceof BaseError) && isProduction) {
    err.message = 'An unexpected error occurred. Please try again later.';
    needToLogStack = !isProduction && err.statusCode === undefined;
  }

  // Log the error
  logger.error(
    `${err.statusCode ? `statusCode: ${err.statusCode}` : ''} message: ${err.message}`,
    {
      stack: needToLogStack ? err.stack : undefined,
    },
  );

  res.status(err.statusCode).json({
    success: false,
    status: err.statusCode,
    message: err.message,
    stack: needToLogStack ? err.stack : undefined,
  });
};

export default errorHandler;
