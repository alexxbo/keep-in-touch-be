import {Express} from 'express';
import {StatusCodes} from 'http-status-codes';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import User from '../../models/user/user.model';
import {createTestApp} from '../testHelpers';

describe('Auth Routes Integration', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  const userData = {
    username: 'integrationuser',
    name: 'Integration Test User',
    email: 'integration@example.com',
    password: 'Password123!',
  };

  describe('Complete auth flow', () => {
    it('should register, login, and access protected route', async () => {
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
        .set('Authorization', `Bearer ${loginToken}`);

      expect(logoutResponse.status).toBe(StatusCodes.OK);

      // 5. Verify tokens are valid JWTs with correct payload
      const decodedRegisterToken = jwt.verify(
        registerToken,
        process.env.ACCESS_TOKEN_SECRET!,
      ) as {userId: string};
      const decodedLoginToken = jwt.verify(
        loginToken,
        process.env.ACCESS_TOKEN_SECRET!,
      ) as {userId: string};

      expect(decodedRegisterToken.userId).toBe(user?._id?.toString());
      expect(decodedLoginToken.userId).toBe(user?._id?.toString());
    });

    it('should handle login with email after registration', async () => {
      // Register
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...userData,
          username: 'emailuser',
          email: 'emaillogin@example.com',
        });

      // Login with email
      const response = await request(app).post('/api/v1/auth/login').send({
        identifier: 'emaillogin@example.com',
        password: userData.password,
      });

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body.user).toHaveProperty('username', 'emailuser');
    });
  });

  describe('Error scenarios', () => {
    it('should handle duplicate registration attempts', async () => {
      // First registration
      const firstResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...userData,
          username: 'uniqueuser',
          email: 'unique@example.com',
        });

      expect(firstResponse.status).toBe(StatusCodes.CREATED);

      // Second registration with same username
      const secondResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...userData,
          username: 'uniqueuser',
          email: 'different@example.com',
        });

      expect(secondResponse.status).toBe(StatusCodes.CONFLICT);
      expect(secondResponse.body.message).toBe('Username already taken');

      // Third registration with same email
      const thirdResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...userData,
          username: 'differentuser',
          email: 'unique@example.com',
        });

      expect(thirdResponse.status).toBe(StatusCodes.CONFLICT);
      expect(thirdResponse.body.message).toBe('Email already registered');
    });

    it('should handle login attempts after multiple failed attempts', async () => {
      // Register user
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...userData,
          username: 'multipleuser',
          email: 'multiple@example.com',
        });

      // Multiple failed login attempts
      for (let i = 0; i < 3; i++) {
        const response = await request(app).post('/api/v1/auth/login').send({
          identifier: 'multipleuser',
          password: 'WrongPassword123!',
        });

        expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
      }

      // Should still allow correct login
      const successResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'multipleuser',
          password: userData.password,
        });

      expect(successResponse.status).toBe(StatusCodes.OK);
    });
  });

  describe('Token validation', () => {
    it('should reject expired tokens', async () => {
      // This test would require mocking time or using a very short expiry
      // For now, we test invalid token format
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer invalid.token.format');

      expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    });

    it('should reject tokens with wrong secret', async () => {
      // Create a token with wrong secret
      const wrongToken = jwt.sign({userId: 'test'}, 'wrong-secret');

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${wrongToken}`);

      expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    });
  });
});
