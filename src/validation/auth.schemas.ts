import z from 'zod';
import {
  emailSchema,
  nameSchema,
  passwordSchema,
  usernameSchema,
} from '../models/user/user.schemas';

export const registerUserSchema = z.object({
  username: usernameSchema,
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  identifier: z.string().trim(), // To handle both username or email
  password: z.string().min(1, 'Password cannot be empty'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
});
