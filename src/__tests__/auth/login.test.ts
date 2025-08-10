import {Express} from 'express';
import {StatusCodes} from 'http-status-codes';
import request from 'supertest';
import User from '../../models/user/user.model';
import {createTestApp, createTestUser} from '../testHelpers';

describe('POST /api/v1/auth/login', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  const userData = {
    username: 'testuser',
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123!',
  };

  beforeEach(async () => {
    // Create a test user for each test
    await createTestUser(userData);
  });

  it('should login successfully with username', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      identifier: userData.username,
      password: userData.password,
    });

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toHaveProperty('message', 'Login successful');
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('username', userData.username);
    expect(response.body.user).toHaveProperty('email', userData.email);
    expect(response.body.user).not.toHaveProperty('password');
  });

  it('should login successfully with email', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      identifier: userData.email,
      password: userData.password,
    });

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toHaveProperty('message', 'Login successful');
    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toHaveProperty('username', userData.username);
  });

  it('should return 400 when identifier is missing', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      password: userData.password,
    });

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('✖ Invalid input:');
    expect(response.body.message).toContain(
      'expected string, received undefined',
    );
    expect(response.body.message).toContain('→ at identifier');
  });

  it('should return 400 when password is missing', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      identifier: userData.username,
    });

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('✖ Invalid input:');
    expect(response.body.message).toContain(
      'expected string, received undefined',
    );
    expect(response.body.message).toContain('→ at password');
  });

  it('should return 401 for non-existent user', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      identifier: 'nonexistent@example.com',
      password: userData.password,
    });

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(response.body).toHaveProperty(
      'message',
      'Invalid credentials or account is inactive',
    );
  });

  it('should return 401 for wrong password', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      identifier: userData.username,
      password: 'WrongPassword123!',
    });

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(response.body).toHaveProperty('message', 'Invalid credentials');
  });

  it('should update lastSeen timestamp on successful login', async () => {
    const beforeLogin = new Date();

    const response = await request(app).post('/api/v1/auth/login').send({
      identifier: userData.username,
      password: userData.password,
    });

    expect(response.status).toBe(StatusCodes.OK);

    const user = await User.findOne({username: userData.username});
    expect(user?.lastSeen).toBeDefined();
    expect(user?.lastSeen!.getTime()).toBeGreaterThanOrEqual(
      beforeLogin.getTime(),
    );
  });

  it('should return a valid JWT token', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      identifier: userData.username,
      password: userData.password,
    });

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.token).toMatch(
      /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
    ); // JWT pattern
  });

  it('should be case insensitive for email login', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      identifier: userData.email.toUpperCase(),
      password: userData.password,
    });

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toHaveProperty('message', 'Login successful');
  });

  it('should handle empty strings as missing fields', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      identifier: '',
      password: userData.password,
    });

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty(
      'message',
      'Username/email and password are required',
    );
  });
});
