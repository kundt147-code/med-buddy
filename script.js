const maTu = "MEDBUDDY-1";

const thamSo = new URLSearchParams(window.location.search);
const maTuTuURL = thamSo.get("tu");

if (maTuTuURL) {
    document.getElementById("maTuHienThi").textContent = maTuTuURL;
}

let duLieuNgan = JSON.parse(localStorage.getItem("duLieuNgan")) || {};
let danhSachNguoi = JSON.parse(localStorage.getItem("danhSachNguoi")) || [
    {
        id: "nguoi-1",
        ten: "Nguyễn Văn A",
        hoSo: {
            ngaySinh: "1956-05-20",
            tinhTrangBenh: "Tiểu đường, huyết áp cao",
            thuocDangDung: "Metformin, Amlodipine",
            ghiChu: "Cần được nhắc uống thuốc đúng giờ"
        }
    },
    {
        id: "nguoi-2",
        ten: "Trần Thị B",
        hoSo: {
            ngaySinh: "1960-08-15",
            tinhTrangBenh: "Huyết áp cao",
            thuocDangDung: "Amlodipine",
            ghiChu: ""
        }
    },
    {
        id: "nguoi-3",
        ten: "Lê Văn C",
        hoSo: {
            ngaySinh: "1958-03-10",
            tinhTrangBenh: "Chưa có thông tin",
            thuocDangDung: "Chưa có thông tin",
            ghiChu: ""
        }
    }
];

let lichSu = JSON.parse(localStorage.getItem("lichSuMEDBUDDY")) || [];
let soNganHienTai = null;
let nguoiDangXem = null;
let dangChinhSuaNgan = false;

function khoiTaoQR() {
    const qrImage = document.getElementById("qrImage");
    const urlTu = window.location.origin + window.location.pathname + "?tu=" + encodeURIComponent(maTu);
    qrImage.src = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(urlTu);
}

function tinhTuoi(ngaySinh) {
    if (!ngaySinh) return "";
    const ngayHienTai = new Date();
    const ngaySinhDate = new Date(ngaySinh);
    let tuoi = ngayHienTai.getFullYear() - ngaySinhDate.getFullYear();
    const chuaDenSinhNhat =
        ngayHienTai.getMonth() < ngaySinhDate.getMonth() ||
        (ngayHienTai.getMonth() === ngaySinhDate.getMonth() && ngayHienTai.getDate() < ngaySinhDate.getDate());
    if (chuaDenSinhNhat) tuoi--;
    return tuoi;
}

function anTatCaTrang() {
    ["trangChinh", "caiDat", "quanLyNguoi", "thongTinNguoiQuanLy", "themNguoi", "lichSu"].forEach(function(id) {
        document.getElementById(id).style.display = "none";
    });
}

function capNhatNav(activeId) {
    ["navTrangChu", "navLichSu", "navThongTin", "navCaiDat"].forEach(function(id) {
        const nut = document.getElementById(id);
        if (nut) nut.classList.toggle("active", id === activeId);
    });
}

function veTrangChinh() {
    anTatCaTrang();
    document.getElementById("trangChinh").style.display = "block";
    capNhatNav("navTrangChu");
    hienThiDuLieuNgan();
}

function hienThiDanhSachNguoi() {
    const select = document.getElementById("nguoiSuDung");
    select.innerHTML = '<option value="">-- Chọn người sử dụng --</option>';
    danhSachNguoi.forEach(function(nguoi) {
        const option = document.createElement("option");
        option.value = nguoi.id;
        option.textContent = nguoi.ten;
        select.appendChild(option);
    });
}

function hienThiHoSoTrongNgan(idNguoi) {
    const ten = document.getElementById("tenHoSo");
    const tuoi = document.getElementById("thongTinTuoi");
    const benh = document.getElementById("thongTinBenh");

    if (!idNguoi) {
        ten.textContent = "Chưa có thông tin";
        tuoi.textContent = "Tuổi: Chưa có thông tin";
        benh.textContent = "Tình trạng bệnh: Chưa có thông tin";
        return;
    }

    const nguoi = danhSachNguoi.find(function(item) { return item.id === idNguoi; });
    if (!nguoi) return;

    ten.textContent = nguoi.ten;
    tuoi.textContent = nguoi.hoSo && nguoi.hoSo.ngaySinh
        ? "Tuổi: " + tinhTuoi(nguoi.hoSo.ngaySinh)
        : "Tuổi: Chưa có thông tin";
    benh.textContent = "Tình trạng bệnh: " + ((nguoi.hoSo && nguoi.hoSo.tinhTrangBenh) || "Chưa có thông tin");
}

function datCheDoForm(cheDo) {
    const nguoi = document.getElementById("nguoiSuDung");
    const gio = document.getElementById("gioUong");
    const loi = document.getElementById("loiNhan");
    const nhac = document.getElementById("batNhac");

    const khoa = cheDo === "xem";
    nguoi.disabled = khoa;
    gio.disabled = khoa;
    loi.disabled = khoa;
    nhac.disabled = khoa;

    document.getElementById("nutCaiDatMoi").style.display = cheDo === "moi" ? "flex" : "none";
    document.getElementById("nutCaiDatDaCo").style.display = cheDo === "xem" ? "flex" : "none";
    document.getElementById("nutCaiDatDangSua").style.display = cheDo === "sua" ? "flex" : "none";
}

function moNgan(soNgan) {
    soNganHienTai = soNgan;
    dangChinhSuaNgan = false;
    anTatCaTrang();
    document.getElementById("caiDat").style.display = "block";
    capNhatNav("");
    document.getElementById("soNgan").textContent = "MED 1 - Ngăn " + soNgan;
    hienThiDanhSachNguoi();

    const duLieu = duLieuNgan[soNgan];
    if (duLieu) {
        document.getElementById("nguoiSuDung").value = duLieu.nguoiSuDung || "";
        document.getElementById("gioUong").value = duLieu.gioUong || "";
        document.getElementById("loiNhan").value = duLieu.loiNhan || "";
        document.getElementById("batNhac").checked = duLieu.batNhac !== false;
        hienThiHoSoTrongNgan(duLieu.nguoiSuDung);
        datCheDoForm("xem");
    } else {
        document.getElementById("nguoiSuDung").value = "";
        document.getElementById("gioUong").value = "";
        document.getElementById("loiNhan").value = "";
        document.getElementById("batNhac").checked = true;
        hienThiHoSoTrongNgan("");
        datCheDoForm("moi");
    }
}

function quayLaiTu() { veTrangChinh(); }

function layDuLieuForm() {
    return {
        nguoiSuDung: document.getElementById("nguoiSuDung").value,
        gioUong: document.getElementById("gioUong").value,
        loiNhan: document.getElementById("loiNhan").value.trim(),
        batNhac: document.getElementById("batNhac").checked
    };
}

function kiemTraDuLieu(duLieu) {
    if (!duLieu.nguoiSuDung || !duLieu.gioUong || !duLieu.loiNhan) {
        alert("Vui lòng nhập đầy đủ thông tin!");
        return false;
    }
    return true;
}

function luuDuLieuNgan(duLieu) {
    duLieuNgan[soNganHienTai] = duLieu;
    localStorage.setItem("duLieuNgan", JSON.stringify(duLieuNgan));
}

function taoLichSuMoi(duLieu) {
    const nguoi = danhSachNguoi.find(function(item) { return item.id === duLieu.nguoiSuDung; });
    const banGhi = {
        id: "ls-" + Date.now(),
        soNgan: soNganHienTai,
        nguoiSuDung: duLieu.nguoiSuDung,
        tenNguoi: nguoi ? nguoi.ten : "Chưa có thông tin",
        gioUong: duLieu.gioUong,
        loiNhan: duLieu.loiNhan,
        batNhac: duLieu.batNhac,
        thoiGianTao: new Date().toISOString(),
        thoiGianCapNhat: new Date().toISOString()
    };
    lichSu.unshift(banGhi);
    localStorage.setItem("lichSuMEDBUDDY", JSON.stringify(lichSu));
}

function capNhatLichSuCu(duLieu) {
    const banGhi = lichSu.find(function(item) { return Number(item.soNgan) === Number(soNganHienTai); });
    const nguoi = danhSachNguoi.find(function(item) { return item.id === duLieu.nguoiSuDung; });

    if (!banGhi) {
        taoLichSuMoi(duLieu);
        return;
    }

    banGhi.nguoiSuDung = duLieu.nguoiSuDung;
    banGhi.tenNguoi = nguoi ? nguoi.ten : "Chưa có thông tin";
    banGhi.gioUong = duLieu.gioUong;
    banGhi.loiNhan = duLieu.loiNhan;
    banGhi.batNhac = duLieu.batNhac;
    banGhi.thoiGianCapNhat = new Date().toISOString();
    localStorage.setItem("lichSuMEDBUDDY", JSON.stringify(lichSu));
}

function luuMoi() {
    const duLieu = layDuLieuForm();
    if (!kiemTraDuLieu(duLieu)) return;

    luuDuLieuNgan(duLieu);
    taoLichSuMoi(duLieu);
    alert("Đã lưu mới thành công!");
    veTrangChinh();
}

function batDauChinhSuaNgan() {
    dangChinhSuaNgan = true;
    datCheDoForm("sua");
}

function huyChinhSuaNgan() {
    if (soNganHienTai === null) return;
    const duLieu = duLieuNgan[soNganHienTai];
    if (duLieu) {
        document.getElementById("nguoiSuDung").value = duLieu.nguoiSuDung || "";
        document.getElementById("gioUong").value = duLieu.gioUong || "";
        document.getElementById("loiNhan").value = duLieu.loiNhan || "";
        document.getElementById("batNhac").checked = duLieu.batNhac !== false;
        hienThiHoSoTrongNgan(duLieu.nguoiSuDung);
    }
    dangChinhSuaNgan = false;
    datCheDoForm("xem");
}

function luuChinhSuaNgan() {
    const duLieu = layDuLieuForm();
    if (!kiemTraDuLieu(duLieu)) return;

    luuDuLieuNgan(duLieu);
    capNhatLichSuCu(duLieu);
    alert("Đã lưu thay đổi thành công!");
    dangChinhSuaNgan = false;
    datCheDoForm("xem");
}

document.getElementById("nguoiSuDung").addEventListener("change", function() {
    hienThiHoSoTrongNgan(this.value);
});

function moQuanLyNguoi() {
    anTatCaTrang();
    document.getElementById("quanLyNguoi").style.display = "block";
    capNhatNav("navThongTin");
    hienThiDanhSachNguoiQuanLy();
}

function dongQuanLyNguoi() { veTrangChinh(); }

function hienThiDanhSachNguoiQuanLy() {
    const danhSach = document.getElementById("danhSachNguoiQuanLy");
    danhSach.innerHTML = "";
    danhSachNguoi.forEach(function(nguoi) {
        const dong = document.createElement("button");
        dong.type = "button";
        dong.className = "person-row";
        const ten = document.createElement("strong");
        ten.textContent = nguoi.ten;
        const moTa = document.createElement("span");
        moTa.textContent = "Xem thông tin →";
        dong.appendChild(ten);
        dong.appendChild(moTa);
        dong.onclick = function() { moThongTinNguoiQuanLy(nguoi.id); };
        danhSach.appendChild(dong);
    });
}

function moThongTinNguoiQuanLy(idNguoi) {
    const nguoi = danhSachNguoi.find(function(item) { return item.id === idNguoi; });
    if (!nguoi) return;
    nguoiDangXem = idNguoi;
    anTatCaTrang();
    document.getElementById("thongTinNguoiQuanLy").style.display = "block";
    capNhatNav("navThongTin");
    hienThiThongTinNguoi(nguoi);
    document.getElementById("nutXemNguoi").style.display = "flex";
    document.getElementById("nutSuaNguoi").style.display = "none";
}

function hienThiThongTinNguoi(nguoi) {
    const hoSo = nguoi.hoSo || {};
    document.getElementById("khuVucThongTinNguoi").innerHTML = `
        <div class="user-summary">
            <div class="avatar">👤</div>
            <div>
                <p class="muted">Người sử dụng</p>
                <h3>${escapeHTML(nguoi.ten)}</h3>
                <span class="role-tag">Người thân</span>
            </div>
        </div>
        <div class="info-grid">
            <div class="info-item"><strong>Ngày sinh</strong><p>${escapeHTML(hoSo.ngaySinh || "Chưa có thông tin")}</p></div>
            <div class="info-item"><strong>Tuổi</strong><p>${hoSo.ngaySinh ? tinhTuoi(hoSo.ngaySinh) : "Chưa có thông tin"}</p></div>
            <div class="info-item"><strong>Tình trạng bệnh</strong><p>${escapeHTML(hoSo.tinhTrangBenh || "Chưa có thông tin")}</p></div>
            <div class="info-item"><strong>Các loại thuốc đang dùng</strong><p>${escapeHTML(hoSo.thuocDangDung || "Chưa có thông tin")}</p></div>
            <div class="info-item"><strong>Ghi chú</strong><p>${escapeHTML(hoSo.ghiChu || "Chưa có thông tin")}</p></div>
        </div>`;
}

function quayLaiDanhSachNguoi() {
    anTatCaTrang();
    document.getElementById("quanLyNguoi").style.display = "block";
    capNhatNav("navThongTin");
    nguoiDangXem = null;
    hienThiDanhSachNguoiQuanLy();
}

function moThemNguoi() {
    anTatCaTrang();
    document.getElementById("themNguoi").style.display = "block";
    document.getElementById("tenNguoiMoi").value = "";
    document.getElementById("ngaySinhNguoiMoi").value = "";
    document.getElementById("benhNguoiMoi").value = "";
    document.getElementById("thuocNguoiMoi").value = "";
    document.getElementById("ghiChuNguoiMoi").value = "";
    capNhatNav("navThongTin");
}

function dongThemNguoi() { moQuanLyNguoi(); }

function themNguoi() {
    const ten = document.getElementById("tenNguoiMoi").value.trim();
    const ngaySinh = document.getElementById("ngaySinhNguoiMoi").value;
    const benh = document.getElementById("benhNguoiMoi").value.trim();
    const thuoc = document.getElementById("thuocNguoiMoi").value.trim();
    const ghiChu = document.getElementById("ghiChuNguoiMoi").value.trim();

    if (!ten || !ngaySinh) {
        alert("Tên và ngày tháng năm sinh là bắt buộc!");
        return;
    }

    danhSachNguoi.push({
        id: "nguoi-" + Date.now(),
        ten: ten,
        hoSo: { ngaySinh: ngaySinh, tinhTrangBenh: benh, thuocDangDung: thuoc, ghiChu: ghiChu }
    });

    localStorage.setItem("danhSachNguoi", JSON.stringify(danhSachNguoi));
    hienThiDanhSachNguoi();
    alert("Đã thêm người sử dụng!");
    moQuanLyNguoi();
}

function moChinhSuaNguoi() {
    if (!nguoiDangXem) return;
    const nguoi = danhSachNguoi.find(function(item) { return item.id === nguoiDangXem; });
    if (!nguoi) return;
    const hoSo = nguoi.hoSo || {};

    document.getElementById("khuVucThongTinNguoi").innerHTML = `
        <h3>Chỉnh sửa thông tin</h3>
        <div class="form-card">
            <label>Tên</label><input class="edit-input" type="text" id="suaTenNguoi" value="${escapeHTML(nguoi.ten)}">
            <label>Ngày sinh</label><input class="edit-input" type="date" id="suaNgaySinhNguoi" value="${hoSo.ngaySinh || ""}">
            <label>Tình trạng bệnh</label><input class="edit-input" type="text" id="suaBenhNguoi" value="${escapeHTML(hoSo.tinhTrangBenh || "")}">
            <label>Các loại thuốc đang dùng</label><textarea class="edit-textarea" id="suaThuocNguoi">${escapeHTML(hoSo.thuocDangDung || "")}</textarea>
            <label>Ghi chú</label><textarea class="edit-textarea" id="suaGhiChuNguoi">${escapeHTML(hoSo.ghiChu || "")}</textarea>
        </div>`;

    document.getElementById("nutXemNguoi").style.display = "none";
    document.getElementById("nutSuaNguoi").style.display = "flex";
}

function huyChinhSuaNguoi() {
    if (!nguoiDangXem) return;
    const nguoi = danhSachNguoi.find(function(item) { return item.id === nguoiDangXem; });
    if (!nguoi) return;
    hienThiThongTinNguoi(nguoi);
    document.getElementById("nutSuaNguoi").style.display = "none";
    document.getElementById("nutXemNguoi").style.display = "flex";
}

function luuChinhSuaNguoi() {
    if (!nguoiDangXem) return;
    const nguoi = danhSachNguoi.find(function(item) { return item.id === nguoiDangXem; });
    if (!nguoi) return;

    const ten = document.getElementById("suaTenNguoi").value.trim();
    const ngaySinh = document.getElementById("suaNgaySinhNguoi").value;
    if (!ten || !ngaySinh) {
        alert("Tên và ngày tháng năm sinh là bắt buộc!");
        return;
    }

    const tenCu = nguoi.ten;
    nguoi.ten = ten;
    nguoi.hoSo = {
        ngaySinh: ngaySinh,
        tinhTrangBenh: document.getElementById("suaBenhNguoi").value.trim(),
        thuocDangDung: document.getElementById("suaThuocNguoi").value.trim(),
        ghiChu: document.getElementById("suaGhiChuNguoi").value.trim()
    };

    localStorage.setItem("danhSachNguoi", JSON.stringify(danhSachNguoi));

    // Đồng bộ tên trong lịch sử nếu người đó đã có lịch sử.
    lichSu.forEach(function(item) {
        if (item.nguoiSuDung === nguoiDangXem) item.tenNguoi = nguoi.ten;
    });
    localStorage.setItem("lichSuMEDBUDDY", JSON.stringify(lichSu));

    hienThiThongTinNguoi(nguoi);
    document.getElementById("nutSuaNguoi").style.display = "none";
    document.getElementById("nutXemNguoi").style.display = "flex";
    hienThiDanhSachNguoi();
    hienThiDuLieuNgan();
    alert(tenCu !== ten ? "Đã lưu thông tin thành công!" : "Đã lưu thông tin thành công!");
}

function xoaNguoi() {
    if (!nguoiDangXem) return;
    const nguoi = danhSachNguoi.find(function(item) { return item.id === nguoiDangXem; });
    if (!nguoi) return;
    if (!confirm("Bạn có chắc muốn xóa " + nguoi.ten + " không?")) return;

    danhSachNguoi = danhSachNguoi.filter(function(item) { return item.id !== nguoiDangXem; });

    Object.keys(duLieuNgan).forEach(function(soNgan) {
        if (duLieuNgan[soNgan] && duLieuNgan[soNgan].nguoiSuDung === nguoiDangXem) delete duLieuNgan[soNgan];
    });

    localStorage.setItem("danhSachNguoi", JSON.stringify(danhSachNguoi));
    localStorage.setItem("duLieuNgan", JSON.stringify(duLieuNgan));
    hienThiDanhSachNguoi();
    hienThiDuLieuNgan();
    alert("Đã xóa người sử dụng!");
    moQuanLyNguoi();
}

function hienThiDuLieuNgan() {
    for (let soNgan = 1; soNgan <= 16; soNgan++) {
        const oThongTin = document.getElementById("thongTin" + soNgan);
        if (!oThongTin) continue;
        const duLieu = duLieuNgan[soNgan];

        if (!duLieu) {
            oThongTin.className = "";
            oThongTin.innerHTML = "Chưa có thông tin";
            continue;
        }

        const nguoi = danhSachNguoi.find(function(item) { return item.id === duLieu.nguoiSuDung; });
        if (nguoi) {
            oThongTin.className = "da-cai-dat";
            oThongTin.innerHTML = escapeHTML(nguoi.ten) + "<br>" + escapeHTML(duLieu.gioUong || "") + "<br>✓ Đã cài đặt";
        } else {
            oThongTin.className = "";
            oThongTin.innerHTML = "Chưa có thông tin";
        }
    }
}

function moLichSu() {
    anTatCaTrang();
    document.getElementById("lichSu").style.display = "block";
    capNhatNav("navLichSu");
    hienThiLichSu();
}

function dinhDangNgay(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    return date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

function hienThiLichSu() {
    const danhSach = document.getElementById("danhSachLichSu");
    danhSach.innerHTML = "";

    if (lichSu.length === 0) {
        danhSach.innerHTML = '<div class="history-empty">Chưa có lịch sử cài đặt nào.</div>';
        return;
    }

    lichSu.forEach(function(item) {
        const div = document.createElement("div");
        div.className = "history-item";
        div.innerHTML = `
            <div class="history-item-top">
                <h3>MED 1 - Ngăn ${escapeHTML(item.soNgan)}</h3>
                <span class="history-time">${escapeHTML(dinhDangNgay(item.thoiGianCapNhat || item.thoiGianTao))}</span>
            </div>
            <p><strong>Người sử dụng:</strong> ${escapeHTML(item.tenNguoi || "Chưa có thông tin")}</p>
            <p><strong>Giờ uống:</strong> ${escapeHTML(item.gioUong || "Chưa có thông tin")}</p>
            <p><strong>Lời nhắn:</strong> ${escapeHTML(item.loiNhan || "Chưa có thông tin")}</p>
            <span class="history-badge ${item.batNhac === false ? "off" : ""}">${item.batNhac === false ? "Nhắc nhở tắt" : "Nhắc nhở bật"}</span>`;
        danhSach.appendChild(div);
    });
}

function escapeHTML(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Khi đổi trạng thái công tắc, chỉ lưu khi người dùng đang ở chế độ sửa.
document.getElementById("batNhac").addEventListener("change", function() {
    if (!dangChinhSuaNgan && duLieuNgan[soNganHienTai]) {
        this.checked = duLieuNgan[soNganHienTai].batNhac !== false;
    }
});

hienThiDanhSachNguoi();
hienThiDuLieuNgan();
khoiTaoQR();
