# Quickstart

## Backend

1. Install dependencies in `backend/`.
2. Copy `backend/.env.example` to `backend/.env` and fill values.
   - Include `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWKS_URL`.
   - Optional: `SUPABASE_JWT_ISSUER`, `SUPABASE_JWT_AUD` for JWT validation.
3. Run `npm run start:dev`.

## Frontend

1. Install dependencies in `frontend/`.
2. Copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL`.
   - Set `VITE_API_BASE_URL=http://localhost:3000/api/v1`.
   - Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Run `npm run dev`.
