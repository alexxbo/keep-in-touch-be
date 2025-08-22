import z from 'zod';
import {
  completeProfileSchema,
  publicProfileSchema,
  updateProfileSchema,
  userParamsSchema,
  userSummarySchema,
} from '../../validation/user.schemas';

export type UserSummaryType = z.infer<typeof userSummarySchema>;
export type CompleteProfileType = z.infer<typeof completeProfileSchema>;
export type PublicProfileType = z.infer<typeof publicProfileSchema>;
export type UpdateProfileType = z.infer<typeof updateProfileSchema>;
export type UserParamsType = z.infer<typeof userParamsSchema>;
