# baogia_dathang

App bảng giá + tồn kho + đặt hàng cho **Công ty TNHH Hùng Anh Cà Mau** – 181 Lý Thường Kiệt, Khóm 7, P6, TP. Cà Mau (gạch ốp lát, thiết bị vệ sinh/bếp, sơn, ngói, keo, sàn).

- Giao diện: `index.html`, `style.css`, `app.js`; trang quản trị `quan-tri.html` – chạy trên GitHub Pages.
- Thông số riêng (tên, màu, logo, địa chỉ máy chủ, liên hệ, nhóm hàng): **`config.js`**.
- Máy chủ: thư mục `backend/` – Google Apps Script gắn với Google Sheet của công ty.
- Dữ liệu giá, tồn kho, tài khoản **chỉ nằm trong Google Sheet**, không nằm trong repo.
- Tính năng giống app Hiền Nga: giá niêm yết/đại lý, tồn kho theo kho, giỏ ảnh gửi Zalo, báo giá, đơn hàng + chừa hàng, phiếu nhập kho + tuổi tồn, tem QR, phân quyền.

## Ai thấy gì
| Người dùng | Giá niêm yết | Giá đại lý | Tồn kho |
|---|---|---|---|
| Chưa đăng nhập | ✅ | ❌ | ❌ |
| Đại lý (`khachhang`) | ✅ | ✅ | tối đa "50+" |
| Nhân viên (`nv`) | ✅ | ✅ | đầy đủ |
| Quản trị (`admin`) | ✅ | ✅ | đầy đủ + quản lý tài khoản |

## Xin sửa giá (nhân viên) → quản trị chốt
- Nhân viên có quyền **Xin sửa giá** thấy nút **Sửa giá** trong giỏ hàng: nhập giá tay hoặc giảm % trên giá niêm yết (từng dòng hoặc cả đơn), bắt buộc ghi lý do.
- Đơn gửi đi ở trạng thái **Chờ chốt giá** (hàng vẫn được giữ). Quản trị (hoặc nhân viên có quyền **Chốt giá**) mở đơn: đồng ý, sửa giá từng dòng, hoặc từ chối (về giá gốc). Chưa chốt thì chưa duyệt được đơn.
- Giá vốn (cột **Giá vốn** trong tab Giá) chỉ quản trị thấy: hiện biên lợi nhuận khi chốt và cảnh báo khi bán dưới vốn. Máy chủ không bao giờ gửi giá vốn cho nhân viên / đại lý.
- Máy chủ tự tính lại tiền theo giá xin / giá chốt, không tin con số từ điện thoại. Mọi bước ghi vào Nhật ký.

## Sổ kho: trừ tồn lúc giao hàng (kiểu ERP)
- **KiotViet vẫn là sổ gốc.** Tab `Tồn kho` (dán từ KiotViet) là **mốc tồn**; từ mốc đó app tự cộng trừ theo `Sổ kho` cho tới lần dán sau. Dán tồn mới → mốc đặt lại (tự động khi copy-paste, hoặc bấm **Chốt mốc tồn** ở trang Tồn kho) nên không bị trừ 2 lần.
- `Tồn thực` = tồn mốc − hàng đã giao + hàng trả về + phiếu nhập (sau mốc) ± kiểm kê. `Đang giữ` = phần chưa giao của đơn mới / chừa hàng / đã xác nhận / đang giao. `Được bán` = Tồn thực − Đang giữ.
- Lên đơn, chừa hàng, duyệt: chỉ **giữ** hàng. Tồn thực chỉ trừ khi bấm **Ghi nhận giao hàng** (nhập số thực giao từng dòng; giao nhiều đợt được; hàng trả về thì nhập số thực giao nhỏ hơn). Đơn chốt `Đã giao` tính tiền theo số thực giao.
- Đại lý không đặt được vượt `Được bán`; nhân viên / quản trị vẫn đặt được, đơn gắn cờ **Thiếu hàng**.
- Trang Tồn kho có **Sổ kho & thẻ kho** (xem biến động từng mã) và **kiểm kê / điều chỉnh**.

## Tab trong Google Sheet (không đổi tên tab)
`Giá`, `Tồn kho`, `Kho`, `Nối mã`, `Ảnh`, `Users`. Cột đọc **theo tên tiêu đề** (xem `backend/Config.js`).
Tồn kho từ KiotViet chỉ có *Tên hàng*, nên **Tên hàng = mã tồn kho**, tab `Nối mã` đổi sang mã `HAxxxx` của tab `Giá`.

## Cài đặt lần đầu
1. Mở Google Sheet mới → Tiện ích mở rộng → Apps Script (hoặc dùng dự án `1LHo2WV…`), dán/đẩy code `backend/`.
2. Nhập 4 file CSV trong `du-lieu-nhap/` (không đưa lên GitHub) vào các tab `Giá`, `Tồn kho`, `Nối mã`, `Kho`.
3. Menu **📱 App**: Khởi tạo các tab, bật tự làm mới 15 phút, tạo tài khoản admin đầu tiên.
4. Triển khai → Ứng dụng web (Chạy với quyền của bạn, Ai cũng truy cập) → địa chỉ `/exec` điền vào `config.js` (`APPS_URL`).
5. GitHub → Settings → Pages → branch `main`.

## Xem thử trên máy
`config.js` để trống `APPS_URL` (hoặc thêm `?demo=1`) → chạy dữ liệu giả (`demo-data.js`). Đăng nhập thử: `admin`, `nv`, `daily`, mật khẩu bất kỳ.
```
powershell -ExecutionPolicy Bypass -File serve.ps1   # http://localhost:3460
```

## Cập nhật máy chủ
```
cd backend
clasp push
clasp deploy -i <deploymentId>
```
`backend/.clasp.json` và `backend/Rieng.js` không đưa lên repo.
