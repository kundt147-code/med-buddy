-- MEDBUDDY V7 - Lịch nhắc thuốc + lịch sử thực hiện thuốc
-- Chạy trong Supabase SQL Editor. KHÔNG xóa bảng hoặc dữ liệu cũ.
-- An toàn để chạy lại nhiều lần (dùng "if not exists").

-- 1) Ngăn thuốc: thêm chế độ lặp lại (Không lặp / Hằng ngày)
alter table if exists ngan_thuoc
    add column if not exists lap_lai text not null default 'khong_lap';

-- 2) Lịch sử: tách "lịch cấu hình" và "lịch sử thực tế".
--    ngay             : ngày của lần uống này (để mỗi ngày là 1 dòng lịch sử riêng khi lặp Hằng ngày)
--    lap_lai          : chế độ lặp tại thời điểm tạo bản ghi
--    so_lan_nhac      : số lần đã phát nhắc (0-3)
--    trang_thai       : cho_den_gio | dang_nhac | da_dung_thuoc | chua_dung_thuoc
--    thoi_diem_mo_ngan: thời điểm cảm biến/medbuddyGhiNhanMoNgan() ghi nhận ngăn được mở
--    thoi_diem_hoan_tat: thời điểm dòng lịch sử này được xử lý xong (đã dùng hoặc hết hạn nhắc)
alter table if exists lich_su add column if not exists ngay date;
alter table if exists lich_su add column if not exists lap_lai text not null default 'khong_lap';
alter table if exists lich_su add column if not exists so_lan_nhac integer not null default 0;
alter table if exists lich_su add column if not exists trang_thai text not null default 'cho_den_gio';
alter table if exists lich_su add column if not exists thoi_diem_mo_ngan timestamptz;
alter table if exists lich_su add column if not exists thoi_diem_hoan_tat timestamptz;

-- 3) Gán "ngay" cho các bản ghi lịch sử cũ (theo giờ Việt Nam) để không bị NULL.
--    Các bản ghi cũ này coi như đã xảy ra trong quá khứ nên đánh dấu đã hoàn tất,
--    tránh bị động cơ nhắc mới xử lý lại (không phát loa/không đổi trạng thái các bản ghi cũ).
update lich_su
set ngay = (coalesce(created_at, updated_at) at time zone 'Asia/Ho_Chi_Minh')::date
where ngay is null and coalesce(created_at, updated_at) is not null;

update lich_su
set trang_thai = 'da_dung_thuoc'
where trang_thai = 'cho_den_gio' and ngay is not null and ngay < (now() at time zone 'Asia/Ho_Chi_Minh')::date;

-- 4) Chỉ mục hỗ trợ tra cứu/tạo lịch sử theo ngăn + ngày (dùng bởi động cơ lịch nhắc).
create index if not exists idx_lich_su_ma_tu_so_ngan_ngay on lich_su (ma_tu, so_ngan, ngay);

-- Lưu ý: các policy RLS "medbuddy_slots_all" và "medbuddy_history_all" tạo ở migration_v6.sql
-- đã cho phép anon toàn quyền select/insert/update/delete trên ngan_thuoc và lich_su,
-- nên các cột mới ở trên không cần policy riêng.
