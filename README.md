# Keep in Touch - Backend API

A secure and scalable messaging application backend built with Node.js, Express, TypeScript, and MongoDB.

## 🚀 Features

- **User Authentication & Security**
  - JWT-based authentication with access and refresh tokens
  - Secure password hashing with bcrypt
  - Password reset functionality via email
  - Account deletion with hard delete strategy

- **User Profile Management**
  - Complete profile CRUD operations
  - Public and private profile views
  - Username uniqueness validation

- **Messaging System**
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
```

## 🏗 Architecture Overview

### Project Structure
```
src/
├── __tests__/           # Test files and helpers
├── controllers/         # Route handlers
├── middleware/          # Express middleware
├── models/             # Database models and schemas
│   ├── auth/           # Authentication schemas
│   └── user/           # User model and schemas
├── routes/             # API route definitions
│   └── v1/             # Version 1 API routes
├── utils/              # Utility functions
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
- Unit tests for controllers and services
- Integration tests for API endpoints
- Mock external dependencies
- Maintain high test coverage (>80%)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Known Issues & Limitations

- Real-time messaging not implemented (WebSocket support planned)
- Media/file sharing not supported in current version
- Push notifications not implemented
- User blocking/reporting features not available

## 🔮 Future Roadmap

- WebSocket integration for real-time messaging
- Media message support (images, videos, files)
- Push notification system
- User presence and typing indicators
- Message search functionality
- Admin moderation tools
- End-to-end encryption support

