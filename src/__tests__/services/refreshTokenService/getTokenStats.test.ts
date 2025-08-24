import RefreshToken from '../../../models/refreshToken/refreshToken.model';
import {RefreshTokenService} from '../../../services/refreshToken.service';

// Mock dependencies
jest.mock('../../../models/refreshToken/refreshToken.model');

describe('RefreshTokenService.getTokenStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return comprehensive token statistics', async () => {
    (RefreshToken.countDocuments as jest.Mock)
      .mockResolvedValueOnce(100) // total
      .mockResolvedValueOnce(75) // active
      .mockResolvedValueOnce(15) // expired
      .mockResolvedValueOnce(10); // revoked

    const result = await RefreshTokenService.getTokenStats();

    expect(RefreshToken.countDocuments).toHaveBeenCalledTimes(4);
    expect(result).toEqual({
      total: 100,
      active: 75,
      expired: 15,
      revoked: 10,
    });
  });
});
