import {RefreshTokenService} from '~services/refreshToken.service';

import RefreshToken from '~models/refreshToken/refreshToken.model';

import {logger} from '~utils/logger';

// Mock dependencies
jest.mock('~models/refreshToken/refreshToken.model');
jest.mock('~utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('RefreshTokenService.cleanupExpiredTokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete expired and revoked tokens', async () => {
    (RefreshToken.deleteMany as jest.Mock).mockResolvedValue({
      deletedCount: 5,
    });

    const result = await RefreshTokenService.cleanupExpiredTokens();

    expect(RefreshToken.deleteMany).toHaveBeenCalledWith({
      $or: [{isRevoked: true}, {expiresAt: {$lt: expect.any(Date)}}],
    });
    expect(result).toBe(5);
    expect(logger.info).toHaveBeenCalledWith(
      'Cleaned up expired refresh tokens',
      {
        deletedCount: 5,
      },
    );
  });

  it('should handle zero deleted count without logging', async () => {
    (RefreshToken.deleteMany as jest.Mock).mockResolvedValue({
      deletedCount: 0,
    });

    const result = await RefreshTokenService.cleanupExpiredTokens();

    expect(result).toBe(0);
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('should handle missing deletedCount gracefully', async () => {
    (RefreshToken.deleteMany as jest.Mock).mockResolvedValue({});

    const result = await RefreshTokenService.cleanupExpiredTokens();

    expect(result).toBe(0);
  });
});
