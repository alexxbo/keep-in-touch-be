import {Types} from 'mongoose';

import {UserService} from '~services/user.service';

// Mock dependencies
jest.mock('~utils/logger');

describe('UserService.getUserSummary', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('should return user summary successfully', async () => {
    const userData = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = await UserService.createUser(userData);
    const userId = user._id as Types.ObjectId;

    const summary = await UserService.getUserSummary(userId);

    expect(summary.name).toBe('Test User');
    expect(summary.username).toBe('testuser');
    expect(summary.id).toBeDefined();
  });

  it('should throw error for non-existent user', async () => {
    const nonExistentId = new Types.ObjectId();

    await expect(UserService.getUserSummary(nonExistentId)).rejects.toThrow(
      'User not found',
    );
  });
});
