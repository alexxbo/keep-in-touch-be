import {z} from 'zod';
import {
  emailSchema,
  nameSchema,
  passwordSchema,
  usernameSchema,
} from './user.types';

export const updatePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
  }),
});

export type UpdatePasswordType = z.infer<typeof updatePasswordSchema>;

export const userIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
});

export type UserIdType = z.infer<typeof userIdSchema>;

export const updateProfileSchema = z.object({
  body: z.object({
    name: nameSchema.optional(),
    username: usernameSchema.optional(),
  }),
});

export type UpdateProfileType = z.infer<typeof updateProfileSchema>;

// Schema for public user profile (omits sensitive fields)
export const publicProfileSchema = z.object({
  username: usernameSchema,
  name: nameSchema,
  email: emailSchema,
  role: z.enum(['user', 'admin']),
  lastSeen: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PublicProfileType = z.infer<typeof publicProfileSchema>;
