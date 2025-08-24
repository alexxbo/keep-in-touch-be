import {Express} from 'express';
import {StatusCodes} from 'http-status-codes';
import request from 'supertest';

import User from '~models/user/user.model';

import {createTestApp, createTestUser} from '../../testHelpers';

describe('POST /api/v1/auth/register', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  const validUserData = {
    username: 'testuser',
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123!',
  };

  it('should register a new user successfully', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(validUserData);

    expect(response.status).toBe(StatusCodes.CREATED);
    expect(response.body).toHaveProperty(
      'message',
      'User registered successfully',
    );
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty(
      'username',
      validUserData.username,
    );
    expect(response.body.user).toHaveProperty('name', validUserData.name);
    expect(response.body.user).toHaveProperty('email', validUserData.email);
    expect(response.body.user).not.toHaveProperty('password');

    // Verify user was created in database
    const user = await User.findOne({email: validUserData.email});
    expect(user).toBeTruthy();
    expect(user?.username).toBe(validUserData.username);
  });

  it('should return 400 when required fields are missing', async () => {
    const testCases = [
      {
        field: 'username',
        expectedMessageContains: 'expected string, received undefined',
        expectedFieldMention: 'username',
      },
      {
        field: 'name',
        expectedMessageContains: 'expected string, received undefined',
        expectedFieldMention: 'name',
      },
      {
        field: 'email',
        expectedMessageContains: 'Please fill a valid email address',
        expectedFieldMention: 'email',
      },
      {
        field: 'password',
        expectedMessageContains: 'expected string, received undefined',
        expectedFieldMention: 'password',
      },
    ];

    for (const testCase of testCases) {
      const incompleteData = {...validUserData};
      delete incompleteData[testCase.field as keyof typeof incompleteData];

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(incompleteData);

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('✖');
      expect(response.body.message).toContain(testCase.expectedMessageContains);
      expect(response.body.message).toContain(
        `→ at ${testCase.expectedFieldMention}`,
      );
    }
  });

  it('should return 400 for invalid email format', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...validUserData,
        email: 'invalid-email',
      });

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('email');
  });

  it('should return 400 for weak password', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...validUserData,
        password: '123',
      });

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('password');
  });

  it('should return 400 for invalid username format', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...validUserData,
        username: 'a', // Too short
      });

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('username');
  });

  it('should return 409 when username is already taken', async () => {
    // Create a user first
    await createTestUser({username: 'existinguser'});

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...validUserData,
        username: 'existinguser',
      });

    expect(response.status).toBe(StatusCodes.CONFLICT);
    expect(response.body).toHaveProperty('message', 'Username already taken');
  });

  it('should return 409 when email is already registered', async () => {
    // Create a user first with a different username
    await createTestUser({
      username: 'existinguser',
      email: 'existing@example.com',
    });

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...validUserData,
        username: 'differentuser', // Use different username to avoid username conflict
        email: 'existing@example.com',
      });

    expect(response.status).toBe(StatusCodes.CONFLICT);
    expect(response.body).toHaveProperty('message', 'Email already registered');
  });

  it('should hash the password before storing', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(validUserData);

    expect(response.status).toBe(StatusCodes.CREATED);

    const user = await User.findOne({email: validUserData.email}).select(
      '+password',
    );
    expect(user?.password).not.toBe(validUserData.password);
    expect(user?.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash pattern
  });

  it('should set default role to user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(validUserData);

    expect(response.status).toBe(StatusCodes.CREATED);
    expect(response.body.user).toHaveProperty('role', 'user');
  });

  it('should return a valid JWT token', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(validUserData);

    expect(response.status).toBe(StatusCodes.CREATED);
    expect(response.body.accessToken).toMatch(
      /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
    ); // JWT pattern
    expect(response.body.refreshToken).toMatch(
      /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
    ); // JWT pattern
  });
});
