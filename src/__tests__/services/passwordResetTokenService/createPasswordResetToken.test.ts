import {Types} from 'mongoose';

import {PasswordResetTokenService} from '~services/passwordResetToken.service';

import PasswordResetToken from '~models/passwordResetToken/passwordResetToken.model';

import {createTestUser} from '../../testHelpers';

describe('PasswordResetTokenService.createPasswordResetToken', () => {
  beforeEach(async () => {
    // Clean up any existing tokens
    await PasswordResetToken.deleteMany({});
  });

  describe('Success cases', () => {
    it('should create a password reset token successfully', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        username: 'testuser',
      });

      const result = await PasswordResetTokenService.createPasswordResetToken({
        userId: user._id as Types.ObjectId,
      });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('document');
      expect(result.token).toBeTruthy();
      expect(result.token).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(result.document.userId).toEqual(user._id);
      expect(result.document.isUsed).toBe(false);
      expect(result.document.expiresAt).toBeInstanceOf(Date);
      expect(result.document.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should revoke existing unused tokens when creating new one', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        username: 'testuser',
      });

      // Create first token
      await PasswordResetTokenService.createPasswordResetToken({
        userId: user._id as Types.ObjectId,
      });

      // Create second token
      const result = await PasswordResetTokenService.createPasswordResetToken({
        userId: user._id as Types.ObjectId,
      });

      // Check that only one active token exists
      const activeTokens = await PasswordResetToken.find({
        userId: user._id,
        isUsed: false,
      });

      expect(activeTokens).toHaveLength(1);
      expect(activeTokens[0]._id).toEqual(result.document._id);

      // Check that previous token was marked as used
      const usedTokens = await PasswordResetToken.find({
        userId: user._id,
        isUsed: true,
      });

      expect(usedTokens).toHaveLength(1);
    });

    it('should set proper expiration time (15 minutes)', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        username: 'testuser',
      });

      const beforeCreation = Date.now();
      const result = await PasswordResetTokenService.createPasswordResetToken({
        userId: user._id as Types.ObjectId,
      });
      const afterCreation = Date.now();

      const expectedMinExpiry = beforeCreation + 15 * 60 * 1000; // 15 minutes
      const expectedMaxExpiry = afterCreation + 15 * 60 * 1000; // 15 minutes

      expect(result.document.expiresAt.getTime()).toBeGreaterThanOrEqual(
        expectedMinExpiry,
      );
      expect(result.document.expiresAt.getTime()).toBeLessThanOrEqual(
        expectedMaxExpiry,
      );
    });
  });

  describe('Edge cases', () => {
    it('should work with different user IDs', async () => {
      const user1 = await createTestUser({
        email: 'user1@example.com',
        username: 'user1',
      });
      const user2 = await createTestUser({
        email: 'user2@example.com',
        username: 'user2',
      });

      const result1 = await PasswordResetTokenService.createPasswordResetToken({
        userId: user1._id as Types.ObjectId,
      });
      const result2 = await PasswordResetTokenService.createPasswordResetToken({
        userId: user2._id as Types.ObjectId,
      });

      expect(result1.document.userId).toEqual(user1._id);
      expect(result2.document.userId).toEqual(user2._id);
      expect(result1.token).not.toBe(result2.token);
    });
  });
});
