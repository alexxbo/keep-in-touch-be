import {z} from 'zod';

// --- Reusable Zod Primitives for Fields ---

export const usernameSchema = z
  .string()
  .trim()
  .min(3, {message: 'Username must be at least 3 characters long'})
  .max(30, {message: 'Username cannot exceed 30 characters'})
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username can only contain letters, numbers, and underscores',
  );

export const nameSchema = z
  .string()
  .trim()
  .min(1, {message: 'Name is required'})
  .max(50, {message: 'Name cannot exceed 50 characters'});

export const emailSchema = z
  .email('Please fill a valid email address')
  .trim()
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(6, {message: 'Password must be at least 6 characters long'})
  .max(128, {message: 'Password cannot exceed 128 characters'});

export const roleSchema = z.enum(['user', 'admin']).default('user');

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');
