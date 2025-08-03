import {NextFunction, Request, Response} from 'express';
import {StatusCodes} from 'http-status-codes';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import {BaseError} from '../utils/BaseError';
import {runCatching} from '../utils/runCatching';

const generateToken = (userId: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new BaseError(
      'JWT secret is not configured',
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
  }

  //TODO: change expiresIn to a more secure value in production
  return jwt.sign({userId}, jwtSecret, {expiresIn: '7d'});
};

export const register = runCatching(
  async (req: Request, res: Response, next: NextFunction) => {
    const {username, name, email, password} = req.body;

    if (!username || !name || !email || !password) {
      return next(
        new BaseError(
          'Username, name, email, and password are required',
          StatusCodes.BAD_REQUEST,
        ),
      );
    }

    const existingUser = await User.findOne({
      $or: [{username}, {email}],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return next(
          new BaseError('Username already taken', StatusCodes.CONFLICT),
        );
      }
      if (existingUser.email === email) {
        return next(
          new BaseError('Email already registered', StatusCodes.CONFLICT),
        );
      }
    }

    const user = new User({username, name, email, password});
    await user.save();

    const token = generateToken((user._id as string).toString());

    const userResponse = user.getPublicProfile();

    res.status(StatusCodes.CREATED).json({
      message: 'User registered successfully',
      user: userResponse,
      token,
    });
  },
);

export const login = runCatching(
  async (req: Request, res: Response, next: NextFunction) => {
    const {identifier, password} = req.body; // identifier can be username or email

    if (!identifier || !password) {
      return next(
        new BaseError(
          'Username/email and password are required',
          StatusCodes.BAD_REQUEST,
        ),
      );
    }

    // Find user by username or email and include password for comparison
    const user = await User.findOne({
      $or: [{username: identifier}, {email: identifier}],
    }).select('+password');

    if (!user) {
      return next(
        new BaseError(
          'Invalid credentials or account is inactive',
          StatusCodes.UNAUTHORIZED,
        ),
      );
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(
        new BaseError('Invalid credentials', StatusCodes.UNAUTHORIZED),
      );
    }

    user.updateLastSeen();
    await user.save();

    const token = generateToken((user._id as string).toString());

    const userResponse = user.getPublicProfile();

    res.status(StatusCodes.OK).json({
      message: 'Login successful',
      user: userResponse,
      token,
    });
  },
);

export const getProfile = runCatching(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new BaseError('User not authenticated', StatusCodes.UNAUTHORIZED),
      );
    }

    req.user.updateLastSeen();
    await req.user.save();

    const userResponse = req.user.getPublicProfile();

    res.status(StatusCodes.OK).json({user: userResponse});
  },
);

export const updateProfile = runCatching(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new BaseError('User not authenticated', StatusCodes.UNAUTHORIZED),
      );
    }

    const {username, name, email} = req.body;
    const updateData: {username?: string; name?: string; email?: string} = {};

    if (username) {
      // Check if username is already taken by another user
      const existingUser = await User.findOne({
        username,
        _id: {$ne: req.user._id},
      });
      if (existingUser) {
        return next(
          new BaseError('Username is already taken', StatusCodes.CONFLICT),
        );
      }
      updateData.username = username;
    }

    if (name) updateData.name = name;

    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({
        email,
        _id: {$ne: req.user._id},
      });
      if (existingUser) {
        return next(
          new BaseError('Email is already taken', StatusCodes.CONFLICT),
        );
      }
      updateData.email = email;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return next(new BaseError('User not found', StatusCodes.NOT_FOUND));
    }

    const userResponse = updatedUser.getPublicProfile();

    res.status(StatusCodes.OK).json({
      message: 'Profile updated successfully',
      user: userResponse,
    });
  },
);

export const changePassword = runCatching(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new BaseError('User not authenticated', StatusCodes.UNAUTHORIZED),
      );
    }

    const {currentPassword, newPassword} = req.body;

    if (!currentPassword || !newPassword) {
      return next(
        new BaseError(
          'Current password and new password are required',
          StatusCodes.BAD_REQUEST,
        ),
      );
    }

    if (newPassword.length < 6) {
      return next(
        new BaseError(
          'New password must be at least 6 characters long',
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

    res.status(StatusCodes.OK).json({message: 'Password changed successfully'});
  },
);
