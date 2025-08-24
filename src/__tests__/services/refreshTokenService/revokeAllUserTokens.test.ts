import {Types} from 'mongoose';

import {RefreshTokenService} from '~services/refreshToken.service';

import RefreshToken from '~models/refreshToken/refreshToken.model';

// Mock dependencies
jest.mock('~models/refreshToken/refreshToken.model');

describe('RefreshTokenService.revokeAllUserTokens', () => {
  const mockUserId = new Types.ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle missing modifiedCount gracefully', async () => {
    (RefreshToken.updateMany as jest.Mock).mockResolvedValue({});

    const result = await RefreshTokenService.revokeAllUserTokens(mockUserId);

    expect(result).toBe(0);
  });
});
