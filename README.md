# Team Task Manager API

A complete project management API with authentication, task tracking, and role-based access control.

## Features

✅ **Authentication** - Signup/Login with JWT  
✅ **Project Management** - Create and manage projects  
✅ **Task Tracking** - Create, assign, and track tasks  
✅ **Team Management** - Add team members with roles  
✅ **Role-Based Access** - Admin and Member roles  
✅ **Dashboard** - Overview of projects and tasks  

## Tech Stack

- **Runtime**: Bun
- **Framework**: Hono
- **Language**: TypeScript
- **Auth**: JWT + Bun password hashing

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login and get JWT token

### Projects
- `POST /projects` - Create project
- `GET /projects` - List user's projects
- `GET /projects/:id` - Get project details

### Tasks
- `POST /projects/:projectId/tasks` - Create task
- `GET /projects/:projectId/tasks` - List project tasks
- `PATCH /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

### Team
- `POST /projects/:projectId/members` - Add team member (Admin only)
- `GET /projects/:projectId/members` - List team members

### Dashboard
- `GET /dashboard` - Get user dashboard stats

### Health
- `GET /health` - Health check

## Setup

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Start production server
bun start
