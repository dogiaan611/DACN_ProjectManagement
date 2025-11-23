# Giải thích chi tiết code `comment.js`

File `comment.js` chịu trách nhiệm quản lý toàn bộ chức năng bình luận (comment) trong modal chi tiết công việc (Task Detail). Dưới đây là phân tích chi tiết về cấu trúc và logic hoạt động của các chức năng.

## 1. Tổng quan
Hàm chính được export là `initComments`. Hàm này được gọi khi mở modal chi tiết công việc. Nó nhận vào các tham số:
- `taskId`, `boardId`, `projectId`, `columnId`: Các ID cần thiết để gọi API.
- `container`: Element chứa giao diện comment (để query các phần tử con như list comment, ô input, nút gửi).

## 2. Các biến và khởi tạo ban đầu
- **DOM Elements**: Lấy các phần tử HTML cần thiết (`listContainer`, `input`, `addBtn`).
- **State**:
  - `currentUser`: Lưu thông tin user đang đăng nhập (để kiểm tra quyền sửa/xóa).
  - `members`: Danh sách thành viên trong dự án (để dùng cho tính năng mention).

Đoạn code đầu tiên trong hàm thực hiện việc lấy thông tin user và danh sách thành viên dự án từ API để chuẩn bị dữ liệu.

## 3. Tính năng Mention (@Tag)
Hàm `setupInputWithMentions(inputEl, containerEl, onSubmit, onCancel)` là core logic của tính năng này.

### Logic hoạt động:
1.  **Tạo Dropdown**: Một `div` ẩn được tạo ra để chứa danh sách gợi ý thành viên.
2.  **Lắng nghe sự kiện `keyup` (`handleKeyUp`)**:
    - Khi người dùng gõ phím, hàm này kiểm tra vị trí con trỏ chuột (`caret`).
    - Nó tìm ký tự `@` gần nhất trước con trỏ.
    - Nếu tìm thấy, nó lấy chuỗi ký tự sau `@` làm từ khóa tìm kiếm (`query`).
    - Lọc danh sách `members` dựa trên `query`.
    - Nếu có kết quả, hiển thị dropdown và render danh sách thành viên.
3.  **Lắng nghe sự kiện `keydown` (`handleKeyDown`)**:
    - Xử lý điều hướng trong dropdown:
        - `ArrowDown` / `ArrowUp`: Di chuyển lựa chọn lên xuống.
        - `Enter` / `Tab`: Chọn thành viên đang được highlight.
        - `Escape`: Đóng dropdown.
    - Nếu dropdown đang ẩn, `Enter` sẽ trigger hàm `onSubmit` (gửi comment).
4.  **Chèn Mention**:
    - Khi người dùng chọn một thành viên, code sẽ xóa đoạn text chứa `@query` cũ.
    - Chèn một thẻ `span` với class `text-blue-500` chứa tên thành viên (VD: `@NguyenVanA`).
    - Thêm một khoảng trắng sau thẻ span để người dùng tiếp tục gõ.

## 4. Hiển thị danh sách Comment (`loadComments` & `renderComments`)

### `loadComments`
- Hiển thị trạng thái "Loading...".
- Gọi API GET để lấy danh sách comment.
- Nếu lỗi, hiển thị thông báo lỗi.
- Nếu thành công, gọi `renderComments`.

### `renderComments`
- Xóa nội dung cũ của list container.
- Nếu không có comment nào, hiển thị icon và thông báo "No comments yet".
- Duyệt qua từng comment và tạo HTML:
    - **Avatar**: Hiển thị ảnh đại diện hoặc chữ cái đầu tên nếu không có ảnh.
    - **Thông tin**: Tên người gửi, thời gian gửi (dùng `formatTimeAgo`).
    - **Nội dung**:
        - Sử dụng `escapeHtml` để chống lỗi XSS.
        - **Highlight Mention**: Dùng Regex để tìm các chuỗi `@TenThanhVien` trong nội dung và bọc chúng bằng thẻ `span` màu xanh.
    - **Nút thao tác (Edit/Delete)**: Chỉ hiển thị nếu `currentUser.id` trùng với `comment.userId` (người xem là người viết comment).
- Cuộn xuống cuối danh sách sau khi render.

### `formatTimeAgo`
- Hàm tiện ích để chuyển đổi thời gian (VD: "2023-11-23T10:00:00Z") thành dạng "đọc được" (human-readable) như: "vừa xong", "5 phút trước", "2 ngày trước", v.v.

## 5. Các thao tác CRUD (Thêm, Sửa, Xóa)

### Thêm Comment (`handleAdd`)
- Lấy nội dung text từ ô input (`innerText`).
- Kiểm tra rỗng.
- Disable nút gửi để tránh spam.
- Gọi API POST để tạo comment mới.
- Nếu thành công: Xóa nội dung input và reload lại danh sách comment.

### Xóa Comment (`handleDelete`)
- Gọi API DELETE với `commentId`.
- Reload lại danh sách sau khi xóa thành công.

### Sửa Comment (`handleEdit`)
- Tìm element comment tương ứng trong DOM.
- Ẩn nội dung hiển thị, hiện form edit (đã có sẵn trong HTML lúc render nhưng bị ẩn).
- Copy nội dung hiện tại vào ô input edit.
- **Tái sử dụng logic Mention**: Gọi lại `setupInputWithMentions` cho ô input edit này để hỗ trợ tag tên khi sửa.
- Xử lý nút Lưu (`handleSave`):
    - Kiểm tra nội dung mới.
    - Gọi `performUpdate`.
- Xử lý nút Hủy (`handleCancel`):
    - Ẩn form edit, hiện lại nội dung cũ.
    - Dọn dẹp các event listener và dropdown mention.

### Cập nhật (`performUpdate`)
- Gọi API PUT để cập nhật nội dung comment.
- Reload lại danh sách sau khi cập nhật thành công.

## 6. Bảo mật
- Hàm `escapeHtml`: Chuyển đổi các ký tự đặc biệt (`&`, `<`, `>`, `"`, `'`) thành HTML entities. Điều này ngăn chặn việc thực thi mã độc (XSS) nếu người dùng cố tình nhập script vào comment.

---
**Tóm lại**: File này kết hợp giữa việc xử lý DOM phức tạp (cho tính năng mention và contenteditable input) với việc gọi API bất đồng bộ để tạo ra trải nghiệm bình luận mượt mà, realtime (thông qua việc reload nhanh).
