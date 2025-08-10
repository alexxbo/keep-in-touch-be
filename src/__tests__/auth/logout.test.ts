import {Express} from 'express';
import {StatusCodes} from 'http-status-codes';
import request from 'supertest';
import {createTestApp, registerAndLogin} from '../testHelpers';

describe('POST /api/v1/auth/logout', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  it('should logout successfully with valid token', async () => {
    const {token} = await registerAndLogin(app);

    const response = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toHaveProperty('message', 'Logged out successfully');
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app).post('/api/v1/auth/logout');

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 when invalid token is provided', async () => {
    const response = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 when malformed Authorization header', async () => {
    const {token} = await registerAndLogin(app);

    const response = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', token); // Missing 'Bearer ' prefix

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(response.body).toHaveProperty('message');
  });
});
