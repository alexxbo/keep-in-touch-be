import {Request, Response} from 'express';
import {StatusCodes} from 'http-status-codes';
import {
  ForgotPasswordType,
  LoginType,
  RefreshTokenType,
  RegisterUserType,
  ResetPasswordType,
} from '../models/auth/auth.types';
import {AuthService} from '../services/auth.service';
import {runCatching} from '../utils/runCatching';

export const register = runCatching(async (req: Request, res: Response) => {
  const userData = req.body as RegisterUserType;

  const result = await AuthService.register(userData);

  res.status(StatusCodes.CREATED).json({
    message: 'User registered successfully',
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
});

export const login = runCatching(async (req: Request, res: Response) => {
  const credentials = req.body as LoginType;

  const result = await AuthService.login(credentials);

  res.status(StatusCodes.OK).json({
    message: 'Login successful',
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
});

export const refreshToken = runCatching(async (req: Request, res: Response) => {
  const tokenData = req.body as RefreshTokenType;

  const result = await AuthService.refreshToken(tokenData);

  res.status(StatusCodes.OK).json({
    message: 'Token refreshed successfully',
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
});

export const logout = runCatching(async (req: Request, res: Response) => {
  const userId = req.user?._id?.toString();

  await AuthService.logout(userId || '');

  res.status(StatusCodes.OK).json({
    message: 'Logged out successfully',
  });
});

export const forgotPassword = runCatching(
  async (req: Request, res: Response) => {
    const data = req.body as ForgotPasswordType;

    await AuthService.forgotPassword(data);

    res.status(StatusCodes.OK).json({
      message: 'Password reset instructions sent to your email',
    });
  },
);

export const resetPassword = runCatching(
  async (req: Request, res: Response) => {
    const data = req.body as ResetPasswordType;

    await AuthService.resetPassword(data);

    res.status(StatusCodes.OK).json({
      message: 'Password reset successfully',
    });
  },
);
