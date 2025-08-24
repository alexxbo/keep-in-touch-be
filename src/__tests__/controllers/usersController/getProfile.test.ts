import {Express} from 'express';
import {StatusCodes} from 'http-status-codes';
import request from 'supertest';
import User from '~models/user/user.model';
import {createTestApp, registerAndLogin} from '../../testHelpers';

describe('UsersController - GET /api/v1/users/me', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  it('should get current user profile successfully', async () => {
    const {accessToken} = await registerAndLogin(app);

    const response = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data.user).toHaveProperty('email');
    expect(response.body.data.user).toHaveProperty('username');
    expect(response.body.data.user).toHaveProperty('name');
    expect(response.body.data.user).not.toHaveProperty('password');
  });

  it('should return 401 when no token provided', async () => {
    const response = await request(app).get('/api/v1/users/me');

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(response.body).toHaveProperty(
      'message',
      'Access token is required. Please login to continue',
    );
  });

  it('should return 401 when invalid token provided', async () => {
    const response = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(response.body).toHaveProperty('message', 'Invalid token');
  });

  it('should return 401 when user no longer exists (token invalid)', async () => {
    const {accessToken, user} = await registerAndLogin(app);

    // Delete the user
    await User.findByIdAndDelete(user.id);

    const response = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(response.body).toHaveProperty('message', 'User not found');
  });
});
