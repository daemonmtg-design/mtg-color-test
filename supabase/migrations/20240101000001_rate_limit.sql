create table public.rate_limits (
  ip_hash text primary key,
  count int not null default 1,
  expires_at timestamptz not null
);

alter table public.rate_limits enable row level security;

-- clear old records function
create or replace function public.clear_old_rate_limits()
returns void as $$
begin
  delete from public.rate_limits where expires_at < now();
end;
$$ language plpgsql;

create or replace function public.increment_rate_limit(p_hash text, p_expires_at timestamptz)
returns int as $$
declare
  v_count int;
begin
  insert into public.rate_limits (ip_hash, count, expires_at)
  values (p_hash, 1, p_expires_at)
  on conflict (ip_hash) do update
  set count = rate_limits.count + 1
  returning count into v_count;
  
  return v_count;
end;
$$ language plpgsql;
