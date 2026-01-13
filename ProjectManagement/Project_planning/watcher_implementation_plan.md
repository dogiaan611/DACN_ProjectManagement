# Plan Thực Hiện Chức Năng Watcher (Frontend)

Tài liệu này mô tả chi tiết các bước để thực hiện chức năng "Watcher" (Người theo dõi) cho Task trên Frontend, sử dụng `taskWatcher.js` và các API đã có sẵn trong `TaskWatcherController`.

## Mục Tiêu
- Hiển thị danh sách người đang theo dõi task.
- Cho phép người dùng hiện tại tự theo dõi/bỏ theo dõi (nút mắt).
- Cho phép thêm người khác vào danh sách theo dõi (nút Change).

## Các Bước Thực Hiện

### Bước 1: Chuẩn bị và Khởi tạo (`initTaskWatcher`)
Trong file `wwwroot/js/taskWatcher.js`, hàm `initTaskWatcher` sẽ là nơi khởi tạo chính.

1.  **Lấy các phần tử DOM cần thiết**:
    *   Nút "Mắt" (Toggle Watch): `#task-detail-watcher-btn`
    *   Khu vực hiển thị avatar watcher: `#task-detail-watcher-avt`
    *   Nút mở dropdown thêm watcher: `#edit-watcher`
    *   Dropdown container: `#watcher-detail-dropdown`
    *   Input tìm kiếm: `#watcher-search`
    *   Danh sách kết quả tìm kiếm: `#watcher-detail-list`

2.  **Lấy thông tin người dùng hiện tại**:
    *   Gọi API `/user/read` (hoặc lấy từ local storage/global state nếu có) để biết `userId` của người đang thao tác. Điều này cần thiết để kiểm tra xem họ có đang watch hay không.

3.  **Lấy danh sách Watchers hiện tại của Task**:
    *   Gọi API: `GET /boards/{boardId}/columns/{columnId}/tasks/{taskId}/watchers`
    *   Kết quả trả về là danh sách các object `{ userId, userName }`.

### Bước 2: Hiển thị dữ liệu (Render UI)

1.  **Hàm `renderWatchers(watchers)`**:
    *   Nhận vào danh sách watchers.
    *   Cập nhật `#task-detail-watcher-avt`:
        *   Hiển thị avatar (hoặc tên viết tắt) của 3-4 watcher đầu tiên.
        *   Nếu danh sách rỗng, hiển thị text "No watchers".
        *   Nếu danh sách dài, hiển thị số lượng `+N`.

2.  **Cập nhật trạng thái nút "Mắt"**:
    *   Kiểm tra xem `currentUser.id` có nằm trong danh sách `watchers` không.
    *   Nếu có: Thêm class màu xanh (ví dụ `text-green-500`) vào `#task-detail-watcher-btn` để chỉ thị đang theo dõi.
    *   Nếu không: Xóa class màu xanh, để màu xám mặc định.

### Bước 3: Chức năng Tự Theo Dõi / Bỏ Theo Dõi (Toggle Watch)

1.  **Gắn sự kiện `click` cho `#task-detail-watcher-btn`**:
    *   Trong handler:
        *   Kiểm tra trạng thái hiện tại (đang watch hay không).
        *   **Nếu đang watch**:
            *   Gọi API: `DELETE /boards/{boardId}/columns/{columnId}/tasks/{taskId}/watchers/{currentUserId}`
            *   Thành công -> Loại bỏ user khỏi danh sách local `watchers` -> Gọi lại `renderWatchers`.
        *   **Nếu chưa watch**:
            *   Gọi API: `POST /boards/{boardId}/columns/{columnId}/tasks/{taskId}/watchers` (Body để trống hoặc `{ userId: null }` để mặc định là chính mình).
            *   Thành công -> Thêm user vào danh sách local `watchers` -> Gọi lại `renderWatchers`.

### Bước 4: Chức năng Thêm Người Khác (Manage Watchers)

1.  **Gắn sự kiện `click` cho `#edit-watcher`**:
    *   Sử dụng hàm `toggleDropdown` (từ `taskUI.js`) để mở/đóng `#watcher-detail-dropdown`.
    *   Khi mở dropdown:
        *   Gọi API lấy danh sách thành viên dự án: `GET /projects/{projectId}/readProject` (để lấy list members).
        *   Lưu danh sách members vào biến local để dùng cho search.
        *   Gọi hàm `renderMemberOptions(members)` để hiển thị danh sách trong dropdown.

2.  **Hàm `renderMemberOptions(members)`**:
    *   Duyệt qua danh sách members.
    *   Tạo element cho mỗi member.
    *   **Kiểm tra trạng thái**: Nếu member đó đã là watcher (có trong list `watchers` hiện tại), hiển thị trạng thái "Đã thêm" hoặc ẩn đi, hoặc hiển thị nút "Remove".
    *   Gắn sự kiện `click` cho từng item member:
        *   Gọi API `POST` để thêm watcher đó: `body: { userId: member.userId }`.
        *   Thành công -> Cập nhật UI (thêm vào list watchers, update trạng thái trong dropdown).

3.  **Chức năng Tìm kiếm (`#watcher-search`)**:
    *   Gắn sự kiện `input`.
    *   Lọc danh sách `members` dựa trên từ khóa.
    *   Gọi lại `renderMemberOptions` với danh sách đã lọc.

### Bước 5: Xử lý Real-time (Optional/Nâng cao)
*   Nếu hệ thống có SignalR, cần lắng nghe sự kiện update task để cập nhật danh sách watcher mà không cần reload. (Bước này có thể làm sau).

---
## Tóm tắt API sử dụng

| Chức năng | Method | Endpoint | Body |
| :--- | :--- | :--- | :--- |
| Lấy DS Watchers | `GET` | `.../watchers` | - |
| Thêm Watcher | `POST` | `.../watchers` | `{ "userId": "..." }` |
| Xóa Watcher | `DELETE` | `.../watchers/{userId}` | - |
