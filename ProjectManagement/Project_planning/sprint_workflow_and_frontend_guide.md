# Hướng Dẫn Triển Khai Sprint (Backend & Frontend)

Tài liệu này mô tả chi tiết quy trình hoạt động của Sprint dựa trên `SprintController.cs` và hướng dẫn từng bước để triển khai giao diện (Frontend) cho tính năng này.

## 1. Quy Trình Hoạt Động Của Sprint (Backend Logic)

Dựa trên `SprintController.cs`, một Sprint có vòng đời và các quy tắc sau:

### 1.1. Vòng Đời (Lifecycle)
Sprint có 3 trạng thái chính (Enum `SprintStatus`):
1.  **Planning (Lên kế hoạch):** Trạng thái mặc định khi mới tạo. Tại đây, PM có thể thêm/bớt task, đặt mục tiêu (Goal).
2.  **Active (Đang chạy):** Sprint đang diễn ra. Chỉ có **DUY NHẤT MỘT** sprint được active trong một project tại một thời điểm.
3.  **Completed (Hoàn thành):** Sprint đã kết thúc. Các task chưa xong sẽ được chuyển đi (sang sprint mới hoặc về backlog).
4.  **Cancelled (Hủy):** Sprint bị hủy bỏ. Tất cả task được trả về backlog.

### 1.2. Các Hành Động Chính
*   **Tạo Sprint (`POST /projects/{id}/sprints`):** Tạo sprint mới với trạng thái `Planning`.
*   **Thêm Task vào Sprint (`POST .../tasks/{taskId}`):** Gán `SprintId` cho task. Task phải chưa thuộc sprint này.
*   **Xóa Task khỏi Sprint (`DELETE .../tasks/{taskId}`):** Set `SprintId = null` cho task, trả về Product Backlog.
*   **Bắt đầu Sprint (`POST .../start`):**
    *   Chuyển trạng thái sang `Active`.
    *   Yêu cầu: Phải có task, không có sprint nào khác đang active.
    *   Cập nhật `StartDate`.
*   **Hoàn thành Sprint (`POST .../complete`):**
    *   Chuyển trạng thái sang `Completed`.
    *   Xử lý các task chưa hoàn thành (Incomplete Tasks):
        *   *MoveToNextSprint:* Chuyển sang sprint Planning tiếp theo.
        *   *MoveToBacklog:* Trả về Product Backlog.
        *   *MarkDone:* Đánh dấu là xong (chuyển sang cột Done).
*   **Hủy Sprint (`POST .../cancel`):** Trả toàn bộ task về Backlog và chuyển trạng thái sang `Cancelled`.

---

## 2. Hướng Dẫn Triển Khai Frontend

Việc triển khai chủ yếu diễn ra tại file `wwwroot/js/project-backlog.js`.

### Bước 1: Hiển Thị Danh Sách Sprint & Backlog
**Mục tiêu:** Hiển thị danh sách các Sprint (cùng task của chúng) và Product Backlog (task chưa gán).

*   **API cần dùng:**
    *   Lấy danh sách Sprints: `GET /projects/{projectId}/sprints`
    *   Lấy Product Backlog: `GET /projects/{projectId}/backlog`
    *   Lấy Task trong Sprint: `GET /projects/{projectId}/sprints/{sprintId}/backlog`
*   **Công việc cụ thể:**
    1.  Tạo hàm `loadBacklogData()`: Gọi song song 2 API lấy Sprints và Product Backlog.
    2.  Render danh sách Sprints:
        *   Duyệt qua mảng sprints.
        *   Với mỗi sprint, tạo khung HTML hiển thị: Tên, Ngày, Trạng thái, Nút Start/Complete (tùy trạng thái).
        *   Gọi tiếp API lấy task cho từng sprint để render list task bên trong.
    3.  Render Product Backlog: Hiển thị danh sách task ở dưới cùng (hoặc cột bên phải).

### Bước 2: Tạo Sprint Mới
**Mục tiêu:** Cho phép người dùng tạo sprint mới để bắt đầu lên kế hoạch.

*   **API cần dùng:** `POST /projects/{projectId}/sprints`
*   **Công việc cụ thể:**
    1.  Thêm nút "Create Sprint" ở đầu trang Backlog.
    2.  Gắn sự kiện click: Gọi API tạo sprint (có thể hiển thị modal nhập tên hoặc tạo nhanh với tên mặc định "Sprint N").
    3.  Sau khi tạo thành công: Reload lại danh sách sprint (`loadBacklogData`).

### Bước 3: Kéo Thả Task (Drag & Drop)
**Mục tiêu:** Phân chia công việc bằng cách kéo task từ Backlog vào Sprint hoặc di chuyển giữa các Sprint.

*   **API cần dùng:**
    *   Thêm vào Sprint: `POST /projects/{id}/sprints/{sprintId}/tasks/{taskId}`
    *   Xóa khỏi Sprint (về Backlog): `DELETE /projects/{id}/sprints/{sprintId}/tasks/{taskId}`
*   **Công việc cụ thể:**
    1.  Sử dụng thư viện Drag & Drop (hoặc HTML5 API) cho các container chứa task.
    2.  **Kéo từ Backlog -> Sprint:** Gọi API `AddTaskToSprint`.
    3.  **Kéo từ Sprint -> Backlog:** Gọi API `RemoveTaskFromSprint`.
    4.  **Kéo từ Sprint A -> Sprint B:**
        *   Gọi API `RemoveTaskFromSprint` (khỏi A).
        *   Gọi API `AddTaskToSprint` (vào B).
    5.  Cập nhật UI ngay lập tức (Optimistic UI) hoặc reload dữ liệu.

### Bước 4: Bắt Đầu Sprint (Start Sprint)
**Mục tiêu:** Kích hoạt một sprint để bắt đầu làm việc (hiển thị lên Board).

*   **API cần dùng:** `POST /projects/{id}/sprints/{sprintId}/start`
*   **Công việc cụ thể:**
    1.  Hiển thị nút "Start Sprint" chỉ cho sprint đầu tiên có trạng thái `Planning`.
    2.  Khi click, mở Modal yêu cầu nhập: Tên Sprint (edit), Goal, Start Date, End Date.
    3.  Submit Modal: Gọi API `Start`.
    4.  Xử lý lỗi: Nếu API báo lỗi (ví dụ: đã có sprint active, sprint rỗng), hiển thị thông báo.
    5.  Thành công: Reload lại trang, nút chuyển thành "Complete Sprint".

### Bước 5: Hoàn Thành Sprint (Complete Sprint)
**Mục tiêu:** Kết thúc chu kỳ làm việc, tổng kết và xử lý việc tồn đọng.

*   **API cần dùng:**
    *   Lấy task chưa xong: `GET /projects/{id}/sprints/{sprintId}/incomplete`
    *   Hoàn thành: `POST /projects/{id}/sprints/{sprintId}/complete`
*   **Công việc cụ thể:**
    1.  Hiển thị nút "Complete Sprint" cho sprint đang `Active`.
    2.  Khi click, gọi API lấy danh sách task chưa xong (`incomplete`).
    3.  Hiển thị Modal "Complete Sprint":
        *   Thống kê: Số task hoàn thành, số task chưa xong.
        *   Dropdown chọn hành động cho task chưa xong: "Move to New Sprint" hoặc "Move to Backlog".
    4.  Submit Modal: Gửi payload chứa danh sách task và hành động tương ứng lên API `Complete`.

### Bước 6: Tích Hợp Board View (Đã làm)
**Mục tiêu:** Board chỉ hiển thị công việc của Sprint đang chạy.

*   **File:** `wwwroot/js/project-board.js`
*   **Logic:**
    *   Kiểm tra loại Project (Scrum vs Kanban).
    *   Nếu là Scrum: Gọi API lấy danh sách Sprint -> Tìm Sprint `Active` -> Lấy task của Sprint đó hiển thị lên bảng.
    *   Nếu không có Sprint Active: Hiển thị màn hình trống hướng dẫn vào Backlog.

---

## Tổng Kết File Cần Làm Việc
1.  `wwwroot/js/project-backlog.js`:
    *   `initProjectBacklog()`: Khởi tạo.
    *   `loadBacklogData()`: Lấy dữ liệu.
    *   `renderSprints()`, `renderProductBacklog()`: Hiển thị.
    *   `handleDragDrop()`: Xử lý kéo thả.
    *   `startSprint()`, `completeSprint()`: Xử lý logic nghiệp vụ.
2.  `wwwroot/js/project-board.js`:
    *   `renderScrumBoard()`: Hiển thị bảng theo Sprint Active (Đã cập nhật).
