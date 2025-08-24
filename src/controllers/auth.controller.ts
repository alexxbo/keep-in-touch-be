import {NextFunction, Request, Response} from 'express';
import {StatusCodes} from 'http-status-codes';

import {AuthService} from '~services/auth.service';

import {
  ForgotPasswordType,
  LoginType,
  LogoutType,
  RefreshTokenType,
  RegisterUserType,
  ResetPasswordType,
  UpdatePasswordType,
} from '~models/auth/auth.types';

import {BaseError} from '~utils/BaseError';
import {runCatching} from '~utils/runCatching';

export const register = runCatching(async (req: Request, res: Response) => {
  const userData = req.body as RegisterUserType;
  const deviceInfo = req.headers['user-agent'] || undefined;

  const result = await AuthService.register(userData, {deviceInfo});

  res.status(StatusCodes.CREATED).json({
    message: 'User registered successfully',
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
});

export const login = runCatching(async (req: Request, res: Response) => {
  const credentials = req.body as LoginType;
  const deviceInfo = req.headers['user-agent'] || undefined;

  const result = await AuthService.login(credentials, {deviceInfo});

  res.status(StatusCodes.OK).json({
    message: 'Login successful',
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
});

export const refreshToken = runCatching(async (req: Request, res: Response) => {
  const tokenData = req.body as RefreshTokenType;
  const deviceInfo = req.headers['user-agent'] || undefined;

  const result = await AuthService.refreshToken(tokenData, {deviceInfo});

  res.status(StatusCodes.OK).json({
    message: 'Token refreshed successfully',
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
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

export const updatePassword = runCatching(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new BaseError('Authentication required', StatusCodes.UNAUTHORIZED),
      );
    }

    const {currentPassword, newPassword} = req.body as UpdatePasswordType;

    await AuthService.updatePassword(
      req.user._id,
      currentPassword,
      newPassword,
    );

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Password updated successfully',
    });
  },
);

export const logout = runCatching(async (req: Request, res: Response) => {
  const userId = req.user?._id?.toString();
  const body = req.body as LogoutType;
  const refreshToken =
    body.refreshToken || (req.headers['x-refresh-token'] as string | undefined);
  const logoutAllDevices = body.logoutAllDevices === true;

  if (!userId) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      message: 'User not authenticated',
    });
    return;
  }

  await AuthService.logout(userId, refreshToken, logoutAllDevices);

  res.status(StatusCodes.OK).json({
    message: logoutAllDevices
      ? 'Logged out from all devices successfully'
      : 'Logged out successfully',
  });
});

export const getSessions = runCatching(async (req: Request, res: Response) => {
  const userId = req.user?._id?.toString();

  if (!userId) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      message: 'User not authenticated',
    });
    return;
  }

  const sessions = await AuthService.getUserSessions(userId);

  res.status(StatusCodes.OK).json({
    message: 'User sessions retrieved successfully',
    sessions,
  });
});

export const revokeSession = runCatching(
  async (req: Request, res: Response) => {
    const userId = req.user?._id?.toString();
    const {tokenId} = req.params;

    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        message: 'User not authenticated',
      });
      return;
    }

    const result = await AuthService.revokeSession(userId, tokenId);

    res.status(StatusCodes.OK).json({
      message: result.message,
      success: result.success,
    });
  },
);
