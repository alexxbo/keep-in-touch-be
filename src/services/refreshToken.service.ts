import {StatusCodes} from 'http-status-codes';
import {Types} from 'mongoose';
import env from '~config/env.config';
import RefreshToken, {
  IRefreshToken,
} from '~models/refreshToken/refreshToken.model';
import {BaseError} from '~utils/BaseError';
import {logger} from '~utils/logger';

export interface CreateRefreshTokenData {
  userId: Types.ObjectId;
  deviceInfo?: string;
}

export interface RefreshTokenValidationResult {
  userId: Types.ObjectId;
  tokenDocument: IRefreshToken;
}

export class RefreshTokenService {
  private static readonly EXPIRY_DAYS = 7;

  /**
   * Parse time string to milliseconds
   */
  private static parseTimeToMs(timeStr: string): number {
    const match = timeStr.match(/^(\d+)([dhms])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'm':
        return value * 60 * 1000;
      case 's':
        return value * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Store a JWT refresh token in database for tracking
   */
  static async storeRefreshToken(
    data: CreateRefreshTokenData,
    jwtRefreshToken: string,
  ): Promise<{document: IRefreshToken}> {
    const {userId, deviceInfo} = data;

    // Calculate expiration date from JWT token
    const expiryTime = env.JWT_REFRESH_EXPIRE || '7d';
    const expiresAt = new Date(Date.now() + this.parseTimeToMs(expiryTime));

    // Create refresh token document to track the JWT token
    const refreshTokenDoc = new RefreshToken({
      userId,
      token: jwtRefreshToken, // Store the JWT refresh token (will be hashed)
      deviceInfo,
      expiresAt,
    });

    await refreshTokenDoc.save();

    logger.info('JWT refresh token stored in database', {
      userId: userId.toString(),
      tokenId: refreshTokenDoc._id.toString(),
      expiresAt: expiresAt.toISOString(),
      deviceInfo,
    });

    return {
      document: refreshTokenDoc,
    };
  }

  /**
   * Validate a refresh token and return user info
   */
  static async validateRefreshToken(
    token: string,
  ): Promise<RefreshTokenValidationResult> {
    if (!token) {
      throw new BaseError(
        'Refresh token is required',
        StatusCodes.UNAUTHORIZED,
      );
    }

    // Find all non-revoked, non-expired refresh tokens
    // We need to check all of them since tokens are hashed
    const tokenDocs = await RefreshToken.find({
      isRevoked: false,
      expiresAt: {$gt: new Date()},
    });

    // Check each token to find a match
    let matchingToken: IRefreshToken | null = null;
    for (const tokenDoc of tokenDocs) {
      const isMatch = await tokenDoc.compareToken(token);
      if (isMatch) {
        matchingToken = tokenDoc;
        break;
      }
    }

    if (!matchingToken) {
      throw new BaseError(
        'Invalid or expired refresh token',
        StatusCodes.UNAUTHORIZED,
      );
    }

    // Double-check validity
    if (!matchingToken.isValid()) {
      throw new BaseError(
        'Invalid or expired refresh token',
        StatusCodes.UNAUTHORIZED,
      );
    }

    logger.info('Refresh token validated', {
      userId: matchingToken.userId.toString(),
      tokenId: matchingToken._id.toString(),
    });

    return {
      userId: matchingToken.userId,
      tokenDocument: matchingToken,
    };
  }

  /**
   * Revoke a specific refresh token
   */
  static async revokeRefreshToken(token: string): Promise<void> {
    try {
      const {tokenDocument} = await this.validateRefreshToken(token);
      await tokenDocument.revoke();

      logger.info('Refresh token revoked', {
        userId: tokenDocument.userId.toString(),
        tokenId: tokenDocument._id.toString(),
      });
    } catch (error) {
      // If token is invalid, consider it already revoked
      logger.warn('Attempted to revoke invalid refresh token', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  static async revokeAllUserTokens(
    userId: string | Types.ObjectId,
  ): Promise<number> {
    const result = await RefreshToken.updateMany(
      {userId, isRevoked: false},
      {isRevoked: true},
    );

    const revokedCount = result.modifiedCount || 0;

    logger.info('All user refresh tokens revoked', {
      userId: userId.toString(),
      revokedCount,
    });

    return revokedCount;
  }

  /**
   * Revoke all refresh tokens except the current one
   */
  static async revokeOtherUserTokens(
    userId: string | Types.ObjectId,
    currentTokenId: Types.ObjectId,
  ): Promise<number> {
    const result = await RefreshToken.updateMany(
      {
        userId,
        _id: {$ne: currentTokenId},
        isRevoked: false,
      },
      {isRevoked: true},
    );

    const revokedCount = result.modifiedCount || 0;

    logger.info('Other user refresh tokens revoked', {
      userId: userId.toString(),
      currentTokenId: currentTokenId.toString(),
      revokedCount,
    });

    return revokedCount;
  }

  /**
   * Get active refresh tokens for a user
   */
  static async getUserActiveTokens(
    userId: string | Types.ObjectId,
  ): Promise<IRefreshToken[]> {
    return RefreshToken.find({
      userId,
      isRevoked: false,
      expiresAt: {$gt: new Date()},
    }).sort({createdAt: -1});
  }

  /**
   * Clean up expired and revoked tokens
   */
  static async cleanupExpiredTokens(): Promise<number> {
    const result = await RefreshToken.deleteMany({
      $or: [{isRevoked: true}, {expiresAt: {$lt: new Date()}}],
    });

    const deletedCount = result.deletedCount || 0;

    if (deletedCount > 0) {
      logger.info('Cleaned up expired refresh tokens', {deletedCount});
    }

    return deletedCount;
  }

  /**
   * Get refresh token statistics for monitoring
   */
  static async getTokenStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    revoked: number;
  }> {
    const now = new Date();

    const [total, active, expired, revoked] = await Promise.all([
      RefreshToken.countDocuments(),
      RefreshToken.countDocuments({
        isRevoked: false,
        expiresAt: {$gt: now},
      }),
      RefreshToken.countDocuments({
        expiresAt: {$lte: now},
      }),
      RefreshToken.countDocuments({
        isRevoked: true,
      }),
    ]);

    return {total, active, expired, revoked};
  }
}
