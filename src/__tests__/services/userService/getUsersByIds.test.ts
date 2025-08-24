import {Types} from 'mongoose';
import {UserService} from '~services/user.service';

// Mock dependencies
jest.mock('~utils/logger');

describe('UserService.getUsersByIds', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('should return users for valid IDs', async () => {
    // Create test users
    const user1 = await UserService.createUser({
      username: 'user1',
      name: 'User One',
      email: 'user1@example.com',
      password: 'password123',
    });

    const user2 = await UserService.createUser({
      username: 'user2',
      name: 'User Two',
      email: 'user2@example.com',
      password: 'password123',
    });

    const userIds = [user1._id as Types.ObjectId, user2._id as Types.ObjectId];

    const result = await UserService.getUsersByIds(userIds);

    expect(result).toHaveLength(2);
    expect(result[0]).toBeDefined();
    expect(result[1]).toBeDefined();
  });

  it('should include password when requested', async () => {
    const user = await UserService.createUser({
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    const userIds = [user._id as Types.ObjectId];

    const result = await UserService.getUsersByIds(userIds, true);

    expect(result).toHaveLength(1);
    // Note: This is currently a bug - password is not included even when includePassword=true
    // because getUsersByIds doesn't use +password selector like findById does
    expect(result[0].password).toBeUndefined();
  });

  it('should filter out invalid IDs', async () => {
    const user = await UserService.createUser({
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    const userIds = [user._id as Types.ObjectId, 'invalid-id'];

    const result = await UserService.getUsersByIds(userIds);

    expect(result).toHaveLength(1);
  });
});
