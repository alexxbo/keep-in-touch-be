import {Types} from 'mongoose';
import PasswordResetToken from '~models/passwordResetToken/passwordResetToken.model';
import {PasswordResetTokenService} from '~services/passwordResetToken.service';
import {createTestUser} from '../../testHelpers';

describe('PasswordResetTokenService.cleanupExpiredTokens', () => {
  beforeEach(async () => {
    // Clean up any existing tokens
    await PasswordResetToken.deleteMany({});
  });

  describe('Success cases', () => {
    it('should delete expired tokens', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        username: 'testuser',
      });

      // Create a token and manually expire it
      const {document} =
        await PasswordResetTokenService.createPasswordResetToken({
          userId: user._id as Types.ObjectId,
        });

      // Manually set expiry to past
      document.expiresAt = new Date(Date.now() - 1000); // 1 second ago
      await document.save();

      const deletedCount =
        await PasswordResetTokenService.cleanupExpiredTokens();

      expect(deletedCount).toBe(1);

      // Verify token was deleted
      const remainingTokens = await PasswordResetToken.find({});
      expect(remainingTokens).toHaveLength(0);
    });

    it('should delete used tokens', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        username: 'testuser',
      });

      // Create a token and mark it as used
      const {document} =
        await PasswordResetTokenService.createPasswordResetToken({
          userId: user._id as Types.ObjectId,
        });

      await PasswordResetTokenService.markTokenAsUsed(document);

      const deletedCount =
        await PasswordResetTokenService.cleanupExpiredTokens();

      expect(deletedCount).toBe(1);

      // Verify token was deleted
      const remainingTokens = await PasswordResetToken.find({});
      expect(remainingTokens).toHaveLength(0);
    });

    it('should not delete valid active tokens', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        username: 'testuser',
      });

      // Create a valid active token
      await PasswordResetTokenService.createPasswordResetToken({
        userId: user._id as Types.ObjectId,
      });

      const deletedCount =
        await PasswordResetTokenService.cleanupExpiredTokens();

      expect(deletedCount).toBe(0);

      // Verify token still exists
      const remainingTokens = await PasswordResetToken.find({});
      expect(remainingTokens).toHaveLength(1);
    });

    it('should return zero when no tokens to cleanup', async () => {
      const deletedCount =
        await PasswordResetTokenService.cleanupExpiredTokens();

      expect(deletedCount).toBe(0);
    });
  });
});
