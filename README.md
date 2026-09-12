# Agency Project Dashboard

A real-time project management dashboard for a small software agency. Built with a focus on clean architecture, strong authorization, and practical UX.

## Features

- Role-based access (Admin, Project Manager, Developer)
- Client management
- Project management
- Task management with status tracking
- Real-time activity updates via Socket.IO
- Real-time notifications
- Presence system (online users)
- Overdue task detection via scheduled job
- Task filtering by status, priority, and date range
- Role-specific dashboards

## Technology Stack

- **Frontend**: React, TypeScript, Vite, React Router, TanStack Query, Zustand, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, Socket.IO
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT access token + HttpOnly cookie refresh token
- **Validation**: Zod
- **Jobs**: node-cron

## Architecture

The project is organized as a simple monorepo:

```
project-root/
  apps/
    web/        # React frontend
    api/        # Express backend
  packages/
    shared/     # Shared TypeScript types
```

### Backend Structure

- **Controllers**: Handle HTTP requests, call services, return responses
- **Services**: Business logic, authorization-sensitive operations, database queries
- **Middleware**: Authentication, role authorization, validation, error handling
- **Routes**: API endpoint definitions
- **Sockets**: Socket.IO authentication, room management, real-time events
- **Jobs**: Scheduled background jobs (overdue task detection)
- **Validators**: Zod schemas for input validation

### Authorization Strategy

Authorization is enforced on the backend at multiple layers:

1. **Route-level**: `authenticate` and `authorize(...roles)` middleware
2. **Service-level**: Every service method verifies ownership and permissions
3. **Query-level**: Database queries filter by user/project before returning data

Key rules:
- Project Managers can only access projects they created
- Developers can only view and update tasks assigned to them
- Admin has full access
- Socket.IO room joining requires server-side permission verification

### Database Schema

- **User**: id, name, email, passwordHash, role, isOnline
- **Client**: id, name, email
- **Project**: id, name, description, clientId, createdById
- **Task**: id, title, description, projectId, assignedDeveloperId, status, priority, dueDate, isOverdue
- **ActivityLog**: id, projectId, taskId, userId, action, previousStatus, newStatus, createdAt
- **Notification**: id, userId, type, title, message, isRead, createdAt
- **RefreshToken**: id, token, userId, expiresAt, createdAt

### Indexing Decisions

- `User(email)` - Fast login lookups
- `User(role)` - Role-based queries
- `User(isOnline)` - Presence queries
- `Project(clientId)` - Client-project lookups
- `Project(createdById)` - Project manager queries
- `Task(projectId)` - Project task listing
- `Task(assignedDeveloperId)` - Developer task queries
- `Task(status)` - Status filtering
- `Task(priority)` - Priority filtering
- `Task(dueDate)` - Overdue detection
- `ActivityLog(projectId, createdAt)` - Activity feed queries
- `Notification(userId, isRead)` - Notification queries

### Real-time Architecture

Socket.IO events are filtered server-side:

- **Admin**: Receives all activity
- **Project Manager**: Receives activity from owned projects only
- **Developer**: Receives activity for assigned tasks only

Rooms:
- `project:{projectId}` - Project-specific events
- `user:{userId}` - User-specific notifications
- `admin` - Admin-only events

Users joining project rooms must be verified by the server before receiving events.

### Refresh Token Strategy

- Access tokens: Short-lived (15 minutes), stored in memory/Zustand
- Refresh tokens: Longer-lived (7 days), stored in HttpOnly cookie
- Refresh endpoint validates the token, issues new access token
- Logout clears the refresh token from database and cookie
- Access token refresh interceptor in frontend handles automatic refresh

### Background Jobs

Overdue task detection runs every hour via node-cron:
- Finds tasks where `dueDate < now` AND `status !== DONE` AND `isOverdue = false`
- Sets `isOverdue = true`
- Job is idempotent - already-flagged tasks are not modified

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker (optional, for database)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
# Option A: Use Docker
docker-compose up -d

# Option B: Use existing PostgreSQL
# Update DATABASE_URL in apps/api/.env
```

3. Run migrations:
```bash
cd apps/api
npx prisma migrate dev --name init
```

4. Seed the database:
```bash
cd apps/api
npx prisma db seed
```

5. Start the backend:
```bash
cd apps/api
npm run dev
```

6. Start the frontend (in a new terminal):
```bash
cd apps/web
npm run dev
```

7. Open http://localhost:5173

## Environment Variables

See `.env.example` for all required variables. Copy to `apps/api/.env` and update values.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_ACCESS_SECRET`: Secret for JWT access tokens
- `JWT_REFRESH_SECRET`: Secret for JWT refresh tokens
- `ACCESS_TOKEN_EXPIRY`: Access token TTL (default: 15m)
- `REFRESH_TOKEN_EXPIRY`: Refresh token TTL (default: 7d)
- `CLIENT_URL`: Frontend URL for CORS
- `PORT`: Backend port (default: 4000)

## Demo Credentials

- **Admin**: admin@agency.com / admin123
- **Project Manager**: manager1@agency.com / manager123
- **Developer**: dev1@agency.com / dev123

## Testing

Run tests with:
```bash
npm test
```

## Known Limitations

- Presence system tracks socket connections, not actual user activity
- Single-server Socket.IO (no horizontal scaling)
- No rate limiting on authentication endpoints
- Password reset flow not implemented
- File upload not implemented
- Email notifications not implemented
