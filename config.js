// ============================================================
// CẤU HÌNH APP – mọi thông số riêng của khách nằm ở file này.
// Repo public: KHÔNG để giá, tồn kho, mật khẩu ở đây. Dữ liệu nằm trong
// Google Sheet, Apps Script chỉ trả giá đại lý / tồn kho khi đã đăng nhập.
// ============================================================
window.APP_CONFIG = {
  TEN_APP: 'Hùng Anh CM',
  TEN_DAY_DU: 'Công ty TNHH Hùng Anh Cà Mau',
  KHAU_HIEU: 'Vật liệu xây dựng · Cà Mau',
  LOGO: 'img/logo-mark.png',      // biểu tượng (ô nhỏ trên thanh đầu) – để trống thì hiện chữ viết tắt
  LOGO_DAY_DU: 'img/logo.png',    // logo có chữ (màn đăng nhập)
  VIET_TAT: 'HA',
  // Màu logo gốc là đỏ (~#E31E24); đậm hơn một chút để chữ trắng trên nền đỏ dễ đọc.
  MAU_CHINH: '#D81E24',
  MAU_DAM: '#A9151B',
  MAU_NHAN: '#D81E24',

  // Địa chỉ Web App Apps Script. Để trống (hoặc thêm ?demo=1) = chạy dữ liệu dùng thử.
  APPS_URL: 'https://script.google.com/macros/s/AKfycbyf9HkzEFICyJ-ShugM2IixIOoVaUi2iRQTJsO0m3P39dLWWhR5XxLXizIsUOizpMNbZw/exec',
  // Khóa gắn theo mọi yêu cầu, khớp APP_KEY trong backend/Config.js.
  APP_KEY: 'PmQOksxCU0m3rYRFjyKdamPgcI0',

  // Nút "Hỏi Zalo" / "Gọi đặt hàng" và dòng "Quên mật khẩu".
  LIEN_HE_TEN: 'Hùng Anh CM',
  LIEN_HE_SDT: '0967110118',
  // Thông tin công ty (theo giấy chứng nhận đăng ký doanh nghiệp). Để trống mục nào thì app ẩn mục đó.
  DIA_CHI: 'Số 181 Lý Thường Kiệt, Khóm 7, Phường 6, TP. Cà Mau, Cà Mau',
  EMAIL: '',
  FACEBOOK: '',
  WEBSITE: '',
  NGANH_HANG: 'Gạch ốp lát · Thiết bị vệ sinh · Thiết bị nhà bếp · Sơn nước · Ngói · Keo & vữa',

  // Logo thương hiệu (tên khớp cột "Hãng", không phân biệt dấu/hoa thường): thêm file vào img/hang/ rồi khai báo ở đây.
  // Hãng không có ở đây thì app hiện chữ. Logo / tên đầy đủ trong tab "Thương hiệu" của Google Sheet được ưu tiên hơn.
  LOGO_HANG: {
    'Đồng Tâm': 'img/hang/dongtam.png',
    'Viglacera': 'img/hang/viglacera.png'
  },

  NGUONG_TON_KHACH: 50,     // đại lý thấy "50+" khi tồn > 50 (máy chủ đã chặn trần 51)

  // Nhóm hàng: "ten" khớp cột "Nhóm hàng" trong Sheet (không phân biệt dấu/hoa thường).
  // icon: gach | ngoi | keo | tbvs | son | bep | khac.  Thứ tự ở đây = thứ tự trên trang chủ.
  NHOM_HANG: [
    { key: 'gach', ten: 'Gạch ốp lát',       ngan: 'Gạch', icon: 'gach', alias: ['gạch', 'gạch men'] },
    { key: 'tbvs', ten: 'Thiết bị vệ sinh',  ngan: 'TBVS', icon: 'tbvs', alias: ['tbvs', 'vệ sinh'] },
    { key: 'bep',  ten: 'Thiết bị nhà bếp',  ngan: 'Bếp',  icon: 'bep',  alias: ['bếp', 'thiết bị bếp', 'nhà bếp'] },
    { key: 'son',  ten: 'Sơn nước',          ngan: 'Sơn',  icon: 'son',  alias: ['sơn'] },
    { key: 'ngoi', ten: 'Ngói',              ngan: 'Ngói', icon: 'ngoi', alias: ['ngói lợp'] },
    { key: 'keo',  ten: 'Keo & vữa',         ngan: 'Keo',  icon: 'keo',  alias: ['keo', 'keo dán gạch', 'keo chà ron', 'bột chà ron', 'vữa'] },
    { key: 'san',  ten: 'Sàn & phụ kiện',    ngan: 'Sàn',  icon: 'khac', alias: ['sàn', 'sàn nhựa', 'phụ kiện sàn'] }
  ]
};
