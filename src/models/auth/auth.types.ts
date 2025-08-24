import z from 'zod';
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerUserSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} from '~validation/auth.schemas';

export type RegisterUserType = z.infer<typeof registerUserSchema>;
export type LoginType = z.infer<typeof loginSchema>;
export type RefreshTokenType = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordType = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordType = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordType = z.infer<typeof updatePasswordSchema>;
export type LogoutType = z.infer<typeof logoutSchema>;
