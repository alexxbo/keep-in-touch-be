import {z} from 'zod';

// In test environment, provide defaults to avoid validation errors
const isTestEnvironment = process.env.NODE_ENV === 'test';

const EnvSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().default(3000),

    // Database
    MONGODB_URI: z
      .url('MONGODB_URI must be a valid URL')
      .default(
        isTestEnvironment ? 'mongodb://localhost:27017/keep-in-touch-test' : '',
      ),

    // JWT Configuration
    ACCESS_TOKEN_SECRET: z
      .string()
      .min(32, 'ACCESS_TOKEN_SECRET must be at least 32 characters long')
      .default(
        isTestEnvironment
          ? 'test-jwt-secret-key-for-testing-only-with-sufficient-length'
          : '',
      ),
    REFRESH_TOKEN_SECRET: z
      .string()
      .min(32, 'REFRESH_TOKEN_SECRET must be at least 32 characters long')
      .default(
        isTestEnvironment
          ? 'test-jwt-refresh-secret-key-for-testing-only-with-sufficient-length'
          : '',
      ),
    JWT_ACCESS_EXPIRE: z.string().default('15m'),
    JWT_REFRESH_EXPIRE: z.string().default('7d'),

    // Email Configuration
    EMAIL_SERVICE: z.string().default('gmail'),
    EMAIL_HOST: z.string().optional(),
    EMAIL_PORT: z.coerce.number().optional(),
    EMAIL_USER: z.string().optional(),
    EMAIL_PASS: z.string().optional(),
    EMAIL_FROM: z.email().optional(),

    // Application Configuration
    APP_NAME: z.string().default('Keep in Touch'),
    SUPPORT_EMAIL: z.email().optional(),

    // Frontend Configuration
    FRONTEND_URL: z.url().default('http://localhost:3001'),
    ALLOWED_ORIGINS: z.string().optional(),

    // Logging
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
  })
  .superRefine((input, ctx) => {
    // Validate JWT secrets in production
    if (input.NODE_ENV === 'production') {
      if (input.ACCESS_TOKEN_SECRET.length < 64) {
        ctx.addIssue({
          code: 'invalid_type',
          expected: 'string',
          received: 'string',
          path: ['ACCESS_TOKEN_SECRET'],
          message:
            'ACCESS_TOKEN_SECRET must be at least 64 characters long in production',
        });
      }

      if (input.REFRESH_TOKEN_SECRET.length < 64) {
        ctx.addIssue({
          code: 'invalid_type',
          expected: 'string',
          received: 'string',
          path: ['REFRESH_TOKEN_SECRET'],
          message:
            'REFRESH_TOKEN_SECRET must be at least 64 characters long in production',
        });
      }
    }

    // Validate email configuration for production
    if (input.NODE_ENV === 'production') {
      const requiredEmailFields = [
        'EMAIL_HOST',
        'EMAIL_PORT',
        'EMAIL_USER',
        'EMAIL_PASS',
        'EMAIL_FROM',
      ];

      for (const field of requiredEmailFields) {
        if (!input[field as keyof typeof input]) {
          ctx.addIssue({
            code: 'invalid_type',
            expected: 'string',
            received: 'undefined',
            path: [field],
            message: `${field} must be set when NODE_ENV is 'production'`,
          });
        }
      }
    }

    // Validate MongoDB URI format for production
    if (
      input.NODE_ENV === 'production' &&
      !input.MONGODB_URI.includes('mongodb+srv://')
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['MONGODB_URI'],
        message:
          'Production MONGODB_URI should use mongodb+srv:// for Atlas connections',
      });
    }
  });

export type Env = z.infer<typeof EnvSchema>;

// Parse and validate environment variables
const {data: env, error} = EnvSchema.safeParse(process.env);

if (error) {
  console.error('❌ Invalid environment variables:');
  console.error(z.prettifyError(error));
  process.exit(1);
}

export default env!;
