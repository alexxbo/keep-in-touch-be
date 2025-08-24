import {Express} from 'express';
import {StatusCodes} from 'http-status-codes';
import request from 'supertest';

import {createTestApp, createTestUser} from '../../testHelpers';

describe('POST /api/v1/auth/forgot-password', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  const userEmail = 'test@example.com';

  beforeEach(async () => {
    await createTestUser({email: userEmail});
  });

  it('should accept forgot password request with valid email', async () => {
    const response = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({
        email: userEmail,
      });

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toHaveProperty(
      'message',
      'Password reset instructions sent to your email',
    );
  });

  it('should return 400 when email is missing', async () => {
    const response = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({});

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain(
      '✖ Please fill a valid email address',
    );
    expect(response.body.message).toContain('→ at email');
  });

  it('should return 400 for invalid email format', async () => {
    const response = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({
        email: 'invalid-email',
      });

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('email');
  });

  it('should return success even for non-existent email (security)', async () => {
    const response = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({
        email: 'nonexistent@example.com',
      });

    // Should return success to prevent email enumeration
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toHaveProperty(
      'message',
      'Password reset instructions sent to your email',
    );
  });

  it('should return 400 for empty email string', async () => {
    const response = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({
        email: '',
      });

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty('message');
  });
});
