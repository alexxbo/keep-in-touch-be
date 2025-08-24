import {StatusCodes} from 'http-status-codes';
import {Types} from 'mongoose';

import {RefreshTokenService} from '~services/refreshToken.service';

import RefreshToken from '~models/refreshToken/refreshToken.model';

import {BaseError} from '~utils/BaseError';

// Mock dependencies
jest.mock('~models/refreshToken/refreshToken.model');

describe('RefreshTokenService.validateRefreshToken', () => {
  const mockUserId = new Types.ObjectId();
  const mockTokenId = new Types.ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error for empty token', async () => {
    await expect(RefreshTokenService.validateRefreshToken('')).rejects.toThrow(
      new BaseError('Refresh token is required', StatusCodes.UNAUTHORIZED),
    );
  });

  it('should throw error when token is found but invalid', async () => {
    const mockTokenDoc = {
      compareToken: jest.fn().mockResolvedValue(true),
      isValid: jest.fn().mockReturnValue(false),
      userId: mockUserId,
      _id: mockTokenId,
    };

    (RefreshToken.find as jest.Mock).mockResolvedValue([mockTokenDoc]);

    await expect(
      RefreshTokenService.validateRefreshToken('valid-token'),
    ).rejects.toThrow(
      new BaseError(
        'Invalid or expired refresh token',
        StatusCodes.UNAUTHORIZED,
      ),
    );
  });
});
