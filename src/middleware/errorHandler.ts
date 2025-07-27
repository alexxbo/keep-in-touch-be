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

  if (process.env.NODE_ENV === 'development') {
    logger.error(`Error ${err.statusCode} - ${err.status}:`, err.message);
    logger.error(err.stack);
  } else {
    logger.error(
      `Production Error ${err.statusCode} - ${err.status}:`,
      err.message,
    );
  }

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  res.status(err.statusCode).json({
    status: 'error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export default errorHandler;
