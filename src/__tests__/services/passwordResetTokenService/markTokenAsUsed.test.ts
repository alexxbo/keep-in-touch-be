import {Types} from 'mongoose';
import PasswordResetToken from '../../../models/passwordResetToken/passwordResetToken.model';
import {PasswordResetTokenService} from '../../../services/passwordResetToken.service';
import {createTestUser} from '../../testHelpers';

describe('PasswordResetTokenService.markTokenAsUsed', () => {
  beforeEach(async () => {
    // Clean up any existing tokens
    await PasswordResetToken.deleteMany({});
  });

  describe('Success cases', () => {
    it('should mark token as used successfully', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        username: 'testuser',
      });

      // Create a token
      const {document} =
        await PasswordResetTokenService.createPasswordResetToken({
          userId: user._id as Types.ObjectId,
        });

      expect(document.isUsed).toBe(false);

      // Mark token as used
      await PasswordResetTokenService.markTokenAsUsed(document);

      // Refresh document from database
      const updatedDocument = await PasswordResetToken.findById(document._id);

      expect(updatedDocument?.isUsed).toBe(true);
    });

    it('should mark multiple tokens as used independently', async () => {
      const user1 = await createTestUser({
        email: 'user1@example.com',
        username: 'user1',
      });
      const user2 = await createTestUser({
        email: 'user2@example.com',
        username: 'user2',
      });

      // Create tokens for both users
      const {document: doc1} =
        await PasswordResetTokenService.createPasswordResetToken({
          userId: user1._id as Types.ObjectId,
        });
      const {document: doc2} =
        await PasswordResetTokenService.createPasswordResetToken({
          userId: user2._id as Types.ObjectId,
        });

      // Mark only first token as used
      await PasswordResetTokenService.markTokenAsUsed(doc1);

      // Refresh documents from database
      const updatedDoc1 = await PasswordResetToken.findById(doc1._id);
      const updatedDoc2 = await PasswordResetToken.findById(doc2._id);

      expect(updatedDoc1?.isUsed).toBe(true);
      expect(updatedDoc2?.isUsed).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle marking already used token', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        username: 'testuser',
      });

      // Create a token
      const {document} =
        await PasswordResetTokenService.createPasswordResetToken({
          userId: user._id as Types.ObjectId,
        });

      // Mark token as used twice
      await PasswordResetTokenService.markTokenAsUsed(document);
      await PasswordResetTokenService.markTokenAsUsed(document);

      // Refresh document from database
      const updatedDocument = await PasswordResetToken.findById(document._id);

      expect(updatedDocument?.isUsed).toBe(true);
    });
  });
});
