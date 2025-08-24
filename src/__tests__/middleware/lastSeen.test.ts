import {NextFunction, Request, Response} from 'express';
import {updateLastSeen} from '~middleware/lastSeen';
import {logger} from '~utils/logger';

jest.mock('~utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

interface MockUser {
  _id: string;
  username: string;
  updateLastSeen: jest.Mock;
  save: jest.Mock;
}

describe('updateLastSeen Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mockUser: MockUser;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      _id: 'user123',
      username: 'testuser',
      updateLastSeen: jest.fn(),
      save: jest.fn().mockResolvedValue({}),
    };

    req = {};
    res = {};
    next = jest.fn();
  });

  it('should update lastSeen when user is authenticated', async () => {
    req.user = mockUser;

    await updateLastSeen(req as Request, res as Response, next);

    expect(mockUser.updateLastSeen).toHaveBeenCalledTimes(1);
    expect(mockUser.save).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledWith(
      `Updated last seen for user ${mockUser.username} (${mockUser._id})`,
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('should skip update when no user in request', async () => {
    req.user = undefined;

    await updateLastSeen(req as Request, res as Response, next);

    expect(logger.debug).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('should handle save errors gracefully and continue', async () => {
    const saveError = new Error('Database connection failed');
    mockUser.save = jest.fn().mockRejectedValue(saveError);
    req.user = mockUser;

    await updateLastSeen(req as Request, res as Response, next);

    expect(mockUser.updateLastSeen).toHaveBeenCalledTimes(1);
    expect(mockUser.save).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'Error updating last seen:',
      saveError,
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('should handle updateLastSeen method errors gracefully', async () => {
    const updateError = new Error('updateLastSeen failed');
    mockUser.updateLastSeen = jest.fn().mockImplementation(() => {
      throw updateError;
    });
    req.user = mockUser;

    await updateLastSeen(req as Request, res as Response, next);

    expect(mockUser.updateLastSeen).toHaveBeenCalledTimes(1);
    expect(mockUser.save).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'Error updating last seen:',
      updateError,
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('should handle null user gracefully', async () => {
    req.user = null;

    await updateLastSeen(req as Request, res as Response, next);

    expect(logger.debug).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });
});
