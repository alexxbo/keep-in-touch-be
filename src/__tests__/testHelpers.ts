import {Express} from 'express';
import request from 'supertest';
import {RegisterUserType} from '~models/auth/auth.types';
import User, {IUser} from '~models/user/user.model';
import {AuthResult} from '~services/auth.service';
import app from '../app';

export const createTestApp = (): Express => {
  return app;
};

export const createTestUser = async (
  userData: Partial<RegisterUserType> = {},
): Promise<IUser> => {
  const defaultUser = {
    username: 'test_user',
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123!',
    ...userData,
  };

  const user = new User(defaultUser);
  await user.save();
  return user;
};

export const loginUser = async (
  app: Express,
  identifier: string,
  password: string,
): Promise<AuthResult> => {
  const response = await request(app).post('/api/v1/auth/login').send({
    identifier,
    password,
  });

  return {
    accessToken: response.body.accessToken,
    refreshToken: response.body.refreshToken,
    user: response.body.user,
  };
};

export const registerAndLogin = async (
  app: Express,
  userData: Partial<RegisterUserType> = {},
): Promise<AuthResult> => {
  const defaultUser = {
    username: 'test_user',
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123!',
    ...userData,
  };

  // Register user
  const registerResponse = await request(app)
    .post('/api/v1/auth/register')
    .send(defaultUser);

  expect(registerResponse.status).toBe(201);

  return {
    accessToken: registerResponse.body.accessToken,
    refreshToken: registerResponse.body.refreshToken,
    user: registerResponse.body.user,
  };
};
