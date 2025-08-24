import {z} from 'zod';

import {
  emailSchema,
  nameSchema,
  passwordSchema,
  usernameSchema,
} from '~models/user/user.schemas';

export const registerUserSchema = z.object({
  username: usernameSchema,
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .nonempty('Username/email and password are required'), // To handle both username or email
  password: z.string().nonempty('Username/email and password are required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().nonempty('Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().nonempty('Reset token is required'),
  newPassword: passwordSchema,
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().nonempty('Current password is required'),
  newPassword: passwordSchema,
});

export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
  logoutAllDevices: z.boolean().optional(),
});
