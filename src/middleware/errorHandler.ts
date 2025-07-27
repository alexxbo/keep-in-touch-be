import {NextFunction, Request, Response} from 'express';
import {logger} from '../utils/logger';

export class BaseError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (
  err: BaseError,
  req: Request,
  res: Response,
  next: NextFunction, // eslint-disable-line @typescript-eslint/no-unused-vars
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  // Log error details
  logger.error(
    `${isProduction ? 'Production' : 'Development'} Error ${err.statusCode} - ${err.status}:`,
    err.message,
  );

  // Log stack trace in development
  if (isDevelopment) {
    logger.error(err.stack);
  }

  // Prepare error response
  const response: {
    status: string;
    message: string;
    error?: BaseError;
    stack?: string;
  } = {
    status: err.status,
    message: err.message,
  };

  if (isDevelopment) {
    response.error = err;
    response.stack = err.stack;
  }

  if (!err.isOperational && isProduction) {
    response.message = 'An unexpected error occurred. Please try again later.';
  }

  res.status(err.statusCode).json(response);
};

export default errorHandler;
