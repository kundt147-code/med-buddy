/* MEDBUDDY - V6: Supabase sync + custom modal + history viewer */
const SUPABASE_URL = "https://zkbqjmpwxaukfytnnjjl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_442VMaVK-Dvy92tJ0Ky_Fw_FT5Rbbg3";
const db = (window.supabase && window.supabase.createClient)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;

const thamSo = new URLSearchParams(window.location.search);
const maTu = thamSo.get("tu") || "MEDBUDDY-1";
let duLieuNgan = {};
let danhSachNguoi = [];
let lichSu = [];
let soNganHienTai = null;
let nguoiDangXem = null;
let dangNhap = false;
let dangChinhSuaNgan = false;
let trangTruocQuanLy = "trangChinh";
let trangTruocThongTin = "quanLyNguoi";
let nguoiTuNgan = null;
let lichSuDangXem = null;

/* =========================
   V7 - LỊCH NHẮC + LỊCH SỬ THỰC HIỆN THUỐC
========================= */
const NHAC_TRANG_THAI_NHAN = {
    cho_den_gio: "Chờ đến giờ",
    dang_nhac: "Đang nhắc",
    da_dung_thuoc: "Đã dùng thuốc",
    chua_dung_thuoc: "Chưa dùng thuốc"
};
let dangKiemTraLichNhac = false;
const dangPhatLoaTheo = {};

const TRANG_THAI_KEY = `medbuddy_trang_thai_${maTu}`;
// Dùng localStorage để trạng thái giao diện không bị mất khi reload/F5.
// URL và dữ liệu tủ vẫn giữ nguyên theo mã tủ hiện tại.
const TRANG_THAI_VERSION = 2;
let dangKhoiPhucTrang = false;

function layFormHienTai() {
    const nguoi = document.getElementById("nguoiSuDung");
    const gio = document.getElementById("gioUong");
    const loi = document.getElementById("loiNhan");
    const nhac = document.getElementById("batNhac");
    const lapLai = document.getElementById("lapLai");
    if (!nguoi || !gio || !loi || !nhac) return null;
    return {
        nguoiSuDung: nguoi.value || "",
        gioUong: gio.value || "",
        loiNhan: loi.value || "",
        batNhac: !!nhac.checked,
        lapLai: lapLai ? lapLai.value || "khong_lap" : "khong_lap"
    };
}

function luuTrangThai(view) {
    try {
        const state = {
            version: TRANG_THAI_VERSION,
            view,
            soNgan: soNganHienTai,
            nguoiDangXem,
            trangTruocQuanLy,
            trangTruocThongTin,
            lichSuDangXem,
            mode: dangChinhSuaNgan ? "edit" : dangNhap ? "input" : "view",
            form: view === "caiDat" ? layFormHienTai() : null
        };
        localStorage.setItem(TRANG_THAI_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn("Không thể lưu trạng thái giao diện:", e);
    }
}

function xoaTrangThai() {
    try { localStorage.removeItem(TRANG_THAI_KEY); } catch (e) {}
}

async function khoiPhucTrangThai() {
    let state = null;
    try { state = JSON.parse(localStorage.getItem(TRANG_THAI_KEY) || "null"); } catch (e) {}
    if (!state || !state.view || state.view === "trangChinh") {
        veTrangChinh();
        return;
    }

    dangKhoiPhucTrang = true;
    soNganHienTai = state.soNgan ?? null;
    nguoiDangXem = state.nguoiDangXem ?? null;
    trangTruocQuanLy = state.trangTruocQuanLy || "trangChinh";
    trangTruocThongTin = state.trangTruocThongTin || "quanLyNguoi";
    lichSuDangXem = state.lichSuDangXem ?? null;

    try {
        if (state.view === "caiDat" && soNganHienTai !== null) {
            await moNgan(soNganHienTai);
            if (state.form) {
                document.getElementById("nguoiSuDung").value = state.form.nguoiSuDung || "";
                document.getElementById("gioUong").value = state.form.gioUong || "";
                document.getElementById("loiNhan").value = state.form.loiNhan || "";
                document.getElementById("batNhac").checked = state.form.batNhac !== false;
                const lapLaiEl = document.getElementById("lapLai");
                if (lapLaiEl) lapLaiEl.value = state.form.lapLai || "khong_lap";
                hienThiHoSoTrongNgan(state.form.nguoiSuDung || "");
            }
            if (state.mode === "input") {
                dangNhap = true;
                dangChinhSuaNgan = false;
                capNhatNutNgap();
            } else if (state.mode === "edit") {
                dangNhap = false;
                dangChinhSuaNgan = true;
                capNhatNutNgap();
            }
        } else if (state.view === "quanLyNguoi") {
            moQuanLyNguoi();
        } else if (state.view === "thongTinNguoiQuanLy" && nguoiDangXem) {
            moThongTinNguoiQuanLy(nguoiDangXem, trangTruocThongTin);
        } else if (state.view === "themNguoi") {
            moThemNguoi();
        } else if (state.view === "lichSu") {
            moLichSu();
        } else if (state.view === "xemLichSu" && lichSuDangXem) {
            xemLichSu(lichSuDangXem);
        } else {
            veTrangChinh();
        }
    } finally {
        dangKhoiPhucTrang = false;
    }
}

function escapeHTML(t) {
    return String(t ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================
   MODAL RIÊNG CỦA WEBSITE
========================= */
function hienThiModal(title, msg, type = "success", confirmText = "Đóng", onConfirm = null) {
    const m = document.getElementById("modal");
    const icon = document.getElementById("modalIcon");
    const actions = document.getElementById("modalActions");
    document.getElementById("modalTitle").textContent = title;
    document.getElementById("modalMessage").textContent = msg;
    icon.className = "modal-icon " + (type === "confirm" ? "modal-question" : type === "error" ? "modal-error" : type === "info" ? "modal-info" : "modal-success");
    icon.textContent = type === "confirm" ? "?" : type === "error" ? "!" : type === "info" ? "i" : "✓";
    actions.innerHTML = "";

    if (type === "confirm") {
        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.className = "secondary-btn";
        cancel.textContent = "Hủy";
        cancel.onclick = dongModal;

        const ok = document.createElement("button");
        ok.type = "button";
        ok.className = "primary-btn";
        ok.textContent = confirmText;
        ok.onclick = () => {
            dongModal();
            if (onConfirm) onConfirm();
        };
        actions.append(cancel, ok);
    } else {
        const close = document.createElement("button");
        close.type = "button";
        close.className = "primary-btn";
        close.textContent = confirmText;
        close.onclick = dongModal;
        actions.append(close);
    }
    m.style.display = "grid";
}

function dongModal() {
    document.getElementById("modal").style.display = "none";
}

function baoDangPhatTrien() {
    hienThiModal("Thông báo", "Chức năng hiện đang phát triển thêm", "info");
}

function moMenu() {
    document.getElementById("sideMenu").classList.add("open");
    document.getElementById("menuOverlay").classList.add("open");
}
function dongMenu() {
    document.getElementById("sideMenu").classList.remove("open");
    document.getElementById("menuOverlay").classList.remove("open");
}

function anTatCaTrang() {
    ["trangChinh", "caiDat", "quanLyNguoi", "thongTinNguoiQuanLy", "themNguoi", "lichSu", "xemLichSu"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
}

function veTrangChinh() {
    anTatCaTrang();
    document.getElementById("trangChinh").style.display = "block";
    hienThiDuLieuNgan();
    xoaTrangThai();
}

function tinhTuoi(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    const n = new Date();
    let age = n.getFullYear() - d.getFullYear();
    if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) age--;
    return age;
}

function dinhDangNgaySinh(iso) {
    if (!iso) return "Chưa có thông tin";
    const parts = String(iso).slice(0, 10).split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : iso;
}

function dinhDangThoiGian(v) {
    if (!v) return "";
    if (/^\d{2}:\d{2}/.test(v)) return v.slice(0, 5);
    const d = new Date(v);
    return isNaN(d) ? String(v) : d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function dinhDangNgayGio(v) {
    if (!v) return "Chưa có thông tin";
    const d = new Date(v);
    return isNaN(d) ? String(v) : d.toLocaleDateString("vi-VN") + " • " + d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function tenNgan(n) {
    if (n <= 4) return `Sáng ${n}`;
    if (n <= 8) return `Trưa ${n - 4}`;
    if (n <= 12) return `Tối ${n - 8}`;
    return `Khác ${n - 12}`;
}

function layNguoi(id) {
    return danhSachNguoi.find(x => String(x.id) === String(id));
}

function hienThiDanhSachNguoi() {
    const s = document.getElementById("nguoiSuDung");
    if (!s) return;
    const current = s.value;
    s.innerHTML = '<option value="">-- Chọn người sử dụng --</option>';
    danhSachNguoi.forEach(n => {
        const o = document.createElement("option");
        o.value = n.id;
        o.textContent = n.ten;
        s.appendChild(o);
    });
    if (current) s.value = current;
}

function hienThiHoSoTrongNgan(id) {
    const n = layNguoi(id);
    const ten = document.getElementById("tenHoSo");
    if (!n) {
        ten.textContent = "Chưa có thông tin";
        document.getElementById("thongTinTuoi").textContent = "Tuổi: Chưa có thông tin";
        document.getElementById("thongTinBenh").textContent = "Tình trạng bệnh: Chưa có thông tin";
        nguoiTuNgan = null;
        return;
    }
    nguoiTuNgan = n.id;
    ten.textContent = n.ten;
    document.getElementById("thongTinTuoi").textContent = "Tuổi: " + (n.ngay_sinh ? tinhTuoi(n.ngay_sinh) : "Chưa có thông tin");
    document.getElementById("thongTinBenh").textContent = "Tình trạng bệnh: " + (n.tinh_trang_benh || "Chưa có thông tin");
}

function datKhoaForm(khoa) {
    ["nguoiSuDung", "gioUong", "loiNhan", "batNhac", "lapLai"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = khoa;
    });
}

function capNhatNutNgap() {
    const dangXem = !dangNhap && !dangChinhSuaNgan;
    document.getElementById("nutNhap").style.display = dangXem ? "flex" : "none";
    document.getElementById("nutLuaChonNhap").style.display = (dangNhap && !dangChinhSuaNgan) ? "flex" : "none";
    document.getElementById("nutCaiDatDangSua").style.display = dangChinhSuaNgan ? "flex" : "none";
    const nutXoa = document.getElementById("nutXoaNgan");
    if (nutXoa) {
        nutXoa.style.display = dangXem ? "inline-flex" : "none";
        nutXoa.disabled = !duLieuNgan[soNganHienTai];
        nutXoa.title = duLieuNgan[soNganHienTai] ? "Xóa thông tin hiện tại của ngăn" : "Ngăn chưa có thông tin";
    }
    datKhoaForm(dangXem);
    document.getElementById("trangThaiNgan").textContent = dangChinhSuaNgan ? "Đang chỉnh sửa" : dangNhap ? "Đang nhập thông tin" : "Chế độ xem";
    document.getElementById("moTaTrangThai").textContent = dangChinhSuaNgan ? "Bạn đang chỉnh sửa thông tin của ngăn" : dangNhap ? "Chọn Lưu mới hoặc Chỉnh sửa" : "Thông tin hiện tại của ngăn";
}

/* =========================
   SUPABASE - TẢI TOÀN BỘ DỮ LIỆU
========================= */
async function taiDuLieuTuDB() {
    const { data: people, error: e1 } = await db.from("nguoi_su_dung").select("*").eq("ma_tu", maTu).order("id");
    if (e1) throw e1;
    danhSachNguoi = people || [];

    const { data: slots, error: e2 } = await db.from("ngan_thuoc").select("*").eq("ma_tu", maTu).order("so_ngan");
    if (e2) throw e2;
    duLieuNgan = {};
    (slots || []).forEach(x => {
        duLieuNgan[x.so_ngan] = {
            id: x.id,
            nguoiSuDung: x.nguoi_su_dung_id,
            gioUong: x.gio_uong || "",
            loiNhan: x.loi_nhan || "",
            batNhac: x.bat_nhac !== false,
            lapLai: x.lap_lai || "khong_lap"
        };
    });

    const { data: history, error: e3 } = await db.from("lich_su").select("*").eq("ma_tu", maTu).order("updated_at", { ascending: false });
    if (e3) throw e3;
    lichSu = history || [];

    hienThiDanhSachNguoi();
    hienThiDuLieuNgan();
    if (document.getElementById("lichSu").style.display !== "none") hienThiLichSu();
    if (soNganHienTai !== null && document.getElementById("caiDat")?.style.display !== "none") hienThiTrangThaiNhacTrongNgan();
}

async function khoiTaoDuLieu() {
    try {
        const { data: tu, error } = await db.from("tu_thuoc").select("ma_tu").eq("ma_tu", maTu).maybeSingle();
        if (error) throw error;
        if (!tu) {
            const r = await db.from("tu_thuoc").insert({ ma_tu: maTu, ten_tu: maTu });
            if (r.error) throw r.error;
        }

        const { count, error: e } = await db.from("nguoi_su_dung").select("id", { count: "exact", head: true }).eq("ma_tu", maTu);
        if (e) throw e;
        if (count === 0) {
            const defaults = [
                { ma_tu: maTu, ten: "Nguyễn Văn A", ngay_sinh: "1956-05-20", tinh_trang_benh: "Tiểu đường, huyết áp cao", thuoc_dang_dung: "Metformin, Amlodipine", ghi_chu: "Cần được nhắc uống thuốc đúng giờ" },
                { ma_tu: maTu, ten: "Trần Thị B", ngay_sinh: "1960-08-15", tinh_trang_benh: "Huyết áp cao", thuoc_dang_dung: "Amlodipine", ghi_chu: "" },
                { ma_tu: maTu, ten: "Lê Văn C", ngay_sinh: "1958-03-10", tinh_trang_benh: "Chưa có thông tin", thuoc_dang_dung: "Chưa có thông tin", ghi_chu: "" }
            ];
            const r = await db.from("nguoi_su_dung").insert(defaults);
            if (r.error) throw r.error;
        }
        await taiDuLieuTuDB();
    } catch (err) {
        console.error("MEDBUDDY init:", err);
        hienThiModal("Không thể kết nối", "Không thể tải dữ liệu MEDBUDDY. Hãy kiểm tra cấu hình Supabase và quyền truy cập dữ liệu.", "error");
    }
}

/* =========================
   NGĂN THUỐC
========================= */
async function moNgan(n) {
    soNganHienTai = n;
    dangNhap = false;
    dangChinhSuaNgan = false;
    anTatCaTrang();
    document.getElementById("caiDat").style.display = "block";
    document.getElementById("soNgan").textContent = `MED 1 - ${tenNgan(n)}`;
    hienThiDanhSachNguoi();

    const d = duLieuNgan[n];
    document.getElementById("nguoiSuDung").value = d?.nguoiSuDung ?? "";
    document.getElementById("gioUong").value = d?.gioUong || "";
    document.getElementById("loiNhan").value = d?.loiNhan || "";
    document.getElementById("batNhac").checked = d?.batNhac !== false;
    document.getElementById("lapLai").value = d?.lapLai || "khong_lap";
    hienThiHoSoTrongNgan(d?.nguoiSuDung || "");
    capNhatNutNgap();
    hienThiTrangThaiNhacTrongNgan();
    luuTrangThai("caiDat");
}

function quayLaiTu() {
    if (dangNhap || dangChinhSuaNgan) {
        hienThiModal("Xác nhận", "Bạn có chắc muốn ngừng nhập thông tin cho ngăn này không?", "confirm", "Ngừng nhập", () => {
            dangNhap = false;
            dangChinhSuaNgan = false;
            moNgan(soNganHienTai);
        });
    } else {
        veTrangChinh();
    }
}

function layForm() {
    return {
        nguoiSuDung: document.getElementById("nguoiSuDung").value || null,
        gioUong: document.getElementById("gioUong").value,
        loiNhan: document.getElementById("loiNhan").value.trim(),
        batNhac: document.getElementById("batNhac").checked,
        lapLai: document.getElementById("lapLai").value || "khong_lap"
    };
}

function kiemTra(d) {
    if (!d.nguoiSuDung || !d.gioUong || !d.loiNhan) {
        hienThiModal("Thiếu thông tin", "Vui lòng nhập đầy đủ người sử dụng, giờ uống và lời nhắn cho ngăn này.", "error");
        return false;
    }
    return true;
}

function batDauNhap() {
    dangNhap = true;
    dangChinhSuaNgan = false;
    capNhatNutNgap();
    luuTrangThai("caiDat");
}

function huyTrongCheDoXem() {
    // Ở chế độ xem, Hủy quay về màn hình chọn ngăn.
    dangNhap = false;
    dangChinhSuaNgan = false;
    veTrangChinh();
}

function huyNhap() {
    hienThiModal("Xác nhận", "Bạn có chắc muốn ngừng nhập thông tin cho ngăn này không?", "confirm", "Ngừng nhập", () => {
        dangNhap = false;
        dangChinhSuaNgan = false;
        moNgan(soNganHienTai);
    });
}

async function luuMoi() {
    const d = layForm();
    if (!kiemTra(d)) return;

    try {
        /* Không dùng upsert để tránh phụ thuộc unique constraint của database. */
        const { data: oldSlot, error: findError } = await db
            .from("ngan_thuoc")
            .select("id")
            .eq("ma_tu", maTu)
            .eq("so_ngan", soNganHienTai)
            .maybeSingle();
        if (findError) throw findError;

        let slot;
        if (oldSlot) {
            const r = await db.from("ngan_thuoc")
                .update({ nguoi_su_dung_id: d.nguoiSuDung, gio_uong: d.gioUong, loi_nhan: d.loiNhan, bat_nhac: d.batNhac, lap_lai: d.lapLai, updated_at: new Date().toISOString() })
                .eq("id", oldSlot.id)
                .select()
                .single();
            if (r.error) throw r.error;
            slot = r.data;
        } else {
            const r = await db.from("ngan_thuoc")
                .insert({ ma_tu: maTu, so_ngan: soNganHienTai, nguoi_su_dung_id: d.nguoiSuDung, gio_uong: d.gioUong, loi_nhan: d.loiNhan, bat_nhac: d.batNhac, lap_lai: d.lapLai })
                .select()
                .single();
            if (r.error) throw r.error;
            slot = r.data;
        }

        const n = layNguoi(d.nguoiSuDung);
        const homNay = ngayHomNay();
        const baseHistory = {
            ma_tu: maTu,
            so_ngan: soNganHienTai,
            nguoi_su_dung_id: d.nguoiSuDung,
            ten_nguoi: n?.ten || "Chưa có thông tin",
            gio_uong: d.gioUong,
            loi_nhan: d.loiNhan,
            bat_nhac: d.batNhac,
            ngay: homNay,
            lap_lai: d.lapLai,
            trang_thai: "cho_den_gio",
            so_lan_nhac: 0
        };

        let historyResult;
        if (d.lapLai === "hang_ngay") {
            // Lịch hằng ngày chỉ có đúng 1 dòng cho một ngăn trong một ngày.
            // Nếu động cơ đã tạo dòng hôm nay trước khi người dùng bấm Lưu mới,
            // dùng lại chính dòng đó thay vì INSERT thêm một dòng.
            const lichKey = `${maTu}|${soNganHienTai}|${homNay}`;
            const existing = await db.from("lich_su").select("id").eq("lich_nhac_key", lichKey).maybeSingle();
            if (existing.error) throw existing.error;
            if (existing.data?.id) {
                historyResult = await db.from("lich_su").update({ ...baseHistory, lich_nhac_key: lichKey, updated_at: new Date().toISOString() }).eq("id", existing.data.id).select().single();
            } else {
                historyResult = await db.from("lich_su").insert({ ...baseHistory, lich_nhac_key: lichKey }).select().single();
            }
        } else {
            // Không lặp: mỗi lần người dùng bấm Lưu mới là một lần tạo lịch sử mới.
            historyResult = await db.from("lich_su").insert(baseHistory).select().single();
        }
        if (historyResult.error) throw historyResult.error;

        await taiDuLieuTuDB();
        dangNhap = false;
        dangChinhSuaNgan = false;
        capNhatNutNgap();
        hienThiModal("Đã lưu", "Lưu mới thành công!", "success");
    } catch (err) {
        console.error("Lưu mới:", err);
        hienThiModal("Lưu chưa thành công", "Không thể lưu dữ liệu. Kiểm tra quyền INSERT/UPDATE của Supabase rồi thử lại.", "error");
    }
}

function batDauChinhSuaNgan() {
    if (!duLieuNgan[soNganHienTai]) {
        hienThiModal("Chưa có dữ liệu", "Ngăn này chưa có dữ liệu cũ để chỉnh sửa. Nếu muốn tạo dữ liệu mới, hãy chọn Lưu mới.", "info");
        return;
    }
    dangNhap = false;
    dangChinhSuaNgan = true;
    capNhatNutNgap();
    luuTrangThai("caiDat");
}

function huyChinhSuaNgan() {
    const d = duLieuNgan[soNganHienTai];
    if (d) {
        document.getElementById("nguoiSuDung").value = d.nguoiSuDung ?? "";
        document.getElementById("gioUong").value = d.gioUong || "";
        document.getElementById("loiNhan").value = d.loiNhan || "";
        document.getElementById("batNhac").checked = d.batNhac !== false;
        document.getElementById("lapLai").value = d.lapLai || "khong_lap";
        hienThiHoSoTrongNgan(d.nguoiSuDung);
    }
    dangChinhSuaNgan = false;
    capNhatNutNgap();
}

async function luuChinhSuaNgan() {
    const d = layForm();
    if (!kiemTra(d)) return;
    const old = duLieuNgan[soNganHienTai];
    if (!old?.id) {
        hienThiModal("Không tìm thấy dữ liệu", "Không tìm thấy ngăn hiện tại trong cơ sở dữ liệu. Hãy thử tải lại trang.", "error");
        return;
    }

    try {
        const r = await db.from("ngan_thuoc")
            .update({ nguoi_su_dung_id: d.nguoiSuDung, gio_uong: d.gioUong, loi_nhan: d.loiNhan, bat_nhac: d.batNhac, lap_lai: d.lapLai, updated_at: new Date().toISOString() })
            .eq("id", old.id)
            .select()
            .single();
        if (r.error) throw r.error;

        // Chỉ cập nhật bản ghi lịch sử của HÔM NAY, và chỉ khi nó chưa xảy ra nhắc (còn "Chờ đến giờ").
        // Lịch sử đã hoàn tất (Đang nhắc / Đã dùng thuốc / Chưa dùng thuốc) không bị chỉnh sửa ngược lại.
        const homNay = ngayHomNay();
        const { data: banGhiHomNay, error: historyFindError } = await db.from("lich_su")
            .select("*")
            .eq("ma_tu", maTu)
            .eq("so_ngan", soNganHienTai)
            .eq("ngay", homNay)
            .order("updated_at", { ascending: false })
            .limit(1);
        if (historyFindError) throw historyFindError;

        const n = layNguoi(d.nguoiSuDung);
        const banGhi = banGhiHomNay?.[0];
        if (banGhi && (!banGhi.trang_thai || banGhi.trang_thai === "cho_den_gio")) {
            const hr = await db.from("lich_su").update({
                nguoi_su_dung_id: d.nguoiSuDung,
                ten_nguoi: n?.ten || "Chưa có thông tin",
                gio_uong: d.gioUong,
                loi_nhan: d.loiNhan,
                bat_nhac: d.batNhac,
                lap_lai: d.lapLai,
                updated_at: new Date().toISOString()
            }).eq("id", banGhi.id);
            if (hr.error) throw hr.error;
        } else if (!banGhi) {
            const payload = {
                ma_tu: maTu, so_ngan: soNganHienTai, nguoi_su_dung_id: d.nguoiSuDung,
                ten_nguoi: n?.ten || "Chưa có thông tin", gio_uong: d.gioUong,
                loi_nhan: d.loiNhan, bat_nhac: d.batNhac, ngay: homNay,
                lap_lai: d.lapLai, trang_thai: "cho_den_gio", so_lan_nhac: 0
            };
            if (d.lapLai === "hang_ngay") payload.lich_nhac_key = `${maTu}|${soNganHienTai}|${homNay}`;
            const hr = await db.from("lich_su").insert(payload);
            if (hr.error) throw hr.error;
        }
        // Nếu bản ghi hôm nay đã "Đang nhắc"/"Đã dùng thuốc"/"Chưa dùng thuốc" thì giữ nguyên, không sửa.

        await taiDuLieuTuDB();
        dangChinhSuaNgan = false;
        dangNhap = false;
        capNhatNutNgap();
        hienThiModal("Đã lưu", "Chỉnh sửa thành công!", "success");
    } catch (err) {
        console.error("Chỉnh sửa ngăn:", err);
        hienThiModal("Chỉnh sửa chưa thành công", "Không thể cập nhật dữ liệu. Kiểm tra quyền UPDATE của Supabase rồi thử lại.", "error");
    }
}

async function xoaThongTinNgan() {
    const d = duLieuNgan[soNganHienTai];
    if (!d?.id) {
        hienThiModal("Chưa có dữ liệu", "Ngăn này hiện chưa có thông tin để xóa.", "info");
        return;
    }

    hienThiModal("Xác nhận xóa", "Bạn có chắc muốn xóa thông tin hiện tại của ngăn này không? Lịch sử và thông tin người sử dụng sẽ không bị ảnh hưởng.", "confirm", "Xóa thông tin", async () => {
        try {
            const { error } = await db.from("ngan_thuoc").delete().eq("id", d.id).eq("ma_tu", maTu);
            if (error) throw error;
            // Xóa cấu hình hiện tại của ngăn, nhưng KHÔNG xóa lịch sử hoặc người sử dụng.
            // Đồng thời dừng nhắc đang phát của ngăn này và ẩn thẻ "Lịch nhắc hôm nay"
            // vì ngăn hiện không còn cấu hình hoạt động. Bản ghi lịch sử vẫn giữ nguyên.
            const historyIdsOfSlot = lichSu
                .filter(x => Number(x.so_ngan) === Number(soNganHienTai) && x.ma_tu === maTu)
                .map(x => x.id);
            historyIdsOfSlot.forEach(id => dungPhatLoiNhac(id));

            await taiDuLieuTuDB();
            dangNhap = false;
            dangChinhSuaNgan = false;
            hienThiDuLieuNgan();
            hienThiTrangThaiNhacTrongNgan();
            hienThiModal("Đã xóa", "Đã xóa thông tin hiện tại của ngăn thành công. Lịch sử và người sử dụng vẫn được giữ nguyên.", "success");
        } catch (err) {
            console.error("Xóa thông tin ngăn:", err);
            hienThiModal("Xóa chưa thành công", "Không thể xóa thông tin ngăn. Kiểm tra quyền DELETE của Supabase rồi thử lại.", "error");
        }
    });
}

/* =========================
   NGƯỜI SỬ DỤNG
========================= */
document.getElementById("nguoiSuDung").addEventListener("change", e => hienThiHoSoTrongNgan(e.target.value));

function moNguoiTuNgan() {
    if (nguoiTuNgan) moThongTinNguoiQuanLy(nguoiTuNgan, "caiDat");
}

function moQuanLyNguoi() {
    trangTruocQuanLy = document.getElementById("caiDat").style.display !== "none" ? "caiDat" : "trangChinh";
    anTatCaTrang();
    document.getElementById("quanLyNguoi").style.display = "block";
    hienThiDanhSachNguoiQuanLy();
    luuTrangThai("quanLyNguoi");
}

function dongQuanLyNguoi() {
    if (trangTruocQuanLy === "caiDat" && soNganHienTai !== null) {
        moNgan(soNganHienTai);
    } else {
        veTrangChinh();
    }
}

function hienThiDanhSachNguoiQuanLy() {
    const box = document.getElementById("danhSachNguoiQuanLy");
    if (!box) return;
    box.innerHTML = "";
    const q = (document.getElementById("timNguoi")?.value || "").trim().toLocaleLowerCase("vi");
    const ds = danhSachNguoi.filter(n => !q || String(n.ten || "").toLocaleLowerCase("vi").includes(q));
    if (!ds.length) {
        box.innerHTML = '<div class="history-empty">Không tìm thấy người sử dụng phù hợp.</div>';
        return;
    }
    ds.forEach(n => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "person-row";
        b.innerHTML = `<span class="person-row-main"><span class="person-row-avatar">♙</span><span><strong>${escapeHTML(n.ten)}</strong><small>${escapeHTML(n.tinh_trang_benh || "Chưa có thông tin")}</small></span></span><span>Xem thông tin →</span>`;
        b.onclick = () => moThongTinNguoiQuanLy(n.id, "quanLyNguoi");
        box.appendChild(b);
    });
}

function moThongTinNguoiQuanLy(id, from = "quanLyNguoi") {
    const n = layNguoi(id);
    if (!n) {
        hienThiModal("Không tìm thấy", "Không tìm thấy thông tin người sử dụng này.", "error");
        return;
    }
    nguoiDangXem = id;
    trangTruocThongTin = from;
    anTatCaTrang();
    document.getElementById("thongTinNguoiQuanLy").style.display = "block";
    hienThiThongTinNguoi(n);
    document.getElementById("nutXemNguoi").style.display = "flex";
    document.getElementById("nutSuaNguoi").style.display = "none";
    luuTrangThai("thongTinNguoiQuanLy");
}

function hienThiThongTinNguoi(n) {
    document.getElementById("khuVucThongTinNguoi").innerHTML = `
        <div class="user-summary">
            <div class="avatar">👤</div>
            <div><p class="muted">Người sử dụng</p><h3>${escapeHTML(n.ten)}</h3><span class="role-tag">Hồ sơ người thân</span></div>
        </div>
        <div class="info-grid">
            <div class="info-item"><strong>Ngày sinh</strong><p>${dinhDangNgaySinh(n.ngay_sinh)}</p></div>
            <div class="info-item"><strong>Tuổi</strong><p>${n.ngay_sinh ? tinhTuoi(n.ngay_sinh) : "Chưa có thông tin"}</p></div>
            <div class="info-item"><strong>Tình trạng bệnh</strong><p>${escapeHTML(n.tinh_trang_benh || "Chưa có thông tin")}</p></div>
            <div class="info-item"><strong>Các loại thuốc đang dùng</strong><p>${escapeHTML(n.thuoc_dang_dung || "Chưa có thông tin")}</p></div>
            <div class="info-item"><strong>Ghi chú</strong><p>${escapeHTML(n.ghi_chu || "Chưa có thông tin")}</p></div>
        </div>`;
}

function quayLaiDanhSachNguoi() {
    if (trangTruocThongTin === "caiDat" && soNganHienTai !== null) {
        moNgan(soNganHienTai);
    } else if (trangTruocThongTin === "lichSu") {
        xemLichSu(lichSuDangXem);
    } else {
        moQuanLyNguoi();
    }
}

function moThemNguoi() {
    anTatCaTrang();
    document.getElementById("themNguoi").style.display = "block";
    ["tenNguoiMoi", "ngaySinhNguoiMoi", "benhNguoiMoi", "thuocNguoiMoi", "ghiChuNguoiMoi"].forEach(id => document.getElementById(id).value = "");
    luuTrangThai("themNguoi");
}

function dongThemNguoi() {
    moQuanLyNguoi();
}

async function themNguoi() {
    const ten = document.getElementById("tenNguoiMoi").value.trim();
    const ngay = document.getElementById("ngaySinhNguoiMoi").value;
    if (!ten || !ngay) {
        hienThiModal("Thiếu thông tin", "Tên và ngày sinh là bắt buộc.", "error");
        return;
    }
    try {
        const { error } = await db.from("nguoi_su_dung").insert({
            ma_tu: maTu,
            ten,
            ngay_sinh: ngay,
            tinh_trang_benh: document.getElementById("benhNguoiMoi").value.trim(),
            thuoc_dang_dung: document.getElementById("thuocNguoiMoi").value.trim(),
            ghi_chu: document.getElementById("ghiChuNguoiMoi").value.trim()
        });
        if (error) throw error;
        await taiDuLieuTuDB();
        hienThiModal("Đã thêm người", "Đã thêm người sử dụng thành công!", "success", "Đóng", () => moQuanLyNguoi());
    } catch (err) {
        console.error("Thêm người:", err);
        hienThiModal("Thêm chưa thành công", "Không thể thêm người sử dụng. Kiểm tra quyền INSERT của Supabase.", "error");
    }
}

function moChinhSuaNguoi() {
    const n = layNguoi(nguoiDangXem);
    if (!n) return;
    document.getElementById("khuVucThongTinNguoi").innerHTML = `
        <h3>Chỉnh sửa thông tin</h3>
        <div class="form-card">
            <label>Tên</label><input class="edit-input" id="suaTenNguoi" value="${escapeHTML(n.ten)}">
            <label>Ngày sinh</label><input class="edit-input" type="date" id="suaNgaySinhNguoi" value="${n.ngay_sinh || ""}">
            <small class="date-help">Ngày sinh sẽ hiển thị theo dạng dd/mm/yyyy</small>
            <label>Tình trạng bệnh</label><input class="edit-input" id="suaBenhNguoi" value="${escapeHTML(n.tinh_trang_benh || "")}">
            <label>Các loại thuốc đang dùng</label><textarea class="edit-textarea" id="suaThuocNguoi">${escapeHTML(n.thuoc_dang_dung || "")}</textarea>
            <label>Ghi chú</label><textarea class="edit-textarea" id="suaGhiChuNguoi">${escapeHTML(n.ghi_chu || "")}</textarea>
        </div>`;
    document.getElementById("nutXemNguoi").style.display = "none";
    document.getElementById("nutSuaNguoi").style.display = "flex";
    luuTrangThai("thongTinNguoiQuanLy");
}

function huyChinhSuaNguoi() {
    const n = layNguoi(nguoiDangXem);
    if (n) hienThiThongTinNguoi(n);
    document.getElementById("nutSuaNguoi").style.display = "none";
    document.getElementById("nutXemNguoi").style.display = "flex";
}

function luuChinhSuaNguoi() {
    const n = layNguoi(nguoiDangXem);
    if (!n) return;
    const ten = document.getElementById("suaTenNguoi").value.trim();
    const ngay = document.getElementById("suaNgaySinhNguoi").value;
    if (!ten || !ngay) {
        hienThiModal("Thiếu thông tin", "Tên và ngày sinh là bắt buộc.", "error");
        return;
    }
    hienThiModal("Xác nhận lưu", "Bạn có chắc muốn lưu thay đổi thông tin người sử dụng này không?", "confirm", "Lưu thay đổi", async () => {
        try {
            const { error } = await db.from("nguoi_su_dung").update({
                ten,
                ngay_sinh: ngay,
                tinh_trang_benh: document.getElementById("suaBenhNguoi").value.trim(),
                thuoc_dang_dung: document.getElementById("suaThuocNguoi").value.trim(),
                ghi_chu: document.getElementById("suaGhiChuNguoi").value.trim()
            }).eq("id", n.id).eq("ma_tu", maTu);
            if (error) throw error;
            await taiDuLieuTuDB();
            const fresh = layNguoi(n.id);
            hienThiThongTinNguoi(fresh);
            document.getElementById("nutSuaNguoi").style.display = "none";
            document.getElementById("nutXemNguoi").style.display = "flex";
            hienThiModal("Đã lưu", "Đã lưu thông tin thành công!", "success");
        } catch (err) {
            console.error("Sửa người:", err);
            hienThiModal("Lưu chưa thành công", "Không thể lưu thay đổi. Kiểm tra quyền UPDATE của Supabase.", "error");
        }
    });
}

function xoaNguoi() {
    const n = layNguoi(nguoiDangXem);
    if (!n) return;
    hienThiModal("Xác nhận xóa", `Bạn có chắc muốn xóa ${n.ten} không?`, "confirm", "Xóa", async () => {
        try {
            const { error } = await db.from("nguoi_su_dung").delete().eq("id", n.id).eq("ma_tu", maTu);
            if (error) throw error;
            await taiDuLieuTuDB();
            hienThiModal("Đã xóa", "Đã xóa người sử dụng thành công!", "success", "Đóng", () => moQuanLyNguoi());
        } catch (err) {
            console.error("Xóa người:", err);
            hienThiModal("Xóa chưa thành công", "Không thể xóa người sử dụng. Kiểm tra dữ liệu đang liên kết hoặc quyền DELETE của Supabase.", "error");
        }
    });
}

/* =========================
   HIỂN THỊ NGĂN + LỊCH SỬ
========================= */
function hienThiDuLieuNgan() {
    const homNay = ngayHomNay();
    for (let i = 1; i <= 16; i++) {
        const o = document.getElementById("thongTin" + i);
        if (!o) continue;
        const d = duLieuNgan[i];
        const n = layNguoi(d?.nguoiSuDung);
        if (!d || !n) {
            o.className = "";
            o.innerHTML = "Chưa có thông tin";
        } else {
            o.className = "da-cai-dat";
            const rec = lichSu.find(x => Number(x.so_ngan) === i && x.ngay === homNay);
            let dong3 = "✓ Đã cài đặt";
            if (rec) {
                if (rec.trang_thai === "dang_nhac") dong3 = "🔊 Đang nhắc";
                else if (rec.trang_thai === "chua_dung_thuoc") dong3 = "⚠ Chưa dùng thuốc";
                else if (rec.trang_thai === "da_dung_thuoc") dong3 = "✓ Đã dùng thuốc";
            }
            o.innerHTML = `${escapeHTML(n.ten)}<br><b>◷ ${escapeHTML(d.gioUong || "")}</b><br><span>${dong3}</span>`;
        }
    }
}

function moLichSu() {
    anTatCaTrang();
    document.getElementById("lichSu").style.display = "block";
    hienThiLichSu();
    luuTrangThai("lichSu");
}

function hienThiLichSu() {
    const box = document.getElementById("danhSachLichSu");
    box.innerHTML = "";
    const ten = (document.getElementById("timLichSuTen")?.value || "").trim().toLocaleLowerCase("vi");
    const ngay = document.getElementById("timLichSuNgay")?.value || "";

    const ketQua = lichSu.filter(x => {
        const tenNguoi = String(x.ten_nguoi || "").toLocaleLowerCase("vi");
        const moc = x.created_at || x.updated_at || "";
        let ngayLichSu = String(moc).slice(0, 10);
        const parsed = new Date(moc);
        if (moc && !isNaN(parsed)) {
            ngayLichSu = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(parsed);
        }
        return (!ten || tenNguoi.includes(ten)) && (!ngay || ngayLichSu === ngay);
    });

    if (!ketQua.length) {
        box.innerHTML = '<div class="history-empty">Không tìm thấy lịch sử phù hợp với điều kiện tra cứu.</div>';
        return;
    }

    ketQua.forEach(x => {
        const d = document.createElement("button");
        d.type = "button";
        d.className = "history-item";
        const lop = lopTrangThaiNhac(x.trang_thai);
        const nhan = NHAC_TRANG_THAI_NHAN[x.trang_thai] || "";
        d.innerHTML = `
            <div class="history-item-top">
                <div><h3>MED 1 - ${escapeHTML(tenNgan(Number(x.so_ngan)))}</h3><span class="history-time">${escapeHTML(dinhDangNgayGio(x.created_at || x.updated_at))}</span></div>
                <span class="history-arrow">›</span>
            </div>
            <p><strong>Người sử dụng:</strong> ${escapeHTML(x.ten_nguoi || "Chưa có thông tin")}</p>
            <p><strong>Giờ uống:</strong> ${escapeHTML(x.gio_uong || "Chưa có thông tin")}</p>
            <span class="history-badge ${x.bat_nhac === false ? "off" : ""}">${x.bat_nhac === false ? "Nhắc nhở tắt" : "Nhắc nhở bật"}</span>
            ${nhan ? ` <span class="status-pill ${lop}">${escapeHTML(nhan)}</span>` : ""}
            <span class="history-hint">Bấm để xem chi tiết</span>`;
        d.onclick = () => xemLichSu(x.id);
        box.appendChild(d);
    });
}

function xoaBoLocLichSu() {
    const ten = document.getElementById("timLichSuTen");
    const ngay = document.getElementById("timLichSuNgay");
    if (ten) ten.value = "";
    if (ngay) ngay.value = "";
    hienThiLichSu();
}

function xemLichSu(id) {
    const x = lichSu.find(h => String(h.id) === String(id));
    if (!x) return;
    lichSuDangXem = x.id;
    anTatCaTrang();
    document.getElementById("xemLichSu").style.display = "block";
    document.getElementById("tieuDeLichSu").textContent = `MED 1 - ${tenNgan(Number(x.so_ngan))} • ${dinhDangNgayGio(x.created_at || x.updated_at)}`;

    const n = layNguoi(x.nguoi_su_dung_id);
    const lop = lopTrangThaiNhac(x.trang_thai);
    const nhanTrangThai = NHAC_TRANG_THAI_NHAN[x.trang_thai] || "Chờ đến giờ";
    const wrap = document.getElementById("noiDungXemLichSu");
    wrap.innerHTML = `
        <div class="history-view-grid">
            <div class="view-field"><strong>Người sử dụng</strong><button id="historyPersonButton" type="button" class="history-person-link">${escapeHTML(n?.ten || x.ten_nguoi || "Chưa có thông tin")} <span>→ Xem hồ sơ</span></button></div>
            <div class="view-field"><strong>Ngày nhập lịch sử</strong>${escapeHTML(dinhDangNgayGio(x.created_at || x.updated_at))}</div>
            <div class="view-field"><strong>Giờ uống</strong>${escapeHTML(x.gio_uong || "Chưa có thông tin")}</div>
            <div class="view-field"><strong>Lời nhắn</strong>${escapeHTML(x.loi_nhan || "Chưa có thông tin")}</div>
            <div class="view-field"><strong>Nhắc nhở</strong>${x.bat_nhac === false ? "Đang tắt" : "Đang bật"}</div>
            <div class="view-field"><strong>Lặp lại</strong>${x.lap_lai === "hang_ngay" ? "Hằng ngày" : "Không lặp"}</div>
            <div class="view-field"><strong>Trạng thái</strong><span class="status-pill ${lop}">${escapeHTML(nhanTrangThai)}</span></div>
            <div class="view-field"><strong>Số lần đã nhắc</strong>${Number(x.so_lan_nhac) || 0} / 3</div>
            <div class="view-field"><strong>Thời điểm mở ngăn</strong>${x.thoi_diem_mo_ngan ? escapeHTML(dinhDangNgayGio(x.thoi_diem_mo_ngan)) : "Chưa mở"}</div>
            <div class="view-field"><strong>Ngăn thuốc</strong>MED 1 - ${escapeHTML(tenNgan(Number(x.so_ngan)))}</div>
        </div>`;

    const personButton = document.getElementById("historyPersonButton");
    if (n) personButton.onclick = () => moThongTinNguoiQuanLy(n.id, "lichSu");
    else personButton.disabled = true;
    luuTrangThai("xemLichSu");
}

function quayLaiLichSu() {
    moLichSu();
}

/* =========================
   V7 - ĐỘNG CƠ LỊCH NHẮC + XÁC NHẬN MỞ NGĂN
   Toàn bộ trạng thái nhắc được tính lại từ (ngày + giờ uống) mỗi lần kiểm tra,
   nên hoạt động đúng dù tải lại trang / nhiều thiết bị cùng mở tủ.
========================= */
function lopTrangThaiNhac(trangThai) {
    if (trangThai === "da_dung_thuoc") return "status-da";
    if (trangThai === "chua_dung_thuoc") return "status-chua";
    if (trangThai === "dang_nhac") return "status-dang";
    return "status-cho";
}

function ngayHomNay() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function ghepThoiDiemNhac(ngay, gio) {
    if (!ngay || !gio) return null;
    // MEDBUDDY dùng giờ Việt Nam (UTC+07) thống nhất trên mọi thiết bị.
    const d = new Date(`${ngay}T${gio.slice(0, 5)}:00+07:00`);
    return isNaN(d) ? null : d;
}

/* Cơ chế nhắc 3 lần, mỗi lần phát 1 phút, chờ 5 phút giữa các lần (chu kỳ 6 phút/lần). */
function tinhGiaiDoanNhac(thoiDiemHen, now) {
    const diffPhut = (now.getTime() - thoiDiemHen.getTime()) / 60000;
    if (diffPhut < 0) return { trangThai: "cho_den_gio", soLan: 0, dangPhat: false, ketThucPhat: null, hoanTat: false };
    if (diffPhut < 1) return { trangThai: "dang_nhac", soLan: 1, dangPhat: true, ketThucPhat: thoiDiemHen.getTime() + 1 * 60000, hoanTat: false };
    if (diffPhut < 6) return { trangThai: "dang_nhac", soLan: 1, dangPhat: false, ketThucPhat: null, hoanTat: false };
    if (diffPhut < 7) return { trangThai: "dang_nhac", soLan: 2, dangPhat: true, ketThucPhat: thoiDiemHen.getTime() + 7 * 60000, hoanTat: false };
    if (diffPhut < 12) return { trangThai: "dang_nhac", soLan: 2, dangPhat: false, ketThucPhat: null, hoanTat: false };
    if (diffPhut < 13) return { trangThai: "dang_nhac", soLan: 3, dangPhat: true, ketThucPhat: thoiDiemHen.getTime() + 13 * 60000, hoanTat: false };
    return { trangThai: "chua_dung_thuoc", soLan: 3, dangPhat: false, ketThucPhat: null, hoanTat: true };
}

function phatLoiNhac(recordId, text, ketThuc) {
    const hien = dangPhatLoaTheo[recordId];
    if (hien && hien.dangChay) return;
    if (!window.speechSynthesis) return;

    const state = { dangChay: true, ketThuc, timer: null, lapTimer: null };
    dangPhatLoaTheo[recordId] = state;

    // Mỗi lần đọc là một SpeechSynthesisUtterance riêng. Chrome đôi khi
    // không gọi onend ổn định, vì vậy không phụ thuộc vào onend để lặp.
    // Cứ vài giây kiểm tra một lần và phát lại cho tới đúng mốc 1 phút.
    const noiMotLan = () => {
        const hienTai = dangPhatLoaTheo[recordId];
        if (!hienTai || !hienTai.dangChay) return;
        if (Date.now() >= hienTai.ketThuc) {
            dungPhatLoiNhac(recordId);
            return;
        }
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) return;
        try {
            const u = new SpeechSynthesisUtterance(text || "Đã đến giờ uống thuốc");
            u.lang = "vi-VN";
            u.rate = 0.95;
            u.pitch = 1;
            window.speechSynthesis.speak(u);
        } catch (e) {
            // Không dừng toàn bộ chu kỳ chỉ vì một lượt đọc lỗi.
            console.warn("MEDBUDDY: không thể phát một lượt nhắc:", e);
        }
    };

    noiMotLan();
    // Khoảng 5 giây/lượt: sau khi một câu đọc xong sẽ tự đọc lại,
    // nhưng vẫn dừng tuyệt đối khi hết 1 phút.
    state.lapTimer = setInterval(noiMotLan, 5000);
    state.timer = setTimeout(() => dungPhatLoiNhac(recordId), Math.max(0, ketThuc - Date.now()));
}

function dungPhatLoiNhac(recordId) {
    const hien = dangPhatLoaTheo[recordId];
    if (hien) {
        hien.dangChay = false;
        if (hien.timer) clearTimeout(hien.timer);
        if (hien.lapTimer) clearInterval(hien.lapTimer);
        delete dangPhatLoaTheo[recordId];
        try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {}
    }
}

function capNhatHienThiSauLichNhac() {
    hienThiDuLieuNgan();
    if (document.getElementById("lichSu")?.style.display !== "none") hienThiLichSu();
    if (soNganHienTai !== null && document.getElementById("caiDat")?.style.display !== "none") hienThiTrangThaiNhacTrongNgan();
}

function hienThiTrangThaiNhacTrongNgan() {
    const box = document.getElementById("trangThaiNhacHomNay");
    const nutDemo = document.getElementById("nutMoNganDemo");
    if (!box || soNganHienTai === null) return;
    const homNay = ngayHomNay();
    // Không còn cấu hình ngăn thì không hiển thị lịch nhắc hiện tại.
    // Lịch sử vẫn tồn tại ở trang Lịch sử và không bị xóa.
    if (!duLieuNgan[soNganHienTai]) {
        box.style.display = "none";
        if (nutDemo) nutDemo.style.display = "none";
        return;
    }
    const rec = lichSu.find(x => Number(x.so_ngan) === Number(soNganHienTai) && x.ngay === homNay);
    if (!rec) {
        box.style.display = "none";
        if (nutDemo) nutDemo.style.display = "none";
        return;
    }
    const nhan = NHAC_TRANG_THAI_NHAN[rec.trang_thai] || "Chờ đến giờ";
    const lop = lopTrangThaiNhac(rec.trang_thai);
    box.style.display = "flex";
    box.innerHTML = `<div><strong>Lịch nhắc hôm nay</strong><small>Giờ nhắc ${escapeHTML(rec.gio_uong || "")}${rec.thoi_diem_mo_ngan ? " • Mở ngăn lúc " + escapeHTML(dinhDangThoiGian(rec.thoi_diem_mo_ngan)) : ""}</small></div><span class="status-pill ${lop}">${escapeHTML(nhan)}</span>`;
    if (nutDemo) nutDemo.style.display = (rec.trang_thai === "cho_den_gio" || rec.trang_thai === "dang_nhac") ? "inline-flex" : "none";
}

/* Kiểm tra định kỳ: (1) tự tạo lịch sử mới cho ngăn "Hằng ngày" khi sang ngày mới,
   (2) cập nhật trạng thái/số lần nhắc của lịch sử hôm nay dựa trên giờ hiện tại,
   (3) phát loa đúng khung giờ đang nhắc. */
async function kiemTraLichNhac() {
    if (dangKiemTraLichNhac || !db) return;
    dangKiemTraLichNhac = true;
    try {
        // Đồng bộ lịch sử mới nhất từ Supabase trước mỗi vòng kiểm tra.
        // Nhờ vậy các thiết bị A/B nhìn thấy trạng thái do thiết bị còn lại cập nhật.
        const { data: historyFresh, error: historyFreshError } = await db.from("lich_su")
            .select("*").eq("ma_tu", maTu).order("updated_at", { ascending: false });
        if (historyFreshError) throw historyFreshError;
        lichSu = historyFresh || [];

        const homNay = ngayHomNay();
        const now = new Date();

        for (let n = 1; n <= 16; n++) {
            const d = duLieuNgan[n];
            if (!d || !d.id || d.lapLai !== "hang_ngay" || !d.gioUong) continue;
            const daCo = lichSu.some(x => Number(x.so_ngan) === n && x.ngay === homNay);
            if (daCo) continue;
            const nguoi = layNguoi(d.nguoiSuDung);
            const lichKey = `${maTu}|${n}|${homNay}`;
            try {
                // Có thể xảy ra race giữa Lưu mới và vòng kiểm tra 5 giây.
                // Unique key trong DB là lớp bảo vệ cuối cùng chống tạo 2 dòng.
                const r = await db.from("lich_su").insert({
                    ma_tu: maTu, so_ngan: n, nguoi_su_dung_id: d.nguoiSuDung,
                    ten_nguoi: nguoi?.ten || "Chưa có thông tin", gio_uong: d.gioUong,
                    loi_nhan: d.loiNhan, bat_nhac: d.batNhac, ngay: homNay,
                    lap_lai: d.lapLai, trang_thai: "cho_den_gio", so_lan_nhac: 0,
                    lich_nhac_key: lichKey
                }).select().single();
                if (!r.error && r.data) { lichSu.unshift(r.data); capNhatHienThiSauLichNhac(); }
                else if (r.error) {
                    // 23505 = bản ghi hôm nay đã được thiết bị/luồng khác tạo.
                    // Không báo lỗi cho người dùng; vòng kiểm tra kế tiếp sẽ đọc lại dòng đó.
                    if (r.error.code !== "23505") console.warn("MEDBUDDY: không thể tạo lịch sử hằng ngày cho ngăn", n, r.error);
                }
            } catch (e) { console.warn("MEDBUDDY: không thể tạo lịch sử hằng ngày cho ngăn", n, e); }
        }

        const canXuLy = lichSu.filter(x => {
            const cauHinhNgan = duLieuNgan[Number(x.so_ngan)];
            return !!cauHinhNgan
                && x.ngay === homNay
                && (x.trang_thai === "cho_den_gio" || x.trang_thai === "dang_nhac" || !x.trang_thai)
                && x.gio_uong;
        });
        for (const rec of canXuLy) {
            const thoiDiemHen = ghepThoiDiemNhac(rec.ngay, rec.gio_uong);
            if (!thoiDiemHen) continue;
            const giaiDoan = tinhGiaiDoanNhac(thoiDiemHen, now);

            if (giaiDoan.trangThai !== (rec.trang_thai || "cho_den_gio") || giaiDoan.soLan !== (rec.so_lan_nhac || 0)) {
                const capNhat = { trang_thai: giaiDoan.trangThai, so_lan_nhac: giaiDoan.soLan };
                if (giaiDoan.hoanTat) capNhat.thoi_diem_hoan_tat = now.toISOString();
                try {
                    const { error } = await db.from("lich_su").update(capNhat).eq("id", rec.id);
                    if (!error) { Object.assign(rec, capNhat); capNhatHienThiSauLichNhac(); }
                } catch (e) { console.warn("MEDBUDDY: không thể cập nhật trạng thái nhắc:", e); }
            }

            const batNhacNgan = rec.bat_nhac !== false;
            if (giaiDoan.dangPhat && batNhacNgan) {
                phatLoiNhac(rec.id, rec.loi_nhan, giaiDoan.ketThucPhat);
            } else {
                dungPhatLoiNhac(rec.id);
            }
        }
    } finally {
        dangKiemTraLichNhac = false;
    }
}

/* Điểm kết nối cho cảm biến mở cửa của tủ thuốc trong tương lai.
   Việc xác nhận đã uống thuốc dựa vào sự kiện mở ngăn, không dựa vào nút bấm trên web. */
async function medbuddyGhiNhanMoNgan(soNgan) {
    if (!db) return;
    const homNay = ngayHomNay();

    // Luôn đọc lại từ Supabase trước khi xác nhận để thiết bị A/B dùng cùng
    // một bản ghi, thay vì phụ thuộc vào bản sao lichSu cũ trên trình duyệt.
    const { data: rec, error: findError } = await db.from("lich_su")
        .select("*")
        .eq("ma_tu", maTu)
        .eq("so_ngan", soNgan)
        .eq("ngay", homNay)
        .in("trang_thai", ["cho_den_gio", "dang_nhac"])
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (findError) {
        console.error("MEDBUDDY: không thể đọc lịch nhắc trước khi xác nhận mở ngăn:", findError);
        return;
    }
    if (!rec) {
        console.warn("MEDBUDDY: không tìm thấy lịch nhắc đang hoạt động cho ngăn", soNgan);
        return;
    }

    dungPhatLoiNhac(rec.id);
    const thoiDiem = new Date().toISOString();
    try {
        const { data: updated, error } = await db.from("lich_su").update({
            trang_thai: "da_dung_thuoc",
            thoi_diem_mo_ngan: thoiDiem,
            thoi_diem_hoan_tat: thoiDiem
        }).eq("id", rec.id)
          .in("trang_thai", ["cho_den_gio", "dang_nhac"])
          .select()
          .maybeSingle();
        if (error) throw error;

        // Nếu thiết bị khác vừa xác nhận trước đó thì không tạo trạng thái
        // mâu thuẫn; lần đọc kế tiếp sẽ đồng bộ dữ liệu từ DB.
        if (updated) {
            const local = lichSu.find(x => x.id === rec.id);
            if (local) Object.assign(local, updated);
            else lichSu.unshift(updated);
            capNhatHienThiSauLichNhac();
        }
    } catch (err) {
        console.error("MEDBUDDY: ghi nhận mở ngăn thất bại:", err);
    }
}
window.medbuddyGhiNhanMoNgan = medbuddyGhiNhanMoNgan;

/* Nút mô phỏng dùng để kiểm thử khi chưa có cảm biến phần cứng thật. */
function moNganDemo() {
    if (soNganHienTai === null) return;
    medbuddyGhiNhanMoNgan(soNganHienTai);
}

function ganSuKienLuuTrangThai() {
    ["nguoiSuDung", "gioUong", "loiNhan", "batNhac", "lapLai"].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("input", () => {
            if (document.getElementById("caiDat").style.display !== "none") luuTrangThai("caiDat");
        });
        el.addEventListener("change", () => {
            if (document.getElementById("caiDat").style.display !== "none") luuTrangThai("caiDat");
        });
    });
}

function luuTrangThaiTruocKhiReload() {
    try {
        const ids = [
            ["caiDat", "caiDat"],
            ["quanLyNguoi", "quanLyNguoi"],
            ["thongTinNguoiQuanLy", "thongTinNguoiQuanLy"],
            ["themNguoi", "themNguoi"],
            ["lichSu", "lichSu"],
            ["trangChinh", "trangChinh"]
        ];
        let view = "trangChinh";
        for (const [id, name] of ids) {
            const el = document.getElementById(id);
            if (el && el.style.display !== "none") { view = name; break; }
        }
        if (document.getElementById("xemLichSu")?.style.display !== "none") view = "xemLichSu";

        if (view === "caiDat") {
            luuTrangThai("caiDat");
        } else if (view === "quanLyNguoi") {
            luuTrangThai("quanLyNguoi");
        } else if (view === "thongTinNguoiQuanLy") {
            luuTrangThai("thongTinNguoiQuanLy");
        } else if (view === "themNguoi") {
            luuTrangThai("themNguoi");
        } else if (view === "lichSu") {
            luuTrangThai("lichSu");
        } else if (view === "xemLichSu") {
            luuTrangThai("xemLichSu");
        }
    } catch (e) {
        console.warn("Không thể lưu trang trước khi reload:", e);
    }
}

window.addEventListener("beforeunload", luuTrangThaiTruocKhiReload);

window.addEventListener("DOMContentLoaded", () => {
    const q = document.getElementById("maTuHienThi");
    if (q) q.textContent = maTu;
    const menuTu = document.getElementById("menuTuSelector");
    if (menuTu) menuTu.value = maTu;
    ganSuKienLuuTrangThai();
    (async () => {
        try {
            if (db) {
                await khoiTaoDuLieu();
            }
            await khoiPhucTrangThai();
            if (db) {
                kiemTraLichNhac();
                setInterval(kiemTraLichNhac, 5000);
            }
        } catch (err) {
            console.error("Không thể khởi tạo MEDBUDDY:", err);
            // Không ép về trang chủ khi F5. Nếu khôi phục thất bại, giữ trang bootstrap đã chọn.
            if (!localStorage.getItem(TRANG_THAI_KEY)) veTrangChinh();
        } finally {
            // Không ẩn toàn bộ main trong lúc khôi phục. CSS bootstrap đã chọn đúng trang từ đầu.
            document.documentElement.removeAttribute("data-med-view");
        }
    })();
});
