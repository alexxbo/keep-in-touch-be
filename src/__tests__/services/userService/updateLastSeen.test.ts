import {Types} from 'mongoose';
import {UserService} from '../../../services/user.service';

// Mock dependencies
jest.mock('../../../utils/logger');

describe('UserService.updateLastSeen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('should update lastSeen for existing user', async () => {
    const userData = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = await UserService.createUser(userData);
    const userId = user._id as Types.ObjectId;

    // Should not throw
    await expect(UserService.updateLastSeen(userId)).resolves.toBeUndefined();
  });

  it('should handle non-existent user gracefully', async () => {
    const nonExistentId = new Types.ObjectId();

    // Should not throw error
    await expect(
      UserService.updateLastSeen(nonExistentId),
    ).resolves.toBeUndefined();
  });
});
