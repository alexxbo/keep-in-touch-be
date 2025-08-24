import type {Express} from 'express';
import {StatusCodes} from 'http-status-codes';
import request from 'supertest';
import User from '~models/user/user.model';
import {
  createTestApp,
  createTestUser,
  registerAndLogin,
} from '../../testHelpers';

describe('Users Controller Integration Scenarios', () => {
  let app: Express;

  beforeEach(async () => {
    app = await createTestApp();
  });

  describe('Complete profile management flow', () => {
    it('should handle complete profile management flow', async () => {
      // Register user
      const {accessToken, user} = await registerAndLogin(app, {
        email: 'integration@example.com',
        username: 'integrationuser',
        name: 'Integration User',
        password: 'originalpassword',
      });

      // Get initial profile
      const profileResponse = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(profileResponse.status).toBe(StatusCodes.OK);

      // Update profile
      const updateResponse = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Integration User',
          username: 'updatedintegration',
        });
      expect(updateResponse.status).toBe(StatusCodes.OK);

      // Update password
      const passwordResponse = await request(app)
        .patch('/api/v1/auth/update-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'originalpassword', // Use the password from registration
          newPassword: 'newintegrationpassword',
        });
      expect(passwordResponse.status).toBe(StatusCodes.OK);

      // Verify public profile is accessible
      const publicResponse = await request(app).get(`/api/v1/users/${user.id}`);
      expect(publicResponse.status).toBe(StatusCodes.OK);

      // Delete account
      const deleteResponse = await request(app)
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(deleteResponse.status).toBe(StatusCodes.OK);

      // Verify user is completely deleted
      const deletedUserCheck = await User.findById(user.id);
      expect(deletedUserCheck).toBeNull();
    });
  });

  describe('Concurrent operations', () => {
    it('should handle concurrent username conflicts', async () => {
      // Create two users
      const user1 = await createTestUser({
        email: 'user1@example.com',
        username: 'user1',
        name: 'User One',
      });

      const {accessToken: token2} = await registerAndLogin(app, {
        email: 'user2@example.com',
        username: 'user2',
        name: 'User Two',
        password: 'testpassword123',
      });

      // Try to update user2's username to user1's username
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token2}`)
        .send({username: user1.username});

      expect(response.status).toBe(StatusCodes.CONFLICT);
      expect(response.body).toHaveProperty('message', 'Username already taken');
    });
  });
});
