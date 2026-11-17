// ============================================================
// CẤU HÌNH – mọi thông số riêng của khách nằm ở file này.
// Đổi cho khách khác: sửa APP_KEY (khớp config.js phía giao diện),
// tên tab và danh sách tên cột nếu file Excel của họ đặt tên khác.
// KHÔNG để mật khẩu/muối mã hóa ở đây: muối nằm trong Script Properties
// (tự sinh lần đầu), nên file này đưa lên GitHub public vẫn an toàn.
// ============================================================
var APP_KEY = 'PmQOksxCU0m3rYRFjyKdamPgcI0';
// Địa chỉ trang web app (link trong email / Telegram báo đơn).
var WEB_APP_PAGE = 'https://ctytnhhhunganhcamau-create.github.io/baogia_dathang/';

// Tên tab trong Google Sheet. KHÔNG đổi tên tab trên Sheet.
var TAB = {
  gia:    'Giá',
  tonkho: 'Tồn kho',
  kho:    'Kho',
  noima:  'Nối mã',
  anh:    'Ảnh',
  users:  'Users',
  thuongHieu: 'Thương hiệu'   // Hãng | Tên đầy đủ | Logo – quản lý tự sửa, app đọc theo
};
var COT_TH = {
  hang: ['Hãng (như bảng giá)', 'Hãng', 'Viết tắt'],
  ten:  ['Tên đầy đủ', 'Tên hãng'],
  logo: ['Logo', 'Link logo']
};

// Khách hàng (đại lý) chỉ thấy tối đa số này; app hiện "50+".
var TRAN_TON_KHACH = 51;
// Đăng nhập giữ được bao nhiêu ngày.
var TOKEN_NGAY = 30;
// Bộ nhớ đệm (giây). Sửa Sheet là tự xóa đệm (onEdit), nên để dài cũng không sao.
var CACHE_GIAY = 6 * 3600;
// Tồn kho nằm ở Sheet riêng (SHEET_TON_KHO_ID trong Rieng.js) nên onEdit của Sheet chính không biết
// khi có người sửa: đệm ngắn hơn, cộng thêm so số dòng/cột mỗi lần tải.
var CACHE_GIAY_TON = 10 * 60;
// Nhập file Excel vào Sheet tồn kho thường ra tab mang tên sheet gốc: chấp nhận thêm các tên này.
var TEN_TAB_TON_KHAC = ['TỒN TỔNG HỢP', 'Ton kho', 'TON KHO'];

// Tên cột chấp nhận được (so khớp không dấu, không phân biệt hoa thường).
// Cột nào đặt tên khác thì thêm tên đó vào danh sách tương ứng.
var COT_GIA = {
  hang:     ['Hãng', 'Thương hiệu', 'Nhãn hiệu', 'Brand'],
  nhom:     ['Nhóm hàng', 'Nhóm', 'Ngành hàng', 'Loại hàng'],
  ma:       ['Mã hàng', 'Mã SP', 'Mã sản phẩm', 'Mã', 'Mã vật tư', 'Code'],
  ten:      ['Tên hàng', 'Tên sản phẩm', 'Tên SP', 'Tên vật tư', 'Tên', 'Diễn giải'],
  tenHien:  ['Tên hiển thị', 'Tên bán hàng'],   // không bắt buộc: có thì app dùng thay cho tên vật tư
  kc:       ['Kích cỡ / Quy cách', 'Kích cỡ', 'Kích thước', 'Quy cách', 'Size'],
  loai:     ['Loại', 'Dòng', 'Chất liệu'],
  dvt:      ['Đơn vị', 'ĐVT', 'Đơn vị tính'],
  dg:       ['Đóng gói', 'Quy cách đóng gói'],
  ny:       ['Giá niêm yết', 'Giá lẻ', 'Giá bán lẻ'],
  dl:       ['Giá đại lý', 'Giá ĐL', 'Giá sỉ'],
  nyV:      ['Giá NY / viên', 'Giá niêm yết / viên', 'Giá NY/viên', 'Giá viên NY', 'Giá lẻ / viên'],   // gạch bán theo viên (không bắt buộc)
  dlV:      ['Giá ĐL / viên', 'Giá đại lý / viên', 'Giá ĐL/viên', 'Giá viên ĐL'],
  gc:       ['Ghi chú'],
  hien:     ['Hiện trên app', 'Hiện', 'Hiển thị'],
  mau:      ['Màu', 'Màu sắc'],
  congNang: ['Công năng'],
  tinhNang: ['Tính năng'],
  hoaVan:   ['Hoa văn', 'Vân'],
  men:      ['Men', 'Bề mặt'],
  dungTich: ['Dung tích', 'Thể tích']
};
var COT_TON = {
  // Hùng Anh: file KiotViet không có mã hàng -> "Tên hàng" là mã tồn kho (tab "Nối mã" đổi sang mã HAxxxx của bảng giá).
  ma:  ['Mã hàng', 'Mã SP', 'Mã', 'Mã vật tư', 'Material Number', 'Tên hàng'],
  ten: ['Tên vật tư', 'Tên'],   // để đọc số viên/thùng "(5v/th)" và kích cỡ gạch
  kho: ['Kho', 'Tên kho', 'Kho hàng', 'Name 1'],
  sl:  ['Số lượng', 'Khả dụng', 'SL', 'Tồn', 'Tồn kho', 'Số lượng tồn'],
  lo:  ['Số lô', 'Lô', 'Batch'],
  ngay: ['Ngày nhập', 'Ngày nhập kho', 'Ngày nhập hàng', 'Ngày NK'],
  dvt: ['Đơn vị', 'ĐVT']
};

// Tiêu đề tạo sẵn khi bấm "Khởi tạo các tab".
var TIEU_DE = {
  gia:    ['Hãng', 'Nhóm hàng', 'Mã hàng', 'Tên hàng', 'Kích cỡ / Quy cách', 'Loại', 'Đơn vị', 'Đóng gói',
           'Giá niêm yết', 'Giá đại lý', 'Giá NY / viên', 'Giá ĐL / viên', 'Ghi chú', 'Hiện trên app',
           'Màu', 'Công năng', 'Tính năng', 'Hoa văn', 'Men', 'Dung tích'],
  tonkho: ['Tên hàng', 'Kho', 'Tồn kho', 'Số lô', 'Đơn vị'],
  kho:    ['Kho', 'Nhóm giao'],
  noima:  ['Mã tồn kho', 'Mã hàng'],
  anh:    ['Mã hàng', 'Ảnh 1', 'Ảnh 2', 'Ảnh 3'],
  users:  ['Username', 'Họ tên', 'Vai trò', 'Mật khẩu mới', 'PasswordHash',
           'Tên công ty', 'SĐT', 'Địa chỉ', 'Khóa']
};
var VAI_TRO = ['admin', 'nv', 'khachhang'];

// Sheet Tồn kho (cho người nhập kho): xuất từ KiotViet (Tên hàng + Tồn kho) + tab hướng dẫn.
var TIEU_DE_TON = ['Tên hàng', 'Kho', 'Tồn kho', 'Số lô', 'Đơn vị'];
var TAB_HUONG_DAN_TON = 'Hướng dẫn';
var HUONG_DAN_TON = [
  'CẬP NHẬT TỒN KHO CHO APP HÙNG ANH CM',
  'Lần đọc gần nhất của app (tự ghi, không cần sửa) →',
  '',
  'CÁCH 1 – Dán từ KiotViet: xuất Danh sách sản phẩm ra Excel → Ctrl+A, Ctrl+C → tab Tồn kho, ô A1 → Ctrl+V (dán đè cả tiêu đề cũng được).',
  'CÁCH 2 – Nhập file: Tệp → Nhập → Tải lên → chọn file Excel → "Chèn trang tính mới". App tự tìm tab có cột "Tên hàng" + "Tồn kho". KHÔNG chọn "Thay thế bảng tính".',
  'CÁCH 3 – Tự gõ: tab Tồn kho, mỗi dòng 1 hàng: Tên hàng | Kho | Tồn kho | Số lô | Đơn vị.',
  '   Tên hàng phải GIỐNG HỆT tên trong tab Nối mã (cột Mã tồn kho). Hàng mới: thêm 1 dòng vào tab Giá (Mã hàng HAxxxx) và 1 dòng vào tab Nối mã (Tên hàng -> Mã hàng).',
  '   Gạch tồn tính theo m². Tồn âm / bằng 0 = hết hàng.',
  '',
  'Lưu ý: không đổi tên tab và dòng tiêu đề (Tên hàng, Kho, Tồn kho). ',
  'Ngày nhập hàng: KHÔNG ghi ở tab này (dán đè sẽ mất). Ghi ở Trang quản trị → Tồn kho → Phiếu nhập kho (lưu ở tab "Nhập kho").',
  'Dán xong chờ tối đa 10 phút, rồi xem dòng 2 ở trên: app ghi lại số mã đã đọc được.'
];
