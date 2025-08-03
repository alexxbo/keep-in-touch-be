import bcrypt from 'bcryptjs';
import {Document, model, Model, Schema} from 'mongoose';

export interface IUser extends Document {
  username: string;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateLastSeen(): void;
  getPublicProfile(): {
    id: string;
    username: string;
    name: string;
    email: string;
    role: string;
    lastSeen?: Date;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface IUserModel extends Model<IUser> {
  findByUsernameOrEmail(identifier: string): Promise<IUser | null>;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [
        /^[a-zA-Z0-9_]+$/,
        'Username can only contain letters, numbers, and underscores',
      ],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please fill a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.updateLastSeen = function (): void {
  this.lastSeen = new Date();
};

UserSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    username: this.username,
    name: this.name,
    email: this.email,
    role: this.role,
    lastSeen: this.lastSeen,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

UserSchema.statics.findByUsernameOrEmail = function (identifier: string) {
  return this.findOne({
    $or: [{username: identifier}, {email: identifier}],
  });
};

const User = model<IUser, IUserModel>('User', UserSchema);

export default User;
