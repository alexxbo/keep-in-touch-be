import {NextFunction, Request, Response} from 'express';
import z from 'zod';
import {runCatching} from '~utils/runCatching';

type RequestSchemas = {
  body?: z.ZodObject;
  params?: z.ZodObject;
  query?: z.ZodObject;
};

export const validateRequest = (schemas: RequestSchemas) =>
  runCatching(async (req: Request, res: Response, next: NextFunction) => {
    // Validate the request body if a schema is provided
    if (schemas.body) {
      await schemas.body.parseAsync(req.body);
    }

    // Validate the request parameters if a schema is provided
    if (schemas.params) {
      await schemas.params.parseAsync(req.params);
    }

    // Validate the request query if a schema is provided
    if (schemas.query) {
      await schemas.query.parseAsync(req.query);
    }
    next();
  });
