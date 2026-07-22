create or replace function public.set_tracking_live_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;

drop trigger if exists set_tracking_live_updated_at on public.tracking_live;

create trigger set_tracking_live_updated_at
before insert or update on public.tracking_live
for each row
execute function public.set_tracking_live_updated_at();

create or replace function public.get_active_tracking_live(
  p_exclude_user_id uuid default null,
  p_stale_after_seconds integer default 120
)
returns table (
  user_id uuid,
  lat numeric,
  lng numeric,
  speed numeric,
  heading numeric,
  is_active boolean,
  updated_at timestamp with time zone,
  usuarios jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    tracking.user_id,
    tracking.lat,
    tracking.lng,
    tracking.speed,
    tracking.heading,
    tracking.is_active,
    tracking.updated_at,
    jsonb_build_object(
      'id', profile.id,
      'nombre', profile.nombre,
      'avatar_url', profile.avatar_url,
      'ciudad', profile.ciudad,
      'nivel', profile.nivel,
      'disciplina', profile.disciplina
    ) as usuarios
  from public.tracking_live as tracking
  join public.usuarios as profile on profile.id = tracking.user_id
  where tracking.is_active = true
    and tracking.updated_at >= now() - make_interval(
      secs => greatest(coalesce(p_stale_after_seconds, 120), 1)
    )
    and (
      p_exclude_user_id is null
      or tracking.user_id <> p_exclude_user_id
    )
  order by tracking.updated_at desc;
$$;

revoke all on function public.get_active_tracking_live(uuid, integer) from public;
grant execute on function public.get_active_tracking_live(uuid, integer)
to anon, authenticated, service_role;
