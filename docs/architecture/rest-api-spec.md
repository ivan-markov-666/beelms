# REST API Specifications

## Overview

QA-4-Free uses a microservices architecture with standardized REST API interfaces for both internal service communication and external access. This document provides detailed specifications for all API endpoints across the system's microservices.

## API Design Principles

1. **REST Compliance** - All APIs follow REST principles with appropriate HTTP methods
2. **JSON Format** - All request/response payloads use JSON format with UTF-8 encoding
3. **Versioning** - All public endpoints are prefixed with `/api/v{n}` (e.g., `/api/v1`)
4. **Authentication** - JWT-based authentication with Bearer token in Authorization header
5. **Idempotency** - All mutating operations (POST/PUT) are designed to be idempotent
6. **Error Handling** - Consistent error response format
7. **Documentation** - All endpoints are documented with OpenAPI/Swagger

## Common API Contract

### Headers

| Header | Description | Required |
|--------|-------------|----------|
| `Content-Type` | `application/json` | Yes |
| `Authorization` | `Bearer <token>` for authenticated requests | For protected endpoints |
| `X-Request-Id` | Unique request identifier (UUID format) | Recommended |
| `Accept-Language` | Client locale preference (e.g., `en-US`, `bg-BG`) | No |

### Request Parameters

- **Query parameters**: Use for filtering, pagination, and sorting
  - Pagination: `page` (1-based) and `limit` (max 100)
  - Sorting: `sort=field:direction` (e.g., `sort=createdAt:desc`)
  - Filtering: Named parameters for field filtering

- **Path parameters**: Use for resource identifiers (e.g., `/users/:id`)

### Response Formats

#### Success Response

```json
{
  "success": true,
  "data": {
    // Response payload
  },
  "meta": {
    // Optional metadata (pagination, etc.)
  }
}
```

#### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      // Optional detailed error information
    ]
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Authenticated but insufficient permissions |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `NOT_FOUND` | 404 | Requested resource not found |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate email) |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Microservices API Specifications

### 1. Auth Service

Base URL: `/api/v1/auth`

#### Authentication Endpoints

| Method | Path | Description | Request Body | Response | Status Codes |
|--------|------|-------------|-------------|----------|--------------|
| POST | `/register` | Register new user | `{ "email": "user@example.com", "password": "Passw0rd!" }` | `{ "accessToken": "...", "refreshToken": "..." }` | 201, 400, 409 |
| POST | `/login` | User login | `{ "email": "user@example.com", "password": "Passw0rd!" }` | `{ "accessToken": "...", "refreshToken": "..." }` | 200, 400, 401 |
| POST | `/refresh` | Refresh access token | `{ "refreshToken": "..." }` | `{ "accessToken": "...", "refreshToken": "..." }` | 200, 400, 401 |
| POST | `/logout` | Invalidate session | - | `{ "message": "Logged out successfully" }` | 200, 401 |

#### Password Management

| Method | Path | Description | Request Body | Response | Status Codes |
|--------|------|-------------|-------------|----------|--------------|
| POST | `/forgot-password` | Request password reset | `{ "email": "user@example.com" }` | - | 204, 400 |
| POST | `/reset-password` | Reset password with token | `{ "token": "...", "password": "NewPass1!" }` | - | 204, 400, 401 |

#### Email Verification

| Method | Path | Description | Request Body | Response | Status Codes |
|--------|------|-------------|-------------|----------|--------------|
| GET | `/verify-email` | Verify email with token | Query param: `token` | `{ "message": "Email verified" }` | 200, 400, 401 |

### 2. User Service

Base URL: `/api/v1/users`

#### User Profile

| Method | Path | Scope | Description | Request Body | Response | Status Codes |
|--------|------|-------|-------------|-------------|----------|--------------|
| GET | `/profile` | USER | Get current user profile | - | User profile data | 200, 401 |
| PUT | `/profile` | USER | Update current user profile | Profile data | Updated profile | 200, 400, 401 |

#### User Management (Admin)

| Method | Path | Scope | Description | Request/Query | Response | Status Codes |
|--------|------|-------|-------------|--------------|----------|--------------|
| GET | `/` | ADMIN | List users | Query: `page`, `limit`, `search` | User list with pagination | 200, 401, 403 |
| GET | `/:id` | ADMIN | Get user by ID | Path param: `id` | User data | 200, 401, 403, 404 |
| PUT | `/:id` | ADMIN | Update user | Path param: `id`; Body: User data | Updated user | 200, 400, 401, 403, 404 |
| DELETE | `/:id` | ADMIN | Delete/deactivate user | Path param: `id` | - | 204, 401, 403, 404 |
| POST | `/:id/deactivate` | ADMIN | Deactivate account | Path param: `id` | - | 200, 401, 403, 404 |
| GET | `/:id/sessions` | ADMIN | List active sessions | Path param: `id` | Session list | 200, 401, 403, 404 |

### 3. Course Service

Base URL: `/api/v1/courses`

#### Course Management

| Method | Path | Scope | Description | Request/Query | Response | Status Codes |
|--------|------|-------|-------------|--------------|----------|--------------|
| GET | `/` | PUBLIC | List courses | Query: filters, pagination | Course list with pagination | 200 |
| POST | `/` | ADMIN | Create course | Course data | Created course | 201, 400, 401, 403 |
| GET | `/:id` | PUBLIC | Get course details | Path param: `id` | Course details | 200, 404 |
| PUT | `/:id` | ADMIN | Update course | Path param: `id`; Body: Course data | Updated course | 200, 400, 401, 403, 404 |
| DELETE | `/:id` | ADMIN | Delete course | Path param: `id` | - | 204, 401, 403, 404 |

#### Chapter Management

| Method | Path | Scope | Description | Request/Query | Response | Status Codes |
|--------|------|-------|-------------|--------------|----------|--------------|
| GET | `/:courseId/chapters` | PUBLIC | List chapters in course | Path param: `courseId` | Chapter list | 200, 404 |
| POST | `/:courseId/chapters` | ADMIN | Create chapter | Path param: `courseId`; Body: Chapter data | Created chapter | 201, 400, 401, 403, 404 |
| PUT | `/chapters/:id` | ADMIN | Update chapter | Path param: `id`; Body: Chapter data | Updated chapter | 200, 400, 401, 403, 404 |
| DELETE | `/chapters/:id` | ADMIN | Delete chapter | Path param: `id` | - | 204, 401, 403, 404 |

#### Content Management

| Method | Path | Scope | Description | Request/Query | Response | Status Codes |
|--------|------|-------|-------------|--------------|----------|--------------|
| GET | `/chapters/:chapterId/content` | PUBLIC | List content in chapter | Path param: `chapterId` | Content list | 200, 404 |
| POST | `/chapters/:chapterId/content` | ADMIN | Create content | Path param: `chapterId`; Body: Content data | Created content | 201, 400, 401, 403, 404 |
| PUT | `/content/:id` | ADMIN | Update content | Path param: `id`; Body: Content data | Updated content | 200, 400, 401, 403, 404 |
| DELETE | `/content/:id` | ADMIN | Delete content | Path param: `id` | - | 204, 401, 403, 404 |

#### Content Versioning

| Method | Path | Scope | Description | Request/Query | Response | Status Codes |
|--------|------|-------|-------------|--------------|----------|--------------|
| GET | `/content/:id/versions` | ADMIN | Get version history | Path param: `id` | Version history | 200, 401, 403, 404 |
| POST | `/content/:id/publish` | ADMIN | Publish version | Path param: `id`; Body: `{ "version": n }` | - | 200, 400, 401, 403, 404 |
| POST | `/content/:id/revert` | ADMIN | Revert to version | Path param: `id`; Body: `{ "version": n }` | - | 200, 400, 401, 403, 404 |

#### Progress Tracking

| Method | Path | Scope | Description | Request/Query | Response | Status Codes |
|--------|------|-------|-------------|--------------|----------|--------------|
| GET | `/users/:userId/progress` | USER/ADMIN | Get user progress | Path param: `userId` | Progress data | 200, 401, 403, 404 |
| POST | `/progress/update` | USER | Update progress | `{ "contentId": "...", "progress": 0.75 }` | Updated progress | 200, 400, 401 |
| POST | `/progress/complete` | USER | Mark content complete | `{ "contentId": "..." }` | - | 200, 400, 401, 404 |

### 4. Test Service

Base URL: `/api/v1/tests`

#### Test Management

| Method | Path | Scope | Description | Request/Query | Response | Status Codes |
|--------|------|-------|-------------|--------------|----------|--------------|
| GET | `/chapter/:chapterId` | PUBLIC | List tests in chapter | Path param: `chapterId` | Test list | 200, 404 |
| GET | `/:id` | PUBLIC | Get test details | Path param: `id` | Test details | 200, 404 |
| POST | `/` | ADMIN | Create test | Test data | Created test | 201, 400, 401, 403 |
| PUT | `/:id` | ADMIN | Update test | Path param: `id`; Body: Test data | Updated test | 200, 400, 401, 403, 404 |
| DELETE | `/:id` | ADMIN | Delete test | Path param: `id` | - | 204, 401, 403, 404 |

#### Question Management

| Method | Path | Scope | Description | Request/Query | Response | Status Codes |
|--------|------|-------|-------------|--------------|----------|--------------|
| GET | `/:testId/questions` | PUBLIC | List questions in test | Path param: `testId` | Question list | 200, 404 |
| POST | `/:testId/questions` | ADMIN | Create question | Path param: `testId`; Body: Question data | Created question | 201, 400, 401, 403, 404 |
| PUT | `/questions/:id` | ADMIN | Update question | Path param: `id`; Body: Question data | Updated question | 200, 400, 401, 403, 404 |
| DELETE | `/questions/:id` | ADMIN | Delete question | Path param: `id` | - | 204, 401, 403, 404 |

#### Test Attempts

| Method | Path | Scope | Description | Request/Query | Response | Status Codes |
|--------|------|-------|-------------|--------------|----------|--------------|
| POST | `/:id/start` | USER | Start test attempt | Path param: `id` | Test attempt data | 201, 400, 401, 404 |
| POST | `/attempts/:attemptId/answer` | USER | Submit answer | Path param: `attemptId`; Body: Answer data | Answer result | 200, 400, 401, 404 |
| POST | `/attempts/:attemptId/complete` | USER | Complete test attempt | Path param: `attemptId` | - | 200, 400, 401, 404 |
| GET | `/attempts/:attemptId/results` | USER | Get attempt results | Path param: `attemptId` | Results data | 200, 401, 404 |
| GET | `/users/:userId/test-history` | USER/ADMIN | Get user test history | Path param: `userId` | Test history | 200, 401, 403, 404 |

### 5. Analytics Service

Base URL: `/api/v1/analytics`

#### User Analytics

| Method | Path | Scope | Description | Request/Query | Response | Status Codes |
|--------|------|-------|-------------|--------------|----------|--------------|
| GET | `/user/:userId/progress` | USER/ADMIN | Get user progress analytics | Path param: `userId` | Progress analytics | 200, 401, 403, 404 |
| GET | `/user/:userId/activity` | USER/ADMIN | Get user activity timeline | Path param: `userId` | Activity data | 200, 401, 403, 404 |

#### Content Analytics

| Method | Path | Scope | Description | Request/Query | Response | Status Codes |
|--------|------|-------|-------------|--------------|----------|--------------|
| GET | `/test/:testId/statistics` | ADMIN | Get test statistics | Path param: `testId` | Test statistics | 200, 401, 403, 404 |
| GET | `/course/:courseId/completion` | ADMIN | Get course completion rates | Path param: `courseId` | Completion data | 200, 401, 403, 404 |
| GET | `/content/:contentId/engagement` | ADMIN | Get content engagement | Path param: `contentId` | Engagement data | 200, 401, 403, 404 |

#### Admin Analytics

| Method | Path | Scope | Description | Request/Query | Response | Status Codes |
|--------|------|-------|-------------|--------------|----------|--------------|
| GET | `/dashboard` | ADMIN | Get admin dashboard data | Query: time range | Dashboard data | 200, 401, 403 |
| POST | `/export` | ADMIN | Export analytics data | Export configuration | File or download URL | 200, 400, 401, 403 |

### 6. Ads Service

Base URL: `/api/v1/ads`

#### Public Ad Endpoints

| Method | Path | Scope | Description | Request/Query | Response | Status Codes |
|--------|------|-------|-------------|--------------|----------|--------------|
| GET | `/serve` | PUBLIC | Get targeted ad | Query: targeting params | Ad data | 200 |
| POST | `/view` | PUBLIC | Record ad impression | `{ "adId": "..." }` | - | 200, 400 |
| POST | `/click` | PUBLIC | Record ad click | `{ "adId": "...", "redirectUrl": "..." }` | - | 200, 400 |

#### Ad Management

| Method | Path | Scope | Description | Request/Query | Response | Status Codes |
|--------|------|-------|-------------|--------------|----------|--------------|
| GET | `/` | ADMIN | List all ads | Query: filters, pagination | Ad list | 200, 401, 403 |
| POST | `/` | ADMIN | Create new ad | Ad data | Created ad | 201, 400, 401, 403 |
| PUT | `/:id` | ADMIN | Update ad | Path param: `id`; Body: Ad data | Updated ad | 200, 400, 401, 403, 404 |
| DELETE | `/:id` | ADMIN | Delete ad | Path param: `id` | - | 204, 401, 403, 404 |
| GET | `/:id/statistics` | ADMIN | Get ad performance stats | Path param: `id` | Statistics data | 200, 401, 403, 404 |

## Data Models and Format

### Common Models

#### User

```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "role": "student",
  "status": "active",
  "createdAt": "2025-01-01T12:00:00Z",
  "updatedAt": "2025-01-02T12:00:00Z"
}
```

#### UserProfile

```json
{
  "userId": "uuid-string",
  "firstName": "John",
  "lastName": "Doe",
  "displayName": "Johnny",
  "avatar": "https://example.com/avatar.jpg",
  "preferences": { 
    "language": "bg",
    "theme": "dark"
  }
}
```

#### Course

```json
{
  "id": "uuid-string",
  "title": "Course Title",
  "description": "Detailed description",
  "coverImage": "https://example.com/cover.jpg",
  "status": "published",
  "createdAt": "2025-01-01T12:00:00Z",
  "updatedAt": "2025-01-02T12:00:00Z",
  "chapters": [
    { /* Chapter data */ }
  ]
}
```

## Security Requirements

1. **Authentication** - JWT tokens required for protected endpoints
2. **Authorization** - Role-based access control (USER/ADMIN)
3. **Data Privacy** - Encryption of sensitive data using EncryptionService with ENCRYPTION_KEY
4. **Input Validation** - All input data validated using class-validator
5. **Rate Limiting** - Enforced on all endpoints to prevent abuse
6. **CORS** - Configured to allow only specific origins

## API Documentation

Each microservice provides Swagger UI documentation at `/api/v1/docs` endpoint:
- Auth Service: http://localhost:3000/api/v1/docs
- User Service: http://localhost:3001/api/v1/docs
- Course Service: http://localhost:3002/api/v1/docs
- Test Service: http://localhost:3003/api/v1/docs
- Analytics Service: http://localhost:3004/api/v1/docs
- Ads Service: http://localhost:3210/api

The OpenAPI specifications are also available in YAML/JSON format and are published as artifacts during CI builds.

## API Versioning Strategy

1. **URL Path Versioning** - `/api/v{n}` prefix for all endpoints
2. **Breaking Changes** - Require version increment (v1 → v2)
3. **Non-Breaking Changes** - Can be added to existing version
4. **Deprecation** - Older versions marked with `Deprecated` header
5. **Sunset** - End-of-life announced at least 6 months in advance

## Error Handling Guidelines

1. **Consistency** - All errors follow the standard error response format
2. **Specificity** - Error messages should be specific but not reveal implementation details
3. **Validation** - Field-level validation errors included in `details` array
4. **Logging** - All errors are logged with appropriate severity level
5. **Security** - Sensitive information never included in error responses
