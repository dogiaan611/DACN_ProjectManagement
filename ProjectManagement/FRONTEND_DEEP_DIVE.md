# Hướng Dẫn Chuyên Sâu Frontend Javascript (Frontend Deep Dive)

Tài liệu này là bản phân tích toàn diện (Encyclopedia) về mã nguồn Frontend của dự án. Nó đi sâu vào **từng file**, giải thích **tại sao** code được viết như vậy, các **kỹ thuật (patterns)** được sử dụng, và **logic nghiệp vụ** bên trong.

---

## 🏗️ 1. Core System & Infrastructure (Hạ tầng cốt lõi)

Nhóm file này chịu trách nhiệm vận hành nền tảng của ứng dụng, bao gồm xác thực, điều hướng và layout chính.

### 🔐 `js/auth/auth.js` - Trái tim của hệ thống bảo mật
*   **Mục đích:** Quản lý JWT Token và API Client trung tâm.
*   **Deep Dive Logic:**
    *   **Interceptor Pattern:** Hàm `authFetch` được thiết kế để thay thế hoàn toàn `fetch` mặc định của trình duyệt. Trước khi gửi bất kỳ request nào, nó tự động lấy Token từ `localStorage` và chèn vào Header `Authorization`.
    *   **Smart Content-Type:** Nó kiểm tra xem `body` có phải là `FormData` hay không. Nếu là `FormData` (thường dùng khi upload ảnh/file), nó **cố tình** không set header `Content-Type` để trình duyệt tự động set `multipart/form-data` kèm theo `boundary` chính xác.
    *   **Auto-Logout:** Nếu nhận phản hồi `401 Unauthorized` từ Server, nó tự động xóa token và chuyển hướng về trang đăng nhập.

### 🚪 `js/auth/login.js` & `register.js` - Logic giao diện xác thực
*   **Mục đích:** Điều khiển các form đăng nhập/đăng ký.
*   **Kỹ thuật đáng chú ý:**
    *   **Input Toggling:** Logic ẩn/hiện mật khẩu bằng cách thay đổi attribute `type` của input từ `password` sang `text`.
    *   **Async Form Submission:** Sử dụng `e.preventDefault()` để chặn hành vi submit mặc định, thay vào đó dùng Javascript để gửi dữ liệu nền (AJAX).
    *   **Countdown Timer (`register.js`):** Khi yêu cầu OTP, một `setInterval` được kích hoạt để đếm ngược thời gian, ngăn spam API liên tục.

### 🧭 `js/layout/sidebar.js` - Bộ định tuyến (SPA Router)
*   **Mục đích:** Biến ứng dụng thành **Single Page Application (SPA)** giả lập.
*   **Logic chuyên sâu:**
    *   **History API:** Sử dụng `window.history.pushState()` để thay đổi URL mà không reload trang.
    *   **Event Delegation:** Bắt sự kiện click trên container `sidebar-nav` thay vì từng thẻ `<a>`, giúp code gọn và hỗ trợ dynamic rendering.
    *   **Modal Rescue:** Kỹ thuật tìm các modal quan trọng (thường được append vào cuối body) và di chuyển/ẩn chúng an toàn trước khi nội dung trang bị thay thế, tránh lỗi DOM orphan.

### 🔔 `js/layout/notification.js` - Hệ thống thông báo
*   **Mục đích:** Hiển thị thông báo thời gian thực và danh sách thông báo.
*   **Kỹ thuật:**
    *   **Infinite Scroll:** Lắng nghe sự kiện `scroll`. Khi `scrollTop + clientHeight` chạm ngưỡng đáy, hệ thống tự động tải trang thông báo tiếp theo (Pagination).
    *   **Badge Update:** Logic đếm số lượng thông báo `isRead == false` để cập nhật số đỏ trên chuông.

---

## 🚀 2. Project Management Engine (Quản lý dự án)

Phần phức tạp nhất của ứng dụng, chứa các logic xử lý dữ liệu và giao diện tương tác cao.

### 🎮 `js/project/project-detail.js` - The Controller
*   **Mục đích:** Điều phối toàn bộ trang chi tiết dự án.
*   **Logic:**
    *   **Lazy Initialization:** Chỉ khởi tạo các view (List, Board, Gantt) khi người dùng click vào tab tương ứng lần đầu tiên.
    *   **Event Hub:** Lắng nghe `project-updated`, `project-members-updated` để đồng bộ dữ liệu giữa các module mà không cần gọi hàm trực tiếp (Loose Coupling).

### 📋 `js/project/project-board.js` - Bảng Kanban & Scrum
*   **Mục đích:** Hiển thị Board công việc.
*   **Deep Dive Logic:**
    *   **Factory Pattern:** Hàm `initProjectBoard` đóng vai trò như một Factory, kiểm tra `projectType` để quyết định render `renderKanbanBoard` hay `renderScrumBoard`.
    *   **Parallel Fetching:** Sử dụng `Promise.all` kết hợp với `map` để tải dữ liệu của tất cả các cột song song.
        ```javascript
        // Thay vì chờ cột A xong mới tải cột B
        const columnsHtmlPromises = columns.map(async column => { ...fetchTasks... });
        await Promise.all(columnsHtmlPromises);
        ```
        Việc này giảm thời gian loading ban đầu từ N giây xuống còn 1 giây (thời gian của request chậm nhất).
    *   **Scrum Active Sprint:** Với dự án Scrum, code tự động tìm Sprint có `status === 1` (Active) để hiển thị, nếu không có sẽ hiển thị màn hình Empty State hướng dẫn vào Backlog.

### 📋 `js/project/project-backlog.js` - Agile Backlog (Scrum)
*   **Purpose**: Quản lý Product Backlog và Sprint cho dự án Scrum.
*   **Deep Dive Logic**:
    *   **Sprint Lifecycle:**
        *   **Create/Start:** Kiểm tra giới hạn (chỉ 1 sprint Active). Validate ngày tháng bằng Calendar component.
        *   **Complete:** Tự động tính toán task hoàn thành/chưa hoàn thành. Hỗ trợ di chuyển task chưa xong về Backlog hoặc Sprint mới.
    *   **Drag & Drop Architecture:** Cho phép kéo thả task tự do giữa Backlog (kho chứa) và các Sprint (kế hoạch).

### �️ `js/project/drag-drop.js` - Core Drag & Drop Engine
*   **Mục đích:** Xử lý kéo thả task và cột mượt mà.
*   **Kỹ thuật & Hack:**
    *   **Ghost Image Hack:** Sử dụng một ảnh trong suốt 1x1 pixel (`data:image/gif...`) để set làm `dragImage` mặc định của trình duyệt, giúp ẩn bóng mờ xấu xí mặc định.
    *   **Custom Drag Preview:** Tự tạo một bản sao (clone) của thẻ đang kéo, xoay nghiêng 3 độ (`rotate(3deg)`), thêm bóng đổ (`box-shadow`), và dùng Javascript để cập nhật vị trí (`top`, `left`) theo con trỏ chuột. Điều này tạo cảm giác "nhấc" thẻ lên rất thật.
    *   **Pointer Events None:** Bản sao Preview được set `pointer-events: none` để các sự kiện chuột có thể "xuyên qua" nó và kích hoạt `dragover` trên các vùng thả bên dưới.
    *   **Math Logic (`getDragAfterElement`):** Tính toán vị trí thả chính xác bằng cách so sánh tọa độ chuột Y (hoặc X) với tâm của các element khác trong list.

### � `js/project/project-gantt.js` - Biểu đồ Gantt (Native SVG)
*   **Mục đích:** Vẽ biểu đồ tiến độ.
*   **Kỹ thuật:**
    *   **SVG Rendering:** Không dùng thư viện, tự vẽ các thẻ `<rect>`, `<line>`, `<text>` bằng SVG để đạt hiệu năng cao nhất.
    *   **Scroll Sync:** Đồng bộ thanh cuộn dọc của danh sách tên task (trái) và biểu đồ (phải) để trải nghiệm giống Excel.

### 🏛️ `js/project/column.js` - Logic cột
*   **Mục đích:** Quản lý cột (Thêm, Sửa, Xóa).
*   **Logic:**
    *   **Optimistic UI:** Cập nhật giao diện ngay lập tức khi di chuyển cột, sau đó mới gửi API. Nếu API lỗi, reload lại bảng.

### 👥 `js/project/project-add-members.js` - Quản lý thành viên
*   **Mục đích:** Modal mời thành viên và quản lý quyền.
*   **Deep Dive Logic:**
    *   **Event Cleanup:** Trước khi khởi tạo lại modal, hàm `cleanupAddMembersListeners` được gọi để gỡ bỏ toàn bộ event listener cũ. Đây là **bắt buộc** trong môi trường SPA để tránh bug "Double Submit" (ấn nút 1 lần nhưng gửi 2 request) hoặc Memory Leak.
    *   **Debounce Search:** Tìm kiếm user sử dụng debounce timer 250ms để tối ưu API call.
    *   **Dynamic DOM:** Danh sách thành viên được render lại hoàn toàn mỗi khi có thay đổi (xóa, thêm), đảm bảo tính nhất quán.

### 📅 `js/components/calendar.js` - Shared UI Component
*   **Purpose**: Bộ chọn ngày (Date Picker) tái sử dụng, không phụ thuộc thư viện ngoài.
*   **Logic**:
    *   **Class-based:** Viết dạng Class để dễ dàng khởi tạo nhiều instance (Task DueDate, Sprint Start/End Date).
    *   **Grid Calculation:** Tự tính toán số ngày trong tháng, ngày bù (padding) đầu tháng để render lưới 7 cột chính xác.
    *   **Callback:** Trả về ngày được chọn qua callback `onChange`, giúp tách biệt UI khỏi logic xử lý dữ liệu.

---

## ✅ 3. Task System (Hệ thống Task chi tiết)

### 📄 `js/task/taskDetail.js` - Modal Controller
*   **Mục đích**: Controller trung tâm cho Modal chi tiết task.
*   **Deep Dive Logic**:
    *   **Lazy Loading:** Comments, Subtasks, Activity Log chỉ được tải khi mở modal (tiết kiệm bandwidth).
    *   **Live Sync:** Khi sửa Title/Assignee trong modal, code sẽ tìm và cập nhật ngay lập tức DOM của thẻ task bên ngoài (Board/Backlog) mà không cần reload lại trang cha.
    *   **Tab System:** Logic chuyển đổi tab đơn giản để hiển thị view con (Comment/Subtask) theo yêu cầu.

### 🧩 `js/task/task.js` - Task Logic Handler
*   **Deep Dive Logic:**
    *   **Event Delegation:** Gắn event listener vào container cha để xử lý click cho hàng trăm task (Delete, View Detail).
    *   **DOM Portal Integration:** Sử dụng các "Portal" (append dropdown vào body thay vì parent) để tránh vấn đề `overflow: hidden` hoặc `z-index` của thẻ cha làm mất dropdown.

### 💬 `js/task/comment.js` - Hệ thống bình luận & Mention
*   **Mục đích:** Xử lý bình luận và tag tên (@).
*   **Logic Mentions:**
    *   Dùng `Window.getSelection()` và `Range API` để xác định chính xác vị trí con trỏ khi user gõ `@`.
    *   Chèn một thẻ `span` (contenteditable=false) chứa tên user vào nội dung input để hiển thị highlight màu xanh.

### 📝 `js/task/subtask.js` - Tính năng chia nhỏ việc
*   **Logic:**
    *   **Progress Calculation:** Tự động tính toán % hoàn thành dựa trên số lượng subtask `isDone` và cập nhật thanh progress bar UI.
    *   **Inline Form:** Form thêm subtask xuất hiện ngay trong list (không modal), hỗ trợ nhập liệu nhanh.

### 📎 `js/task/attachment.js` - File đính kèm
*   **Logic:**
    *   **Authenticated Download:** Dùng `fetch()` với Header Authorization để tải file về dưới dạng BLOB, sau đó tạo Object URL để user tải xuống, bỏ qua cơ chế bảo mật trình duyệt mặc định.

### 📄 `js/task/taskDetail.js` - Modal Controller
*   **Purpose**: The central controller for the Task Detail Modal. It orchestrates UI updates, data fetching, and sub-module initialization.
*   **Deep Dive Logic**:
    *   **Lazy Loading**: Comments, Subtasks, and Logs are NOT loaded until the modal opens (improving initial page load).
    *   **Optimistic UI Updates**: When the user edits Title, Description, or Priority, the UI updates *immediately* while the API call happens in the background. If the API fails, it reverts the change.
    *   **View Synchronization**: When a task is updated in the modal (e.g., Assignee changed), it **directly modifies the DOM** of the Kanban Board or Backlog List behind the modal to reflect changes without a full page reload. This ensures the board is always fresh when the modal closes.
    *   **Tab System**: simple switch logic to toggle visibility between Comments/Subtasks/Activity views.

### 🏷️ `js/task/taskTag.js` - Phân loại Task
*   **Mục đích:** Quản lý hệ thống Tags (nhãn) cho task.
*   **Logic:**
    *   **Dropdown Search & Create:** Dropdown cho phép tìm kiếm tag có sẵn AND tạo tag mới cùng lúc. Nếu không tìm thấy tag, hiển thị option "Press Enter to create...".
    *   **Random Color Generation:** Khi tạo tag mới, hệ thống tự random màu từ một bảng màu định sẵn (Red, Amber, Emerald, Blue, Indigo, etc.) để giao diện sinh động.
    *   **Smart Rendering:** Chỉ hiển thị trong dropdown những tag *chưa* được gán vào task hiện tại (filtering).

### 👀 `js/task/taskWatcher.js` - Người theo dõi
*   **Mục đích:** Quản lý danh sách người nhận thông báo (Watchers).
*   **Logic:**
    *   **Toggle Mechanism:** Một nút "Eye" icon hoạt động như toggle: Click để Tự thêm/Tự xóa bản thân khỏi list.
    *   **Condensed Avatar List:** Chỉ hiển thị 4 avatar đầu tiên, còn lại hiển thị số lượng `+N` (Ví dụ: 4 avatar + "+3").
    *   **Portal Integration:** Sử dụng `toggleDropdown` từ `taskUI.js` để hiển thị danh sách add/remove watcher phức tạp mà không bị lỗi z-index.

### 🧩 `js/task/taskUI.js` - UI Factory & Portals
*   **Mục đích:** Tách biệt HTML String ra khỏi Logic code.
*   **Deep Dive Logic:**
    *   **Pure Functions:** Chứa các hàm chỉ trả về string HTML (ví dụ `createTaskCardHtml`, `createTaskDetailModalHtml`). Giúp file logic chính (`task.js`) gọn nhẹ, dễ đọc.
    *   **Portal Pattern (`toggleDropdown`):** Đây là một helper function cực kỳ quan trọng. Nó render các dropdown (như User Select, Calendar, Priority) trực tiếp vào `document.body` thay vì lồng trong div cha.
        *   *Tại sao?* Để tránh các vấn đề về `overflow: hidden` hoặc `z-index` của các container cha (như thẻ Task Card bé xíu).
        *   Sử dụng `getBoundingClientRect()` để tính tọa độ nút trigger và định vị dropdown chính xác ngay bên cạnh nó.

---

## 🛠️ 4. Admin System (Hệ thống Quản trị)

### 📈 `js/admin/admin-dashboard.js` - Dashboard thống kê
*   **Mục đích:** Hiển thị số liệu tổng quan và quản lý nhanh.
*   **Deep Dive Logic:**
    *   **Parallel Data Loading:** Tương tự Project Board, Dashboard sử dụng `Promise.all` để gọi 3 API thống kê (Stats, User Growth, Project Stats) cùng lúc.
    *   **Dynamic Library Loading:** Hàm `loadChartJs` kiểm tra xem `Chart` đã tồn tại chưa. Nếu chưa, nó tự tạo thẻ `<script>` để tải thư viện Chart.js từ CDN về. Kỹ thuật này giúp trang tải nhanh hơn vì không cần tải thư viện nếu user chưa vào màn hình Admin.
    *   **Lazy Tab Loading:** Tab "Task Management" chỉ bắt đầu tải dữ liệu khi user click vào nó, giảm tải cho lần render đầu tiên.

### 👥 `js/admin/admin-user-list.js` - Quản lý User
*   **Kỹ thuật:**
    *   **State Object:** Duy trì một object `state` duy nhất chứa `page`, `pageSize`, `search`, `role`. Mọi hành động lọc/sort đều chỉ sửa object này và gọi hàm `loadUserList()` tái sử dụng.

---

## ⚙️ 5. Settings System (Cài đặt)

### � `js/settings/user-settings-autosave.js` - Tự động lưu
*   **Mục đích:** Tự động lưu thông tin profile khi người dùng gõ.
*   **Deep Dive Logic:**
    *   **Class-based Design:** Được viết dưới dạng Class `UserSettingsAutoSave` để đóng gói logic gọn gàng.
    *   **Auto-Save Debounce:** Khi user gõ, chờ 2 giây mới gọi API save.
    *   **Smart Blur:** Nếu user đang gõ dở và click ra ngoài (blur), hệ thống hủy timer debounce và GỌI API NGAY LẬP TỨC. Logic này cực kỳ quan trọng để đảm bảo dữ liệu không mất khi user chuyển trang nhanh.
    *   **Optimistic Status:** Hiển thị trạng thái "Đang lưu..." -> "Đã lưu" để user yên tâm.

---
## ✨ Tổng kết kỹ thuật (Technical Summary)

Dự án này là minh chứng cho sức mạnh của **Vanilla Javascript** khi được tổ chức tốt:
1.  **Module hóa (ES6 Modules):** Code được chia nhỏ, dễ bảo trì.
2.  **Performance First:** Tận dụng `Promise.all`, `Lazy Loading`, `Debounce`, và `Event Delegation`.
3.  **User Experience (UX):** Chú trọng vào các chi tiết nhỏ như `Optimistic UI`, `Custom Drag Ghost`, `Auto-save`, và `Skeleton/Loading States`.
4.  **SPA Architecture:** Giả lập SPA hoàn hảo bằng `History API` và cơ chế thay thế nội dung DOM thông minh.
