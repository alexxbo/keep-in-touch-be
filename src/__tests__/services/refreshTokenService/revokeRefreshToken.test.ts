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

describe('RefreshTokenService.revokeRefreshToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle invalid token gracefully with warning', async () => {
    (RefreshToken.find as jest.Mock).mockResolvedValue([]);

    await RefreshTokenService.revokeRefreshToken('invalid-token');

    expect(logger.warn).toHaveBeenCalledWith(
      'Attempted to revoke invalid refresh token',
      {
        error: 'Invalid or expired refresh token',
      },
    );
  });

  it('should handle non-Error object gracefully', async () => {
    (RefreshToken.find as jest.Mock).mockRejectedValue('string error');

    await RefreshTokenService.revokeRefreshToken('any-token');

    expect(logger.warn).toHaveBeenCalledWith(
      'Attempted to revoke invalid refresh token',
      {
        error: 'Unknown error',
      },
    );
  });
});
