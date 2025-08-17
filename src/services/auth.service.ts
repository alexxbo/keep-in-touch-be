import {StatusCodes} from 'http-status-codes';
import jwt from 'jsonwebtoken';
import {Types} from 'mongoose';
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
import {logger} from '../utils/logger';
import {UserService} from './user.service';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: PublicProfileType;
}

export class AuthService {
  private static readonly ACCESS_TOKEN_EXPIRY = '15m';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';

  /**
   * Generate JWT access token
   */
  private static generateAccessToken(userId: string): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new BaseError(
        'JWT secret is not configured',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }

    return jwt.sign({userId, type: 'access'}, jwtSecret, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });
  }

  /**
   * Generate JWT refresh token
   */
  private static generateRefreshToken(userId: string): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new BaseError(
        'JWT secret is not configured',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }

    return jwt.sign({userId, type: 'refresh'}, jwtSecret, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
    });
  }

  /**
   * Generate both access and refresh tokens
   */
  private static generateTokens(userId: string): AuthTokens {
    return {
      accessToken: this.generateAccessToken(userId),
      refreshToken: this.generateRefreshToken(userId),
    };
  }

  /**
   * Verify and decode JWT token
   */
  static verifyToken(token: string): {userId: string; type: string} {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new BaseError(
        'JWT secret is not configured',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }

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
   * Register a new user
   */
  static async register(userData: RegisterUserType): Promise<AuthResult> {
    const {username, name, email, password} = userData;

    // Remove redundant validation - Zod schema already validates required fields

    // Create user through UserService
    const user = await UserService.createUser({
      username,
      name,
      email,
      password,
    });

    // Generate tokens
    const tokens = this.generateTokens((user._id as Types.ObjectId).toString());

    // Update last seen
    await UserService.updateLastSeen(user._id as Types.ObjectId);

    logger.info(`User registered and logged in: ${user.username}`, {
      userId: user._id,
      username: user.username,
      email: user.email,
    });

    return {
      user: user.getPublicProfile(),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Login user with credentials
   */
  static async login(credentials: LoginType): Promise<AuthResult> {
    const {identifier, password} = credentials;

    // Remove redundant validation - Zod schema already validates required fields

    // Find user by username or email
    const user = await UserService.findByUsernameOrEmail(identifier, true);
    if (!user) {
      throw new BaseError(
        'Invalid credentials or account is inactive',
        StatusCodes.UNAUTHORIZED,
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new BaseError('Invalid credentials', StatusCodes.UNAUTHORIZED);
    }

    // Generate tokens
    const tokens = this.generateTokens((user._id as Types.ObjectId).toString());

    // Update last seen
    await UserService.updateLastSeen(user._id as Types.ObjectId);

    logger.info(`User logged in: ${user.username}`, {
      userId: user._id,
      username: user.username,
    });

    return {
      user: user.getPublicProfile(),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(tokenData: RefreshTokenType): Promise<AuthTokens> {
    const {refreshToken} = tokenData;

    // Remove redundant validation - Zod schema already validates required fields

    // Verify refresh token
    const decoded = this.verifyToken(refreshToken);

    if (decoded.type !== 'refresh') {
      throw new BaseError('Invalid token type', StatusCodes.UNAUTHORIZED);
    }

    // Check if user still exists
    const userExists = await UserService.userExists(decoded.userId);
    if (!userExists) {
      throw new BaseError('User not found', StatusCodes.UNAUTHORIZED);
    }

    // Generate new tokens
    const tokens = this.generateTokens(decoded.userId);

    // Update last seen
    await UserService.updateLastSeen(decoded.userId);

    logger.info(`Token refreshed for user: ${decoded.userId}`, {
      userId: decoded.userId,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Logout user (invalidate refresh token)
   */
  static async logout(userId: string): Promise<void> {
    // TODO: Implement refresh token blacklist/invalidation
    // For now, we'll rely on client-side token removal

    logger.info(`User logged out: ${userId}`, {
      userId,
    });
  }

  /**
   * Initiate forgot password process
   */
  static async forgotPassword(data: ForgotPasswordType): Promise<void> {
    const {email} = data;

    // Remove redundant validation - Zod schema already validates required fields

    // Find user by email
    const user = await UserService.findByUsernameOrEmail(email);

    // Always return success for security (don't reveal if email exists)
    if (user) {
      // TODO: Generate password reset token and send email
      // For now, just log the attempt
      logger.info(`Password reset requested for: ${email}`, {
        userId: user._id,
        email: user.email,
      });
    } else {
      logger.warn(`Password reset requested for non-existent email: ${email}`);
    }
  }

  /**
   * Reset password using reset token
   */
  static async resetPassword(data: ResetPasswordType): Promise<void> {
    const {token, newPassword} = data;

    logger.info(
      `Password reset requested for token: ${token} newPassword: ${newPassword}`,
      {
        token,
        newPassword,
      },
    );
    // TODO: Implement password reset token validation and password update
    // For now, return not implemented
    throw new BaseError(
      'Password reset functionality not implemented yet',
      StatusCodes.NOT_IMPLEMENTED,
    );
  }

  /**
   * Validate access token and return user
   */
  static async validateAccessToken(token: string): Promise<IUser> {
    const decoded = this.verifyToken(token);

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
   * Update password for authenticated user
   */
  static async updatePassword(
    userId: string | Types.ObjectId,
    currentPassword: string,
    newPassword: string,
  ): Promise<{message: string}> {
    await UserService.updatePassword(userId, {
      currentPassword,
      newPassword,
    });

    logger.info(`Password updated via auth service: ${userId}`, {
      userId,
    });

    return {message: 'Password updated successfully'};
  }
}
