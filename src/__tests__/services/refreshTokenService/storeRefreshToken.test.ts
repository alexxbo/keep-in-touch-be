import {Types} from 'mongoose';
import RefreshToken from '~models/refreshToken/refreshToken.model';
import {RefreshTokenService} from '~services/refreshToken.service';

// Mock dependencies
jest.mock('~models/refreshToken/refreshToken.model');
jest.mock('~config/env.config', () => ({
  JWT_REFRESH_EXPIRE: '7d',
}));

describe('RefreshTokenService.storeRefreshToken', () => {
  const mockUserId = new Types.ObjectId();
  const mockTokenId = new Types.ObjectId();
  const mockJwtToken = 'mock.jwt.token';

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the env mock to default
    const envMock = jest.requireMock('../../../config/env.config');
    envMock.JWT_REFRESH_EXPIRE = '7d';
  });

  describe('parseTimeToMs edge cases', () => {
    it('should parse hours correctly', async () => {
      // Mock the env configuration to return custom expire time
      const envMock = jest.requireMock('../../../config/env.config');
      envMock.JWT_REFRESH_EXPIRE = '12h';

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
      const expectedTime = Date.now() + 12 * 60 * 60 * 1000;
      const actualTime = call.expiresAt.getTime();
      expect(Math.abs(actualTime - expectedTime)).toBeLessThan(1000);
    });

    it('should parse minutes correctly', async () => {
      // Mock the env configuration to return custom expire time
      const envMock = jest.requireMock('../../../config/env.config');
      envMock.JWT_REFRESH_EXPIRE = '30m';

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
      // Mock the env configuration to return custom expire time
      const envMock = jest.requireMock('../../../config/env.config');
      envMock.JWT_REFRESH_EXPIRE = '3600s';

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
      // Mock the env configuration to return invalid expire time
      const envMock = jest.requireMock('../../../config/env.config');
      envMock.JWT_REFRESH_EXPIRE = 'invalid';

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
      // Mock the env configuration to return time with unknown unit
      const envMock = jest.requireMock('../../../config/env.config');
      envMock.JWT_REFRESH_EXPIRE = '5w'; // weeks not supported

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
