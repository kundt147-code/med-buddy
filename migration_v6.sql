-- MEDBUDDY V6 - chạy trong Supabase SQL Editor.
-- Mục tiêu: cho phép website demo đọc/ghi dữ liệu bằng publishable key.
-- Nếu project đã có policy tương đương thì có thể bỏ qua các policy trùng tên.

alter table if exists ngan_thuoc add column if not exists bat_nhac boolean not null default true;
alter table if exists lich_su add column if not exists bat_nhac boolean not null default true;

-- Kiểm tra RLS trước khi chạy. Nếu đang bật RLS và chưa có policy cho anon,
-- các nút Lưu/Chỉnh sửa/Thêm/Xóa sẽ không ghi được.
alter table if exists tu_thuoc enable row level security;
alter table if exists nguoi_su_dung enable row level security;
alter table if exists ngan_thuoc enable row level security;
alter table if exists lich_su enable row level security;

-- Xóa policy demo cũ cùng tên để chạy lại không bị trùng.
drop policy if exists "medbuddy_tu_select" on tu_thuoc;
drop policy if exists "medbuddy_tu_insert" on tu_thuoc;
drop policy if exists "medbuddy_people_all" on nguoi_su_dung;
drop policy if exists "medbuddy_slots_all" on ngan_thuoc;
drop policy if exists "medbuddy_history_all" on lich_su;

create policy "medbuddy_tu_select" on tu_thuoc for select to anon using (true);
create policy "medbuddy_tu_insert" on tu_thuoc for insert to anon with check (true);
create policy "medbuddy_people_all" on nguoi_su_dung for all to anon using (true) with check (true);
create policy "medbuddy_slots_all" on ngan_thuoc for all to anon using (true) with check (true);
create policy "medbuddy_history_all" on lich_su for all to anon using (true) with check (true);
