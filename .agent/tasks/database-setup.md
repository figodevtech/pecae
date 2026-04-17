# Task: Database Setup & Env Configuration

## Overview
Status: 🟡 In Progress
Priority: High
Agent: @backend-specialist

## Goals
- Set up local PostgreSQL using Docker.
- Configure environment variables for local dev and Supabase prod.
- Ensure Prisma is ready for migration.

## Implementation Plan
1. **Docker Setup**: Create `docker-compose.yml` in the root.
2. **Local Environment**: Create `apps/api/.env` (linked to development).
3. **Production Template**: Create `apps/api/.env.production.example`.
4. **Scripts**: Add `db:up`, `db:down`, and `prisma:generate` scripts to the root `package.json`.

## Progress
- [x] Docker Compose File
- [x] .env Files
- [x] Root package.json scripts
- [x] Schema validation
