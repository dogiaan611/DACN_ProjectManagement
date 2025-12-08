# Hướng Dẫn Hiện Thực Sprint (Detailed Implementation Plan)

Tài liệu này là hướng dẫn chi tiết từng bước (step-by-step) để hiện thực tính năng Sprint (Scrum) cho Frontend. Hãy làm theo thứ tự checklist dưới đây.

## Phase 1: Setup Navigation & View (Cấu trúc & Điều hướng)

Mục tiêu: Tạo view mới "Backlog" và đảm bảo người dùng có thể chuyển đổi qua lại giữa các view.

### 1.1. Cập nhật HTML (`wwwroot/project.html`)
- [ ] Tìm đến section chứa các nút chuyển view (`#kanban-view-btn`, `#list-view-btn`, ...).
- [ ] Thêm một nút mới cho **Backlog**:
  ```html
  <div role="button" id="backlog-view-btn" class="flex items-center justify-center gap-1 hover:text-blue-400 transition-colors duration-200">
      <!-- Icon Backlog (ví dụ: list-checks hoặc layers) -->
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layers"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>
      Backlog
  </div>
  ```

### 1.2. Tạo file Controller cho Backlog (`wwwroot/js/project-backlog.js`)
- [ ] Tạo file mới `wwwroot/js/project-backlog.js`.
- [ ] Export hàm `initProjectBacklog()`:
  ```javascript
  import { authFetch } from './auth.js';

  export async function initProjectBacklog() {
      const container = document.getElementById('project-content');
      container.innerHTML = '<div class="p-4">Loading Backlog...</div>';
      
      // TODO: Load data
      console.log("Backlog view initialized");
  }
  ```

### 1.3. Cập nhật Router (`wwwroot/js/project-detail.js`)
- [ ] Import `initProjectBacklog` ở đầu file.
- [ ] Trong hàm `viewSwitcher()`:
  - [ ] Lấy element `#backlog-view-btn`.
  - [ ] Thêm event listener cho nút này.
  - [ ] Khi click, gọi `initProjectBacklog()` và cập nhật active class (tương tự như kanban/list).

---

## Phase 2: Data Fetching & Rendering (Hiển thị dữ liệu)

Mục tiêu: Hiển thị danh sách các Sprint và Product Backlog.

### 2.1. Fetch Data (`wwwroot/js/project-backlog.js`)
- [ ] Viết hàm `loadBacklogData(projectId)` gọi song song 2 API:
  1.  `GET /projects/{projectId}/sprints`: Lấy danh sách sprints.
  2.  `GET /projects/{projectId}/backlog`: Lấy các task chưa vào sprint (Product Backlog).
      *Note: Nếu chưa có API backlog riêng, có thể gọi API lấy all tasks và lọc `sprintId == null`.*

### 2.2. Render UI Structure
- [ ] Xây dựng layout chia làm 2 phần chính:
  - **Left/Top Panel**: Danh sách Sprints (Active, Planning, Completed).
  - **Right/Bottom Panel**: Product Backlog (Các task chưa assign).
- [ ] **Sprint Component**: Mỗi sprint hiển thị:
  - Header: Tên, Ngày tháng, Trạng thái, Nút "Start/Complete", Nút "Edit/Delete".
  - Body: Danh sách task trong sprint đó (Sprint Backlog).
  - Footer: Nút "Create Task" (nhanh) vào sprint này.

### 2.3. Render Tasks
- [ ] Tái sử dụng logic render task card (nếu được) hoặc tạo version nhỏ gọn hơn cho view Backlog (chỉ cần Title, Priority, Story Points, Assignee).

---

## Phase 3: Sprint Management (CRUD Sprint)

Mục tiêu: Cho phép tạo, sửa, xóa Sprint.

### 3.1. Create Sprint
- [ ] Thêm nút "Create Sprint" ở đầu danh sách Sprint.
- [ ] Sự kiện click: Gọi API `POST /projects/{projectId}/sprints`.
  - Body: `{ name: "Sprint " + (count+1), ... }` (có thể auto-generate tên hoặc hiện modal).
- [ ] Reload lại danh sách sprint sau khi tạo thành công.

### 3.2. Edit/Delete Sprint
- [ ] Thêm menu dropdown hoặc nút icon trên header của mỗi Sprint.
- [ ] **Edit**: Hiện modal sửa Tên, Goal, StartDate, EndDate -> Gọi `PUT`.
- [ ] **Delete**: Confirm dialog -> Gọi `DELETE`. *Lưu ý: Chỉ xóa được sprint chưa start hoặc đã cancel (tùy logic backend).*

---

## Phase 4: Task Assignment (Drag & Drop)

Mục tiêu: Kéo thả task giữa Backlog và các Sprint.

### 4.1. Setup Drag & Drop
- [ ] Sử dụng thư viện `SortableJS` (đã có sẵn hoặc import CDN).
- [ ] Khởi tạo Sortable cho:
  - Container `Product Backlog`.
  - Container `Sprint Backlog` của từng sprint.
- [ ] Cấu hình `group: 'shared-sprints'` để cho phép kéo qua lại giữa các container.

### 4.2. Handle Drop Event (`onEnd`)
- [ ] Khi task được thả vào một Sprint mới:
  - Lấy `taskId` từ element.
  - Lấy `sprintId` từ container đích.
  - Gọi API: `POST /projects/{projectId}/sprints/{sprintId}/tasks/{taskId}`.
- [ ] Khi task được thả về Product Backlog:
  - Gọi API: `DELETE /projects/{projectId}/sprints/{oldSprintId}/tasks/{taskId}` (hoặc API remove from sprint).
- [ ] **Optimistic Update**: Cập nhật UI ngay lập tức, nếu API lỗi thì revert.

---

## Phase 5: Sprint Lifecycle (Start & Complete)

Mục tiêu: Quản lý vòng đời của Sprint.

### 5.1. Start Sprint
- [ ] Chỉ hiện nút "Start Sprint" ở sprint có trạng thái `Planning`.
- [ ] Logic check: Không cho phép start nếu đã có sprint `Active`.
- [ ] Click -> Hiện Modal chọn ngày kết thúc -> Gọi API `POST .../start`.

### 5.2. Complete Sprint
- [ ] Chỉ hiện nút "Complete Sprint" ở sprint `Active`.
- [ ] Click -> Hiện Modal "Complete Sprint":
  - Hiển thị số lượng task hoàn thành / chưa hoàn thành.
  - Option xử lý task chưa xong: "Move to New Sprint" hoặc "Move to Backlog".
- [ ] Gọi API `POST .../complete` với payload xử lý task tồn đọng.

---

## Phase 6: Board View Integration (Kanban)

Mục tiêu: Kanban Board chỉ hiện task của Sprint đang chạy.

### 6.1. Update `project-board.js`
- [ ] Trong hàm `createBoard` hoặc khi fetch tasks:
- [ ] Kiểm tra xem Project có đang chạy Sprint nào không (gọi API lấy active sprint).
- [ ] Nếu có Active Sprint:
  - Chỉ hiển thị các task thuộc Sprint đó lên bảng.
  - (Backend có thể đã handle việc này, cần verify).
- [ ] Nếu không có Active Sprint:
  - Hiển thị thông báo "No active sprint" hoặc hiển thị backlog (tùy requirement).

---

## API Reference (Quick Look)

| Action | Method | URL |
| :--- | :--- | :--- |
| **Get Sprints** | `GET` | `/projects/{id}/sprints` |
| **Get Backlog** | `GET` | `/projects/{id}/backlog` |
| **Create Sprint** | `POST` | `/projects/{id}/sprints` |
| **Add Task to Sprint** | `POST` | `/projects/{id}/sprints/{sprintId}/tasks/{taskId}` |
| **Start Sprint** | `POST` | `/projects/{id}/sprints/{sprintId}/start` |
| **Complete Sprint** | `POST` | `/projects/{id}/sprints/{sprintId}/complete` |
