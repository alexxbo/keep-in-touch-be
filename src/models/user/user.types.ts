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

// --- Core Database Schema and Types ---

// Zod schema for a User document as it exists in the database.
// This is our single source of truth for the core data model.
export const userDatabaseSchema = z.object({
  _id: objectIdSchema,
  username: usernameSchema,
  name: nameSchema,
  email: emailSchema,
  // The database stores the HASHED password.
  password: z
    .string()
    .length(60, {message: 'Hashed password must be 60 characters long'}), // bcrypt hash length
  role: roleSchema,
  lastSeen: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Infer the TypeScript type for the full database document
export type UserType = z.infer<typeof userDatabaseSchema>;

// Schema for user creation (before hashing password)
export const userCreationSchema = userDatabaseSchema
  .omit({
    _id: true,
    password: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    password: passwordSchema, // Plain password before hashing
  });

export type UserCreationType = z.infer<typeof userCreationSchema>;
