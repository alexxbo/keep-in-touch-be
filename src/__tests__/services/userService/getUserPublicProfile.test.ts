import {Types} from 'mongoose';

import {UserService} from '~services/user.service';

// Mock dependencies
jest.mock('~utils/logger');

describe('UserService.getUserPublicProfile', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('should return user public profile successfully', async () => {
    const userData = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = await UserService.createUser(userData);
    const userId = user._id as Types.ObjectId;

    const profile = await UserService.getUserPublicProfile(userId);

    expect(profile.name).toBe('Test User');
    expect(profile.username).toBe('testuser');
    expect(profile.email).toBe('test@example.com');
    expect(profile.id).toBeDefined();
  });

  it('should throw error for non-existent user', async () => {
    const nonExistentId = new Types.ObjectId();

    await expect(
      UserService.getUserPublicProfile(nonExistentId),
    ).rejects.toThrow('User not found');
  });
});
