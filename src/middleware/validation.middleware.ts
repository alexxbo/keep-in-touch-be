import {NextFunction, Request, Response} from 'express';
import z from 'zod';
import {runCatching} from '../utils/runCatching';

export const validateRequest = (schema: z.ZodObject) =>
  runCatching(async (req: Request, res: Response, next: NextFunction) => {
    await schema.parseAsync(req);
    next();
  });
