import {NextFunction, Request, Response} from 'express';
import {StatusCodes} from 'http-status-codes';
import User from '../models/user/user.model';
import {UpdatePasswordType, UserParamsType} from '../models/user/user.types';
import {BaseError} from '../utils/BaseError';
import {runCatching} from '../utils/runCatching';

export const getCurrentUser = runCatching(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new BaseError('Authentication required', StatusCodes.UNAUTHORIZED),
      );
    }

    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return next(new BaseError('User not found', StatusCodes.NOT_FOUND));
    }

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

    // Check if username is already taken by another user
    if (username) {
      const existingUser = await User.findOne({
        username,
        _id: {$ne: req.user._id},
      });
      if (existingUser) {
        return next(
          new BaseError('Username already taken', StatusCodes.CONFLICT),
        );
      }
    }

    const updateData: Partial<{name: string; username: string}> = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return next(new BaseError('User not found', StatusCodes.NOT_FOUND));
    }

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {user},
    });
  },
);

export const updatePassword = runCatching(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new BaseError('Authentication required', StatusCodes.UNAUTHORIZED),
      );
    }

    const {currentPassword, newPassword} = req.body as UpdatePasswordType;

    if (!currentPassword || !newPassword) {
      return next(
        new BaseError(
          'Current password and new password are required',
          StatusCodes.BAD_REQUEST,
        ),
      );
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return next(new BaseError('User not found', StatusCodes.NOT_FOUND));
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return next(
        new BaseError(
          'Current password is incorrect',
          StatusCodes.UNAUTHORIZED,
        ),
      );
    }

    user.password = newPassword;
    await user.save();

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Password updated successfully',
    });
  },
);

export const getUserById = runCatching(
  async (req: Request, res: Response, next: NextFunction) => {
    const {id} = req.params as UserParamsType;

    const user = await User.findById(id).select(
      'name username email createdAt',
    );
    if (!user) {
      return next(new BaseError('User not found', StatusCodes.NOT_FOUND));
    }

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {user},
    });
  },
);

export const deleteAccount = runCatching(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new BaseError('Authentication required', StatusCodes.UNAUTHORIZED),
      );
    }

    // Hard delete the user account
    await User.findByIdAndDelete(req.user._id);

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Account deleted successfully',
    });
  },
);
