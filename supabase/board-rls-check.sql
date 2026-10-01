-- Transactional verification: all temporary rows and storage metadata are rolled back.
begin;
insert into public.posts(title,slug,category,content,published) values ('RLS check','rls-check-draft','news','test',false);
insert into public.faq(question,answer,published) values ('RLS check private','test',false);
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$
declare denied boolean := false;
begin
  if exists(select 1 from public.posts where not published) or exists(select 1 from public.faq where not published) then raise exception 'FAIL: anon sees drafts'; end if;
  if (select count(*) from public.posts where published) < 6 then raise exception 'FAIL: anon cannot read published posts'; end if;
  begin insert into public.posts(title,slug,category) values ('x','rls-anon-write','news'); exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL: anon can insert'; end if;
  denied := false;
  begin update public.faq set answer='changed'; exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL: anon can update'; end if;
  denied := false;
  begin delete from public.posts; exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL: anon can delete'; end if;
  denied := false;
  begin insert into storage.objects(bucket_id,name) values ('board-images','rls-anon-test.jpg'); exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL: anon can upload'; end if;
end $$;
reset role;
set local role authenticated;
-- A user-editable metadata claim MUST NOT grant admin access.
select set_config('request.jwt.claims','{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001","app_metadata":{},"user_metadata":{"role":"admin"}}',true);
do $$
declare denied boolean := false; changed integer;
begin
  if exists(select 1 from public.posts where not published) or exists(select 1 from public.faq where not published) then raise exception 'FAIL: nonadmin sees drafts'; end if;
  begin insert into public.posts(title,slug,category) values ('x','rls-nonadmin-write','news'); exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL: nonadmin can insert'; end if;
  denied := false;
  begin insert into public.faq(question,answer) values ('x','x'); exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL: nonadmin can insert FAQ'; end if;
  update public.posts set title='changed'; get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL: nonadmin can update'; end if;
  delete from public.faq; get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL: nonadmin can delete'; end if;
  denied := false;
  begin insert into storage.objects(bucket_id,name) values ('board-images','rls-nonadmin-test.jpg'); exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL: nonadmin can upload'; end if;
end $$;
-- Only trusted app_metadata grants administrator access.
select set_config('request.jwt.claims','{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001","app_metadata":{"role":"admin"}}',true);
do $$
declare changed integer;
begin
  if not exists(select 1 from public.posts where slug='rls-check-draft') then raise exception 'FAIL: admin cannot see draft'; end if;
  insert into public.posts(title,slug,category) values ('admin test','rls-admin-check','news');
  update public.posts set title='updated' where slug='rls-admin-check'; get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'FAIL: admin update'; end if;
  delete from public.posts where slug='rls-admin-check'; get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'FAIL: admin delete'; end if;
  insert into public.faq(question,answer) values ('RLS admin check','test');
  update public.faq set answer='updated' where question='RLS admin check'; get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'FAIL: FAQ admin update'; end if;
  delete from public.faq where question='RLS admin check'; get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'FAIL: FAQ admin delete'; end if;
  insert into storage.objects(bucket_id,name) values ('board-images','rls-admin-test.jpg');
  update storage.objects set name='rls-admin-test-updated.jpg' where bucket_id='board-images' and name='rls-admin-test.jpg'; get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'FAIL: storage admin update'; end if;
  -- Storage prohibits direct SQL deletion, even for admins. Metadata is rolled back;
  -- physical deletion is performed only through the Storage API.
end $$;
reset role;
select 'PASS: published read, draft isolation, anon/nonadmin write denial, trusted admin post/FAQ CRUD and storage insert/update policies' as result;
rollback;
