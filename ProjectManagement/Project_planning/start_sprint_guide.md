# Hướng Dẫn Chi Tiết: Bắt Đầu Sprint (Start Sprint)

Tài liệu này mô tả chi tiết các bước đã thực hiện để triển khai tính năng "Start Sprint" trong `project-backlog.js`.

## 1. Mục Tiêu
Cho phép người dùng kích hoạt một Sprint đang ở trạng thái `Planning`. Khi kích hoạt, người dùng có thể cập nhật lại Tên, Mục tiêu, Ngày bắt đầu và Ngày kết thúc.

## 2. Các Bước Thực Hiện

### Bước 1: Thêm HTML Modal "Start Sprint"
Đã thêm cấu trúc HTML cho Modal vào hàm `initProjectBacklog` (trong `project-backlog.js`). Modal này bao gồm:
*   Form nhập liệu: Tên Sprint, Goal, Start Date, End Date.
*   Các nút: Cancel, Start Sprint.
*   Date Picker: Sử dụng lại component `calendar.js` để chọn ngày.

### Bước 2: Xử Lý Logic Modal (JavaScript)
Đã thêm code JavaScript để xử lý các sự kiện của Modal:
*   **Mở Modal:** Lắng nghe sự kiện click vào nút "Start Sprint" (sử dụng Event Delegation). Khi mở, điền sẵn dữ liệu hiện tại của Sprint vào form.
*   **Đóng Modal:** Reset form và ẩn modal.
*   **Submit Form:**
    1.  Lấy dữ liệu từ form.
    2.  Gọi API `PUT /projects/{id}/sprints/{sprintId}` để cập nhật thông tin Sprint (Tên, Goal, Ngày).
    3.  Nếu cập nhật thành công, gọi tiếp API `POST /projects/{id}/sprints/{sprintId}/start` để chuyển trạng thái sang `Active`.
    4.  Reload lại dữ liệu Backlog (`loadBacklogData`) nếu thành công.

### Bước 3: Cập Nhật Hàm Render (`renderSprints`)
Cập nhật logic hiển thị danh sách Sprint để chỉ hiển thị nút "Start Sprint" cho **Sprint đầu tiên** có trạng thái `Planning`.
*   Sử dụng biến cờ `firstPlanningSprintFound` để xác định sprint nào được phép start.
*   Truyền tham số `canStart` vào hàm `createSprintElement`.

### Bước 4: Cập Nhật `createSprintElement`
*   Thêm logic render nút "Start Sprint" nếu `canStart = true`.
*   Gán các `data-attributes` (data-sprint-id, data-name, ...) vào nút để dễ dàng lấy dữ liệu khi click.

## 3. API Sử Dụng
*   **Cập nhật thông tin:** `PUT /projects/{projectId}/sprints/{sprintId}`
    *   Body: `{ name, goal, startDate, endDate }`
*   **Kích hoạt Sprint:** `POST /projects/{projectId}/sprints/{sprintId}/start`
    *   Không cần Body (hoặc Body rỗng).

## 4. Kiểm Tra
1.  Vào trang Backlog.
2.  Tìm Sprint đầu tiên có trạng thái `PLANNING`.
3.  Click nút "Start Sprint".
4.  Nhập thông tin và chọn ngày.
5.  Nhấn "Start Sprint".
6.  Kiểm tra trang reload, Sprint chuyển sang trạng thái `ACTIVE` và nút chuyển thành "Complete Sprint".
