-- profiles: auth.users 1:1 매핑

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  is_anonymous boolean not null default true,
  provider text not null default 'ANONYMOUS'
    check (provider in ('ANONYMOUS', 'EMAIL', 'GOOGLE', 'APPLE')),
  main_portfolio_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_main_portfolio_id_idx on public.profiles(main_portfolio_id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- auth.users insert 시 profiles row 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, nickname, is_anonymous, provider)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nickname', null),
    coalesce(new.is_anonymous, false),
    case
      when coalesce(new.is_anonymous, false) then 'ANONYMOUS'
      when new.raw_app_meta_data ->> 'provider' = 'google' then 'GOOGLE'
      when new.raw_app_meta_data ->> 'provider' = 'apple' then 'APPLE'
      when new.email is not null then 'EMAIL'
      else 'ANONYMOUS'
    end
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS: 본인만 read/update
alter table public.profiles enable row level security;

create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
