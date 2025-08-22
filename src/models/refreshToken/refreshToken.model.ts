import bcrypt from 'bcryptjs';
import {Document, model, Schema, Types} from 'mongoose';

export interface IRefreshToken extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  token: string;
  deviceInfo?: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;

  compareToken(token: string): Promise<boolean>;
  revoke(): Promise<void>;
  isExpired(): boolean;
  isValid(): boolean;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    deviceInfo: {
      type: String,
      maxlength: 255,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

refreshTokenSchema.index({userId: 1, isRevoked: 1});
refreshTokenSchema.index({expiresAt: 1}, {expireAfterSeconds: 0});

refreshTokenSchema.pre('save', async function (next) {
  if (!this.isModified('token')) {
    return next();
  }

  try {
    const saltRounds = 12;
    this.token = await bcrypt.hash(this.token, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

refreshTokenSchema.methods.compareToken = async function (
  token: string,
): Promise<boolean> {
  return bcrypt.compare(token, this.token);
};

refreshTokenSchema.methods.revoke = async function (): Promise<void> {
  this.isRevoked = true;
  await this.save();
};

refreshTokenSchema.methods.isExpired = function (): boolean {
  return new Date() > this.expiresAt;
};

refreshTokenSchema.methods.isValid = function (): boolean {
  return !this.isRevoked && !this.isExpired();
};

const RefreshToken = model<IRefreshToken>('RefreshToken', refreshTokenSchema);

export default RefreshToken;
