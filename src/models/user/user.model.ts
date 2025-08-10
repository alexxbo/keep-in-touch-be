import bcrypt from 'bcryptjs';
import {Document, model, Model, Schema} from 'mongoose';
import {PublicProfileType} from './user.schemas';
import {passwordSchema, UserType} from './user.types';

// The combined interface for Mongoose methods, statics, and the Zod-inferred type
export interface IUser extends UserType, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateLastSeen(): void;
  getPublicProfile(): PublicProfileType;
}

export interface IUserModel extends Model<IUser> {
  findByUsernameOrEmail(identifier: string): Promise<IUser | null>;
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

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userMongooseSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  const user = await this.model('User')
    .findOne({_id: this._id})
    .select('+password');
  if (!user) return false;
  return bcrypt.compare(candidatePassword, user.password);
};

userMongooseSchema.methods.updateLastSeen = function (): void {
  this.lastSeen = new Date();
};

userMongooseSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    username: this.username,
    name: this.name,
    email: this.email,
    role: this.role,
    lastSeen: this.lastSeen,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  } as PublicProfileType;
};

userMongooseSchema.statics.findByUsernameOrEmail = function (
  identifier: string,
) {
  return this.findOne({
    $or: [{username: identifier}, {email: identifier}],
  });
};

const User = model<IUser, IUserModel>('User', userMongooseSchema);

export default User;
