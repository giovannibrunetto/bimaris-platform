-- DS-B2B-NOTIFY-01: operator-scoped new-match notifications; no automatic emails by default.
create table if not exists public.b2b_match_notifications (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id) on delete cascade,
  partner_operator_id uuid not null references public.operators(id) on delete cascade,
  match_score integer not null check (match_score between 55 and 100),
  first_detected_at timestamptz not null default now(),
  read_at timestamptz,
  email_sent_at timestamptz,
  email_claimed_at timestamptz,
  constraint b2b_match_notifications_unique_pair unique (operator_id, partner_operator_id),
  constraint b2b_match_notifications_not_self check (operator_id <> partner_operator_id)
);
create index if not exists b2b_match_notifications_operator_unread_idx
 on public.b2b_match_notifications(operator_id, first_detected_at desc) where read_at is null;
create table if not exists public.b2b_notification_preferences (
  operator_id uuid primary key references public.operators(id) on delete cascade,
  email_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.b2b_match_notifications enable row level security;
alter table public.b2b_notification_preferences enable row level security;
-- Only trusted server APIs access this data; membership is reverified on each request.
revoke all on public.b2b_match_notifications from anon, authenticated;
revoke all on public.b2b_notification_preferences from anon, authenticated;
comment on table public.b2b_match_notifications is 'One historical notification per directional compatible pair; service-only mutations.';
comment on table public.b2b_notification_preferences is 'Email notifications opt-in, default false. Service-only access with membership checks.';
