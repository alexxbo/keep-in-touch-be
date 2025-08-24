import {Types} from 'mongoose';
import {IRefreshToken} from '~models/refreshToken/refreshToken.model';
import {RefreshTokenService} from '~services/refreshToken.service';
import {UserService} from '~services/user.service';

// Mock dependencies
jest.mock('~services/refreshToken.service');
jest.mock('~utils/logger');

const mockedRefreshTokenService = RefreshTokenService as jest.Mocked<
  typeof RefreshTokenService
>;

describe('UserService.getUserActiveSessions', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('should return user active sessions', async () => {
    const userData = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = await UserService.createUser(userData);
    const userId = user._id as Types.ObjectId;

    const mockTokens = [
      {
        _id: new Types.ObjectId(),
        deviceInfo: 'Chrome on macOS',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        _id: new Types.ObjectId(),
        deviceInfo: 'Safari on iOS',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    ];

    mockedRefreshTokenService.getUserActiveTokens.mockResolvedValue(
      mockTokens as IRefreshToken[],
    );

    const sessions = await UserService.getUserActiveSessions(userId);

    expect(sessions).toHaveLength(2);
    expect(sessions[0].tokenId).toBe(mockTokens[0]._id.toString());
    expect(sessions[0].deviceInfo).toBe('Chrome on macOS');
    expect(sessions[1].tokenId).toBe(mockTokens[1]._id.toString());
    expect(sessions[1].deviceInfo).toBe('Safari on iOS');
  });

  it('should handle sessions without deviceInfo', async () => {
    const userData = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = await UserService.createUser(userData);
    const userId = user._id as Types.ObjectId;

    const mockTokens = [
      {
        _id: new Types.ObjectId(),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    ];

    mockedRefreshTokenService.getUserActiveTokens.mockResolvedValue(
      mockTokens as IRefreshToken[],
    );

    const sessions = await UserService.getUserActiveSessions(userId);

    expect(sessions).toHaveLength(1);
    expect(sessions[0].deviceInfo).toBeUndefined();
  });
});
