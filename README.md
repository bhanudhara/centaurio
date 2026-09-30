# Taskwell

A task-planning workspace built with React, NestJS, and PostgreSQL.

## Features

- Kanban board with To do, In progress, and Done columns
- Create, edit, delete, and drag tasks between statuses
- Priority, due dates, search, and progress tracking
- PostgreSQL-backed REST API with request validation
- Browser storage fallback when the API is unavailable

## Run locally

Requirements: Node.js 20.19+ and Docker Compose.

1. Start PostgreSQL from the project root:

   ```sh
   docker compose up -d postgres
   ```

2. Copy the example environment files:

   ```sh
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. Start the API and frontend in separate terminals:

   ```sh
   npm --prefix backend run start:dev
   ```

   ```sh
   npm --prefix frontend run dev
   ```

4. Open http://localhost:5173. The API is available at http://localhost:3000/api/tasks.

The backend creates the task table automatically in development. For production, set `NODE_ENV=production` and use database migrations instead of TypeORM synchronization.