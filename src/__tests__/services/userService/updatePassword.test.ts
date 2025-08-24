import {Types} from 'mongoose';
import {UserService} from '~services/user.service';

// Mock dependencies
jest.mock('~utils/logger');

describe('UserService.updatePassword', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('should update password without current password verification (reset)', async () => {
    const userData = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = await UserService.createUser(userData);
    const userId = user._id as Types.ObjectId;

    // Password reset - no current password required
    await UserService.updatePassword(userId, {
      newPassword: 'resetpassword123',
    });

    // Verify old password no longer works
    const oldPasswordValid = await UserService.verifyPassword(
      userId,
      'password123',
    );
    expect(oldPasswordValid).toBe(false);

    // Verify new password works
    const newPasswordValid = await UserService.verifyPassword(
      userId,
      'resetpassword123',
    );
    expect(newPasswordValid).toBe(true);
  });
});
