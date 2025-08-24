import {Types} from 'mongoose';
import {UserService} from '../../../services/user.service';

// Mock dependencies
jest.mock('../../../utils/logger');

describe('UserService.userExists', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('should return true for existing user', async () => {
    const userData = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = await UserService.createUser(userData);
    const userId = user._id as Types.ObjectId;

    const exists = await UserService.userExists(userId);
    expect(exists).toBe(true);
  });

  it('should return false for non-existent user', async () => {
    const nonExistentId = new Types.ObjectId();

    const exists = await UserService.userExists(nonExistentId);
    expect(exists).toBe(false);
  });

  it('should return false for invalid ObjectId string', async () => {
    const exists = await UserService.userExists('invalid-id');
    expect(exists).toBe(false);
  });
});
