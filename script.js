/* MEDBUDDY - Supabase sync version */
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
let nguoiTuNgan = null;
let dangTaiDuLieu = false;

function escapeHTML(t) { return String(t ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
function hienThiModal(title,msg,type="success",confirmText="Đóng",onConfirm=null){
    const m=document.getElementById("modal");
    document.getElementById("modalTitle").textContent=title;
    document.getElementById("modalMessage").textContent=msg;
    document.getElementById("modalIcon").textContent=type==="confirm"?"?":type==="error"?"!":"✓";
    const a=document.getElementById("modalActions"); a.innerHTML="";
    if(type==="confirm"){
        const c=document.createElement("button"); c.className="secondary-btn"; c.textContent="Hủy"; c.onclick=()=>dongModal();
        const ok=document.createElement("button"); ok.className=type==="confirm"?"danger-btn":"primary-btn"; ok.textContent=confirmText;
        ok.onclick=()=>{dongModal();if(onConfirm)onConfirm()}; a.append(c,ok);
    } else { const b=document.createElement("button"); b.className="primary-btn"; b.textContent=confirmText; b.onclick=dongModal; a.append(b); }
    m.style.display="grid";
}
function dongModal(){document.getElementById("modal").style.display="none"}
function baoDangPhatTrien(){hienThiModal("Thông báo","Chức năng đang trong giai đoạn phát triển","info")}
function moMenu(){document.getElementById("sideMenu").classList.add("open");document.getElementById("menuOverlay").classList.add("open")}
function dongMenu(){document.getElementById("sideMenu").classList.remove("open");document.getElementById("menuOverlay").classList.remove("open")}
function anTatCaTrang(){["trangChinh","caiDat","quanLyNguoi","thongTinNguoiQuanLy","themNguoi","lichSu","xemLichSu"].forEach(id=>document.getElementById(id).style.display="none")}
function veTrangChinh(){anTatCaTrang();document.getElementById("trangChinh").style.display="block";hienThiDuLieuNgan()}
function tinhTuoi(iso){if(!iso)return"";const d=new Date(iso+"T00:00:00"),n=new Date();let age=n.getFullYear()-d.getFullYear();if(n.getMonth()<d.getMonth()||(n.getMonth()===d.getMonth()&&n.getDate()<d.getDate()))age--;return age}
function dinhDangNgaySinh(iso){if(!iso)return"Chưa có thông tin";const [y,m,d]=iso.split("-");return `${d}/${m}/${y}`}
function dinhDangThoiGian(v){if(!v)return"";if(/^\d{2}:\d{2}/.test(v))return v.slice(0,5);const d=new Date(v);return isNaN(d)?String(v):d.toLocaleDateString("vi-VN")+" "+d.toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"})}
function tenNgan(n){if(n<=4)return`Sáng ${n}`;if(n<=8)return`Trưa ${n-4}`;if(n<=12)return`Tối ${n-8}`;return`Khác ${n-12}`}
function hienThiDanhSachNguoi(){const s=document.getElementById("nguoiSuDung");if(!s)return;s.innerHTML='<option value="">-- Chọn người sử dụng --</option>';danhSachNguoi.forEach(n=>{const o=document.createElement("option");o.value=n.id;o.textContent=n.ten;s.appendChild(o)})}
function hienThiHoSoTrongNgan(id){const n=danhSachNguoi.find(x=>String(x.id)===String(id));const ten=document.getElementById("tenHoSo");if(!n){ten.textContent="Chưa có thông tin";document.getElementById("thongTinTuoi").textContent="Tuổi: Chưa có thông tin";document.getElementById("thongTinBenh").textContent="Tình trạng bệnh: Chưa có thông tin";nguoiTuNgan=null;return}nguoiTuNgan=n.id;ten.textContent=n.ten;document.getElementById("thongTinTuoi").textContent="Tuổi: "+(n.ngay_sinh?tinhTuoi(n.ngay_sinh):"Chưa có thông tin");document.getElementById("thongTinBenh").textContent="Tình trạng bệnh: "+(n.tinh_trang_benh||"Chưa có thông tin")}
function datKhoaForm(khoa){["nguoiSuDung","gioUong","loiNhan","batNhac"].forEach(id=>{const el=document.getElementById(id);if(el)el.disabled=khoa})}
function capNhatNutNgap(){document.getElementById("nutNhap").style.display=!dangNhap&&!dangChinhSuaNgan?"flex":"none";document.getElementById("nutLuaChonNhap").style.display=dangNhap&&!dangChinhSuaNgan?"flex":"none";document.getElementById("nutCaiDatDangSua").style.display=dangChinhSuaNgan?"flex":"none";datKhoaForm(!dangNhap&&!dangChinhSuaNgan);document.getElementById("trangThaiNgan").textContent=dangChinhSuaNgan?"Đang chỉnh sửa":dangNhap?"Đang nhập thông tin":"Chế độ xem";document.getElementById("moTaTrangThai").textContent=dangChinhSuaNgan?"Chỉnh sửa dòng lịch sử hiện tại":dangNhap?"Chọn cách lưu thông tin":"Thông tin hiện tại của ngăn"}

async function taiDuLieuTuDB(){
    dangTaiDuLieu=true;
    const {data: people,error:e1}=await db.from("nguoi_su_dung").select("*").eq("ma_tu",maTu).order("id");
    if(e1) throw e1;
    danhSachNguoi=people||[];
    const {data: slots,error:e2}=await db.from("ngan_thuoc").select("*").eq("ma_tu",maTu).order("so_ngan");
    if(e2) throw e2;
    duLieuNgan={};
    (slots||[]).forEach(x=>{duLieuNgan[x.so_ngan]={id:x.id,nguoiSuDung:x.nguoi_su_dung_id,gioUong:x.gio_uong||"",loiNhan:x.loi_nhan||"",batNhac:x.bat_nhac!==false}});
    const {data: history,error:e3}=await db.from("lich_su").select("*").eq("ma_tu",maTu).order("updated_at",{ascending:false});
    if(e3) throw e3;
    lichSu=history||[];
    hienThiDanhSachNguoi(); hienThiDuLieuNgan();
    dangTaiDuLieu=false;
}

async function khoiTaoDuLieu(){
    try{
        const {data: tu,error}=await db.from("tu_thuoc").select("ma_tu").eq("ma_tu",maTu).maybeSingle();
        if(error) throw error;
        if(!tu){const r=await db.from("tu_thuoc").insert({ma_tu:maTu,ten_tu:maTu});if(r.error)throw r.error;}
        const {count,error:e}=await db.from("nguoi_su_dung").select("id",{count:"exact",head:true}).eq("ma_tu",maTu);
        if(e)throw e;
        if(count===0){
            const defaults=[
                {ma_tu:maTu,ten:"Nguyễn Văn A",ngay_sinh:"1956-05-20",tinh_trang_benh:"Tiểu đường, huyết áp cao",thuoc_dang_dung:"Metformin, Amlodipine",ghi_chu:"Cần được nhắc uống thuốc đúng giờ"},
                {ma_tu:maTu,ten:"Trần Thị B",ngay_sinh:"1960-08-15",tinh_trang_benh:"Huyết áp cao",thuoc_dang_dung:"Amlodipine",ghi_chu:""},
                {ma_tu:maTu,ten:"Lê Văn C",ngay_sinh:"1958-03-10",tinh_trang_benh:"Chưa có thông tin",thuoc_dang_dung:"Chưa có thông tin",ghi_chu:""}
            ];
            const r=await db.from("nguoi_su_dung").insert(defaults);if(r.error)throw r.error;
        }
        await taiDuLieuTuDB();
    }catch(err){dangTaiDuLieu=false;console.error(err);hienThiModal("Không thể kết nối","Không thể tải dữ liệu MEDBUDDY. Kiểm tra Supabase và cấu hình database.","error");}
}

async function moNgan(n){soNganHienTai=n;dangNhap=false;dangChinhSuaNgan=false;anTatCaTrang();document.getElementById("caiDat").style.display="block";document.getElementById("soNgan").textContent=`MED 1 - ${tenNgan(n)}`;hienThiDanhSachNguoi();const d=duLieuNgan[n];document.getElementById("nguoiSuDung").value=d?.nguoiSuDung||"";document.getElementById("gioUong").value=d?.gioUong||"";document.getElementById("loiNhan").value=d?.loiNhan||"";document.getElementById("batNhac").checked=d?.batNhac!==false;hienThiHoSoTrongNgan(d?.nguoiSuDung||"");capNhatNutNgap()}
function quayLaiTu(){if(dangNhap||dangChinhSuaNgan){hienThiModal("Xác nhận","Bạn có chắc muốn ngừng nhập thông tin cho ngăn này không?","confirm","Ngừng nhập",()=>{dangNhap=false;dangChinhSuaNgan=false;moNgan(soNganHienTai)})}else veTrangChinh()}
function layForm(){return{nguoiSuDung:document.getElementById("nguoiSuDung").value?Number(document.getElementById("nguoiSuDung").value):null,gioUong:document.getElementById("gioUong").value,loiNhan:document.getElementById("loiNhan").value.trim(),batNhac:document.getElementById("batNhac").checked}}
function kiemTra(d){if(!d.nguoiSuDung||!d.gioUong||!d.loiNhan){hienThiModal("Thiếu thông tin","Vui lòng nhập đầy đủ thông tin cho ngăn này.","error");return false}return true}
function batDauNhap(){dangNhap=true;dangChinhSuaNgan=false;capNhatNutNgap()}
function huyNhap(){if(!dangNhap&&!dangChinhSuaNgan){veTrangChinh();return}hienThiModal("Xác nhận","Bạn có chắc muốn ngừng nhập thông tin cho ngăn này không?","confirm","Ngừng nhập",()=>{dangNhap=false;dangChinhSuaNgan=false;moNgan(soNganHienTai)})}

async function luuMoi(){const d=layForm();if(!kiemTra(d))return;try{
    const {data:slot,error:e1}=await db.from("ngan_thuoc").upsert({ma_tu:maTu,so_ngan:soNganHienTai,nguoi_su_dung_id:d.nguoiSuDung,gio_uong:d.gioUong,loi_nhan:d.loiNhan,bat_nhac:d.batNhac,updated_at:new Date().toISOString()},{onConflict:"ma_tu,so_ngan"}).select().single();
    if(e1)throw e1;
    const n=danhSachNguoi.find(x=>Number(x.id)===d.nguoiSuDung);
    const {error:e2}=await db.from("lich_su").insert({ma_tu:maTu,so_ngan:soNganHienTai,nguoi_su_dung_id:d.nguoiSuDung,ten_nguoi:n?.ten||"Chưa có thông tin",gio_uong:d.gioUong,loi_nhan:d.loiNhan,bat_nhac:d.batNhac});
    if(e2)throw e2;
    duLieuNgan[soNganHienTai]={id:slot.id,...d};
    await taiDuLieuTuDB();
    hienThiModal("Đã lưu","Đã lưu mới thành công!","success","Đóng",()=>{dangNhap=false;moNgan(soNganHienTai)});
}catch(err){console.error(err);hienThiModal("Lỗi lưu dữ liệu","Không thể lưu dữ liệu. Vui lòng thử lại.","error")}}

function batDauChinhSuaNgan(){if(!duLieuNgan[soNganHienTai]){hienThiModal("Chưa có dữ liệu","Ngăn này chưa có dữ liệu để chỉnh sửa.","error");return}dangNhap=false;dangChinhSuaNgan=true;capNhatNutNgap()}
function huyChinhSuaNgan(){const d=duLieuNgan[soNganHienTai];if(d){document.getElementById("nguoiSuDung").value=d.nguoiSuDung||"";document.getElementById("gioUong").value=d.gioUong||"";document.getElementById("loiNhan").value=d.loiNhan||"";document.getElementById("batNhac").checked=d.batNhac!==false;hienThiHoSoTrongNgan(d.nguoiSuDung)}dangChinhSuaNgan=false;capNhatNutNgap()}
async function luuChinhSuaNgan(){const d=layForm();if(!kiemTra(d))return;try{
    const {error:e1}=await db.from("ngan_thuoc").update({nguoi_su_dung_id:d.nguoiSuDung,gio_uong:d.gioUong,loi_nhan:d.loiNhan,bat_nhac:d.batNhac,updated_at:new Date().toISOString()}).eq("ma_tu",maTu).eq("so_ngan",soNganHienTai);
    if(e1)throw e1;
    const {data:latest,error:e2}=await db.from("lich_su").select("id").eq("ma_tu",maTu).eq("so_ngan",soNganHienTai).order("updated_at",{ascending:false}).limit(1);
    if(e2)throw e2;
    const n=danhSachNguoi.find(x=>Number(x.id)===d.nguoiSuDung);
    if(latest?.length){
        const {error:e3}=await db.from("lich_su").update({nguoi_su_dung_id:d.nguoiSuDung,ten_nguoi:n?.ten||"Chưa có thông tin",gio_uong:d.gioUong,loi_nhan:d.loiNhan,bat_nhac:d.batNhac,updated_at:new Date().toISOString()}).eq("id",latest[0].id);
        if(e3)throw e3;
    } else {
        const r=await db.from("lich_su").insert({ma_tu:maTu,so_ngan:soNganHienTai,nguoi_su_dung_id:d.nguoiSuDung,ten_nguoi:n?.ten||"Chưa có thông tin",gio_uong:d.gioUong,loi_nhan:d.loiNhan,bat_nhac:d.batNhac});
        if(r.error)throw r.error;
    }
    await taiDuLieuTuDB();
    hienThiModal("Đã cập nhật","Đã chỉnh sửa thông tin thành công!","success","Đóng",()=>{dangChinhSuaNgan=false;moNgan(soNganHienTai)});
}catch(err){console.error(err);hienThiModal("Lỗi cập nhật","Không thể cập nhật dữ liệu. Vui lòng thử lại.","error")}}

document.getElementById("nguoiSuDung").addEventListener("change",e=>hienThiHoSoTrongNgan(e.target.value));
function moNguoiTuNgan(){if(nguoiTuNgan)moThongTinNguoiQuanLy(nguoiTuNgan)}
function moQuanLyNguoi(){trangTruocQuanLy=document.getElementById("caiDat").style.display!=="none"?"caiDat":"trangChinh";anTatCaTrang();document.getElementById("quanLyNguoi").style.display="block";hienThiDanhSachNguoiQuanLy()}
function dongQuanLyNguoi(){if(trangTruocQuanLy==="caiDat"&&soNganHienTai!==null)moNgan(soNganHienTai);else veTrangChinh()}
function hienThiDanhSachNguoiQuanLy(){const box=document.getElementById("danhSachNguoiQuanLy");box.innerHTML="";danhSachNguoi.forEach(n=>{const b=document.createElement("button");b.className="person-row";b.innerHTML=`<strong>${escapeHTML(n.ten)}</strong><span>Xem thông tin →</span>`;b.onclick=()=>moThongTinNguoiQuanLy(n.id);box.appendChild(b)})}
function moThongTinNguoiQuanLy(id){const n=danhSachNguoi.find(x=>String(x.id)===String(id));if(!n)return;nguoiDangXem=id;anTatCaTrang();document.getElementById("thongTinNguoiQuanLy").style.display="block";hienThiThongTinNguoi(n);document.getElementById("nutXemNguoi").style.display="flex";document.getElementById("nutSuaNguoi").style.display="none"}
function hienThiThongTinNguoi(n){const h=n;document.getElementById("khuVucThongTinNguoi").innerHTML=`<div class="user-summary"><div class="avatar">👤</div><div><p class="muted">Người sử dụng</p><h3>${escapeHTML(n.ten)}</h3><span class="role-tag">Hồ sơ người thân</span></div></div><div class="info-grid"><div class="info-item"><strong>Ngày sinh</strong><p>${dinhDangNgaySinh(h.ngay_sinh)}</p></div><div class="info-item"><strong>Tuổi</strong><p>${h.ngay_sinh?tinhTuoi(h.ngay_sinh):"Chưa có thông tin"}</p></div><div class="info-item"><strong>Tình trạng bệnh</strong><p>${escapeHTML(h.tinh_trang_benh||"Chưa có thông tin")}</p></div><div class="info-item"><strong>Các loại thuốc đang dùng</strong><p>${escapeHTML(h.thuoc_dang_dung||"Chưa có thông tin")}</p></div><div class="info-item"><strong>Ghi chú</strong><p>${escapeHTML(h.ghi_chu||"Chưa có thông tin")}</p></div></div>`}
function quayLaiDanhSachNguoi(){moQuanLyNguoi()}
function moThemNguoi(){anTatCaTrang();document.getElementById("themNguoi").style.display="block";["tenNguoiMoi","ngaySinhNguoiMoi","benhNguoiMoi","thuocNguoiMoi","ghiChuNguoiMoi"].forEach(id=>document.getElementById(id).value="")}
function dongThemNguoi(){moQuanLyNguoi()}
async function themNguoi(){const ten=document.getElementById("tenNguoiMoi").value.trim(),ngay=document.getElementById("ngaySinhNguoiMoi").value;if(!ten||!ngay){hienThiModal("Thiếu thông tin","Tên và ngày sinh là bắt buộc.","error");return}try{const {error}=await db.from("nguoi_su_dung").insert({ma_tu:maTu,ten,ngay_sinh:ngay,tinh_trang_benh:document.getElementById("benhNguoiMoi").value.trim(),thuoc_dang_dung:document.getElementById("thuocNguoiMoi").value.trim(),ghi_chu:document.getElementById("ghiChuNguoiMoi").value.trim()});if(error)throw error;await taiDuLieuTuDB();hienThiModal("Đã thêm người","Đã thêm người sử dụng thành công!","success","Đóng",()=>moQuanLyNguoi())}catch(err){console.error(err);hienThiModal("Lỗi","Không thể thêm người sử dụng.","error")}}
function moChinhSuaNguoi(){const n=danhSachNguoi.find(x=>String(x.id)===String(nguoiDangXem));if(!n)return;document.getElementById("khuVucThongTinNguoi").innerHTML=`<h3>Chỉnh sửa thông tin</h3><div class="form-card"><label>Tên</label><input class="edit-input" id="suaTenNguoi" value="${escapeHTML(n.ten)}"><label>Ngày sinh</label><input class="edit-input" type="date" id="suaNgaySinhNguoi" value="${n.ngay_sinh||""}"><label>Tình trạng bệnh</label><input class="edit-input" id="suaBenhNguoi" value="${escapeHTML(n.tinh_trang_benh||"")}"><label>Các loại thuốc đang dùng</label><textarea class="edit-textarea" id="suaThuocNguoi">${escapeHTML(n.thuoc_dang_dung||"")}</textarea><label>Ghi chú</label><textarea class="edit-textarea" id="suaGhiChuNguoi">${escapeHTML(n.ghi_chu||"")}</textarea></div>`;document.getElementById("nutXemNguoi").style.display="none";document.getElementById("nutSuaNguoi").style.display="flex"}
function huyChinhSuaNguoi(){const n=danhSachNguoi.find(x=>String(x.id)===String(nguoiDangXem));if(n)hienThiThongTinNguoi(n);document.getElementById("nutSuaNguoi").style.display="none";document.getElementById("nutXemNguoi").style.display="flex"}
function luuChinhSuaNguoi(){const n=danhSachNguoi.find(x=>String(x.id)===String(nguoiDangXem));if(!n)return;const ten=document.getElementById("suaTenNguoi").value.trim(),ngay=document.getElementById("suaNgaySinhNguoi").value;if(!ten||!ngay){hienThiModal("Thiếu thông tin","Tên và ngày sinh là bắt buộc.","error");return}hienThiModal("Xác nhận lưu","Bạn có chắc muốn lưu thay đổi thông tin người sử dụng này không?","confirm","Lưu thay đổi",async()=>{try{const {error}=await db.from("nguoi_su_dung").update({ten,ngay_sinh:ngay,tinh_trang_benh:document.getElementById("suaBenhNguoi").value.trim(),thuoc_dang_dung:document.getElementById("suaThuocNguoi").value.trim(),ghi_chu:document.getElementById("suaGhiChuNguoi").value.trim()}).eq("id",n.id).eq("ma_tu",maTu);if(error)throw error;await taiDuLieuTuDB();const fresh=danhSachNguoi.find(x=>Number(x.id)===Number(n.id));hienThiThongTinNguoi(fresh);document.getElementById("nutSuaNguoi").style.display="none";document.getElementById("nutXemNguoi").style.display="flex";hienThiModal("Đã lưu","Đã lưu thông tin thành công!")}catch(err){console.error(err);hienThiModal("Lỗi","Không thể lưu thay đổi.","error")}})}
function xoaNguoi(){const n=danhSachNguoi.find(x=>String(x.id)===String(nguoiDangXem));if(!n)return;hienThiModal("Xác nhận xóa","Bạn có chắc muốn xóa "+n.ten+" không?","confirm","Xóa",async()=>{try{const {error}=await db.from("nguoi_su_dung").delete().eq("id",n.id).eq("ma_tu",maTu);if(error)throw error;await taiDuLieuTuDB();hienThiModal("Đã xóa","Đã xóa người sử dụng thành công!","success","Đóng",()=>moQuanLyNguoi())}catch(err){console.error(err);hienThiModal("Lỗi","Không thể xóa người sử dụng.","error")}})}
function hienThiDuLieuNgan(){for(let i=1;i<=16;i++){const o=document.getElementById("thongTin"+i),d=duLieuNgan[i],n=danhSachNguoi.find(x=>Number(x.id)===Number(d?.nguoiSuDung));if(!d||!n){o.className="";o.textContent="Chưa có thông tin"}else{o.className="da-cai-dat";o.innerHTML=`${escapeHTML(n.ten)}<br><b>◷ ${escapeHTML(d.gioUong||"")}</b>`}}}
function moLichSu(){anTatCaTrang();document.getElementById("lichSu").style.display="block";hienThiLichSu()}
function hienThiLichSu(){const box=document.getElementById("danhSachLichSu");box.innerHTML="";if(!lichSu.length){box.innerHTML='<div class="history-item">Chưa có lịch sử cài đặt nào.</div>';return}lichSu.forEach(x=>{const d=document.createElement("div");d.className="history-item";d.innerHTML=`<div class="history-item-top"><h3>MED 1 - ${escapeHTML(tenNgan(Number(x.so_ngan)))}</h3><span class="history-time">${escapeHTML(dinhDangThoiGian(x.updated_at||x.created_at))}</span></div><p><strong>Người sử dụng:</strong> ${escapeHTML(x.ten_nguoi||"Chưa có thông tin")}</p><p><strong>Giờ uống:</strong> ${escapeHTML(x.gio_uong||"Chưa có thông tin")}</p><span class="history-badge ${x.bat_nhac===false?"off":""}">${x.bat_nhac===false?"Nhắc nhở tắt":"Nhắc nhở bật"}</span>`;d.onclick=()=>xemLichSu(x.id);box.appendChild(d)})}
function xemLichSu(id){const x=lichSu.find(h=>Number(h.id)===Number(id));if(!x)return;anTatCaTrang();document.getElementById("xemLichSu").style.display="block";document.getElementById("tieuDeLichSu").textContent=`MED 1 - ${tenNgan(Number(x.so_ngan))} • ${dinhDangThoiGian(x.created_at)}`;const n=danhSachNguoi.find(p=>Number(p.id)===Number(x.nguoi_su_dung_id));document.getElementById("noiDungXemLichSu").innerHTML=`<div class="view-field"><strong>Người sử dụng</strong><button class="history-person-link" onclick="moThongTinNguoiQuanLy(${x.nguoi_su_dung_id||0})">${escapeHTML(n?.ten||x.ten_nguoi||"Chưa có thông tin")} → Xem hồ sơ</button></div><div class="view-field"><strong>Giờ uống</strong>${escapeHTML(x.gio_uong||"Chưa có thông tin")}</div><div class="view-field"><strong>Lời nhắn</strong>${escapeHTML(x.loi_nhan||"Chưa có thông tin")}</div><div class="view-field"><strong>Nhắc nhở</strong>${x.bat_nhac===false?"Đang tắt":"Đang bật"}</div>`}

window.addEventListener("DOMContentLoaded",()=>{const q=document.getElementById("maTuHienThi");if(q)q.textContent=maTu;khoiTaoDuLieu()});
