# Library Management System

A full-stack library platform for discovery, circulation, operations, and analytics.

## Overview
This system supports the full lending lifecycle:
- Catalog management with copy-level inventory.
- Patron browsing and checkout requests.
- Staff/admin fulfillment and check-in workflows.
- Alerts and operational analytics.
- AI-assisted discovery and recommendation experiences.

The project is split into two apps:
- `backend/`: NestJS API + business logic + Supabase integration.
- `frontend/`: React + Vite client UI.

## Feature Outline
- Authentication and role-based access control.
- Book catalog CRUD and archive/restore.
- Copy management with unique copy codes (barcodes).
- Checkout tied to a specific copy.
- Check-in (return) by loan or copy.
- Patron checkout requests queue.
- Staff/admin request fulfillment workflows.
- Overdue alert processing.
- Analytics overview and CSV export.
- AI capabilities:
  - Semantic search and query refinement.
  - Similar books and reading-time insights.
  - Patron AI recommendations dashboard.

## User Roles and Use Cases
### Patron
- Browse/search books.
- View book details and AI insights.
- Submit checkout requests.
- Track personal loans and statuses.

### Staff
- View checkout requests.
- Fulfill requests by checking out a specific copy to a patron.
- Check in returned copies.
- View loans section for loans processed by staff account.

### Admin
- Full catalog administration (books and copies).
- Checkout/check-in operations.
- Manage users and roles.
- View all system loans.
- Access analytics and exports.

## Quick Demo (Role-Based Accounts)
Use the following accounts to demo the system with seeded data.
All demo accounts use the same password: `123456`.

| Role | Email | Password | Suggested Demo Focus |
|---|---|---|---|
| Admin | `avery.admin@example.com` | `123456` | Catalog management, users/roles, all loans, analytics |
| Staff | `sam.staff@example.com` | `123456` | Checkout requests, request fulfillment, check-in |
| Patron | `casey.reader@example.com` | `123456` | Search/browse, AI recommendations, checkout requests |

Suggested demo flow:
1. Sign in as **Patron** and submit checkout requests.
2. Sign in as **Staff** and fulfill those requests with specific copies.
3. Sign in as **Admin** and review catalog updates and analytics.

## Tech Stack
- Language: TypeScript.
- Backend: NestJS (Node.js LTS runtime).
- Frontend: React + Vite.
- Database/Auth/Storage: Supabase (Postgres + Auth).
- AI: Gemini API.
- Testing:
  - Backend: Jest + Supertest.
  - Frontend: Vitest.

## Integrations
- Supabase REST + Auth JWT validation.
- Gemini text generation for recommendation/ranking/search features.
- CSV export for analytics workflows.

## Architecture and Engineering Practices
The codebase follows core engineering principles and best practices:
- Separation of concerns: controllers, services, repositories, entities.
- Role-based authorization and guarded endpoints.
- Consistent API layering and typed contracts.
- Audit/event logging around critical workflows.
- Migration-based schema evolution.
- UI component modularity and reusable service clients.
- Loading/error states for API-driven actions.
- Readable IDs in UX where possible.

## Project Structure
```text
backend/
  src/
  test/
frontend/
  src/
  tests/
docs/
```

## Prerequisites
- Node.js 20+ and npm.
- Supabase project (URL, keys, JWT settings).
- Gemini API key.
- Docker (optional, for containerized run).

## Environment Setup
### Backend
1. Copy `backend/.env.example` to `backend/.env`.
2. Fill required variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWKS_URL`
   - `SUPABASE_JWT_ISSUER`
   - `SUPABASE_JWT_AUD`
   - `GEMINI_API_KEY`
3. Optional:
   - `AUTH_BYPASS` for local-only testing scenarios.

### Frontend
1. Copy `frontend/.env.example` to `frontend/.env`.
2. Set:
   - `VITE_API_BASE_URL` (default: `http://localhost:3000/api/v1`)
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Database Setup (Supabase)
Apply migrations in order from:
- `backend/src/common/db/migrations/001_init.sql`
- `backend/src/common/db/migrations/002_seed.sql`
- `backend/src/common/db/migrations/003_copy_code_unique.sql`
- `backend/src/common/db/migrations/004_loan_requests.sql`
- `backend/src/common/db/migrations/005_loans_checked_out_by.sql`

You can run them using Supabase SQL editor or your migration pipeline.

## Run Locally
### Backend
```bash
cd backend
npm install
npm run start:dev
```
API default: `http://localhost:3000/api/v1`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App default: `http://localhost:5173`

## Run Tests
### Backend
```bash
cd backend
npm test
npm run lint
```

### Frontend
```bash
cd frontend
npm test
npm run lint
```

## Docker
Dockerfiles are available for both apps.

### Backend
```bash
docker build -t library-backend ./backend
docker run --rm -p 3000:3000 --env-file ./backend/.env library-backend
```

### Frontend
```bash
docker build -t library-frontend ./frontend \
  --build-arg VITE_API_BASE_URL=http://localhost:3000/api/v1 \
  --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=your-anon-key
docker run --rm -p 8080:80 library-frontend
```
