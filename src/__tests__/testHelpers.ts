import {Express} from 'express';
import request from 'supertest';
import app from '../app';
import {RegisterUserType} from '../models/auth/auth.schemas';
import User, {IUser} from '../models/user/user.model';
import {PublicProfileType} from '../models/user/user.schemas';

export const createTestApp = (): Express => {
  return app;
};

export const createTestUser = async (
  userData: Partial<RegisterUserType> = {},
): Promise<IUser> => {
  const defaultUser = {
    username: 'testuser',
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
): Promise<{token: string; user: PublicProfileType}> => {
  const response = await request(app).post('/api/v1/auth/login').send({
    identifier,
    password,
  });

  return {
    token: response.body.token,
    user: response.body.user,
  };
};

export const registerAndLogin = async (
  app: Express,
  userData: Partial<RegisterUserType> = {},
): Promise<{token: string; user: PublicProfileType}> => {
  const defaultUser = {
    username: 'testuser',
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
    token: registerResponse.body.token,
    user: registerResponse.body.user,
  };
};
