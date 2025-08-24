import bcrypt from 'bcryptjs';
import {Express} from 'express';
import {StatusCodes} from 'http-status-codes';
import request from 'supertest';

import User from '~models/user/user.model';

import {createTestApp, registerAndLogin} from '../../testHelpers';

describe('PATCH /api/v1/auth/update-password', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  it('should update password successfully', async () => {
    const {accessToken, user} = await registerAndLogin(app);

    const passwordData = {
      currentPassword: 'Password123!', // Use the default password from testHelpers
      newPassword: 'newPassword456',
    };

    const response = await request(app)
      .patch('/api/v1/auth/update-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(passwordData);

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty(
      'message',
      'Password updated successfully',
    );

    // Verify the password was actually updated
    const updatedUser = await User.findById(user.id).select('+password');
    const isNewPasswordValid = await bcrypt.compare(
      passwordData.newPassword,
      updatedUser!.password,
    );
    expect(isNewPasswordValid).toBe(true);
  });

  it('should return 400 when current password is missing', async () => {
    const {accessToken} = await registerAndLogin(app);

    const response = await request(app)
      .patch('/api/v1/auth/update-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({newPassword: 'newPassword456'});

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain(
      '✖ Invalid input: expected string, received undefined\n  → at currentPassword',
    );
  });

  it('should return 400 when new password is missing', async () => {
    const {accessToken} = await registerAndLogin(app);

    const response = await request(app)
      .patch('/api/v1/auth/update-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({currentPassword: 'testpassword123'});

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain(
      '✖ Invalid input: expected string, received undefined\n  → at newPassword',
    );
  });

  it('should return 400 when both passwords are missing', async () => {
    const {accessToken} = await registerAndLogin(app);

    const response = await request(app)
      .patch('/api/v1/auth/update-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain(
      '✖ Invalid input: expected string, received undefined\n  → at currentPassword',
    );
  });

  it('should return 400 for weak new password', async () => {
    const {accessToken} = await registerAndLogin(app);

    const passwordData = {
      currentPassword: 'testpassword123',
      newPassword: '123', // Too weak
    };

    const response = await request(app)
      .patch('/api/v1/auth/update-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(passwordData);

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain(
      '✖ Password must be at least 6 characters long\n  → at newPassword',
    );
  });

  it('should return 401 when current password is incorrect', async () => {
    const {accessToken} = await registerAndLogin(app);

    const passwordData = {
      currentPassword: 'wrongpassword',
      newPassword: 'newPassword456',
    };

    const response = await request(app)
      .patch('/api/v1/auth/update-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(passwordData);

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(response.body).toHaveProperty(
      'message',
      'Current password is incorrect',
    );
  });

  it('should return 401 when no token provided', async () => {
    const response = await request(app)
      .patch('/api/v1/auth/update-password')
      .send({
        currentPassword: 'testpassword123',
        newPassword: 'newPassword456',
      });

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(response.body).toHaveProperty(
      'message',
      'Access token is required. Please login to continue',
    );
  });
});
