import {Express} from 'express';
import {StatusCodes} from 'http-status-codes';
import request from 'supertest';
import {createTestApp} from '../testHelpers';

describe('POST /api/v1/auth/reset-password', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  const validResetData = {
    token: 'valid-reset-token',
    newPassword: 'NewPassword123!',
  };

  it('should return 501 for reset password functionality (not implemented)', async () => {
    const response = await request(app)
      .post('/api/v1/auth/reset-password')
      .send(validResetData);

    expect(response.status).toBe(StatusCodes.NOT_IMPLEMENTED);
    expect(response.body).toHaveProperty(
      'message',
      'Password reset functionality not implemented yet',
    );
  });

  it('should return 400 when token is missing', async () => {
    const response = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        newPassword: validResetData.newPassword,
      });

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty(
      'message',
      '✖ Invalid input: expected string, received undefined\n  → at token',
    );
  });

  it('should return 400 when new password is missing', async () => {
    const response = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: validResetData.token,
      });

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty(
      'message',
      '✖ Invalid input: expected string, received undefined\n  → at newPassword',
    );
  });

  it('should return 400 when both token and password are missing', async () => {
    const response = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({});

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty(
      'message',
      '✖ Invalid input: expected string, received undefined\n  → at token\n✖ Invalid input: expected string, received undefined\n  → at newPassword',
    );
  });

  it('should return 400 for weak new password', async () => {
    const response = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: validResetData.token,
        newPassword: '123', // Weak password
      });

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe(
      '✖ Password must be at least 6 characters long\n  → at newPassword',
    );
  });

  it('should return 400 for empty token string', async () => {
    const response = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: '',
        newPassword: validResetData.newPassword,
      });

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty(
      'message',
      '✖ Reset token is required\n  → at token',
    );
  });
});
