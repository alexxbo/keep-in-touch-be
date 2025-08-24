import {Types} from 'mongoose';

import {UserService} from '~services/user.service';

// Mock dependencies
jest.mock('~utils/logger');

describe('UserService.verifyPassword', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('should return true for correct password', async () => {
    const userData = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = await UserService.createUser(userData);
    const userId = user._id as Types.ObjectId;

    const isValid = await UserService.verifyPassword(userId, 'password123');
    expect(isValid).toBe(true);
  });

  it('should return false for incorrect password', async () => {
    const userData = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = await UserService.createUser(userData);
    const userId = user._id as Types.ObjectId;

    const isValid = await UserService.verifyPassword(userId, 'wrongpassword');
    expect(isValid).toBe(false);
  });

  it('should throw error for non-existent user', async () => {
    const nonExistentId = new Types.ObjectId();

    await expect(
      UserService.verifyPassword(nonExistentId, 'password123'),
    ).rejects.toThrow('User not found');
  });
});
