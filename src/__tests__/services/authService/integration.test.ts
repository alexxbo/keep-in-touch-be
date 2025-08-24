import {Express} from 'express';
import {StatusCodes} from 'http-status-codes';
import jwt from 'jsonwebtoken';
import {Types} from 'mongoose';
import request from 'supertest';

import env from '~config/env.config';
import User from '~models/user/user.model';
import {PasswordResetTokenService} from '~services/passwordResetToken.service';
import {createTestApp, createTestUser} from '../../testHelpers';

describe('Authentication Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  // Helper function to generate unique user data
  const generateUserData = (prefix: string = 'test') => ({
    username: `${prefix}_${Date.now()}`,
    name: `${prefix} User`,
    email: `${prefix}_${Date.now()}@example.com`,
    password: 'Password123!',
  });

  // Helper function for authentication flow
  const authenticateUser = async (userData: {
    email: string;
    username: string;
    password: string;
    name?: string;
  }) => {
    const user = await createTestUser(userData);
    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      identifier: userData.email,
      password: userData.password,
    });
    return {
      user,
      accessToken: loginResponse.body.accessToken,
      refreshToken: loginResponse.body.refreshToken,
    };
  };

  describe('Registration and Login Flow', () => {
    it('should register, login, and access protected route', async () => {
      const userData = generateUserData('register');

      // 1. Register a new user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(registerResponse.status).toBe(StatusCodes.CREATED);
      expect(registerResponse.body).toHaveProperty('accessToken');
      const registerToken = registerResponse.body.accessToken;

      // 2. Verify user exists in database
      const user = await User.findOne({email: userData.email});
      expect(user).toBeTruthy();
      expect(user?.username).toBe(userData.username);

      // 3. Login with username
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        identifier: userData.username,
        password: userData.password,
      });

      expect(loginResponse.status).toBe(StatusCodes.OK);
      expect(loginResponse.body).toHaveProperty('accessToken');
      const loginToken = loginResponse.body.accessToken;

      // 4. Access protected logout route
      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${loginToken}`)
        .send({});

      expect(logoutResponse.status).toBe(StatusCodes.OK);

      // 5. Verify tokens are valid JWTs with correct payload
      const decodedRegisterToken = jwt.verify(
        registerToken,
        env.ACCESS_TOKEN_SECRET,
      ) as {userId: string};
      const decodedLoginToken = jwt.verify(
        loginToken,
        env.ACCESS_TOKEN_SECRET,
      ) as {userId: string};

      expect(decodedRegisterToken.userId).toBe(user?._id?.toString());
      expect(decodedLoginToken.userId).toBe(user?._id?.toString());
    });

    it('should handle login with email after registration', async () => {
      const userData = generateUserData('email');

      // Register user first
      await createTestUser(userData);

      // Login with email
      const response = await request(app).post('/api/v1/auth/login').send({
        identifier: userData.email,
        password: userData.password,
      });

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body.user).toHaveProperty('username', userData.username);
    });
  });

  describe('Password Reset Flow', () => {
    it('should handle complete password reset workflow', async () => {
      const userData = generateUserData('reset');

      // 1. Create a test user
      const testUser = await createTestUser(userData);

      // 2. Create a password reset token using the service
      const {token} = await PasswordResetTokenService.createPasswordResetToken({
        userId: testUser._id as Types.ObjectId,
      });

      // 3. Reset password using the token
      const newPassword = 'NewPassword456!';
      const resetPasswordResponse = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token,
          newPassword,
        });

      expect(resetPasswordResponse.status).toBe(StatusCodes.OK);
      expect(resetPasswordResponse.body).toHaveProperty(
        'message',
        'Password reset successfully',
      );

      // 4. Verify old password no longer works
      const oldPasswordResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: testUser.email,
          password: userData.password, // old password
        });

      expect(oldPasswordResponse.status).toBe(StatusCodes.UNAUTHORIZED);

      // 5. Verify new password works
      const newPasswordResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: testUser.email,
          password: newPassword,
        });

      expect(newPasswordResponse.status).toBe(StatusCodes.OK);
    });

    it('should invalidate all refresh tokens after password reset', async () => {
      const userData = generateUserData('session');

      // 1. Create user and login to get refresh token
      const {refreshToken} = await authenticateUser(userData);

      // 2. Verify refresh token works before reset
      const refreshBeforeResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({refreshToken});
      expect(refreshBeforeResponse.status).toBe(StatusCodes.OK);

      // 3. Create password reset token using the service
      const user = await User.findOne({email: userData.email});
      const {token} = await PasswordResetTokenService.createPasswordResetToken({
        userId: user!._id as Types.ObjectId,
      });

      // 4. Reset password using the token
      await request(app).post('/api/v1/auth/reset-password').send({
        token,
        newPassword: 'NewPassword456!',
      });

      // 5. Verify refresh token no longer works after reset
      const refreshAfterResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({refreshToken});
      expect(refreshAfterResponse.status).toBe(StatusCodes.UNAUTHORIZED);

      // 6. Verify user can still access protected routes after login with new password
      const newLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: userData.email,
          password: 'NewPassword456!',
        });

      const protectedResponse = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${newLoginResponse.body.accessToken}`);

      expect(protectedResponse.status).toBe(StatusCodes.OK);
    });
  });

  describe('Session Management', () => {
    it('should handle token refresh workflow', async () => {
      const userData = generateUserData('refresh');

      // 1. Authenticate user
      const {refreshToken} = await authenticateUser(userData);

      // 2. Use refresh token to get new access token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken,
        });

      expect(refreshResponse.status).toBe(StatusCodes.OK);
      expect(refreshResponse.body).toHaveProperty('accessToken');

      // 3. Use new access token to access protected route
      const protectedResponse = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${refreshResponse.body.accessToken}`);

      expect(protectedResponse.status).toBe(StatusCodes.OK);
    });

    it('should logout and invalidate refresh token', async () => {
      const userData = generateUserData('logout');

      // 1. Authenticate user
      const {accessToken, refreshToken} = await authenticateUser(userData);

      // 2. Logout user with refresh token
      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({refreshToken});

      expect(logoutResponse.status).toBe(StatusCodes.OK);

      // 3. Try to use refresh token after logout
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken,
        });

      expect(refreshResponse.status).toBe(StatusCodes.UNAUTHORIZED);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle duplicate registration attempts', async () => {
      const userData = generateUserData('unique');

      // First registration
      const firstResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(firstResponse.status).toBe(StatusCodes.CREATED);

      // Second registration with same username but different email
      const secondResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...userData,
          email: `different_${Date.now()}@example.com`,
        });

      expect(secondResponse.status).toBe(StatusCodes.CONFLICT);
      expect(secondResponse.body.message).toBe('Username already taken');

      // Third registration with same email but different username
      const thirdResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: `different_${Date.now()}`,
          name: userData.name,
          email: userData.email,
          password: userData.password,
        });

      expect(thirdResponse.status).toBe(StatusCodes.CONFLICT);
      expect(thirdResponse.body.message).toBe('Email already registered');
    });

    it('should handle login attempts after multiple failed attempts', async () => {
      const userData = generateUserData('multiple');

      // Register user
      await createTestUser(userData);

      // Multiple failed login attempts
      for (let i = 0; i < 3; i++) {
        const response = await request(app).post('/api/v1/auth/login').send({
          identifier: userData.username,
          password: 'WrongPassword123!',
        });

        expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
      }

      // Should still allow correct login
      const successResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: userData.username,
          password: userData.password,
        });

      expect(successResponse.status).toBe(StatusCodes.OK);
    });
  });

  describe('Security and Token Validation', () => {
    it('should reject malformed tokens', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer invalid.token.format')
        .send({});

      expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    });

    it('should reject tokens with wrong secret', async () => {
      // Create a token with wrong secret
      const wrongToken = jwt.sign({userId: 'test'}, 'wrong-secret');

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${wrongToken}`)
        .send({});

      expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    });

    it('should reject requests without authorization header', async () => {
      const response = await request(app).get('/api/v1/users/me').send({});

      expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    });

    it('should handle concurrent login sessions', async () => {
      const userData = generateUserData('concurrent');

      await createTestUser(userData);

      // Create multiple login sessions
      const session1 = await request(app).post('/api/v1/auth/login').send({
        identifier: userData.email,
        password: userData.password,
      });

      const session2 = await request(app).post('/api/v1/auth/login').send({
        identifier: userData.email,
        password: userData.password,
      });

      expect(session1.status).toBe(StatusCodes.OK);
      expect(session2.status).toBe(StatusCodes.OK);

      // Both sessions should have different refresh tokens
      expect(session1.body.refreshToken).not.toBe(session2.body.refreshToken);

      // Both sessions should be able to access protected routes
      const access1 = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${session1.body.accessToken}`);

      const access2 = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${session2.body.accessToken}`);

      expect(access1.status).toBe(StatusCodes.OK);
      expect(access2.status).toBe(StatusCodes.OK);
    });
  });
});
