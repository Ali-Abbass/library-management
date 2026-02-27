create table if not exists loan_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid,
  note text
);

create index if not exists loan_requests_status_idx on loan_requests (status);
create index if not exists loan_requests_user_id_idx on loan_requests (user_id);
create index if not exists loan_requests_book_id_idx on loan_requests (book_id);
