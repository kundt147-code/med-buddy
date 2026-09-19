-- MEDBUDDY V8 - Thông tin dị ứng + thuốc theo từng ngăn
-- Không xóa dữ liệu cũ. Có thể chạy lại an toàn.

alter table if exists nguoi_su_dung
    add column if not exists di_ung text not null default '';

alter table if exists ngan_thuoc
    add column if not exists ten_thuoc text not null default '';

alter table if exists lich_su
    add column if not exists ten_thuoc text not null default '';

-- Đồng bộ tên thuốc vào lịch sử từ cấu hình ngăn hiện tại khi có thể.
update lich_su h
set ten_thuoc = coalesce(n.ten_thuoc, '')
from ngan_thuoc n
where h.ma_tu = n.ma_tu
  and h.so_ngan = n.so_ngan
  and (h.ten_thuoc is null or h.ten_thuoc = '');

-- RLS của V6 đã cho phép anon thao tác trên các bảng này nên không cần policy mới.
