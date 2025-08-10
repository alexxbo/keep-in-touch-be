import bcrypt from 'bcryptjs';
import {Document, model, Model, Schema} from 'mongoose';
import {logger} from '../../utils/logger';
import {
  CompleteProfileType,
  PublicProfileType,
  UserSummaryType,
} from './user.schemas';
import {passwordSchema, UserType} from './user.types';

// The combined interface for Mongoose methods, statics, and the Zod-inferred type
export interface IUser extends Omit<UserType, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateLastSeen(): Promise<void>;
  getPublicProfile(): PublicProfileType;
  getCompleteProfile(): CompleteProfileType;
  getUserSummary(): UserSummaryType;
}

export interface IUserModel extends Model<IUser> {
  findByUsernameOrEmail(identifier: string): Promise<IUser | null>;
  findActiveById(id: string): Promise<IUser | null>;
}

const userMongooseSchema = new Schema<IUser, IUserModel>(
  {
    // These Mongoose definitions ensure uniqueness, required status, and data type
    // The specific rules (min/max length, regex) are handled by Zod.
    username: {type: String, required: true, unique: true},
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true, lowercase: true},
    password: {type: String, required: true, select: false},
    role: {type: String, enum: ['user', 'admin'], default: 'user'},
    lastSeen: {type: Date, default: Date.now},
  },
  {
    timestamps: true,
  },
);

// Indexes for performance
userMongooseSchema.index({email: 1});
userMongooseSchema.index({username: 1});
userMongooseSchema.index({lastSeen: -1});
userMongooseSchema.index({isActive: 1});

userMongooseSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // Use Zod's minlength validation from user.types.ts
  const minLength = passwordSchema.minLength;
  if (minLength === null) {
    const err = new Error('Password schema does not define a minimum length');
    return next(err);
  }

  if (this.password.length < minLength) {
    const err = new Error(
      `Password must be at least ${minLength} characters long`,
    );
    return next(err);
  }

  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error('Password hashing failed'));
  }
});

userMongooseSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  try {
    const user = await this.model('User')
      .findOne({_id: this._id})
      .select('+password');
    if (!user || !user.password) return false;
    return await bcrypt.compare(candidatePassword, user.password);
  } catch (error) {
    logger.warning('Password comparison failed:', error);
    return false;
  }
};

userMongooseSchema.methods.updateLastSeen = async function (): Promise<void> {
  this.lastSeen = new Date();
  await this.save();
};

userMongooseSchema.methods.getPublicProfile = function (): PublicProfileType {
  return {
    id: this._id.toString(),
    username: this.username,
    name: this.name,
    email: this.email,
    role: this.role,
    lastSeen: this.lastSeen,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

userMongooseSchema.methods.getCompleteProfile =
  function (): CompleteProfileType {
    return this.getPublicProfile();
  };

userMongooseSchema.methods.getUserSummary = function (): UserSummaryType {
  return {
    id: this._id.toString(),
    username: this.username,
    name: this.name,
  };
};

userMongooseSchema.statics.findByUsernameOrEmail = function (
  identifier: string,
): Promise<IUser | null> {
  return this.findOne({
    $or: [
      {username: identifier.trim()},
      {email: identifier.trim().toLowerCase()},
    ],
    isActive: true, // Only find active users
  });
};

const User = model<IUser, IUserModel>('User', userMongooseSchema);

export default User;
