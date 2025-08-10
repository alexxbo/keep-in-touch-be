import z from 'zod';
import {
  emailSchema,
  nameSchema,
  passwordSchema,
  usernameSchema,
} from '../user/user.types';

export const registerUserSchema = z.object({
  username: usernameSchema,
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export type RegisterUserType = z.infer<typeof registerUserSchema>;

export const loginSchema = z.object({
  identifier: z.string().trim(), // To handle both username or email
  password: z.string().min(1, 'Password cannot be empty'),
});

export type LoginType = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenType = z.infer<typeof refreshTokenSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordType = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
});

export type ResetPasswordType = z.infer<typeof resetPasswordSchema>;
