-- Apply once to the existing jangseong-board project. No existing tables are removed.
begin;
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  category text not null check (category in ('automotive-care','repair-case','news')),
  summary text not null default '' check (char_length(summary) <= 500),
  content text not null default '' check (char_length(content) <= 100000),
  thumbnail_url text,
  images text[] not null default '{}',
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category, slug),
  check (cardinality(images) <= 20),
  check (not published or published_at is not null)
);
create index posts_public_category_date on public.posts(category, published_at desc) where published;
create table public.faq (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(question) between 1 and 300),
  answer text not null check (char_length(answer) between 1 and 5000),
  display_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index faq_public_order on public.faq(display_order) where published;
create function public.board_updated_at() returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
revoke all on function public.board_updated_at() from public, anon, authenticated;
create trigger posts_updated_at before update on public.posts for each row execute function public.board_updated_at();
create trigger faq_updated_at before update on public.faq for each row execute function public.board_updated_at();
alter table public.posts enable row level security;
alter table public.faq enable row level security;
revoke all on public.posts, public.faq from anon, authenticated;
grant select on public.posts, public.faq to anon;
grant select, insert, update, delete on public.posts, public.faq to authenticated;
create policy posts_public_read on public.posts for select to anon, authenticated using (published = true);
create policy posts_admin_read on public.posts for select to authenticated using ((select auth.jwt())->'app_metadata'->>'role' = 'admin');
create policy posts_admin_insert on public.posts for insert to authenticated with check ((select auth.jwt())->'app_metadata'->>'role' = 'admin');
create policy posts_admin_update on public.posts for update to authenticated using ((select auth.jwt())->'app_metadata'->>'role' = 'admin') with check ((select auth.jwt())->'app_metadata'->>'role' = 'admin');
create policy posts_admin_delete on public.posts for delete to authenticated using ((select auth.jwt())->'app_metadata'->>'role' = 'admin');
create policy faq_public_read on public.faq for select to anon, authenticated using (published = true);
create policy faq_admin_read on public.faq for select to authenticated using ((select auth.jwt())->'app_metadata'->>'role' = 'admin');
create policy faq_admin_insert on public.faq for insert to authenticated with check ((select auth.jwt())->'app_metadata'->>'role' = 'admin');
create policy faq_admin_update on public.faq for update to authenticated using ((select auth.jwt())->'app_metadata'->>'role' = 'admin') with check ((select auth.jwt())->'app_metadata'->>'role' = 'admin');
create policy faq_admin_delete on public.faq for delete to authenticated using ((select auth.jwt())->'app_metadata'->>'role' = 'admin');
-- Published site images are public; uploading/replacing/deleting requires admin privileges.
-- Do not upload private material to this bucket, including draft images.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('board-images','board-images',true,8388608,array['image/jpeg','image/png','image/webp']);
create policy board_images_admin_select on storage.objects for select to authenticated using (bucket_id = 'board-images' and (select auth.jwt())->'app_metadata'->>'role' = 'admin');
create policy board_images_admin_insert on storage.objects for insert to authenticated with check (bucket_id = 'board-images' and (select auth.jwt())->'app_metadata'->>'role' = 'admin');
create policy board_images_admin_update on storage.objects for update to authenticated using (bucket_id = 'board-images' and (select auth.jwt())->'app_metadata'->>'role' = 'admin') with check (bucket_id = 'board-images' and (select auth.jwt())->'app_metadata'->>'role' = 'admin');
create policy board_images_admin_delete on storage.objects for delete to authenticated using (bucket_id = 'board-images' and (select auth.jwt())->'app_metadata'->>'role' = 'admin');
commit;
