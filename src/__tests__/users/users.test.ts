import bcrypt from 'bcryptjs';
import {Express} from 'express';
import {StatusCodes} from 'http-status-codes';
import {Types} from 'mongoose';
import request from 'supertest';
import User from '../../models/user/user.model';
import {createTestApp, createTestUser, registerAndLogin} from '../testHelpers';

describe('Users Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('GET /api/v1/users/me', () => {
    it('should get current user profile successfully', async () => {
      const {token} = await registerAndLogin(app);

      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email');
      expect(response.body.data.user).toHaveProperty('username');
      expect(response.body.data.user).toHaveProperty('name');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(app).get('/api/v1/users/me');

      expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(response.body).toHaveProperty(
        'message',
        'Access token is required. Please login to continue',
      );
    });

    it('should return 401 when invalid token provided', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(response.body).toHaveProperty(
        'message',
        'Invalid JSON web token. Please try again.',
      );
    });

    it('should return 401 when user no longer exists (token invalid)', async () => {
      const {token, user} = await registerAndLogin(app);

      // Delete the user
      await User.findByIdAndDelete(user.id);

      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(response.body).toHaveProperty(
        'message',
        'Invalid token or user not found',
      );
    });
  });

  describe('PATCH /api/v1/users/me', () => {
    it('should update user profile successfully with both name and username', async () => {
      const {token} = await registerAndLogin(app);

      const updateData = {
        name: 'Updated Name',
        username: 'updateduser',
      };

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data.user).toHaveProperty('name', updateData.name);
      expect(response.body.data.user).toHaveProperty(
        'username',
        updateData.username,
      );
    });

    it('should update only name when provided', async () => {
      const {token, user} = await registerAndLogin(app);

      const updateData = {
        name: 'Only Name Updated',
      };

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body.data.user).toHaveProperty('name', updateData.name);
      expect(response.body.data.user).toHaveProperty('username', user.username);
    });

    it('should update only username when provided', async () => {
      const {token, user} = await registerAndLogin(app);

      const updateData = {
        username: 'onlyusername',
      };

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body.data.user).toHaveProperty(
        'username',
        updateData.username,
      );
      expect(response.body.data.user).toHaveProperty('name', user.name);
    });

    it('should return 400 when no fields provided', async () => {
      const {token} = await registerAndLogin(app);

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain(
        'At least one field (name or username) must be provided',
      );
    });

    it('should return 400 for invalid username format', async () => {
      const {token} = await registerAndLogin(app);

      const updateData = {
        username: 'invalid username!', // Contains spaces and special characters
      };

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain(
        'Username can only contain letters, numbers, and underscores',
      );
    });

    it('should return 400 for username too short', async () => {
      const {token} = await registerAndLogin(app);

      const updateData = {
        username: 'ab', // Too short
      };

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain(
        'Username must be at least 3 characters long',
      );
    });

    it('should return 400 for name too long', async () => {
      const {token} = await registerAndLogin(app);

      const updateData = {
        name: 'a'.repeat(51), // Too long
      };

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain(
        'Name cannot exceed 50 characters',
      );
    });

    it('should return 409 when username is already taken', async () => {
      // Create first user
      const firstUser = await createTestUser({
        email: 'first@example.com',
        username: 'firstuser',
        name: 'First User',
      });

      // Register and login second user
      const {token} = await registerAndLogin(app, {
        email: 'second@example.com',
        username: 'seconduser',
        name: 'Second User',
        password: 'password123',
      });

      // Try to update second user's username to first user's username
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({username: firstUser.username});

      expect(response.status).toBe(StatusCodes.CONFLICT);
      expect(response.body).toHaveProperty('message', 'Username already taken');
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .send({name: 'New Name'});

      expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(response.body).toHaveProperty(
        'message',
        'Access token is required. Please login to continue',
      );
    });
  });

  describe('PATCH /api/v1/users/me/password', () => {
    it('should update password successfully', async () => {
      const {token, user} = await registerAndLogin(app);

      const passwordData = {
        currentPassword: 'Password123!', // Use the default password from testHelpers
        newPassword: 'newPassword456',
      };

      const response = await request(app)
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData);

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty(
        'message',
        'Password updated successfully',
      );

      // Verify the password was actually updated
      const updatedUser = await User.findById(user.id).select('+password');
      const isNewPasswordValid = await bcrypt.compare(
        passwordData.newPassword,
        updatedUser!.password,
      );
      expect(isNewPasswordValid).toBe(true);
    });

    it('should return 400 when current password is missing', async () => {
      const {token} = await registerAndLogin(app);

      const response = await request(app)
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${token}`)
        .send({newPassword: 'newPassword456'});

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain(
        '✖ Invalid input: expected string, received undefined\n  → at currentPassword',
      );
    });

    it('should return 400 when new password is missing', async () => {
      const {token} = await registerAndLogin(app);

      const response = await request(app)
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${token}`)
        .send({currentPassword: 'testpassword123'});

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain(
        '✖ Invalid input: expected string, received undefined\n  → at newPassword',
      );
    });

    it('should return 400 when both passwords are missing', async () => {
      const {token} = await registerAndLogin(app);

      const response = await request(app)
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain(
        '✖ Invalid input: expected string, received undefined\n  → at currentPassword',
      );
    });

    it('should return 400 for weak new password', async () => {
      const {token} = await registerAndLogin(app);

      const passwordData = {
        currentPassword: 'testpassword123',
        newPassword: '123', // Too weak
      };

      const response = await request(app)
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData);

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain(
        '✖ Password must be at least 6 characters long\n  → at newPassword',
      );
    });

    it('should return 401 when current password is incorrect', async () => {
      const {token} = await registerAndLogin(app);

      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newPassword456',
      };

      const response = await request(app)
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData);

      expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(response.body).toHaveProperty(
        'message',
        'Current password is incorrect',
      );
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me/password')
        .send({
          currentPassword: 'testpassword123',
          newPassword: 'newPassword456',
        });

      expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(response.body).toHaveProperty(
        'message',
        'Access token is required. Please login to continue',
      );
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should get user by id successfully', async () => {
      const testUser = await createTestUser({
        email: 'public@example.com',
        username: 'publicuser',
        name: 'Public User',
      });

      const response = await request(app).get(`/api/v1/users/${testUser._id}`);

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('name', testUser.name);
      expect(response.body.data.user).toHaveProperty(
        'username',
        testUser.username,
      );
      expect(response.body.data.user).toHaveProperty('email', testUser.email);
      expect(response.body.data.user).toHaveProperty('createdAt');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user id', async () => {
      const fakeId = new Types.ObjectId();

      const response = await request(app).get(`/api/v1/users/${fakeId}`);

      expect(response.status).toBe(StatusCodes.NOT_FOUND);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it('should return 400 for invalid ObjectId format', async () => {
      const response = await request(app).get('/api/v1/users/invalid-id');

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid ObjectId format');
    });

    it('should work without authentication (public endpoint)', async () => {
      const testUser = await createTestUser({
        email: 'anonymous@example.com',
        username: 'anonymoususer',
        name: 'Anonymous User',
      });

      const response = await request(app).get(`/api/v1/users/${testUser._id}`);

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body.data.user).toHaveProperty('name');
    });
  });

  describe('DELETE /api/v1/users/me', () => {
    it('should delete user account successfully', async () => {
      const {token, user} = await registerAndLogin(app);

      const response = await request(app)
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

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
      expect(response.body).toHaveProperty(
        'message',
        'Invalid JSON web token. Please try again.',
      );
    });

    it('should allow the same email to be used for new registration after deletion', async () => {
      const userData = {
        email: 'reusable@example.com',
        username: 'reusableuser',
        name: 'Reusable User',
        password: 'testpassword123',
      };

      // Register and delete first user
      const {token} = await registerAndLogin(app, userData);
      await request(app)
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

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

  describe('Integration scenarios', () => {
    it('should handle complete profile management flow', async () => {
      // Register user
      const {token, user} = await registerAndLogin(app, {
        email: 'integration@example.com',
        username: 'integrationuser',
        name: 'Integration User',
        password: 'originalpassword',
      });

      // Get initial profile
      const profileResponse = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);
      expect(profileResponse.status).toBe(StatusCodes.OK);

      // Update profile
      const updateResponse = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Integration User',
          username: 'updatedintegration',
        });
      expect(updateResponse.status).toBe(StatusCodes.OK);

      // Update password
      const passwordResponse = await request(app)
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${token}`)
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
        .set('Authorization', `Bearer ${token}`);
      expect(deleteResponse.status).toBe(StatusCodes.OK);

      // Verify user is completely deleted
      const deletedUserCheck = await User.findById(user.id);
      expect(deletedUserCheck).toBeNull();
    });

    it('should handle concurrent username conflicts', async () => {
      // Create two users
      const user1 = await createTestUser({
        email: 'user1@example.com',
        username: 'user1',
        name: 'User One',
      });

      const {token: token2} = await registerAndLogin(app, {
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
