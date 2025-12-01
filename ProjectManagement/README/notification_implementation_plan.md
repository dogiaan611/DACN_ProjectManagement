# Plan Implementation: Notification Page

Mục tiêu: Tạo một trang hiển thị thông báo cho người dùng, cho phép xem danh sách thông báo, đánh dấu đã đọc và điều hướng đến các tác vụ liên quan.

## 1. Backend Implementation

### Tại sao cần thay đổi Backend?
Hiện tại `NotificationController` chỉ xử lý việc gửi Email và OTP (System Admin). Chúng ta cần các API để người dùng bình thường có thể:
- Lấy danh sách thông báo của chính họ từ cơ sở dữ liệu (`Notifications` table).
- Đánh dấu thông báo là đã đọc.
- Đếm số lượng thông báo chưa đọc.

### Các bước thực hiện:

#### Bước 1: Cập nhật `NotificationController.cs`
Thêm các endpoint sau:
- `GET /notifications/mine`: Lấy danh sách thông báo của user hiện tại. Cần phân trang hoặc lấy 20-50 thông báo gần nhất.
- `POST /notifications/{id}/read`: Đánh dấu 1 thông báo là đã đọc.
- `POST /notifications/read-all`: Đánh dấu tất cả là đã đọc.
- `GET /notifications/unread-count`: Lấy số lượng thông báo chưa đọc (để hiển thị lên badge).

**Lưu ý:** Cần inject `PMDbContext` vào controller vì `INotificationService` hiện tại có vẻ chỉ lo việc gửi ra ngoài (Email/SMS).

## 2. Frontend Implementation

### Tại sao cần trang Notification riêng?
Mặc dù thông báo thường xuất hiện ở popup nhỏ trên header, nhưng một trang riêng (`/notifications`) giúp người dùng xem lại lịch sử đầy đủ, quản lý dễ dàng hơn trên thiết bị di động và không bị giới hạn không gian hiển thị.

### Các bước thực hiện:

#### Bước 1: Tạo View `Views/Notification/Index.cshtml`
- **Cấu trúc:**
  - Header: Tiêu đề "Thông báo", nút "Đánh dấu tất cả đã đọc".
  - List: Danh sách các thông báo. Mỗi item hiển thị:
    - Avatar người gửi (nếu có) hoặc icon loại thông báo.
    - Nội dung thông báo.
    - Thời gian (VD: "2 giờ trước").
    - Trạng thái (Đã đọc/Chưa đọc - phân biệt bằng màu nền hoặc dot xanh).
- **Logic:**
  - Khi click vào thông báo -> Gọi API đánh dấu đã đọc -> Chuyển hướng đến trang chi tiết (Task/Project).

#### Bước 2: Tạo File CSS/JS riêng
- `wwwroot/css/notification.css`: Style cho list item, trạng thái unread, hover effects.
- `wwwroot/js/notification.js`:
  - Hàm `loadNotifications()`: Gọi API và render danh sách.
  - Hàm `markAsRead(id)`: Gọi API khi user click.
  - Hàm `markAllAsRead()`: Xử lý nút "Đánh dấu tất cả".
  - Hàm `formatTime()`: Chuyển đổi timestamp sang dạng "time ago".

#### Bước 3: Cập nhật `_Layout.cshtml` (Header)
- Thêm icon chuông thông báo.
- Hiển thị badge số lượng chưa đọc (gọi API `unread-count` khi load trang).
- Link icon đến trang `/notification` (hoặc mở dropdown - nhưng trong scope này ta làm trang riêng trước).

## 3. Chi tiết kỹ thuật & Lý giải

1.  **Sử dụng AJAX/Fetch API cho trang Notification**:
    *   *Tại sao?* Thay vì load lại cả trang khi đánh dấu đã đọc, ta dùng JS để update UI ngay lập tức -> Trải nghiệm mượt mà hơn (SPA-like feel).

2.  **Phân trang (Pagination) hoặc Load More**:
    *   *Tại sao?* Bảng `Notifications` sẽ rất lớn theo thời gian. Không thể load tất cả. Nên load 20 item đầu, và có nút "Xem thêm" hoặc infinite scroll.

3.  **Activity Log vs Notification**:
    *   *Lưu ý:* `ActivityLog` là lịch sử thay đổi của Task (ai làm gì). `Notification` là thông báo gửi đích danh cho User (bạn được assign, bạn được mention). Đừng nhầm lẫn 2 cái này. Trang này chỉ hiển thị `Notification`.

## 4. Kế hoạch triển khai (Checklist)

- [ ] **Backend**: Inject `PMDbContext` vào `NotificationController`.
- [ ] **Backend**: Viết API `GetMyNotifications` (GET).
- [ ] **Backend**: Viết API `MarkAsRead` (POST).
- [ ] **Backend**: Viết API `MarkAllAsRead` (POST).
- [ ] **Frontend**: Tạo file `notification.css`.
- [ ] **Frontend**: Tạo file `notification.js` với các hàm fetch data.
- [ ] **Frontend**: Tạo View `Index.cshtml` với khung HTML.
- [ ] **Frontend**: Gắn kết API vào View và test.
