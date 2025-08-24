# Keep in Touch - Backend API

![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue.svg)
![MongoDB](https://img.shields.io/badge/mongodb-5.0+-green.svg)
![Coverage](https://img.shields.io/badge/coverage-90.97%25-brightgreen.svg)
![Tests](https://img.shields.io/badge/tests-206_total_ALL_PASSING-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

A secure and scalable messaging application backend built with Node.js, Express, TypeScript, and MongoDB.

## 🚀 Features

- **User Authentication & Security**
  - JWT-based authentication with access and refresh tokens
  - Secure password hashing with bcrypt (12+ rounds)
  - Password reset functionality via email with time-limited tokens
  - Account deletion with hard delete strategy
  - Session management with token refresh workflow
  - Multiple active session support with device tracking

- **User Profile Management**
  - Complete profile CRUD operations
  - Public and private profile views
  - Username uniqueness validation
  - User search functionality
  - Account deletion preserving chat history

- **Messaging System** (Models ready, endpoints planned)
  - One-to-one private chats
  - Group chat functionality
  - Message history and retrieval
  - Smart chat cleanup for empty conversations

- **Security & Middleware**
  - Request validation with Zod schemas
  - Comprehensive error handling
  - HTTP logging with Winston
  - Rate limiting on authentication endpoints

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Logging**: Winston
- **Testing**: Jest
- **Password Hashing**: bcrypt
- **Email**: Nodemailer with EJS templates
- **Security**: Helmet, CORS, Rate limiting, Express Mongo Sanitize

## 📋 Prerequisites

- Node.js 18.x or higher
- MongoDB 5.x or higher
- npm or yarn package manager

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd keep-in-touch-be
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   NODE_ENV=development

   # Database
   MONGODB_URI=mongodb://localhost:27017/keep-in-touch

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key
   JWT_ACCESS_EXPIRE=15m
   JWT_REFRESH_EXPIRE=7d

   # Email Configuration (for password reset)
   EMAIL_SERVICE=your-email-service
   EMAIL_USER=your-email@example.com
   EMAIL_PASS=your-email-password
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Granular test commands
npm run test:auth                # All auth-related tests
npm run test:auth:controllers    # Auth controller tests only
npm run test:auth:services       # Auth service tests only
npm run test:users               # All user-related tests
npm run test:users:controllers   # User controller tests only
npm run test:users:services      # User service tests only
npm run test:controllers         # All controller tests
npm run test:services           # All service tests
npm run test:middleware         # All middleware tests
npm run test:utils              # All utility tests
npm run test:integration        # Integration tests
```

## 🏗 Architecture Overview

### Project Structure
```
src/
├── __tests__/           # Test files and helpers
│   ├── controllers/     # Controller unit tests
│   │   ├── authController/    # Auth controller tests
│   │   └── usersController/   # Users controller tests
│   ├── services/        # Service unit tests
│   ├── middleware/      # Middleware tests
│   └── utils/          # Utility tests
├── controllers/         # Route handlers
├── middleware/          # Express middleware
├── models/             # Database models and schemas
│   ├── auth/           # Authentication schemas
│   ├── user/           # User model and schemas
│   ├── refreshToken/   # Refresh token model
│   └── passwordResetToken/  # Password reset token model
├── routes/             # API route definitions
│   └── v1/             # Version 1 API routes
├── services/           # Business logic services
├── templates/          # Email templates
│   └── emails/         # Email template files
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── validation/         # Zod validation schemas
└── app.ts              # Express app configuration
```

### Data Models

#### User Model
- Stores user authentication and profile information
- Handles password hashing and validation
- Supports soft deletion strategy

#### Chat Model
- Manages both one-to-one and group conversations
- Tracks participants and admin roles
- Implements smart cleanup for empty chats

#### Message Model
- Stores chat messages with sender information
- Maintains chronological order
- Preserves history even after user deletion

#### RefreshToken Model
- Manages JWT refresh tokens
- Supports token revocation
- Automatic cleanup of expired tokens

#### PasswordResetToken Model
- Handles password reset workflow
- Time-limited token validity (1 hour)
- Single-use token enforcement

### Security Features

- **JWT Authentication**: Short-lived access tokens (15 min) with longer refresh tokens (7 days)
- **Password Security**: bcrypt hashing with 12+ rounds
- **Input Validation**: Comprehensive request validation using Zod schemas
- **Error Handling**: Centralized error handling with proper logging
- **Rate Limiting**: Protection against brute force attacks

## 🔒 Security Considerations

1. **Token Management**
   - Access tokens are short-lived to minimize exposure
   - Refresh tokens are stored securely and can be revoked
   - All tokens use cryptographically secure generation

2. **Password Security**
   - Minimum complexity requirements enforced
   - Secure hashing with bcrypt (12+ rounds)
   - Password reset tokens expire within 1 hour

3. **Data Validation**
   - All inputs are validated and sanitized
   - Type-safe validation with Zod schemas
   - SQL injection prevention through ODM usage

4. **Account Deletion**
   - Hard delete strategy allows email reuse
   - Preserves chat history for other participants
   - Deleted users appear as "Deleted User" in conversations

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login and receive access + refresh tokens
- `POST /api/v1/auth/refresh` - Refresh access token using refresh token
- `POST /api/v1/auth/logout` - Logout and invalidate refresh token
- `POST /api/v1/auth/forgot-password` - Request password reset email
- `POST /api/v1/auth/reset-password` - Reset password using token
- `PUT /api/v1/auth/update-password` - Update password (authenticated)

### User Profile Endpoints
- `GET /api/v1/users/me` - Get authenticated user's complete profile
- `PATCH /api/v1/users/me` - Update authenticated user's profile
- `GET /api/v1/users/:id` - Get another user's public profile
- `DELETE /api/v1/users/me` - Delete own account (hard delete)

### Session Management Endpoints
- `GET /api/v1/users/me/sessions` - Get user's active sessions
- `DELETE /api/v1/users/me/sessions/:tokenId` - Revoke specific session

### Planned Chat Endpoints (Models Ready)
- `POST /api/v1/chats/one-to-one` - Create or retrieve 1:1 chat
- `POST /api/v1/chats/groups` - Create a new group chat
- `POST /api/v1/chats/groups/:id/members` - Add members to group chat
- `DELETE /api/v1/chats/groups/:id/members/:userId` - Remove member from group
- `DELETE /api/v1/chats/:id` - Delete chat from user's perspective
- `POST /api/v1/chats/groups/:id/leave` - Leave group chat
- `POST /api/v1/chats/:id/messages` - Send a message
- `GET /api/v1/chats/:id/messages` - Fetch chat history

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are set in production:
- `NODE_ENV=production`
- `MONGODB_URI` (production database)
- `JWT_SECRET` (strong, unique secret)
- Email service configuration for password reset

### Production Considerations
- Use a reverse proxy (nginx) for SSL termination
- Implement proper logging and monitoring
- Set up database backups and replica sets
- Configure rate limiting and security headers
- Use environment-specific configuration

## 📝 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write comprehensive unit tests
- Use descriptive variable and function names

### Git Workflow
- Create feature branches from `main`
- Write meaningful commit messages
- Submit pull requests for code review
- Ensure all tests pass before merging

### Testing Strategy
- Unit tests for controllers and services (206 total tests)
- Integration tests for API endpoints
- Mock external dependencies
- Maintain high test coverage (>90%)
- Granular test script organization for efficient development
- Function-specific test files for better maintainability

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

**Author**: Alex Borovskoy

## 🐛 Known Issues & Limitations

- Real-time messaging not implemented (WebSocket support planned)
- Media/file sharing not supported in current version  
- Push notifications not implemented
- User blocking/reporting features not available
- Chat and message endpoints not yet implemented (models ready)

## 🔮 Future Roadmap

- **Chat System Implementation**: Complete chat and message endpoints (models ready)
- WebSocket integration for real-time messaging
- Media message support (images, videos, files)
- Push notification system
- User presence and typing indicators
- Message search functionality
- Admin moderation tools
- End-to-end encryption support

## 📊 Current Test Coverage

The project maintains high test coverage with comprehensive test suites:

- **Total Tests**: 206 (ALL PASSING ✅)
- **Statement Coverage**: 90.97%
- **Function Coverage**: 91.66%
- **Branch Coverage**: 75.6%
- **Line Coverage**: 90.8%

### Test Organization
- **Controllers**: 35 auth controller tests + 23 user controller tests (ALL PASSING)
- **Services**: Comprehensive service layer testing with mocking
- **Middleware**: Authentication, validation, and error handling tests
- **Utilities**: Email, logging, and helper function tests
- **Integration**: End-to-end workflow testing

