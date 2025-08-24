import {Request, Response} from 'express';
import {runCatching} from '../../utils/runCatching';

describe('runCatching debug', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should catch errors properly', async () => {
    const innerFn = jest.fn().mockRejectedValue(new Error('Test error'));
    const wrappedFn = runCatching(innerFn);

    await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

    expect(innerFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should not call next when no error', async () => {
    const innerFn = jest.fn().mockResolvedValue(undefined);
    const wrappedFn = runCatching(innerFn);

    await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

    expect(innerFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
