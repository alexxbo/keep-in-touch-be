import {Express} from 'express';
import {StatusCodes} from 'http-status-codes';
import request from 'supertest';
import {createTestApp} from '../testHelpers';

describe('POST /api/v1/auth/refresh', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  it('should return 401 for invalid refresh token', async () => {
    const response = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken: 'invalid-refresh-token',
    });

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(response.body).toHaveProperty('message', 'Invalid token');
  });

  it('should return 400 when refresh token is missing', async () => {
    const response = await request(app).post('/api/v1/auth/refresh').send({});

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('refreshToken');
  });

  it('should return 400 when refresh token is empty string', async () => {
    const response = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken: '',
    });

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('refreshToken');
  });
});
