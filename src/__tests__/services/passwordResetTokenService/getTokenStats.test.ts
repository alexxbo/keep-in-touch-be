import {Types} from 'mongoose';

import {PasswordResetTokenService} from '~services/passwordResetToken.service';

import PasswordResetToken from '~models/passwordResetToken/passwordResetToken.model';

import {createTestUser} from '../../testHelpers';

describe('PasswordResetTokenService.getTokenStats', () => {
  beforeEach(async () => {
    // Clean up any existing tokens
    await PasswordResetToken.deleteMany({});
  });

  describe('Success cases', () => {
    it('should return zero stats when no tokens exist', async () => {
      const stats = await PasswordResetTokenService.getTokenStats();

      expect(stats).toEqual({
        total: 0,
        active: 0,
        expired: 0,
        used: 0,
      });
    });

    it('should return correct stats for active tokens', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        username: 'testuser',
      });

      // Create an active token
      await PasswordResetTokenService.createPasswordResetToken({
        userId: user._id as Types.ObjectId,
      });

      const stats = await PasswordResetTokenService.getTokenStats();

      expect(stats).toEqual({
        total: 1,
        active: 1,
        expired: 0,
        used: 0,
      });
    });

    it('should return correct stats for expired tokens', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        username: 'testuser',
      });

      // Create a token and expire it
      const {document} =
        await PasswordResetTokenService.createPasswordResetToken({
          userId: user._id as Types.ObjectId,
        });

      document.expiresAt = new Date(Date.now() - 1000); // 1 second ago
      await document.save();

      const stats = await PasswordResetTokenService.getTokenStats();

      expect(stats).toEqual({
        total: 1,
        active: 0,
        expired: 1,
        used: 0,
      });
    });

    it('should return correct stats for used tokens', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        username: 'testuser',
      });

      // Create a token and mark as used
      const {document} =
        await PasswordResetTokenService.createPasswordResetToken({
          userId: user._id as Types.ObjectId,
        });

      await PasswordResetTokenService.markTokenAsUsed(document);

      const stats = await PasswordResetTokenService.getTokenStats();

      expect(stats).toEqual({
        total: 1,
        active: 0,
        expired: 0,
        used: 1,
      });
    });

    it('should return correct stats for mixed token states', async () => {
      const user1 = await createTestUser({
        email: 'user1@example.com',
        username: 'user1',
      });
      const user2 = await createTestUser({
        email: 'user2@example.com',
        username: 'user2',
      });
      const user3 = await createTestUser({
        email: 'user3@example.com',
        username: 'user3',
      });

      // Create active token
      await PasswordResetTokenService.createPasswordResetToken({
        userId: user1._id as Types.ObjectId,
      });

      // Create expired token
      const {document: expiredDoc} =
        await PasswordResetTokenService.createPasswordResetToken({
          userId: user2._id as Types.ObjectId,
        });
      expiredDoc.expiresAt = new Date(Date.now() - 1000);
      await expiredDoc.save();

      // Create used token
      const {document: usedDoc} =
        await PasswordResetTokenService.createPasswordResetToken({
          userId: user3._id as Types.ObjectId,
        });
      await PasswordResetTokenService.markTokenAsUsed(usedDoc);

      const stats = await PasswordResetTokenService.getTokenStats();

      expect(stats).toEqual({
        total: 3,
        active: 1,
        expired: 1,
        used: 1,
      });
    });
  });
});
