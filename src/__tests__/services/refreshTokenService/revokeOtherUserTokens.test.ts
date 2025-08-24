import {Types} from 'mongoose';
import RefreshToken from '../../../models/refreshToken/refreshToken.model';
import {RefreshTokenService} from '../../../services/refreshToken.service';

// Mock dependencies
jest.mock('../../../models/refreshToken/refreshToken.model');

describe('RefreshTokenService.revokeOtherUserTokens', () => {
  const mockUserId = new Types.ObjectId();
  const mockTokenId = new Types.ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle missing modifiedCount gracefully', async () => {
    (RefreshToken.updateMany as jest.Mock).mockResolvedValue({});

    const result = await RefreshTokenService.revokeOtherUserTokens(
      mockUserId,
      mockTokenId,
    );

    expect(result).toBe(0);
  });
});
