const maTu = "MEDBUDDY-TU-001";


// =========================
// NHẬN MÃ TỦ
// =========================

const thamSo = new URLSearchParams(window.location.search);
const maTuTuURL = thamSo.get("tu");

if (maTuTuURL) {
    document.getElementById("maTuHienThi").textContent = maTuTuURL;
}


// =========================
// DỮ LIỆU
// =========================

let duLieuNgan =
    JSON.parse(localStorage.getItem("duLieuNgan")) || {};

let danhSachNguoi =
    JSON.parse(localStorage.getItem("danhSachNguoi")) || [
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

let soNganHienTai = null;
let nguoiDangXem = null;


// =========================
// TÍNH TUỔI
// =========================

function tinhTuoi(ngaySinh) {

    if (!ngaySinh) {
        return "";
    }

    const ngayHienTai = new Date();
    const ngaySinhDate = new Date(ngaySinh);

    let tuoi =
        ngayHienTai.getFullYear() -
        ngaySinhDate.getFullYear();

    const chuaDenSinhNhat =
        ngayHienTai.getMonth() < ngaySinhDate.getMonth() ||
        (
            ngayHienTai.getMonth() === ngaySinhDate.getMonth() &&
            ngayHienTai.getDate() < ngaySinhDate.getDate()
        );

    if (chuaDenSinhNhat) {
        tuoi--;
    }

    return tuoi;
}


// =========================
// DROPDOWN
// =========================

function hienThiDanhSachNguoi() {

    const select =
        document.getElementById("nguoiSuDung");

    select.innerHTML =
        '<option value="">-- Chọn người sử dụng --</option>';

    danhSachNguoi.forEach(function(nguoi) {

        const option =
            document.createElement("option");

        option.value = nguoi.id;
        option.textContent = nguoi.ten;

        select.appendChild(option);
    });
}


// =========================
// HỒ SƠ TRONG NGĂN
// =========================

function hienThiHoSoTrongNgan(idNguoi) {

    const ten =
        document.getElementById("tenHoSo");

    const tuoi =
        document.getElementById("thongTinTuoi");

    const benh =
        document.getElementById("thongTinBenh");

    if (!idNguoi) {

        ten.textContent = "Tên: Chưa có thông tin";
        tuoi.textContent = "Tuổi: Chưa có thông tin";
        benh.textContent =
            "Tình trạng bệnh: Chưa có thông tin";

        return;
    }

    const nguoi =
        danhSachNguoi.find(function(item) {
            return item.id === idNguoi;
        });

    if (!nguoi) {
        return;
    }

    ten.textContent =
        "Tên: " + nguoi.ten;

    if (nguoi.hoSo && nguoi.hoSo.ngaySinh) {

        tuoi.textContent =
            "Tuổi: " +
            tinhTuoi(nguoi.hoSo.ngaySinh);

        benh.textContent =
            "Tình trạng bệnh: " +
            (
                nguoi.hoSo.tinhTrangBenh ||
                "Chưa có thông tin"
            );

    } else {

        tuoi.textContent =
            "Tuổi: Chưa có thông tin";

        benh.textContent =
            "Tình trạng bệnh: Chưa có thông tin";
    }
}


// =========================
// MỞ NGĂN
// =========================

function moNgan(soNgan) {

    soNganHienTai = soNgan;

    document.getElementById("trangChinh").style.display =
        "none";

    document.getElementById("caiDat").style.display =
        "block";

    document.getElementById("soNgan").textContent =
        soNgan;

    const duLieu =
        duLieuNgan[soNgan];

    if (duLieu) {

        document.getElementById("nguoiSuDung").value =
            duLieu.nguoiSuDung || "";

        document.getElementById("gioUong").value =
            duLieu.gioUong || "";

        document.getElementById("loiNhan").value =
            duLieu.loiNhan || "";

        hienThiHoSoTrongNgan(
            duLieu.nguoiSuDung
        );

    } else {

        document.getElementById("nguoiSuDung").value = "";
        document.getElementById("gioUong").value = "";
        document.getElementById("loiNhan").value = "";

        hienThiHoSoTrongNgan("");
    }
}


// =========================
// QUAY LẠI TỦ
// =========================

function quayLaiTu() {

    document.getElementById("caiDat").style.display =
        "none";

    document.getElementById("trangChinh").style.display =
        "block";

    hienThiDanhSachNguoi();
    hienThiDuLieuNgan();
}


// =========================
// LƯU CÀI ĐẶT NGĂN
// =========================

function luuCaiDat() {

    const nguoiSuDung =
        document.getElementById("nguoiSuDung").value;

    const gioUong =
        document.getElementById("gioUong").value;

    const loiNhan =
        document.getElementById("loiNhan").value.trim();

    if (
        nguoiSuDung === "" ||
        gioUong === "" ||
        loiNhan === ""
    ) {

        alert("Vui lòng nhập đầy đủ thông tin!");
        return;
    }

    duLieuNgan[soNganHienTai] = {

        nguoiSuDung: nguoiSuDung,

        gioUong: gioUong,

        loiNhan: loiNhan
    };

    localStorage.setItem(
        "duLieuNgan",
        JSON.stringify(duLieuNgan)
    );

    hienThiDuLieuNgan();

    alert("Đã lưu cài đặt thành công!");

    quayLaiTu();
}


// =========================
// ĐỔI NGƯỜI TRONG NGĂN
// =========================

document
    .getElementById("nguoiSuDung")
    .addEventListener("change", function() {

        hienThiHoSoTrongNgan(this.value);
    });


// =========================
// QUẢN LÝ NGƯỜI
// =========================

function moQuanLyNguoi() {

    document.getElementById("trangChinh").style.display =
        "none";

    document.getElementById("caiDat").style.display =
        "none";

    document.getElementById("quanLyNguoi").style.display =
        "block";

    document.getElementById("themNguoi").style.display =
        "none";

    document.getElementById("thongTinNguoiQuanLy").style.display =
        "none";

    hienThiDanhSachNguoiQuanLy();
}


// Khi đang ở trang cài đặt ngăn
function moQuanLyNguoiTuCaiDat() {

    document.getElementById("caiDat").style.display =
        "none";

    document.getElementById("quanLyNguoi").style.display =
        "block";

    document.getElementById("thongTinNguoiQuanLy").style.display =
        "none";

    document.getElementById("themNguoi").style.display =
        "none";

    hienThiDanhSachNguoiQuanLy();
}


function dongQuanLyNguoi() {

    document.getElementById("quanLyNguoi").style.display =
        "none";

    if (soNganHienTai !== null) {

        document.getElementById("caiDat").style.display =
            "block";

    } else {

        document.getElementById("trangChinh").style.display =
            "block";
    }
}


// =========================
// DANH SÁCH NGƯỜI
// =========================

function hienThiDanhSachNguoiQuanLy() {

    const danhSach =
        document.getElementById(
            "danhSachNguoiQuanLy"
        );

    danhSach.innerHTML = "";

    if (danhSachNguoi.length === 0) {

        danhSach.textContent =
            "Chưa có người sử dụng.";

        return;
    }

    danhSachNguoi.forEach(function(nguoi) {

        const dong =
            document.createElement("button");

        dong.type = "button";

        dong.textContent =
            nguoi.ten;

        dong.className =
            "dong-nguoi";

        dong.onclick =
            function() {

                moThongTinNguoiQuanLy(
                    nguoi.id
                );
            };

        danhSach.appendChild(dong);
    });
}


// =========================
// THÔNG TIN NGƯỜI
// =========================

function moThongTinNguoiQuanLy(idNguoi) {

    const nguoi =
        danhSachNguoi.find(function(item) {
            return item.id === idNguoi;
        });

    if (!nguoi) {
        return;
    }

    nguoiDangXem = idNguoi;

    document.getElementById("quanLyNguoi").style.display =
        "none";

    document.getElementById("thongTinNguoiQuanLy").style.display =
        "block";

    hienThiThongTinNguoi(nguoi);

    document.getElementById("nutXemNguoi").style.display =
        "block";

    document.getElementById("nutSuaNguoi").style.display =
        "none";
}


// =========================
// HIỂN THỊ DẠNG XEM
// =========================

function hienThiThongTinNguoi(nguoi) {

    const hoSo =
        nguoi.hoSo || {};

    const khuVuc =
        document.getElementById(
            "khuVucThongTinNguoi"
        );

    khuVuc.innerHTML = "";

    const taoDong = function(tieuDe, noiDung) {

        const p =
            document.createElement("p");

        const strong =
            document.createElement("strong");

        strong.textContent =
            tieuDe + ": ";

        const span =
            document.createElement("span");

        span.textContent =
            noiDung || "Chưa có thông tin";

        p.appendChild(strong);
        p.appendChild(span);

        khuVuc.appendChild(p);
    };

    taoDong(
        "Tên",
        nguoi.ten
    );

    taoDong(
        "Ngày sinh",
        hoSo.ngaySinh
    );

    taoDong(
        "Tuổi",
        hoSo.ngaySinh
            ? tinhTuoi(hoSo.ngaySinh)
            : "Chưa có thông tin"
    );

    taoDong(
        "Tình trạng bệnh",
        hoSo.tinhTrangBenh
    );

    taoDong(
        "Các loại thuốc đang dùng",
        hoSo.thuocDangDung
    );

    taoDong(
        "Ghi chú",
        hoSo.ghiChu
    );
}


// =========================
// QUAY LẠI DANH SÁCH
// =========================

function quayLaiDanhSachNguoi() {

    document.getElementById(
        "thongTinNguoiQuanLy"
    ).style.display = "none";

    document.getElementById(
        "quanLyNguoi"
    ).style.display = "block";

    nguoiDangXem = null;

    hienThiDanhSachNguoiQuanLy();
}


// =========================
// THÊM NGƯỜI
// =========================

function moThemNguoi() {

    document.getElementById(
        "quanLyNguoi"
    ).style.display = "none";

    document.getElementById(
        "themNguoi"
    ).style.display = "block";

    document.getElementById(
        "tenNguoiMoi"
    ).value = "";

    document.getElementById(
        "ngaySinhNguoiMoi"
    ).value = "";

    document.getElementById(
        "benhNguoiMoi"
    ).value = "";

    document.getElementById(
        "thuocNguoiMoi"
    ).value = "";

    document.getElementById(
        "ghiChuNguoiMoi"
    ).value = "";
}


function dongThemNguoi() {

    document.getElementById(
        "themNguoi"
    ).style.display = "none";

    document.getElementById(
        "quanLyNguoi"
    ).style.display = "block";
}


function themNguoi() {

    const ten =
        document.getElementById(
            "tenNguoiMoi"
        ).value.trim();

    const ngaySinh =
        document.getElementById(
            "ngaySinhNguoiMoi"
        ).value;

    const benh =
        document.getElementById(
            "benhNguoiMoi"
        ).value.trim();

    const thuoc =
        document.getElementById(
            "thuocNguoiMoi"
        ).value.trim();

    const ghiChu =
        document.getElementById(
            "ghiChuNguoiMoi"
        ).value.trim();

    if (
        ten === "" ||
        ngaySinh === ""
    ) {

        alert(
            "Tên và ngày sinh là bắt buộc!"
        );

        return;
    }

    const nguoiMoi = {

        id:
            "nguoi-" +
            Date.now(),

        ten:
            ten,

        hoSo: {

            ngaySinh:
                ngaySinh,

            tinhTrangBenh:
                benh,

            thuocDangDung:
                thuoc,

            ghiChu:
                ghiChu
        }
    };

    danhSachNguoi.push(
        nguoiMoi
    );

    localStorage.setItem(
        "danhSachNguoi",
        JSON.stringify(danhSachNguoi)
    );

    hienThiDanhSachNguoi();

    alert(
        "Đã thêm người sử dụng thành công!"
    );

    document.getElementById(
        "themNguoi"
    ).style.display = "none";

    document.getElementById(
        "quanLyNguoi"
    ).style.display = "block";

    hienThiDanhSachNguoiQuanLy();
}


// =========================
// CHỈNH SỬA TRỰC TIẾP
// =========================

function moChinhSuaNguoi() {

    if (!nguoiDangXem) {
        return;
    }

    const nguoi =
        danhSachNguoi.find(function(item) {
            return item.id === nguoiDangXem;
        });

    if (!nguoi) {
        return;
    }

    const hoSo =
        nguoi.hoSo || {};

    const khuVuc =
        document.getElementById(
            "khuVucThongTinNguoi"
        );

    khuVuc.innerHTML = `

        <div class="dong-chinh-sua">
            <label>Tên</label>
            <input
                type="text"
                id="suaTenNguoi"
            >
        </div>

        <div class="dong-chinh-sua">
            <label>Ngày sinh</label>
            <input
                type="date"
                id="suaNgaySinhNguoi"
            >
        </div>

        <div class="dong-chinh-sua">
            <label>Tuổi</label>
            <input
                type="text"
                id="tuoiDangSua"
                readonly
            >
        </div>

        <div class="dong-chinh-sua">
            <label>Tình trạng bệnh</label>
            <input
                type="text"
                id="suaBenhNguoi"
            >
        </div>

        <div class="dong-chinh-sua">
            <label>Các loại thuốc đang dùng</label>
            <textarea
                id="suaThuocNguoi"
            ></textarea>
        </div>

        <div class="dong-chinh-sua">
            <label>Ghi chú</label>
            <textarea
                id="suaGhiChuNguoi"
            ></textarea>
        </div>
    `;


    document.getElementById(
        "suaTenNguoi"
    ).value =
        nguoi.ten;

    document.getElementById(
        "suaNgaySinhNguoi"
    ).value =
        hoSo.ngaySinh || "";

    document.getElementById(
        "suaBenhNguoi"
    ).value =
        hoSo.tinhTrangBenh || "";

    document.getElementById(
        "suaThuocNguoi"
    ).value =
        hoSo.thuocDangDung || "";

    document.getElementById(
        "suaGhiChuNguoi"
    ).value =
        hoSo.ghiChu || "";

    document.getElementById(
        "tuoiDangSua"
    ).value =
        hoSo.ngaySinh
            ? tinhTuoi(hoSo.ngaySinh)
            : "";


    document.getElementById(
        "suaNgaySinhNguoi"
    ).addEventListener(
        "change",
        function() {

            document.getElementById(
                "tuoiDangSua"
            ).value =
                this.value
                    ? tinhTuoi(this.value)
                    : "";
        }
    );


    // ẨN NÚT CHỈNH SỬA + XÓA
    document.getElementById(
        "nutXemNguoi"
    ).style.display = "none";


    // HIỆN NÚT LƯU + HỦY
    document.getElementById(
        "nutSuaNguoi"
    ).style.display = "block";
}


// =========================
// HỦY CHỈNH SỬA
// =========================

function huyChinhSuaNguoi() {

    if (!nguoiDangXem) {
        return;
    }

    const nguoi =
        danhSachNguoi.find(function(item) {
            return item.id === nguoiDangXem;
        });

    if (!nguoi) {
        return;
    }

    // Trả lại giao diện xem
    hienThiThongTinNguoi(nguoi);

    document.getElementById(
        "nutSuaNguoi"
    ).style.display = "none";

    document.getElementById(
        "nutXemNguoi"
    ).style.display = "block";
}


// =========================
// LƯU CHỈNH SỬA
// =========================

function luuChinhSuaNguoi() {

    if (!nguoiDangXem) {
        return;
    }

    const nguoi =
        danhSachNguoi.find(function(item) {
            return item.id === nguoiDangXem;
        });

    if (!nguoi) {
        return;
    }

    const ten =
        document.getElementById(
            "suaTenNguoi"
        ).value.trim();

    const ngaySinh =
        document.getElementById(
            "suaNgaySinhNguoi"
        ).value;

    const benh =
        document.getElementById(
            "suaBenhNguoi"
        ).value.trim();

    const thuoc =
        document.getElementById(
            "suaThuocNguoi"
        ).value.trim();

    const ghiChu =
        document.getElementById(
            "suaGhiChuNguoi"
        ).value.trim();


    if (
        ten === "" ||
        ngaySinh === ""
    ) {

        alert(
            "Tên và ngày sinh là bắt buộc!"
        );

        return;
    }


    nguoi.ten =
        ten;

    nguoi.hoSo = {

        ngaySinh:
            ngaySinh,

        tinhTrangBenh:
            benh,

        thuocDangDung:
            thuoc,

        ghiChu:
            ghiChu
    };


    localStorage.setItem(
        "danhSachNguoi",
        JSON.stringify(danhSachNguoi)
    );


    // CẬP NHẬT DROPDOWN
    hienThiDanhSachNguoi();


    // CẬP NHẬT CÁC NGĂN
    hienThiDuLieuNgan();


    // QUAY VỀ GIAO DIỆN XEM
    hienThiThongTinNguoi(nguoi);


    document.getElementById(
        "nutSuaNguoi"
    ).style.display = "none";

    document.getElementById(
        "nutXemNguoi"
    ).style.display = "block";


    alert(
        "Đã lưu thông tin thành công!"
    );
}


// =========================
// XÓA NGƯỜI
// =========================

function xoaNguoi() {

    if (!nguoiDangXem) {
        return;
    }

    const nguoi =
        danhSachNguoi.find(function(item) {
            return item.id === nguoiDangXem;
        });

    if (!nguoi) {
        return;
    }

    const xacNhan =
        confirm(
            "Bạn có chắc muốn xóa " +
            nguoi.ten +
            " không?"
        );

    if (!xacNhan) {
        return;
    }


    danhSachNguoi =
        danhSachNguoi.filter(function(item) {
            return item.id !== nguoiDangXem;
        });


    // Xóa người khỏi các ngăn
    Object.keys(duLieuNgan).forEach(
        function(soNgan) {

            if (
                duLieuNgan[soNgan] &&
                duLieuNgan[soNgan].nguoiSuDung ===
                nguoiDangXem
            ) {

                delete duLieuNgan[soNgan];
            }
        }
    );


    localStorage.setItem(
        "danhSachNguoi",
        JSON.stringify(danhSachNguoi)
    );

    localStorage.setItem(
        "duLieuNgan",
        JSON.stringify(duLieuNgan)
    );


    hienThiDanhSachNguoi();

    hienThiDuLieuNgan();


    alert(
        "Đã xóa người sử dụng!"
    );


    nguoiDangXem = null;


    document.getElementById(
        "thongTinNguoiQuanLy"
    ).style.display = "none";


    document.getElementById(
        "quanLyNguoi"
    ).style.display = "block";


    hienThiDanhSachNguoiQuanLy();
}


// =========================
// HIỂN THỊ DỮ LIỆU NGĂN
// =========================

function hienThiDuLieuNgan() {

    for (
        let soNgan = 1;
        soNgan <= 16;
        soNgan++
    ) {

        const oThongTin =
            document.getElementById(
                "thongTin" + soNgan
            );

        if (!oThongTin) {
            continue;
        }

        const duLieu =
            duLieuNgan[soNgan];

        if (!duLieu) {

            oThongTin.innerHTML = "";

            continue;
        }

        const nguoi =
            danhSachNguoi.find(function(item) {
                return item.id ===
                    duLieu.nguoiSuDung;
            });

        if (!nguoi) {

            oThongTin.innerHTML = "";

            continue;
        }

        oThongTin.innerHTML =
            nguoi.ten +
            "<br>" +
            duLieu.gioUong +
            "<br>" +
            "<small>✓ Đã cài đặt</small>";
    }
}


// =========================
// KHỞI ĐỘNG
// =========================

hienThiDanhSachNguoi();

hienThiDuLieuNgan();