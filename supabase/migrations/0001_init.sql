-- 따라가게 초기 스키마
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여 넣고 실행하면 된다.
-- 임계값은 src/lib/store/types.ts 의 VERIFY_THRESHOLD(3), FLAG_THRESHOLD(2) 와 맞춘다.

-- ── 아이돌 ────────────────────────────────────────────────
create table public.idols (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 30),
  group_name  text check (char_length(group_name) between 1 and 40),
  solo        boolean not null default false,
  agency      text check (char_length(agency) between 1 and 40),
  image_url   text check (image_url is null or image_url like 'https://%'),
  aliases     text[] not null default '{}',
  created_by  uuid default auth.uid() references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint idols_group_or_solo check (solo or group_name is not null)
);
-- 이름이 같아도 그룹이 다르면 다른 아이돌
create unique index idols_unique_name_group
  on public.idols (lower(replace(name, ' ', '')), solo, lower(replace(coalesce(group_name, ''), ' ', '')));

-- ── 성지 ──────────────────────────────────────────────────
create type public.spot_status as enum ('pending', 'verified', 'hidden');

create table public.spots (
  id            uuid primary key default gen_random_uuid(),
  idol_id       uuid not null references public.idols (id) on delete cascade,
  place_name    text not null check (char_length(place_name) between 2 and 50),
  location      text not null check (char_length(location) between 2 and 50),
  source_url    text not null check (source_url ~ '^https?://'),
  source_type   text not null check (source_type in ('방송', '본인 SNS', '공식 콘텐츠', '인터뷰', '기타 공개 콘텐츠')),
  note          text not null default '' check (char_length(note) <= 300),
  status        public.spot_status not null default 'pending',
  verify_count  int not null default 0,
  flag_count    int not null default 0,
  -- 가게 정보 매칭 결과 {merchant, score, matchedAt}. 서버(service role)만 기록한다.
  match         jsonb,
  reporter_id   uuid default auth.uid() references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  -- 사적인 생활 공간 제보 차단 (앱에서도 한 번 더 검사)
  constraint spots_no_private_place check (
    (place_name || ' ' || note) !~ '(자택|숙소|기숙사|본가|집\s*앞|집\s*근처|사는\s*곳|동네\s*단골|퇴근길|출근길)'
  )
);
create unique index spots_unique_place
  on public.spots (idol_id, lower(replace(place_name, ' ', '')), lower(replace(location, ' ', '')));
create index spots_idol_status on public.spots (idol_id, status);

-- 한 사람이 1시간에 제보 10건까지
create function public.spots_rate_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.reporter_id is not null and (
    select count(*) from public.spots
    where reporter_id = new.reporter_id and created_at > now() - interval '1 hour'
  ) >= 10 then
    raise exception 'rate_limited' using hint = '잠시 후 다시 제보해 주세요.';
  end if;
  return new;
end $$;
create trigger spots_rate_limit before insert on public.spots
  for each row execute function public.spots_rate_limit();

-- ── 출처 확인 / 신고 ──────────────────────────────────────
create table public.spot_verifications (
  spot_id    uuid not null references public.spots (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (spot_id, user_id)
);

create table public.spot_flags (
  spot_id    uuid not null references public.spots (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (spot_id, user_id)
);

-- 확인/신고 수가 바뀌면 상태 재계산. 한 번 공개된 성지는 신고로 숨겨지지 않는 한 공개 유지.
create function public.refresh_spot_status() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  sid uuid := coalesce(new.spot_id, old.spot_id);
  v int;
  f int;
begin
  select count(*) into v from public.spot_verifications where spot_id = sid;
  select count(*) into f from public.spot_flags where spot_id = sid;
  update public.spots set
    verify_count = v,
    flag_count = f,
    status = case
      when f >= 2 then 'hidden'
      when v >= 3 or status = 'verified' then 'verified'
      else 'pending'
    end::public.spot_status
  where id = sid;
  return null;
end $$;

create trigger spot_verifications_refresh after insert or delete on public.spot_verifications
  for each row execute function public.refresh_spot_status();
create trigger spot_flags_refresh after insert or delete on public.spot_flags
  for each row execute function public.refresh_spot_status();

-- ── RLS ───────────────────────────────────────────────────
alter table public.idols enable row level security;
alter table public.spots enable row level security;
alter table public.spot_verifications enable row level security;
alter table public.spot_flags enable row level security;

-- 아이돌: 누구나 보기, 로그인하면 등록
create policy "idols are public" on public.idols for select using (true);
create policy "signed-in users add idols" on public.idols for insert to authenticated
  with check (created_by = auth.uid());

-- 성지: 숨김 아닌 것만 보기, 로그인하면 제보 (상태·카운트·매칭은 직접 못 넣음)
create policy "visible spots are public" on public.spots for select using (status <> 'hidden');
create policy "signed-in users report spots" on public.spots for insert to authenticated
  with check (
    reporter_id = auth.uid() and status = 'pending'
    and verify_count = 0 and flag_count = 0 and match is null
  );

-- 확인: 내 것만 보기, 대기 중이고 내가 올리지 않은 제보만 확인, 취소 가능
create policy "see own verifications" on public.spot_verifications for select to authenticated
  using (user_id = auth.uid());
create policy "verify others' pending spots" on public.spot_verifications for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.spots s
      where s.id = spot_id and s.status = 'pending' and s.reporter_id is distinct from auth.uid()
    )
  );
create policy "undo own verification" on public.spot_verifications for delete to authenticated
  using (user_id = auth.uid());

-- 신고: 내 것만 보기, 한 번씩
create policy "see own flags" on public.spot_flags for select to authenticated using (user_id = auth.uid());
create policy "flag spots" on public.spot_flags for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.spots s where s.id = spot_id and s.reporter_id is distinct from auth.uid())
  );
