import crypto from 'crypto';
import {StatusCodes} from 'http-status-codes';
import {Types} from 'mongoose';

import PasswordResetToken, {
  IPasswordResetToken,
} from '~models/passwordResetToken/passwordResetToken.model';

import {BaseError} from '~utils/BaseError';
import {logger} from '~utils/logger';

export interface CreatePasswordResetTokenData {
  userId: Types.ObjectId;
}

export interface PasswordResetValidationResult {
  userId: Types.ObjectId;
  tokenDocument: IPasswordResetToken;
}

export class PasswordResetTokenService {
  private static readonly TOKEN_LENGTH = 32; // bytes, will be 64 hex chars
  private static readonly EXPIRY_MINUTES = 15; // 15 minutes

  /**
   * Create a new password reset token
   */
  static async createPasswordResetToken(
    data: CreatePasswordResetTokenData,
  ): Promise<{token: string; document: IPasswordResetToken}> {
    const {userId} = data;

    // Revoke any existing password reset tokens for this user
    await PasswordResetToken.updateMany(
      {userId, isUsed: false},
      {isUsed: true},
    );

    // Generate cryptographically secure random token
    const plainToken = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');

    // Calculate expiration date (15 minutes)
    const expiresAt = new Date(Date.now() + this.EXPIRY_MINUTES * 60 * 1000);

    // Create password reset token document
    const resetTokenDoc = new PasswordResetToken({
      userId,
      token: plainToken, // Will be hashed in pre-save hook
      expiresAt,
    });

    await resetTokenDoc.save();

    logger.info('Password reset token created', {
      userId: userId.toString(),
      tokenId: resetTokenDoc._id.toString(),
      expiresAt: expiresAt.toISOString(),
    });

    return {
      token: plainToken,
      document: resetTokenDoc,
    };
  }

  /**
   * Validate a password reset token
   */
  static async validatePasswordResetToken(
    token: string,
  ): Promise<PasswordResetValidationResult> {
    if (!token) {
      throw new BaseError(
        'Password reset token is required',
        StatusCodes.BAD_REQUEST,
      );
    }

    // Find all non-used, non-expired password reset tokens
    const tokenDocs = await PasswordResetToken.find({
      isUsed: false,
      expiresAt: {$gt: new Date()},
    });

    // Check each token to find a match
    let matchingToken: IPasswordResetToken | null = null;
    for (const tokenDoc of tokenDocs) {
      const isMatch = await tokenDoc.compareToken(token);
      if (isMatch) {
        matchingToken = tokenDoc;
        break;
      }
    }

    if (!matchingToken) {
      throw new BaseError(
        'Invalid or expired password reset token',
        StatusCodes.BAD_REQUEST,
      );
    }

    // Double-check validity
    if (!matchingToken.isValid()) {
      throw new BaseError(
        'Invalid or expired password reset token',
        StatusCodes.BAD_REQUEST,
      );
    }

    logger.info('Password reset token validated', {
      userId: matchingToken.userId.toString(),
      tokenId: matchingToken._id.toString(),
    });

    return {
      userId: matchingToken.userId,
      tokenDocument: matchingToken,
    };
  }

  /**
   * Mark a password reset token as used
   */
  static async markTokenAsUsed(
    tokenDocument: IPasswordResetToken,
  ): Promise<void> {
    await tokenDocument.markAsUsed();

    logger.info('Password reset token marked as used', {
      userId: tokenDocument.userId.toString(),
      tokenId: tokenDocument._id.toString(),
    });
  }

  /**
   * Clean up expired and used tokens
   */
  static async cleanupExpiredTokens(): Promise<number> {
    const result = await PasswordResetToken.deleteMany({
      $or: [{isUsed: true}, {expiresAt: {$lt: new Date()}}],
    });

    const deletedCount = result.deletedCount || 0;

    if (deletedCount > 0) {
      logger.info('Cleaned up expired password reset tokens', {deletedCount});
    }

    return deletedCount;
  }

  /**
   * Get password reset token statistics
   */
  static async getTokenStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    used: number;
  }> {
    const now = new Date();

    const [total, active, expired, used] = await Promise.all([
      PasswordResetToken.countDocuments(),
      PasswordResetToken.countDocuments({
        isUsed: false,
        expiresAt: {$gt: now},
      }),
      PasswordResetToken.countDocuments({
        expiresAt: {$lte: now},
      }),
      PasswordResetToken.countDocuments({
        isUsed: true,
      }),
    ]);

    return {total, active, expired, used};
  }
}
