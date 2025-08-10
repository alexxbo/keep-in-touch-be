import {z} from 'zod';
import {
  emailSchema,
  nameSchema,
  objectIdSchema,
  passwordSchema,
  roleSchema,
  usernameSchema,
} from './user.types';

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export type UpdatePasswordType = z.infer<typeof updatePasswordSchema>;

export const userParamsSchema = z.object({
  id: objectIdSchema,
});

export type UserParamsType = z.infer<typeof userParamsSchema>;

export const updateProfileSchema = z
  .object({
    name: nameSchema.optional(),
    username: usernameSchema.optional(),
  })
  .refine(data => data.name !== undefined || data.username !== undefined, {
    message: 'At least one field (name or username) must be provided',
  });

export type UpdateProfileType = z.infer<typeof updateProfileSchema>;

// Schema for public user profile (omits sensitive fields)
export const publicProfileSchema = z.object({
  id: objectIdSchema,
  username: usernameSchema,
  name: nameSchema,
  email: emailSchema,
  role: roleSchema,
  lastSeen: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PublicProfileType = z.infer<typeof publicProfileSchema>;

// Schema for user's own complete profile
export const completeProfileSchema = publicProfileSchema;

export type CompleteProfileType = z.infer<typeof completeProfileSchema>;

// Schema for minimal user info (for chat participants, etc.)
export const userSummarySchema = z.object({
  id: objectIdSchema,
  username: usernameSchema,
  name: nameSchema,
});

export type UserSummaryType = z.infer<typeof userSummarySchema>;
