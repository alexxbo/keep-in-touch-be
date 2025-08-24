import {Types} from 'mongoose';

import {UserService} from '~services/user.service';

import User from '~models/user/user.model';

// Mock dependencies
jest.mock('~utils/logger');

describe('UserService.searchUsers', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // Create test users with different names and usernames
    await UserService.createUser({
      username: 'johnsmith',
      name: 'John Smith',
      email: 'john@example.com',
      password: 'password123',
    });

    await UserService.createUser({
      username: 'janedoe',
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
    });

    await UserService.createUser({
      username: 'alexbrown',
      name: 'Alex Brown',
      email: 'alex@example.com',
      password: 'password123',
    });

    await UserService.createUser({
      username: 'mikesmith',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      password: 'password123',
    });
  });

  it('should search users by username', async () => {
    const results = await UserService.searchUsers('johnsmith');

    expect(results).toHaveLength(1);
    expect(results[0].username).toBe('johnsmith');
    expect(results[0].name).toBe('John Smith');
  });

  it('should search users by name', async () => {
    const results = await UserService.searchUsers('smith');

    expect(results).toHaveLength(2);
    const usernames = results.map(u => u.username).sort();
    expect(usernames).toEqual(['johnsmith', 'mikesmith']);
  });

  it('should be case insensitive', async () => {
    const results = await UserService.searchUsers('JANE');

    expect(results).toHaveLength(1);
    expect(results[0].username).toBe('janedoe');
  });

  it('should exclude specified user', async () => {
    const johnUser = await User.findOne({username: 'johnsmith'});
    const userId = johnUser?._id as Types.ObjectId;

    const results = await UserService.searchUsers('smith', userId);

    expect(results).toHaveLength(1);
    expect(results[0].username).toBe('mikesmith');
  });

  it('should respect limit parameter', async () => {
    const results = await UserService.searchUsers('', undefined, 2);

    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('should return empty array for no matches', async () => {
    const results = await UserService.searchUsers('nonexistent');

    expect(results).toHaveLength(0);
  });
});
