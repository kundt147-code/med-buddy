-- Chạy 1 lần trong Supabase SQL Editor
alter table ngan_thuoc
add column if not exists bat_nhac boolean not null default true;

alter table lich_su
add column if not exists bat_nhac boolean not null default true;
