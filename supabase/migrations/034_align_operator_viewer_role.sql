-- Align the operator admin read-only viewer role with its database constraint.
-- Keep the legacy editor value for backward compatibility.
alter table public.operator_memberships
  drop constraint if exists operator_memberships_role_check;
alter table public.operator_memberships
  add constraint operator_memberships_role_check
  check (role in ('owner', 'manager', 'editor', 'viewer'));
