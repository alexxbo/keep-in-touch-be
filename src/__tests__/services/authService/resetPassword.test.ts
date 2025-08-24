import {Express} from 'express';
import {StatusCodes} from 'http-status-codes';
import {Types} from 'mongoose';
import request from 'supertest';

import {PasswordResetTokenService} from '~services/passwordResetToken.service';

import {createTestApp, createTestUser} from '../../testHelpers';

describe('POST /api/v1/auth/reset-password - Unit Tests', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('Input Validation', () => {
    it('should return 400 for invalid or expired token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty(
        'message',
        'Invalid or expired password reset token',
      );
    });

    it('should return 400 when token is missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty(
        'message',
        '✖ Invalid input: expected string, received undefined\n  → at token',
      );
    });

    it('should return 400 when new password is missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'some-token',
        });

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty(
        'message',
        '✖ Invalid input: expected string, received undefined\n  → at newPassword',
      );
    });

    it('should return 400 when both token and password are missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({});

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body.message).toContain(
        'expected string, received undefined',
      );
    });

    it('should return 400 for weak new password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'some-token',
          newPassword: '123',
        });

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty(
        'message',
        '✖ Password must be at least 6 characters long\n  → at newPassword',
      );
    });

    it('should return 400 for empty token string', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: '',
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty(
        'message',
        '✖ Reset token is required\n  → at token',
      );
    });
  });

  describe('Success Response', () => {
    it('should return 200 with success message for valid reset', async () => {
      // Create a test user
      const testUser = await createTestUser({
        email: 'unit-success@example.com',
        username: 'unit-user',
        password: 'OldPassword123!',
      });

      // Create a valid password reset token
      const {token} = await PasswordResetTokenService.createPasswordResetToken({
        userId: testUser._id as Types.ObjectId,
      });

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token,
          newPassword: 'NewPassword456!',
        });

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body).toHaveProperty(
        'message',
        'Password reset successfully',
      );
    });
  });
});
