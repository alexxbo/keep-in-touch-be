import {Types} from 'mongoose';

import {RefreshTokenService} from '~services/refreshToken.service';
import {UserService} from '~services/user.service';

// Mock dependencies
jest.mock('~services/refreshToken.service');
jest.mock('~utils/logger');

const mockedRefreshTokenService = RefreshTokenService as jest.Mocked<
  typeof RefreshTokenService
>;

describe('UserService.revokeUserTokens', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('should revoke all user tokens when revokeAll is true', async () => {
    const userData = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = await UserService.createUser(userData);
    const userId = user._id as Types.ObjectId;

    mockedRefreshTokenService.revokeAllUserTokens.mockResolvedValue(3);

    const revokedCount = await UserService.revokeUserTokens(userId, true);

    expect(mockedRefreshTokenService.revokeAllUserTokens).toHaveBeenCalledWith(
      userId,
    );
    expect(revokedCount).toBe(3);
  });

  it('should revoke other user tokens when currentTokenId provided', async () => {
    const userData = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = await UserService.createUser(userData);
    const userId = user._id as Types.ObjectId;
    const currentTokenId = new Types.ObjectId();

    mockedRefreshTokenService.revokeOtherUserTokens.mockResolvedValue(2);

    const revokedCount = await UserService.revokeUserTokens(
      userId,
      false,
      currentTokenId,
    );

    expect(
      mockedRefreshTokenService.revokeOtherUserTokens,
    ).toHaveBeenCalledWith(userId, currentTokenId);
    expect(revokedCount).toBe(2);
  });

  it('should return 0 when neither revokeAll nor currentTokenId provided', async () => {
    const userData = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = await UserService.createUser(userData);
    const userId = user._id as Types.ObjectId;

    const revokedCount = await UserService.revokeUserTokens(userId, false);

    expect(revokedCount).toBe(0);
    expect(
      mockedRefreshTokenService.revokeAllUserTokens,
    ).not.toHaveBeenCalled();
    expect(
      mockedRefreshTokenService.revokeOtherUserTokens,
    ).not.toHaveBeenCalled();
  });

  it('should handle service errors gracefully', async () => {
    const userData = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = await UserService.createUser(userData);
    const userId = user._id as Types.ObjectId;

    mockedRefreshTokenService.revokeAllUserTokens.mockRejectedValue(
      new Error('Database error'),
    );

    await expect(UserService.revokeUserTokens(userId, true)).rejects.toThrow(
      'Failed to revoke authentication tokens',
    );
  });

  it('should work with string userId', async () => {
    const userData = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = await UserService.createUser(userData);
    const userId = (user._id as Types.ObjectId).toString();

    mockedRefreshTokenService.revokeAllUserTokens.mockResolvedValue(1);

    const revokedCount = await UserService.revokeUserTokens(userId, true);

    expect(revokedCount).toBe(1);
  });
});
