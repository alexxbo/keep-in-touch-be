import {Types} from 'mongoose';
import PasswordResetToken from '../../../models/passwordResetToken/passwordResetToken.model';
import {PasswordResetTokenService} from '../../../services/passwordResetToken.service';
import {BaseError} from '../../../utils/BaseError';
import {createTestUser} from '../../testHelpers';

describe('PasswordResetTokenService.validatePasswordResetToken', () => {
  beforeEach(async () => {
    // Clean up any existing tokens
    await PasswordResetToken.deleteMany({});
  });

  describe('Success cases', () => {
    it('should validate a valid token successfully', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        username: 'testuser',
      });

      // Create a token
      const {token} = await PasswordResetTokenService.createPasswordResetToken({
        userId: user._id as Types.ObjectId,
      });

      // Validate the token
      const result =
        await PasswordResetTokenService.validatePasswordResetToken(token);

      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('tokenDocument');
      expect(result.userId).toEqual(user._id);
      expect(result.tokenDocument.isUsed).toBe(false);
    });
  });

  describe('Error cases', () => {
    it('should throw error for empty token', async () => {
      await expect(
        PasswordResetTokenService.validatePasswordResetToken(''),
      ).rejects.toThrow('Password reset token is required');
    });

    it('should throw error for invalid token', async () => {
      await expect(
        PasswordResetTokenService.validatePasswordResetToken('invalid-token'),
      ).rejects.toThrow('Invalid or expired password reset token');
    });

    it('should throw error for expired token', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        username: 'testuser',
      });

      // Create a token
      const {token, document} =
        await PasswordResetTokenService.createPasswordResetToken({
          userId: user._id as Types.ObjectId,
        });

      // Manually expire the token
      document.expiresAt = new Date(Date.now() - 1000); // 1 second ago
      await document.save();

      await expect(
        PasswordResetTokenService.validatePasswordResetToken(token),
      ).rejects.toThrow('Invalid or expired password reset token');
    });

    it('should throw error for used token', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        username: 'testuser',
      });

      // Create a token
      const {token, document} =
        await PasswordResetTokenService.createPasswordResetToken({
          userId: user._id as Types.ObjectId,
        });

      // Mark token as used
      await PasswordResetTokenService.markTokenAsUsed(document);

      await expect(
        PasswordResetTokenService.validatePasswordResetToken(token),
      ).rejects.toThrow('Invalid or expired password reset token');
    });

    it('should throw BaseError with correct status code', async () => {
      try {
        await PasswordResetTokenService.validatePasswordResetToken('invalid');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect((error as BaseError).statusCode).toBe(400);
      }
    });
  });
});
