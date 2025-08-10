---
applyTo: '**'
---

Here is a Product Requirements Document (PRD) for the backend of a simple messenger application.

### Product Requirements Document (PRD)

**Product Name:** Simple Messenger App Backend
**Version:** 1.2
**Last Updated:** December 2024

---

### 1. Introduction

#### 1.1 Project Overview

This document defines the product and technical requirements for the backend of the Simple Messenger App. The primary goal of this backend is to support messaging capabilities—both one-to-one and group chats—that will be consumed by a mobile frontend developed in a later phase. The backend must be scalable, secure, and provide a clean RESTful API with comprehensive user authentication and profile management.

#### 1.2 Target Audience

- Backend and frontend developers
- Technical leads and architects
- Project managers and stakeholders

---

### 2. Goals and Objectives

#### 2.1 Business Goals

- Launch the core backend infrastructure for the messaging app.
- Support seamless text-based communication between users.
- Establish a solid foundation for future features.
- Allow users to delete their accounts while preserving chat history for other participants.
- Provide comprehensive user authentication and profile management.

#### 2.2 Technical Goals

- Build with TypeScript and Express for maintainability.
- Use MongoDB with Mongoose for data modeling.
- Implement JWT-based authentication with refresh token support.
- Ensure secure, fast, and reliable data access.
- Implement secure password reset functionality.

---

### 3. Scope

#### 3.1 In Scope

- **User Authentication and Security:**
  - User registration and login
  - JWT access and refresh token management
  - Secure logout functionality
  - Password reset via email
  - Password update functionality
- **User Profile Management:**
  - Profile information retrieval
  - Profile updates (name, username)
  - User account deletion with hard delete functionality
- **Chat Features:**
  - One-to-one chat support
  - Group chat (one-to-many) support
  - Chat deletion and cleanup for empty chats
- **Technical Infrastructure:**
  - REST API with request/response validation
  - Message storage and history retrieval
  - Logging with Winston
  - Config management with dotenv

#### 3.2 Out of Scope

- Mobile client development
- Media/file sharing
- Push notifications
- Real-time chat (websocket or socket.io)
- Typing indicators, read receipts, user status
- End-to-end encryption
- User blocking or reporting features
- Email service implementation (assume external service)

---

### 4. Functional Requirements

#### 4.1 User Authentication

- **FR-4.1.1**: Users can register using email, username, name, and password.
- **FR-4.1.2**: Users can log in with email/username and password, receiving access and refresh tokens.
- **FR-4.1.3**: Users can refresh their access token using a valid refresh token.
- **FR-4.1.4**: Users can log out, invalidating their refresh token.
- **FR-4.1.5**: Users can request password reset via email.
- **FR-4.1.6**: Users can reset password using a secure token.
- **FR-4.1.7**: Users can update their password when authenticated.

#### 4.2 User Profile Management

- **FR-4.2.1**: Users can fetch their own complete profile information.
- **FR-4.2.2**: Users can fetch other users' public profiles (limited information).
- **FR-4.2.3**: Users can update their profile information (name, username).
- **FR-4.2.4**: Users can delete their own account (hard delete).
- **FR-4.2.5**: Deleted users appear as "Deleted User" in chat history.
- **FR-4.2.6**: Deleted users cannot log in or perform any actions.
- **FR-4.2.7**: Username must be unique across the platform.

#### 4.3 One-to-One Chats

- **FR-4.3.1**: Authenticated users can start a 1-to-1 chat.
- **FR-4.3.2**: If a chat already exists between two users, it is reused.
- **FR-4.3.3**: Messages are stored in chronological order.
- **FR-4.3.4**: Message history can be retrieved.
- **FR-4.3.5**: Users cannot send messages to deleted users in 1-to-1 chats.
- **FR-4.3.6**: Users can delete a 1-to-1 chat from their side.
- **FR-4.3.7**: A 1-to-1 chat is permanently deleted when both users delete it OR one user is deleted and the other deletes the chat.

#### 4.4 Group Chats

- **FR-4.4.1**: Users can create a group chat with a name and members.
- **FR-4.4.2**: Group creators become admins.
- **FR-4.4.3**: Admins can add/remove users.
- **FR-4.4.4**: Members can send messages.
- **FR-4.4.5**: Members can fetch group chat history.
- **FR-4.4.6**: Deleted users remain in group chat history but cannot send messages.
- **FR-4.4.7**: Other participants can continue messaging in groups with deleted users.
- **FR-4.4.8**: Users can leave group chats.
- **FR-4.4.9**: Group chats are permanently deleted when all participants have left or been deleted.

---

### 5. Non-Functional Requirements

#### 5.1 Performance

- **NFR-5.1.1**: API responses should be under 500ms in normal conditions.
- **NFR-5.1.2**: Token refresh should be under 200ms.

#### 5.2 Scalability

- **NFR-5.2.1**: Database schemas and indexes must be designed for future scale.

#### 5.3 Security

- **NFR-5.3.1**: Passwords must be hashed using bcrypt with minimum 12 rounds.
- **NFR-5.3.2**: JWT-based route protection with access and refresh tokens.
- **NFR-5.3.3**: Refresh tokens must be stored securely and be revokable.
- **NFR-5.3.4**: Password reset tokens must expire within 1 hour.
- **NFR-5.3.5**: Rate limiting on authentication endpoints.
- **NFR-5.3.6**: Users must not access data for chats they aren't part of.
- **NFR-5.3.7**: Deleted users cannot authenticate or access any resources.

#### 5.4 Maintainability

- **NFR-5.4.1**: Use TypeScript with interfaces and types.
- **NFR-5.4.2**: Use dotenv for environment variables.
- **NFR-5.4.3**: Winston for structured logging.
- **NFR-5.4.4**: Modular folder structure with services/controllers/models.

---

### 6. System Architecture

- **Tech Stack:** Node.js, Express, TypeScript, MongoDB, Mongoose, Winston, Dotenv
- **Auth:** JWT access tokens (15 min) + refresh tokens (7 days) with role-based access
- **Database Models:** Users, Chats, Messages, RefreshTokens, PasswordResetTokens
- **API Type:** RESTful JSON API
- **Deletion Strategy:** Hard delete for users, hard delete for empty chats

---

### 7. API Endpoints

#### 7.1 Authentication

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login and receive access + refresh tokens
- `POST /api/auth/refresh`: Refresh access token using refresh token
- `POST /api/auth/logout`: Logout and invalidate refresh token
- `POST /api/auth/forgot-password`: Request password reset email
- `POST /api/auth/reset-password`: Reset password using token
- `PUT /api/auth/update-password`: Update password (authenticated)

#### 7.2 User Profile

- `GET /api/users/me`: Get authenticated user's complete profile
- `PUT /api/users/me`: Update authenticated user's profile
- `GET /api/users/:id`: Get another user's public profile
- `DELETE /api/users/me`: Delete own account (hard delete)

#### 7.3 Chats

- `POST /api/chats/one-to-one`: Create or retrieve 1:1 chat
- `POST /api/chats/groups`: Create a new group chat
- `POST /api/chats/groups/:id/members`: Add members to group chat
- `DELETE /api/chats/groups/:id/members/:userId`: Remove member from group
- `DELETE /api/chats/:id`: Delete chat from user's perspective
- `POST /api/chats/groups/:id/leave`: Leave group chat

#### 7.4 Messages

- `POST /api/chats/:id/messages`: Send a message
- `GET /api/chats/:id/messages`: Fetch chat history

---

### 8. Data Models

#### 8.1 User

```ts
{
  _id: ObjectId,
  username: string, // unique
  name: string,
  email: string, // unique
  password: string, // hashed
  role: 'user' | 'admin',
  isActive: boolean,
  lastSeen?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### 8.2 RefreshToken

```ts
{
  _id: ObjectId,
  userId: ObjectId,
  token: string, // hashed
  expiresAt: Date,
  isRevoked: boolean,
  createdAt: Date
}
```

#### 8.3 PasswordResetToken

```ts
{
  _id: ObjectId,
  userId: ObjectId,
  token: string, // hashed
  expiresAt: Date,
  isUsed: boolean,
  createdAt: Date
}
```

#### 8.4 Chat

```ts
{
  _id: ObjectId,
  isGroup: boolean,
  groupName?: string,
  participants: ObjectId[], // User IDs, may reference deleted users
  admins?: ObjectId[], // User IDs, may reference deleted users
  createdBy: ObjectId, // User ID, may reference deleted user
  deletedBy?: ObjectId[], // Users who deleted this chat from their side
  createdAt: Date,
  updatedAt: Date
}
```

#### 8.5 Message

```ts
{
  _id: ObjectId,
  chatId: ObjectId,
  sender: ObjectId, // User ID, may reference deleted user
  content: string,
  createdAt: Date
}
```

---

### 9. Authentication Flow

#### 9.1 Registration/Login Flow

1. User registers/logs in with credentials
2. Server validates credentials and creates user session
3. Server generates access token (15 min expiry) and refresh token (7 days expiry)
4. Refresh token is stored in database (hashed)
5. Both tokens are returned to client

#### 9.2 Token Refresh Flow

1. Client sends refresh token when access token expires
2. Server validates refresh token exists and is not expired/revoked
3. Server generates new access token
4. Optionally rotate refresh token for enhanced security

#### 9.3 Logout Flow

1. Client sends logout request with refresh token
2. Server marks refresh token as revoked
3. Client discards both tokens

#### 9.4 Password Reset Flow

1. User requests password reset with email
2. Server generates secure token and sends reset email
3. User clicks link and provides new password with token
4. Server validates token and updates password
5. All refresh tokens for user are revoked

---

### 10. Business Rules for Deletion

#### 10.1 User Deletion

- When a user deletes their account, the user document is permanently removed from the database (hard delete)
- This allows the same email to be used for new registrations by different people
- User IDs remain in chats, messages, and other references
- When displaying user information for deleted users, show "Deleted User" as the name
- Deleted users cannot log in or perform any actions (they don't exist in the database)

#### 10.2 Chat Deletion

- **One-to-One Chats:**
  - Users can delete chats from their perspective (add user ID to `deletedBy` array)
  - Chat is permanently deleted when both users delete it OR one user is deleted and the other deletes it
- **Group Chats:**
  - Users can leave group chats (remove from `participants` array)
  - When users are deleted, they remain in chat references but cannot send messages
  - Group chat is permanently deleted when all participants have left or been deleted

#### 10.3 Message and User Reference Handling

- When a user is deleted, their ObjectId references remain in:
  - Chat participants and admins arrays
  - Message sender fields
  - Chat createdBy fields
- Frontend should handle missing users by displaying "Deleted User"
- Backend should provide helper methods to identify when a user reference points to a deleted user

---

### 11. Security Considerations

#### 11.1 Token Security

- Access tokens are short-lived (15 minutes) to minimize exposure
- Refresh tokens are long-lived (7 days) but stored securely and revokable
- Password reset tokens expire in 1 hour
- All tokens are cryptographically secure and unpredictable

#### 11.2 Password Security

- Passwords must meet minimum complexity requirements
- Password history prevents reuse of recent passwords
- Account lockout after failed login attempts

#### 11.3 Data Validation

- All input validated and sanitized
- Email format validation
- Username format validation (alphanumeric + underscore/dash)
- Password strength validation

---

### 12. Acceptance Criteria

- All authentication endpoints function as described
- Token refresh mechanism works reliably
- Password reset flow is secure and functional
- Profile update validation works correctly
- All business rules (chat reuse, group admin control, user deletion) enforced
- API protected by authentication middleware
- Deleted users cannot authenticate or access resources
- Chat cleanup works correctly for empty chats
- Logging enabled for all request/response cycles
- Unit tests for critical paths (auth flows, chat, message creation, user deletion)
- All sensitive data handled via env variables
- Rate limiting prevents abuse of authentication endpoints

---

### 13. Future Roadmap (Out of Scope Now)

- WebSocket/Socket.IO support for real-time
- Media message support (image, video)
- User status tracking (online/offline)
- Push notifications
- Chat search, user mentions
- Admin chat tools (ban user, mute user)
- Message editing/deletion
