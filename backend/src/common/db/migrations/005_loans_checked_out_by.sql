alter table if exists loans
  add column if not exists checked_out_by uuid;

create index if not exists loans_checked_out_by_idx on loans (checked_out_by);
