import type {Express} from 'express';
import {StatusCodes} from 'http-status-codes';
import request from 'supertest';
import User from '../../../models/user/user.model';
import {createTestApp, registerAndLogin} from '../../testHelpers';

describe('DELETE /api/v1/users/me', () => {
  let app: Express;

  beforeEach(async () => {
    app = await createTestApp();
  });

  describe('Success cases', () => {
    it('should delete user account successfully', async () => {
      const {accessToken, user} = await registerAndLogin(app);

      const response = await request(app)
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty(
        'message',
        'Account deleted successfully',
      );

      // Verify the user was actually deleted (hard delete)
      const deletedUser = await User.findById(user.id);
      expect(deletedUser).toBeNull();
    });

    it('should allow the same email to be used for new registration after deletion', async () => {
      const userData = {
        email: 'reusable@example.com',
        username: 'reusableuser',
        name: 'Reusable User',
        password: 'testpassword123',
      };

      // Register and delete first user
      const {accessToken} = await registerAndLogin(app, userData);
      await request(app)
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      // Register new user with same email
      const newUserResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...userData,
          username: 'newuser', // Different username
          name: 'New User',
        });

      expect(newUserResponse.status).toBe(StatusCodes.CREATED);
      expect(newUserResponse.body.user).toHaveProperty('email', userData.email);
    });
  });

  describe('Error cases', () => {
    it('should return 401 when no token provided', async () => {
      const response = await request(app).delete('/api/v1/users/me');

      expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(response.body).toHaveProperty(
        'message',
        'Access token is required. Please login to continue',
      );
    });

    it('should return 401 when invalid token provided', async () => {
      const response = await request(app)
        .delete('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(response.body).toHaveProperty('message', 'Invalid token');
    });
  });
});
