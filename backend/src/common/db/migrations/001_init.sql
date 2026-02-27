create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key,
  full_name text not null,
  email text not null unique,
  roles text[] not null default '{patron}',
  status text not null default 'pending_approval',
  created_at timestamptz not null default now()
);

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  authors text[] not null default '{}',
  description text,
  tags text[] default '{}',
  genres text[] default '{}',
  language text,
  identifiers text[] default '{}',
  publication_date date,
  page_count int,
  cover_image_url text,
  metadata jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists copies (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  barcode text,
  location text,
  status text not null default 'available',
  condition text,
  created_at timestamptz not null default now()
);

create table if not exists loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  copy_id uuid not null references copies(id) on delete restrict,
  status text not null default 'active',
  checked_out_at timestamptz not null default now(),
  due_at timestamptz not null,
  returned_at timestamptz
);

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  loan_id uuid not null references loans(id) on delete cascade,
  type text not null,
  status text not null,
  channel text not null default 'in_app',
  sent_at timestamptz not null default now()
);

create table if not exists activity (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  occurred_at timestamptz not null default now(),
  metadata jsonb
);

create index if not exists books_authors_idx on books using gin (authors);
create index if not exists books_tags_idx on books using gin (tags);
create index if not exists books_genres_idx on books using gin (genres);
create index if not exists copies_book_id_idx on copies (book_id);
create index if not exists loans_user_id_idx on loans (user_id);
create index if not exists loans_copy_id_idx on loans (copy_id);
create index if not exists alerts_user_id_idx on alerts (user_id);
