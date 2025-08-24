import {StatusCodes} from 'http-status-codes';
import jwt from 'jsonwebtoken';
import {Types} from 'mongoose';
import type {StringValue} from 'ms';
import env from '../config/env.config';
import {
  ForgotPasswordType,
  LoginType,
  RefreshTokenType,
  RegisterUserType,
  ResetPasswordType,
} from '../models/auth/auth.types';
import {IUser} from '../models/user/user.model';
import {
  CompleteProfileType,
  PublicProfileType,
} from '../models/user/user.types';
import {BaseError} from '../utils/BaseError';
import {Email} from '../utils/email';
import {logger} from '../utils/logger';
import {PasswordResetTokenService} from './passwordResetToken.service';
import {RefreshTokenService} from './refreshToken.service';
import {UserService} from './user.service';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: PublicProfileType;
}

export interface Options {
  deviceInfo?: string;
}

export class AuthService {
  private static readonly ACCESS_TOKEN_EXPIRY =
    env.JWT_ACCESS_EXPIRE as StringValue;

  private static readonly REFRESH_TOKEN_EXPIRY =
    env.JWT_REFRESH_EXPIRE as StringValue;

  /**
   * Register a new user
   */
  static async register(
    userData: RegisterUserType,
    options?: Options,
  ): Promise<AuthResult> {
    const {username, name, email, password} = userData;
    const {deviceInfo} = options || {};

    // Create user through UserService
    const user = await UserService.createUser({
      username,
      name,
      email,
      password,
    });

    // Generate JWT tokens
    const jwtTokens = this.generateTokens(
      (user._id as Types.ObjectId).toString(),
    );

    // Store refresh token in database for tracking
    await RefreshTokenService.storeRefreshToken(
      {
        userId: user._id as Types.ObjectId,
        deviceInfo,
      },
      jwtTokens.refreshToken,
    );

    // Update last seen
    await UserService.updateLastSeen(user._id as Types.ObjectId);

    logger.info(`User registered and logged in: ${user.username}`, {
      userId: user._id,
      username: user.username,
      email: user.email,
      deviceInfo,
    });

    return {
      user: user.getPublicProfile(),
      accessToken: jwtTokens.accessToken,
      refreshToken: jwtTokens.refreshToken,
    };
  }

  /**
   * Login user with credentials
   */
  static async login(
    credentials: LoginType,
    options?: Options,
  ): Promise<AuthResult> {
    const {identifier, password} = credentials;
    const {deviceInfo} = options || {};

    const user = await UserService.findByUsernameOrEmail(identifier, true);
    if (!user) {
      throw new BaseError(
        'Invalid credentials or account is inactive',
        StatusCodes.UNAUTHORIZED,
      );
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new BaseError('Invalid credentials', StatusCodes.UNAUTHORIZED);
    }

    const jwtTokens = this.generateTokens(
      (user._id as Types.ObjectId).toString(),
    );

    await RefreshTokenService.storeRefreshToken(
      {
        userId: user._id as Types.ObjectId,
        deviceInfo,
      },
      jwtTokens.refreshToken,
    );

    await UserService.updateLastSeen(user._id as Types.ObjectId);

    logger.info(`User logged in: ${user.username}`, {
      userId: user._id,
      username: user.username,
      deviceInfo,
    });

    return {
      user: user.getPublicProfile(),
      accessToken: jwtTokens.accessToken,
      refreshToken: jwtTokens.refreshToken,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(
    tokenData: RefreshTokenType,
    options?: Options,
  ): Promise<AuthTokens> {
    const {refreshToken} = tokenData;
    const {deviceInfo} = options || {};

    const decoded = this.verifyToken(refreshToken, 'refresh');
    if (decoded.type !== 'refresh') {
      throw new BaseError('Invalid token type', StatusCodes.UNAUTHORIZED);
    }

    const {userId, tokenDocument} =
      await RefreshTokenService.validateRefreshToken(refreshToken);

    const userExists = await UserService.userExists(userId);
    if (!userExists) {
      throw new BaseError('User not found', StatusCodes.UNAUTHORIZED);
    }

    const newAccessToken = this.generateAccessToken(userId.toString());

    const newJwtTokens = this.generateTokens(userId.toString());

    await RefreshTokenService.storeRefreshToken(
      {
        userId,
        deviceInfo: deviceInfo || tokenDocument.deviceInfo,
      },
      newJwtTokens.refreshToken,
    );

    // Revoke the old refresh token
    await tokenDocument.revoke();

    await UserService.updateLastSeen(userId);

    logger.info(`Token refreshed for user: ${userId.toString()}`, {
      userId: userId.toString(),
      oldTokenId: tokenDocument._id.toString(),
      deviceInfo: deviceInfo || tokenDocument.deviceInfo,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newJwtTokens.refreshToken,
    };
  }

  /**
   * Logout user (invalidate refresh token)
   */
  static async logout(
    userId: string,
    refreshToken?: string,
    logoutAllDevices = false,
  ): Promise<void> {
    try {
      if (logoutAllDevices) {
        // Revoke all refresh tokens for the user
        const revokedCount =
          await RefreshTokenService.revokeAllUserTokens(userId);
        logger.info(`User logged out from all devices: ${userId}`, {
          userId,
          revokedTokens: revokedCount,
        });
      } else if (refreshToken) {
        // Revoke specific refresh token
        await RefreshTokenService.revokeRefreshToken(refreshToken);
        logger.info(`User logged out: ${userId}`, {
          userId,
        });
      } else {
        logger.info(`User logout initiated without token: ${userId}`, {
          userId,
        });
      }
    } catch (error) {
      logger.warn('Error during logout', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw error for logout - always succeed
    }
  }

  /**
   * Initiate forgot password process
   */
  static async forgotPassword(data: ForgotPasswordType): Promise<void> {
    const {email} = data;

    // Find user by email
    const user = await UserService.findByUsernameOrEmail(email);

    // Always return success for security (don't reveal if email exists)
    if (user) {
      // Generate password reset token
      const {token} = await PasswordResetTokenService.createPasswordResetToken({
        userId: user._id as Types.ObjectId,
      });

      const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

      try {
        // Send email with reset token
        const emailSender = new Email({user, url: resetUrl});
        await emailSender.sendPasswordReset();

        logger.info(`Password reset email sent successfully`, {
          userId: user._id,
          email: user.email,
        });
      } catch (error) {
        logger.error(`Failed to send password reset email`, {
          userId: user._id,
          email: user.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        // In development, still log the token for testing
        if (env.NODE_ENV === 'development') {
          logger.info(`Password reset token for development: ${token}`, {
            userId: user._id,
            email: user.email,
          });
        }

        // Don't throw error to prevent revealing email existence
        // Just log the error and continue
      }
    } else {
      logger.warn(`Password reset requested for non-existent email: ${email}`);
    }
  }

  /**
   * Reset password using reset token
   */
  static async resetPassword(data: ResetPasswordType): Promise<void> {
    const {token, newPassword} = data;

    const {userId, tokenDocument} =
      await PasswordResetTokenService.validatePasswordResetToken(token);

    await UserService.updatePassword(userId, {
      currentPassword: undefined,
      newPassword: newPassword,
    });

    await PasswordResetTokenService.markTokenAsUsed(tokenDocument);

    // Revoke all refresh tokens for security
    await RefreshTokenService.revokeAllUserTokens(userId);

    logger.info(`Password reset completed for user: ${userId.toString()}`, {
      userId: userId.toString(),
      tokenId: tokenDocument._id.toString(),
    });
  }

  /**
   * Validate access token and return user
   */
  static async validateAccessToken(token: string): Promise<IUser> {
    const decoded = this.verifyToken(token, 'access');

    if (decoded.type !== 'access') {
      throw new BaseError('Invalid token type', StatusCodes.UNAUTHORIZED);
    }

    const user = await UserService.findById(decoded.userId);
    if (!user) {
      throw new BaseError('User not found', StatusCodes.UNAUTHORIZED);
    }

    return user;
  }

  /**
   * Check if user is authenticated based on token
   */
  static async isAuthenticated(token: string): Promise<boolean> {
    try {
      await this.validateAccessToken(token);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get authenticated user profile
   */
  static async getAuthenticatedUser(
    token: string,
  ): Promise<CompleteProfileType> {
    const user = await this.validateAccessToken(token);
    return user.getCompleteProfile();
  }

  /**
   * Get user's active sessions
   */
  static async getUserSessions(userId: string): Promise<
    Array<{
      tokenId: string;
      deviceInfo?: string;
      createdAt: Date;
      expiresAt: Date;
    }>
  > {
    return UserService.getUserActiveSessions(userId);
  }

  /**
   * Revoke a specific session
   */
  static async revokeSession(
    userId: string,
    tokenId: string,
  ): Promise<{success: boolean; message: string}> {
    try {
      logger.info(`Session revocation requested: ${userId}`, {
        userId,
        tokenId,
      });
      const result = await UserService.revokeUserTokens(
        userId,
        false,
        new Types.ObjectId(tokenId),
      );

      if (result === 0) {
        logger.warn(`Session not found for revocation: ${userId}`, {
          userId,
          tokenId,
        });

        return {
          success: false,
          message: 'Session not found',
        };
      }

      return {
        success: true,
        message: 'Session revoked successfully',
      };
    } catch (error) {
      logger.error('Failed to revoke session', {
        userId,
        tokenId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        message: 'Failed to revoke session',
      };
    }
  }

  /**
   * Update password for authenticated user
   */
  static async updatePassword(
    userId: string | Types.ObjectId,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    await UserService.updatePassword(userId, {
      newPassword: newPassword,
      currentPassword: currentPassword,
    });
  }

  /**
   * Verify and decode JWT token
   */
  private static verifyToken(
    token: string,
    type: 'access' | 'refresh',
  ): {userId: string; type: string} {
    const jwtSecret =
      type === 'access' ? env.ACCESS_TOKEN_SECRET : env.REFRESH_TOKEN_SECRET;

    try {
      const decoded = jwt.verify(token, jwtSecret) as {
        userId: string;
        type: string;
      };
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new BaseError('Token has expired', StatusCodes.UNAUTHORIZED);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new BaseError('Invalid token', StatusCodes.UNAUTHORIZED);
      }
      throw new BaseError(
        'Token verification failed',
        StatusCodes.UNAUTHORIZED,
      );
    }
  }

  /**
   * Generate JWT access token
   */
  private static generateAccessToken(userId: string): string {
    const payload = {
      userId,
      type: 'access',
      iat: Math.floor(Date.now() / 1000), // Ensure uniqueness with explicit issued-at timestamp
      jti: `${Date.now()}-${Math.random().toString(36).substring(2)}`, // Unique JWT ID
    };
    const options = {expiresIn: AuthService.ACCESS_TOKEN_EXPIRY};

    return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, options);
  }

  /**
   * Generate JWT refresh token
   */
  private static generateRefreshToken(userId: string): string {
    const payload = {
      userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000), // Ensure uniqueness with explicit issued-at timestamp
      jti: `${Date.now()}-${Math.random().toString(36).substring(2)}`, // Unique JWT ID
    };
    const options = {expiresIn: AuthService.REFRESH_TOKEN_EXPIRY};

    return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, options);
  }

  /**
   * Generate both access and refresh tokens
   */
  private static generateTokens(userId: string): AuthTokens {
    return {
      accessToken: AuthService.generateAccessToken(userId),
      refreshToken: AuthService.generateRefreshToken(userId),
    };
  }
}
