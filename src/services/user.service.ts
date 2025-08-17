import {StatusCodes} from 'http-status-codes';
import {Types} from 'mongoose';
import User, {IUser} from '../models/user/user.model';
import {
  CompleteProfileType,
  PublicProfileType,
  UpdatePasswordType,
  UserSummaryType,
} from '../models/user/user.types';
import {BaseError} from '../utils/BaseError';
import {logger} from '../utils/logger';

export class UserService {
  /**
   * Create a new user with the provided data
   */
  static async createUser(userData: {
    username: string;
    name: string;
    email: string;
    password: string;
  }): Promise<IUser> {
    const {username, name, email, password} = userData;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{username}, {email}],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new BaseError('Username already taken', StatusCodes.CONFLICT);
      }
      if (existingUser.email === email) {
        throw new BaseError('Email already registered', StatusCodes.CONFLICT);
      }
    }

    const user = new User({username, name, email, password});
    await user.save();

    logger.info(`User created successfully: ${user.username}`, {
      userId: user._id,
      username: user.username,
      email: user.email,
    });

    return user;
  }

  /**
   * Find user by username or email
   */
  static async findByUsernameOrEmail(
    identifier: string,
    includePassword = false,
  ): Promise<IUser | null> {
    const query = User.findOne({
      $or: [{username: identifier}, {email: identifier}],
    });

    if (includePassword) {
      query.select('+password');
    }

    return query.exec();
  }

  /**
   * Find user by ID
   */
  static async findById(
    userId: string | Types.ObjectId,
    includePassword = false,
  ): Promise<IUser | null> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BaseError('Invalid user ID format', StatusCodes.BAD_REQUEST);
    }

    const query = User.findById(userId);

    if (includePassword) {
      query.select('+password');
    } else {
      query.select('-password');
    }

    return query.exec();
  }

  /**
   * Get user's complete profile (for authenticated user)
   */
  static async getUserCompleteProfile(
    userId: string | Types.ObjectId,
  ): Promise<CompleteProfileType> {
    const user = await this.findById(userId);
    if (!user) {
      throw new BaseError('User not found', StatusCodes.NOT_FOUND);
    }

    return user.getCompleteProfile();
  }

  /**
   * Get user's public profile (for other users)
   */
  static async getUserPublicProfile(
    userId: string | Types.ObjectId,
  ): Promise<PublicProfileType> {
    const user = await User.findById(userId).select(
      'name username email createdAt',
    );
    if (!user) {
      throw new BaseError('User not found', StatusCodes.NOT_FOUND);
    }

    return user.getPublicProfile();
  }

  /**
   * Get user summary (minimal info for listings)
   */
  static async getUserSummary(
    userId: string | Types.ObjectId,
  ): Promise<UserSummaryType> {
    const user = await User.findById(userId).select('name username');
    if (!user) {
      throw new BaseError('User not found', StatusCodes.NOT_FOUND);
    }

    return user.getUserSummary();
  }

  /**
   * Update user profile information
   */
  static async updateProfile(
    userId: string | Types.ObjectId,
    updateData: {name?: string; username?: string},
  ): Promise<IUser> {
    // Check if username is already taken by another user
    if (updateData.username) {
      const existingUser = await User.findOne({
        username: updateData.username,
        _id: {$ne: userId},
      });
      if (existingUser) {
        throw new BaseError('Username already taken', StatusCodes.CONFLICT);
      }
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      throw new BaseError('User not found', StatusCodes.NOT_FOUND);
    }

    logger.info(`User profile updated: ${user.username}`, {
      userId: user._id,
      updatedFields: Object.keys(updateData),
    });

    return user;
  }

  /**
   * Update user's password
   */
  static async updatePassword(
    userId: string | Types.ObjectId,
    passwordData: UpdatePasswordType,
  ): Promise<void> {
    const {currentPassword, newPassword} = passwordData;

    const user = await this.findById(userId, true);
    if (!user) {
      throw new BaseError('User not found', StatusCodes.NOT_FOUND);
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new BaseError(
        'Current password is incorrect',
        StatusCodes.UNAUTHORIZED,
      );
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password updated for user: ${user.username}`, {
      userId: user._id,
    });
  }

  /**
   * Update user's last seen timestamp
   */
  static async updateLastSeen(userId: string | Types.ObjectId): Promise<void> {
    const user = await User.findById(userId);
    if (user) {
      await user.updateLastSeen();
    }
  }

  /**
   * Verify user password
   */
  static async verifyPassword(
    userId: string | Types.ObjectId,
    password: string,
  ): Promise<boolean> {
    const user = await this.findById(userId, true);
    if (!user) {
      throw new BaseError('User not found', StatusCodes.NOT_FOUND);
    }

    return user.comparePassword(password);
  }

  /**
   * Delete user account (hard delete)
   */
  static async deleteAccount(userId: string | Types.ObjectId): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new BaseError('User not found', StatusCodes.NOT_FOUND);
    }

    const deletedUser = {
      username: user.username,
      email: user.email,
      id: user._id,
    };

    await User.findByIdAndDelete(userId);

    logger.info(`User account deleted: ${deletedUser.username}`, {
      userId: deletedUser.id,
      username: deletedUser.username,
      email: deletedUser.email,
    });
  }

  /**
   * Check if user exists by ID
   */
  static async userExists(userId: string | Types.ObjectId): Promise<boolean> {
    if (!Types.ObjectId.isValid(userId)) {
      return false;
    }

    const user = await User.findById(userId).select('_id');
    return !!user;
  }

  /**
   * Get users by IDs (for batch operations)
   */
  static async getUsersByIds(
    userIds: (string | Types.ObjectId)[],
    includePassword = false,
  ): Promise<IUser[]> {
    const validIds = userIds.filter(id => Types.ObjectId.isValid(id));

    const query = User.find({_id: {$in: validIds}});

    if (!includePassword) {
      query.select('-password');
    }

    return query.exec();
  }

  /**
   * Search users by username or name (for future chat features)
   */
  static async searchUsers(
    searchTerm: string,
    excludeUserId?: string | Types.ObjectId,
    limit = 10,
  ): Promise<PublicProfileType[]> {
    const searchRegex = new RegExp(searchTerm, 'i');

    const query: Record<string, unknown> = {
      $or: [{username: searchRegex}, {name: searchRegex}],
    };

    if (excludeUserId) {
      query._id = {$ne: excludeUserId};
    }

    const users = await User.find(query)
      .select('name username email createdAt')
      .limit(limit)
      .exec();

    return users.map(user => user.getPublicProfile());
  }
}
