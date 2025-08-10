import {Express} from 'express';
import {StatusCodes} from 'http-status-codes';
import request from 'supertest';
import {createTestApp} from '../testHelpers';

describe('POST /api/v1/auth/refresh', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  it('should return 501 for refresh token functionality (not implemented)', async () => {
    const response = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken: 'some-refresh-token',
    });

    expect(response.status).toBe(StatusCodes.NOT_IMPLEMENTED);
    expect(response.body).toHaveProperty(
      'message',
      'Refresh token functionality not implemented yet',
    );
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
