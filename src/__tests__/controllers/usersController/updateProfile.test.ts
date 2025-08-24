import {Express} from 'express';
import {StatusCodes} from 'http-status-codes';
import request from 'supertest';
import {
  createTestApp,
  createTestUser,
  registerAndLogin,
} from '../../testHelpers';

describe('UsersController - PATCH /api/v1/users/me', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  it('should update user profile successfully with both name and username', async () => {
    const {accessToken} = await registerAndLogin(app);

    const updateData = {
      name: 'Updated Name',
      username: 'updateduser',
    };

    const response = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
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
    const {accessToken, user} = await registerAndLogin(app);

    const updateData = {
      name: 'Only Name Updated',
    };

    const response = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(updateData);

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.data.user).toHaveProperty('name', updateData.name);
    expect(response.body.data.user).toHaveProperty('username', user.username);
  });

  it('should update only username when provided', async () => {
    const {accessToken, user} = await registerAndLogin(app);

    const updateData = {
      username: 'onlyusername',
    };

    const response = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(updateData);

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.data.user).toHaveProperty(
      'username',
      updateData.username,
    );
    expect(response.body.data.user).toHaveProperty('name', user.name);
  });

  it('should return 400 when no fields provided', async () => {
    const {accessToken} = await registerAndLogin(app);

    const response = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain(
      'At least one field (name or username) must be provided',
    );
  });

  it('should return 400 for invalid username format', async () => {
    const {accessToken} = await registerAndLogin(app);

    const updateData = {
      username: 'invalid username!', // Contains spaces and special characters
    };

    const response = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(updateData);

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain(
      'Username can only contain letters, numbers, and underscores',
    );
  });

  it('should return 400 for username too short', async () => {
    const {accessToken} = await registerAndLogin(app);

    const updateData = {
      username: 'ab', // Too short
    };

    const response = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(updateData);

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain(
      'Username must be at least 3 characters long',
    );
  });

  it('should return 400 for name too long', async () => {
    const {accessToken} = await registerAndLogin(app);

    const updateData = {
      name: 'a'.repeat(51), // Too long
    };

    const response = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(updateData);

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('Name cannot exceed 50 characters');
  });

  it('should return 409 when username is already taken', async () => {
    // Create first user
    const firstUser = await createTestUser({
      email: 'first@example.com',
      username: 'firstuser',
      name: 'First User',
    });

    // Register and login second user
    const {accessToken} = await registerAndLogin(app, {
      email: 'second@example.com',
      username: 'seconduser',
      name: 'Second User',
      password: 'password123',
    });

    // Try to update second user's username to first user's username
    const response = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
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
