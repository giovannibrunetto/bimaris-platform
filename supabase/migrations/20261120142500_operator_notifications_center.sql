-- OP-NOTIFY-01: unified operator notifications, server-only writes.
create table if not exists public.operator_notifications(
 id uuid primary key default gen_random_uuid(),
 operator_id uuid not null references public.operators(id) on delete cascade,
 category text not null check(category in ('experience','profile','calendar','collaboration','communication')),
 event_key text not null,
 title text not null check(char_length(title) between 1 and 160),
 description text not null default '',
 target_path text not null default '/area-operatore',
 created_at timestamptz not null default now(),
 read_at timestamptz,
 constraint operator_notifications_event_unique unique(operator_id,event_key),
 constraint operator_notifications_target_path_check check(target_path like '/area-operatore%' and target_path not like '%//%')
);
create index if not exists operator_notifications_unread_idx on public.operator_notifications(operator_id,created_at desc) where read_at is null;
alter table public.operator_notifications enable row level security;
revoke all on public.operator_notifications from anon,authenticated;
comment on table public.operator_notifications is 'Internal operator activity notices; authorized server endpoints only';
