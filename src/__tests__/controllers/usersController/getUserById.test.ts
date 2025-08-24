import type {Express} from 'express';
import {StatusCodes} from 'http-status-codes';
import {Types} from 'mongoose';
import request from 'supertest';
import {createTestApp, createTestUser} from '../../testHelpers';

describe('GET /api/v1/users/:id', () => {
  let app: Express;

  beforeEach(async () => {
    app = await createTestApp();
  });

  describe('Success cases', () => {
    it('should get user public profile by id', async () => {
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

  describe('Error cases', () => {
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
  });
});
