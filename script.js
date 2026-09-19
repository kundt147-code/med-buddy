/* MEDBUDDY - V6: Supabase sync + custom modal + history viewer */
const SUPABASE_URL = "https://zkbqjmpwxaukfytnnjjl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_442VMaVK-Dvy92tJ0Ky_Fw_FT5Rbbg3";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

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
    if (!nguoi || !gio || !loi || !nhac) return null;
    return {
        nguoiSuDung: nguoi.value || "",
        gioUong: gio.value || "",
        loiNhan: loi.value || "",
        batNhac: !!nhac.checked
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
    ["nguoiSuDung", "gioUong", "loiNhan", "batNhac"].forEach(id => {
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
            batNhac: x.bat_nhac !== false
        };
    });

    const { data: history, error: e3 } = await db.from("lich_su").select("*").eq("ma_tu", maTu).order("updated_at", { ascending: false });
    if (e3) throw e3;
    lichSu = history || [];

    hienThiDanhSachNguoi();
    hienThiDuLieuNgan();
    if (document.getElementById("lichSu").style.display !== "none") hienThiLichSu();
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
    hienThiHoSoTrongNgan(d?.nguoiSuDung || "");
    capNhatNutNgap();
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
        batNhac: document.getElementById("batNhac").checked
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
                .update({ nguoi_su_dung_id: d.nguoiSuDung, gio_uong: d.gioUong, loi_nhan: d.loiNhan, bat_nhac: d.batNhac, updated_at: new Date().toISOString() })
                .eq("id", oldSlot.id)
                .select()
                .single();
            if (r.error) throw r.error;
            slot = r.data;
        } else {
            const r = await db.from("ngan_thuoc")
                .insert({ ma_tu: maTu, so_ngan: soNganHienTai, nguoi_su_dung_id: d.nguoiSuDung, gio_uong: d.gioUong, loi_nhan: d.loiNhan, bat_nhac: d.batNhac })
                .select()
                .single();
            if (r.error) throw r.error;
            slot = r.data;
        }

        const n = layNguoi(d.nguoiSuDung);
        const historyResult = await db.from("lich_su").insert({
            ma_tu: maTu,
            so_ngan: soNganHienTai,
            nguoi_su_dung_id: d.nguoiSuDung,
            ten_nguoi: n?.ten || "Chưa có thông tin",
            gio_uong: d.gioUong,
            loi_nhan: d.loiNhan,
            bat_nhac: d.batNhac
        }).select().single();
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
            .update({ nguoi_su_dung_id: d.nguoiSuDung, gio_uong: d.gioUong, loi_nhan: d.loiNhan, bat_nhac: d.batNhac, updated_at: new Date().toISOString() })
            .eq("id", old.id)
            .select()
            .single();
        if (r.error) throw r.error;

        const { data: latest, error: historyFindError } = await db.from("lich_su")
            .select("id")
            .eq("ma_tu", maTu)
            .eq("so_ngan", soNganHienTai)
            .order("updated_at", { ascending: false })
            .limit(1);
        if (historyFindError) throw historyFindError;

        const n = layNguoi(d.nguoiSuDung);
        if (latest?.length) {
            const hr = await db.from("lich_su").update({
                nguoi_su_dung_id: d.nguoiSuDung,
                ten_nguoi: n?.ten || "Chưa có thông tin",
                gio_uong: d.gioUong,
                loi_nhan: d.loiNhan,
                bat_nhac: d.batNhac,
                updated_at: new Date().toISOString()
            }).eq("id", latest[0].id);
            if (hr.error) throw hr.error;
        } else {
            const hr = await db.from("lich_su").insert({
                ma_tu: maTu,
                so_ngan: soNganHienTai,
                nguoi_su_dung_id: d.nguoiSuDung,
                ten_nguoi: n?.ten || "Chưa có thông tin",
                gio_uong: d.gioUong,
                loi_nhan: d.loiNhan,
                bat_nhac: d.batNhac
            });
            if (hr.error) throw hr.error;
        }

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
            await taiDuLieuTuDB();
            dangNhap = false;
            dangChinhSuaNgan = false;
            await moNgan(soNganHienTai);
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
            o.innerHTML = `${escapeHTML(n.ten)}<br><b>◷ ${escapeHTML(d.gioUong || "")}</b><br><span>✓ Đã cài đặt</span>`;
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
        d.innerHTML = `
            <div class="history-item-top">
                <div><h3>MED 1 - ${escapeHTML(tenNgan(Number(x.so_ngan)))}</h3><span class="history-time">${escapeHTML(dinhDangNgayGio(x.created_at || x.updated_at))}</span></div>
                <span class="history-arrow">›</span>
            </div>
            <p><strong>Người sử dụng:</strong> ${escapeHTML(x.ten_nguoi || "Chưa có thông tin")}</p>
            <p><strong>Giờ uống:</strong> ${escapeHTML(x.gio_uong || "Chưa có thông tin")}</p>
            <span class="history-badge ${x.bat_nhac === false ? "off" : ""}">${x.bat_nhac === false ? "Nhắc nhở tắt" : "Nhắc nhở bật"}</span>
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
    const wrap = document.getElementById("noiDungXemLichSu");
    wrap.innerHTML = `
        <div class="history-view-grid">
            <div class="view-field"><strong>Người sử dụng</strong><button id="historyPersonButton" type="button" class="history-person-link">${escapeHTML(n?.ten || x.ten_nguoi || "Chưa có thông tin")} <span>→ Xem hồ sơ</span></button></div>
            <div class="view-field"><strong>Ngày nhập lịch sử</strong>${escapeHTML(dinhDangNgayGio(x.created_at || x.updated_at))}</div>
            <div class="view-field"><strong>Giờ uống</strong>${escapeHTML(x.gio_uong || "Chưa có thông tin")}</div>
            <div class="view-field"><strong>Lời nhắn</strong>${escapeHTML(x.loi_nhan || "Chưa có thông tin")}</div>
            <div class="view-field"><strong>Nhắc nhở</strong>${x.bat_nhac === false ? "Đang tắt" : "Đang bật"}</div>
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


function ganSuKienLuuTrangThai() {
    ["nguoiSuDung", "gioUong", "loiNhan", "batNhac"].forEach(id => {
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
        await khoiTaoDuLieu();
        await khoiPhucTrangThai();
    })();
});
