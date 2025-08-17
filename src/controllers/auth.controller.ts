import {NextFunction, Request, Response} from 'express';
import {StatusCodes} from 'http-status-codes';
import jwt from 'jsonwebtoken';
import {
  ForgotPasswordType,
  LoginType,
  RefreshTokenType,
  RegisterUserType,
  ResetPasswordType,
} from '../models/auth/auth.types';
import User from '../models/user/user.model';
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
    const {username, name, email, password} = req.body as RegisterUserType;

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
    // identifier can be username or email
    const {identifier, password} = req.body as LoginType;

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

    const token = generateToken((user._id as string).toString());

    const userResponse = user.getPublicProfile();

    res.status(StatusCodes.OK).json({
      message: 'Login successful',
      user: userResponse,
      token,
    });
  },
);

export const refreshToken = runCatching(
  async (req: Request, res: Response, next: NextFunction) => {
    const {refreshToken} = req.body as RefreshTokenType;

    if (!refreshToken) {
      return next(
        new BaseError('Refresh token is required', StatusCodes.BAD_REQUEST),
      );
    }

    // TODO: Implement refresh token logic with database storage
    // For now, just return an error
    return next(
      new BaseError(
        'Refresh token functionality not implemented yet',
        StatusCodes.NOT_IMPLEMENTED,
      ),
    );
  },
);

export const logout = runCatching(async (req: Request, res: Response) => {
  // TODO: Implement logout logic with refresh token invalidation
  // For now, just return success
  res.status(StatusCodes.OK).json({message: 'Logged out successfully'});
});

export const forgotPassword = runCatching(
  async (req: Request, res: Response, next: NextFunction) => {
    const {email} = req.body as ForgotPasswordType;

    if (!email) {
      return next(new BaseError('Email is required', StatusCodes.BAD_REQUEST));
    }

    // TODO: Implement forgot password logic with email service
    // For now, just return success
    res.status(StatusCodes.OK).json({
      message: 'Password reset instructions sent to your email',
    });
  },
);

export const resetPassword = runCatching(
  async (req: Request, res: Response, next: NextFunction) => {
    const {token, newPassword} = req.body as ResetPasswordType;

    if (!token || !newPassword) {
      return next(
        new BaseError(
          'Reset token and new password are required',
          StatusCodes.BAD_REQUEST,
        ),
      );
    }

    // TODO: Implement reset password logic with token validation
    // For now, just return an error
    return next(
      new BaseError(
        'Password reset functionality not implemented yet',
        StatusCodes.NOT_IMPLEMENTED,
      ),
    );
  },
);
