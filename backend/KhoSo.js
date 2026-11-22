// ============================================================
// SỔ KHO (kiểu ERP) – trừ tồn thật lúc GIAO HÀNG, có thẻ kho, kiểm kê, mốc tồn.
//
// NGUYÊN TẮC (KiotViet vẫn là sổ kho gốc):
//  • Sheet "Tồn kho" (dán từ KiotViet) = ảnh chụp tồn tại một thời điểm = "MỐC TỒN".
//  • Từ mốc đó app tự cộng / trừ theo sổ kho cho tới lần dán sau:
//        Tồn thực  = Tồn mốc  − hàng đã giao (sau mốc)  + hoàn kho (hàng trả về)  + phiếu nhập (sau mốc)  ± kiểm kê
//        Đang giữ  = hàng của đơn mới / chừa hàng / đã xác nhận / đang giao mà CHƯA giao
//        Được bán  = Tồn thực − Đang giữ
//  • Dán tồn KiotViet mới -> mốc đặt lại (tự động khi dán, hoặc bấm "Chốt mốc tồn") -> các dòng sổ kho trước mốc
//    không tính nữa (KiotViet đã gồm rồi) -> KHÔNG bị trừ 2 lần.
//  • Lên đơn / chừa hàng / duyệt chỉ GIỮ hàng (giảm "Được bán"); tồn thực chỉ trừ khi bấm "Đã giao" (nhập số thực giao,
//    có thể giao từng phần, phần trả về được cấn trừ).
// Tab "Sổ kho": mỗi dòng 1 biến động (xuất ghi số ÂM, hoàn / nhập ghi số DƯƠNG).
// ============================================================
var TAB_SO_KHO = 'Sổ kho';
var TD_SO_KHO = ['Thời gian', 'Loại', 'Chứng từ', 'Mã hàng', 'Tên hàng', 'Số lượng', 'Đơn vị', 'Quy đổi (m²)', 'Kho', 'Người', 'Ghi chú'];
var LOAI_XUAT = 'Xuất kho giao hàng', LOAI_HOAN = 'Hoàn kho (hàng trả về)', LOAI_DC = 'Điều chỉnh kiểm kê';

function lam2(n) { return Math.round(Number(n) * 100) / 100; }
function isoDe(v) { return v instanceof Date ? v.toISOString() : chu(v); }

// ---------- Mốc tồn ----------
function sigTon(data) {
  var n = 0, s = 0;
  Object.keys(data).forEach(function (ma) { n++; s += Number(data[ma].tong) || 0; });
  return n + ':' + Math.round(s * 1000) / 1000;
}
function docMoc() {
  var pr = PropertiesService.getScriptProperties(), luc = pr.getProperty('TON_MOC');
  if (!luc) { luc = new Date().toISOString(); pr.setProperty('TON_MOC', luc); } // lần đầu dùng sổ kho: mốc = bây giờ
  return { luc: luc, sig: pr.getProperty('TON_MOC_SIG') || '', nguoi: pr.getProperty('TON_MOC_NGUOI') || '', gc: pr.getProperty('TON_MOC_GC') || '' };
}
// Chốt mốc: p.gc ghi chú. Gọi sau khi dán tồn KiotViet mới (dán bằng copy-paste thì onEdit đã tự chốt).
function chotMoc(p, ti) {
  var res = docTonKho(), pr = PropertiesService.getScriptProperties();
  if (res.status !== 'ok') return res;
  pr.setProperty('TON_MOC', new Date().toISOString());
  pr.setProperty('TON_MOC_SIG', sigTon(res.data));
  pr.setProperty('TON_MOC_NGUOI', ti ? ti.user : '');
  pr.setProperty('TON_MOC_GC', chu(p && p.gc).slice(0, 200));
  demXoa('sokho'); demXoa('tonkho');
  ghiNhatKy(ti, 'Chốt mốc tồn', '', 'tồn KiotViet mới – ' + Object.keys(res.data).length + ' mã còn hàng' + (chu(p && p.gc) ? ' · ' + chu(p.gc).slice(0, 100) : ''));
  return { status: 'ok', msg: 'Đã chốt mốc tồn lúc ' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'HH:mm dd/MM/yyyy') + ' – các biến động trước đó không tính nữa.' };
}
// Gọi từ onEdit: dán nhiều ô vào tab tồn kho = tồn mới -> tự đặt lại mốc (xóa chữ ký để lần đọc sau tự ghi lại).
function tuChotMocKhiDan(e) {
  try {
    var n = e.range.getNumRows() * e.range.getNumColumns();
    if (n < 40) return; // sửa tay vài ô thì không đổi mốc
    var pr = PropertiesService.getScriptProperties();
    pr.setProperty('TON_MOC', new Date().toISOString()); pr.setProperty('TON_MOC_SIG', ''); pr.setProperty('TON_MOC_NGUOI', 'tự động khi dán'); pr.setProperty('TON_MOC_GC', '');
    demXoa('sokho');
  } catch (err) { }
}

// ---------- Đọc / ghi sổ kho ----------
function docSoKho() {
  var c = demLay('sokho');
  if (c) return c;
  var sh = layTab(TAB_SO_KHO, false), ds = [];
  if (sh && sh.getLastRow() > 1) {
    var rows = sh.getDataRange().getValues(), cc = timCot(rows[0], { luc: ['Thời gian'], loai: ['Loại'], ct: ['Chứng từ'], ma: ['Mã hàng'], ten: ['Tên hàng'], sl: ['Số lượng'], dv: ['Đơn vị'], m2: ['Quy đổi (m²)'], kho: ['Kho'], ng: ['Người'], gc: ['Ghi chú'] });
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i], o = function (k) { return cc[k] === undefined ? '' : r[cc[k]]; };
      if (!chu(o('ma'))) continue;
      ds.push({ luc: isoDe(o('luc')), loai: chu(o('loai')), ct: chu(o('ct')), ma: chu(o('ma')), ten: chu(o('ten')), sl: Number(o('sl')) || 0, dv: chu(o('dv')), m2: Number(o('m2')) || 0, kho: chu(o('kho')), nguoi: chu(o('ng')), gc: chu(o('gc')) });
    }
  }
  demLuu('sokho', ds, 600);
  return ds;
}
// dong = [{loai, ct, ma, ten, sl, dv, m2, kho, nguoi, gc}] – gọi khi đang giữ khóa của người gọi (không tự khóa).
function ghiSoKho(dong) {
  if (!dong.length) return;
  var sh = tabDon(TAB_SO_KHO, TD_SO_KHO), luc = new Date();
  var rows = dong.map(function (d) { return [luc, d.loai, d.ct, d.ma, d.ten, d.sl, d.dv, d.m2 || '', d.kho || '', d.nguoi || '', d.gc || '']; });
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, TD_SO_KHO.length).setValues(rows);
  demXoa('sokho');
}
// Số của 1 dòng sổ kho theo ĐƠN VỊ TỒN của mã đó (tồn tính thùng thì lấy số thùng, còn lại lấy m² nếu có).
function soTheoDvTon(d, sl, m2) { return (d && d.dvt === 'thùng') || !(Math.abs(Number(m2) || 0) > 0) ? sl : m2; }

// Áp sổ kho + phiếu nhập (sau mốc) vào số tồn đọc từ Sheet. res = kết quả docTonKho (sửa tại chỗ).
function apDungSoKho(res) {
  var data = res.data, moc = docMoc(), sig = sigTon(data), pr = PropertiesService.getScriptProperties();
  if (!moc.sig) { pr.setProperty('TON_MOC_SIG', sig); moc.sig = sig; }
  res.moc = { luc: moc.luc, lech: moc.sig !== sig, nguoi: moc.nguoi, gc: moc.gc };
  var t0 = new Date(moc.luc).getTime(), bd = [];
  docSoKho().forEach(function (r) { if (r.luc && new Date(r.luc).getTime() >= t0) bd.push({ ma: r.ma, ten: r.ten, loai: r.loai, sl: r.sl, m2: r.m2, dv: r.dv, kho: r.kho }); });
  try {
    docPhieuNhap().forEach(function (p) {
      if (!p.luc || new Date(p.luc).getTime() < t0) return;
      p.items.forEach(function (x) { bd.push({ ma: x.ma, ten: x.ten, loai: 'Nhập kho', sl: x.sl, m2: 0, dv: x.dv, kho: p.kho }); });
    });
  } catch (e) { }
  var cham = {};
  bd.forEach(function (b) {
    var d = data[b.ma];
    if (!d) d = data[b.ma] = { tong: 0, dvt: b.dv || '', tier: { nhanh: 0, mai: 0, cho: 0 }, kho: [], ten: b.ten || '' };
    if (!cham[b.ma]) { cham[b.ma] = true; d.tonMoc = d.tong; d.soKho = { xuat: 0, hoan: 0, nhap: 0, dc: 0 }; }
    var v = lam3(soTheoDvTon(d, b.sl, b.m2));
    if (b.loai === LOAI_XUAT) d.soKho.xuat = lam3(d.soKho.xuat - v);
    else if (b.loai === LOAI_HOAN) d.soKho.hoan = lam3(d.soKho.hoan + v);
    else if (b.loai === 'Nhập kho') d.soKho.nhap = lam3(d.soKho.nhap + v);
    else d.soKho.dc = lam3(d.soKho.dc + v);
    d.tong = lam3(d.tong + v);
    var tenKho = b.kho || (d.kho[0] && d.kho[0].ten) || 'Kho chính', k = d.kho.filter(function (x) { return norm(x.ten) === norm(tenKho); })[0];
    if (!k) { k = { ten: tenKho, nhom: nhomGiao(tenKho), tong: 0, lo: [] }; d.kho.push(k); }
    k.tong = lam3(k.tong + v); d.tier[k.nhom] = lam3((d.tier[k.nhom] || 0) + v);
  });
  Object.keys(cham).forEach(function (ma) {
    var d = data[ma];
    if (d.tong < 0) { d.am = lam3(d.tong); }
    d.tong = Math.max(0, d.tong);
    ['nhanh', 'mai', 'cho'].forEach(function (t) { d.tier[t] = Math.max(0, d.tier[t] || 0); });
    d.kho.forEach(function (k) { k.tong = Math.max(0, k.tong); });
  });
}

// Tồn đầy đủ: tồn Sheet + sổ kho (tồn thực) + ngày nhập + trừ hàng đang giữ (= Được bán).
function tonKhoDayDu() {
  var res = quaDem('tonkho', docTonKho, function () { return layTabTon(false); }, CACHE_GIAY_TON);
  if (res.status !== 'ok') return res;
  try { apDungSoKho(res); } catch (e) { Logger.log('Sổ kho lỗi: ' + e); }
  try { apDungNgayNhap(res.data); } catch (e) { Logger.log('Ngày nhập lỗi: ' + e); }
  truHangGiu(res.data);
  return res;
}

// ---------- Giao hàng từng phần / số thực giao ----------
// p.ma · p.items = { maHàng: số thực giao CỘNG DỒN } · p.giaDu = 1 (giao đủ phần còn lại) · p.ketThuc = 1 (giao xong, nhả phần còn lại)
// p.nguoiGiao · p.kho. Chỉ lúc này tồn thực mới bị trừ (hàng trả về thì nhập số thực giao nhỏ hơn -> ghi hoàn kho).
function giaoHang(p, ti) {
  if (!coQuyen(ti, 'giao')) return { status: 'error', msg: 'Tài khoản chưa có quyền: ' + QUYEN.giao + '.' };
  var muc = p.items || {};
  if (typeof muc === 'string') { try { muc = JSON.parse(muc); } catch (e) { muc = {}; } }
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  var d, ghiSo = [], nk = [], ttMoi, tatCaDu = true, tong = 0;
  try {
    d = docDon({ noiBo: true, admin: true }, 5000).filter(function (x) { return x.ma === chu(p.ma); })[0];
    if (!d) return { status: 'error', msg: 'Không thấy đơn ' + p.ma };
    if (['xacnhan', 'danggiao', 'dagiao'].indexOf(d.tt) < 0) return { status: 'error', msg: 'Chỉ ghi nhận giao hàng cho đơn đã xác nhận / đang giao.' };
    if (d.giaTT === 'cho') return { status: 'error', msg: 'Đơn đang chờ chốt giá.' };
    var ton = null; try { var tk = quaDem('tonkho', docTonKho, function () { return layTabTon(false); }, CACHE_GIAY_TON); if (tk.status === 'ok') ton = tk.data; } catch (e) { }
    // kiểm tra trước khi ghi
    for (var i = 0; i < d.items.length; i++) {
      var x = d.items[i], da = Number(x.slGiao) || 0, mt;
      if (p.giaDu) mt = Number(x.sl); else if (muc[x.ma] !== undefined && muc[x.ma] !== '') mt = Number(String(muc[x.ma]).replace(',', '.')); else mt = da;
      if (!(mt >= 0) || mt > Number(x.sl) + 1e-9) return { status: 'error', msg: 'Mã ' + x.ma + ': số thực giao phải từ 0 đến ' + x.sl + '.' };
      x._mt = lam2(mt);
    }
    d.items.forEach(function (x) {
      var da = Number(x.slGiao) || 0, delta = lam2(x._mt - da), heSo = Number(x.sl) > 0 ? (parseFloat(String(x.qd || '').replace(',', '.')) || 0) / Number(x.sl) : 0;
      if (delta !== 0) {
        var dT = ton && ton[x.ma], kho = chu(p.kho) || (dT && dT.kho && dT.kho.length ? dT.kho[0].ten : 'Kho chính');
        ghiSo.push({ loai: delta > 0 ? LOAI_XUAT : LOAI_HOAN, ct: d.ma, ma: x.ma, ten: x.ten, sl: -delta, dv: x.dv, m2: heSo ? lam2(-delta * heSo) : 0, kho: kho, nguoi: ti.user, gc: delta > 0 ? 'giao đơn ' + d.ma : 'hàng trả về đơn ' + d.ma });
        nk.push(x.ma + ' ' + (delta > 0 ? '+' : '') + delta + ' ' + (x.dv || ''));
      }
      x.slGiao = x._mt; delete x._mt;
      if (x.slGiao < Number(x.sl) - 1e-9) tatCaDu = false;
    });
    if (!nk.length && !p.ketThuc) return { status: 'ok', msg: 'Không có gì thay đổi' };
    if (p.ketThuc && d.items.every(function (x) { return !(Number(x.slGiao) > 0); })) return { status: 'error', msg: 'Chưa giao mặt hàng nào – nếu không giao nữa hãy Hủy đơn (nhả hàng).' };
    ttMoi = (p.ketThuc || tatCaDu || d.tt === 'dagiao') ? 'dagiao' : 'danggiao';
    if (ttMoi === 'dagiao') { // đơn chốt: thành tiền theo số thực giao
      d.items.forEach(function (x) {
        var heSo = Number(x.sl) > 0 ? (parseFloat(String(x.qd || '').replace(',', '.')) || 0) / Number(x.sl) : 0, luong = heSo ? x.slGiao * heSo : x.slGiao;
        x.tienGiao = Math.round(luong * x.dongia); tong += x.tienGiao;
      });
    } else tong = d.tong;
    ghiSoKho(ghiSo);
    var sh = tabDon(TAB_DON, TD_DON), head = dauCot(sh), luc = new Date();
    var ghi = function (ten, v) { var c = head.indexOf(ten) + 1; if (c > 0) sh.getRange(d._dong, c).setValue(v); };
    ghi('Chi tiết (máy)', JSON.stringify(d.items)); ghi('Trạng thái', TRANG_THAI[ttMoi]); ghi('Cập nhật lúc', luc); ghi('Người xử lý', "'" + ti.user);
    if (ttMoi === 'dagiao') { ghi('Tổng tiền', tong); if (d.tt !== 'dagiao') ghi('Ngày giao', luc); }
    if (chu(p.nguoiGiao)) ghi('Người giao', chu(p.nguoiGiao).slice(0, 100));
    var ct = tabDon(TAB_CT, TD_CT), hc = dauCot(ct), rows = ct.getDataRange().getValues();
    var iMa = hc.indexOf('Mã đơn'), iHang = hc.indexOf('Mã hàng'), iGiao = hc.indexOf('Đã giao'), iTien = hc.indexOf('Thành tiền'), theoMa = {};
    d.items.forEach(function (x) { theoMa[x.ma] = x; });
    for (var r = 1; r < rows.length; r++) {
      if (chu(rows[r][iMa]) !== d.ma) continue;
      var xx = theoMa[chu(rows[r][iHang])];
      if (xx && iGiao >= 0) ct.getRange(r + 1, iGiao + 1).setValue(xx.slGiao);
      if (xx && ttMoi === 'dagiao' && iTien >= 0) ct.getRange(r + 1, iTien + 1).setValue(xx.tienGiao);
    }
  } finally { lock.releaseLock(); }
  demXoa('giu');
  ghiNhatKy(ti, ttMoi === 'dagiao' ? 'Đã giao' : 'Giao một phần', d.ma, (nk.length ? nk.join(' · ') : 'không đổi số lượng') + (p.ketThuc ? ' · nhả phần còn lại' : '') + (ttMoi === 'dagiao' ? ' · tổng ' + tienVN(tong) : ''));
  return { status: 'ok', tt: ttMoi, tong: tong, msg: 'Đơn ' + d.ma + (ttMoi === 'dagiao' ? ': đã giao xong, trừ kho theo số thực giao (' + tienVN(tong) + ')' : ': đã ghi nhận giao một phần, phần còn lại vẫn được giữ') };
}

// ---------- Thẻ kho ----------
// p.ma: thẻ kho 1 mã (tóm tắt + mọi biến động + đơn đang giữ). Không có p.ma: sổ kho gần đây.
function theKho(p) {
  var ma = chu(p.ma), moc = docMoc(), t0 = new Date(moc.luc).getTime();
  if (!ma) {
    var gan = docSoKho().slice().reverse().slice(0, Math.min(Number(p.gioiHan) || 100, 500));
    return { status: 'ok', moc: { luc: moc.luc, nguoi: moc.nguoi, gc: moc.gc }, ds: gan };
  }
  var tk = tonKhoDayDu(), d = tk.status === 'ok' ? tk.data[ma] : null;
  var ds = docSoKho().filter(function (r) { return r.ma.toUpperCase() === ma.toUpperCase(); }).slice().reverse().map(function (r) { r.sauMoc = new Date(r.luc).getTime() >= t0; return r; });
  var nhap = [];
  try { docPhieuNhap().forEach(function (pn) { pn.items.forEach(function (x) { if (x.ma.toUpperCase() === ma.toUpperCase()) nhap.push({ luc: pn.luc, loai: 'Nhập kho', ct: pn.ma, ma: x.ma, ten: x.ten, sl: x.sl, dv: x.dv, kho: pn.kho, nguoi: pn.nguoi, gc: pn.ncc, sauMoc: !!pn.luc && new Date(pn.luc).getTime() >= t0 }); }); }); } catch (e) { }
  var giu = [];
  try { var g = giuTheoMa()[ma]; if (g) giu = g.ds || []; } catch (e) { }
  var tt = d ? { dvt: d.dvt || '', tonMoc: d.tonMoc !== undefined ? d.tonMoc : d.tonGoc, soKho: d.soKho || { xuat: 0, hoan: 0, nhap: 0, dc: 0 }, tonThat: d.tonGoc !== undefined ? d.tonGoc : d.tong, giu: d.giu || 0, duocBan: d.tong, am: d.am || 0, kho: d.kho || [] } : null;
  return { status: 'ok', ma: ma, moc: { luc: moc.luc, nguoi: moc.nguoi, gc: moc.gc, lech: tk.moc ? tk.moc.lech : false }, tt: tt, ds: ds.concat(nhap).sort(function (a, b) { return a.luc < b.luc ? 1 : -1; }).slice(0, 200), giu: giu };
}

// ---------- Kiểm kê / điều chỉnh (quyền "nhapton") ----------
// p.ma · p.thucDem = số đếm thực tế (theo đơn vị tồn của mã) · p.kho · p.lyDo
function dieuChinhTon(p, ti) {
  var ma = chu(p.ma), thuc = Number(String(p.thucDem).replace(',', '.'));
  if (!ma || !isFinite(thuc) || thuc < 0) return { status: 'error', msg: 'Nhập mã hàng và số đếm thực tế (≥ 0).' };
  var tk = tonKhoDayDu();
  if (tk.status !== 'ok') return tk;
  var d = tk.data[ma], gia = quaDem('gia', docGia, TAB.gia), g = gia.status === 'ok' ? gia.data.filter(function (x) { return x.ma === ma; })[0] : null;
  if (!d && !g) return { status: 'error', msg: 'Không thấy mã ' + ma };
  var hienTai = d ? (d.tonGoc !== undefined ? d.tonGoc : d.tong) : 0, delta = lam3(thuc - hienTai);
  if (delta === 0) return { status: 'ok', msg: 'Số đếm khớp với số hệ thống (' + hienTai + ') – không cần điều chỉnh.' };
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    ghiSoKho([{ loai: LOAI_DC, ct: 'KK' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyMMdd'), ma: ma, ten: (g && (g.tenGoc || g.ten)) || (d && d.ten) || '', sl: delta, dv: (d && d.dvt) || (g && g.dvt) || '', m2: 0,
      kho: chu(p.kho) || (d && d.kho && d.kho[0] ? d.kho[0].ten : 'Kho chính'), nguoi: ti.user, gc: chu(p.lyDo).slice(0, 200) || 'kiểm kê' }]);
  } finally { lock.releaseLock(); }
  ghiNhatKy(ti, 'Kiểm kê tồn', '', ma + ': hệ thống ' + hienTai + ' → thực đếm ' + thuc + ' (' + (delta > 0 ? '+' : '') + delta + ')' + (chu(p.lyDo) ? ' · ' + chu(p.lyDo).slice(0, 100) : ''));
  return { status: 'ok', msg: 'Đã điều chỉnh ' + ma + ': ' + hienTai + ' → ' + thuc + ' (' + (delta > 0 ? '+' : '') + delta + ')' };
}
