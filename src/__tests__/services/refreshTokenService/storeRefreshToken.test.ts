import {Types} from 'mongoose';
import RefreshToken from '../../../models/refreshToken/refreshToken.model';
import {RefreshTokenService} from '../../../services/refreshToken.service';

// Mock dependencies
jest.mock('../../../models/refreshToken/refreshToken.model');

describe('RefreshTokenService.storeRefreshToken', () => {
  const mockUserId = new Types.ObjectId();
  const mockTokenId = new Types.ObjectId();
  const mockJwtToken = 'mock.jwt.token';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
  });

  afterEach(() => {
    delete process.env.REFRESH_TOKEN_EXPIRES_IN;
  });

  describe('parseTimeToMs edge cases', () => {
    it('should parse hours correctly', async () => {
      process.env.REFRESH_TOKEN_EXPIRES_IN = '12h';

      const mockSave = jest.fn().mockResolvedValue(undefined);
      const mockRefreshToken = {
        _id: mockTokenId,
        userId: mockUserId,
        save: mockSave,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (RefreshToken as any).mockImplementation(() => mockRefreshToken);

      await RefreshTokenService.storeRefreshToken(
        {userId: mockUserId},
        mockJwtToken,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (RefreshToken as any).mock.calls[0][0];
      const expectedTime = Date.now() + 12 * 60 * 60 * 1000;
      const actualTime = call.expiresAt.getTime();
      expect(Math.abs(actualTime - expectedTime)).toBeLessThan(1000);
    });

    it('should parse minutes correctly', async () => {
      process.env.REFRESH_TOKEN_EXPIRES_IN = '30m';

      const mockSave = jest.fn().mockResolvedValue(undefined);
      const mockRefreshToken = {
        _id: mockTokenId,
        save: mockSave,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (RefreshToken as any).mockImplementation(() => mockRefreshToken);

      await RefreshTokenService.storeRefreshToken(
        {userId: mockUserId},
        mockJwtToken,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (RefreshToken as any).mock.calls[0][0];
      expect(call.expiresAt.getTime() - Date.now()).toBeCloseTo(
        30 * 60 * 1000,
        -2,
      );
    });

    it('should parse seconds correctly', async () => {
      process.env.REFRESH_TOKEN_EXPIRES_IN = '3600s';

      const mockSave = jest.fn().mockResolvedValue(undefined);
      const mockRefreshToken = {
        _id: mockTokenId,
        save: mockSave,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (RefreshToken as any).mockImplementation(() => mockRefreshToken);

      await RefreshTokenService.storeRefreshToken(
        {userId: mockUserId},
        mockJwtToken,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (RefreshToken as any).mock.calls[0][0];
      expect(call.expiresAt.getTime() - Date.now()).toBeCloseTo(
        3600 * 1000,
        -2,
      );
    });

    it('should default to 7 days for invalid format', async () => {
      process.env.REFRESH_TOKEN_EXPIRES_IN = 'invalid';

      const mockSave = jest.fn().mockResolvedValue(undefined);
      const mockRefreshToken = {
        _id: mockTokenId,
        save: mockSave,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (RefreshToken as any).mockImplementation(() => mockRefreshToken);

      await RefreshTokenService.storeRefreshToken(
        {userId: mockUserId},
        mockJwtToken,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (RefreshToken as any).mock.calls[0][0];
      expect(call.expiresAt.getTime() - Date.now()).toBeCloseTo(
        7 * 24 * 60 * 60 * 1000,
        -2,
      );
    });

    it('should default to 7 days for unknown unit', async () => {
      process.env.REFRESH_TOKEN_EXPIRES_IN = '5w'; // weeks not supported

      const mockSave = jest.fn().mockResolvedValue(undefined);
      const mockRefreshToken = {
        _id: mockTokenId,
        save: mockSave,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (RefreshToken as any).mockImplementation(() => mockRefreshToken);

      await RefreshTokenService.storeRefreshToken(
        {userId: mockUserId},
        mockJwtToken,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (RefreshToken as any).mock.calls[0][0];
      expect(call.expiresAt.getTime() - Date.now()).toBeCloseTo(
        7 * 24 * 60 * 60 * 1000,
        -2,
      );
    });
  });
});
