import {NextFunction, Request, Response} from 'express';
import {StatusCodes} from 'http-status-codes';

import {UserService} from '~services/user.service';

import {UserParamsType} from '~models/user/user.types';

import {BaseError} from '~utils/BaseError';
import {runCatching} from '~utils/runCatching';

export const getCurrentUser = runCatching(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new BaseError('Authentication required', StatusCodes.UNAUTHORIZED),
      );
    }

    const user = await UserService.getUserCompleteProfile(req.user._id);

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {user},
    });
  },
);

export const updateProfile = runCatching(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new BaseError('Authentication required', StatusCodes.UNAUTHORIZED),
      );
    }

    const {name, username} = req.body;

    const updateData: Partial<{name: string; username: string}> = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;

    const user = await UserService.updateProfile(req.user._id, updateData);

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {user},
    });
  },
);

export const getUserById = runCatching(async (req: Request, res: Response) => {
  const {id} = req.params as UserParamsType;

  const user = await UserService.getUserPublicProfile(id);

  res.status(StatusCodes.OK).json({
    status: 'success',
    data: {user},
  });
});

export const deleteAccount = runCatching(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new BaseError('Authentication required', StatusCodes.UNAUTHORIZED),
      );
    }

    await UserService.deleteAccount(req.user._id);

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Account deleted successfully',
    });
  },
);
