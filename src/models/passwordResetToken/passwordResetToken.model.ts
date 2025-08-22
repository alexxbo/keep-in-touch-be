import bcrypt from 'bcryptjs';
import {Document, model, Schema, Types} from 'mongoose';

export interface IPasswordResetToken extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  token: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;

  compareToken(token: string): Promise<boolean>;
  markAsUsed(): Promise<void>;
  isExpired(): boolean;
  isValid(): boolean;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>(
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
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {createdAt: true, updatedAt: false},
    versionKey: false,
  },
);

passwordResetTokenSchema.index({expiresAt: 1}, {expireAfterSeconds: 0});
passwordResetTokenSchema.index({userId: 1, isUsed: 1});

passwordResetTokenSchema.pre('save', async function (next) {
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

passwordResetTokenSchema.methods.compareToken = async function (
  token: string,
): Promise<boolean> {
  return bcrypt.compare(token, this.token);
};

passwordResetTokenSchema.methods.markAsUsed = async function (): Promise<void> {
  this.isUsed = true;
  await this.save();
};

passwordResetTokenSchema.methods.isExpired = function (): boolean {
  return new Date() > this.expiresAt;
};

passwordResetTokenSchema.methods.isValid = function (): boolean {
  return !this.isUsed && !this.isExpired();
};

const PasswordResetToken = model<IPasswordResetToken>(
  'PasswordResetToken',
  passwordResetTokenSchema,
);

export default PasswordResetToken;
