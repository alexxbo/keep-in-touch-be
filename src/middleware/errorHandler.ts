import {NextFunction, Request, Response} from 'express';

interface CustomError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction, // eslint-disable-line @typescript-eslint/no-unused-vars
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    console.error(`Error ${err.statusCode} - ${err.status}:`, err.message);
    console.error(err.stack);
  } else {
    // In production, log less verbose error info to console
    // Or send to a proper error monitoring service (e.g., Winston, Pino, Sentry)
    console.error(
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
