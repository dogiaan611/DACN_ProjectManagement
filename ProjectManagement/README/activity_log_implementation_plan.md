# Plan Implement Activity Log Frontend

Tài liệu này hướng dẫn chi tiết từng bước để tích hợp Activity Log (Lịch sử hoạt động) vào giao diện chi tiết công việc (Task Detail).

## 1. Tổng quan

Mục tiêu là hiển thị danh sách các hoạt động (lịch sử thay đổi) của một task trong modal chi tiết task.
Chúng ta sẽ thêm một tab "Activity" bên cạnh "Comments" và "Subtasks".

### Backend API (Đã có sẵn)
- **Endpoint**: `GET /boards/{boardId}/columns/{columnId}/tasks/{taskId}/activity`
- **Controller**: `Controllers/ActivityLogController.cs`
- **Response**: Danh sách các object log:
  ```json
  [
    {
      "logId": 1,
      "taskId": 10,
      "userId": "user-guid",
      "userName": "Nguyen Van A",
      "action": "Updated title",
      "oldValue": "Old Title",
      "newValue": "New Title",
      "createdAt": "2023-10-27T10:00:00Z"
    }
  ]
  ```

## 2. Các bước thực hiện

### Bước 1: Tạo file `wwwroot/js/activityLog.js`

File này sẽ chứa logic để fetch và render activity logs.

**Nội dung cần cài đặt:**
1.  **Import `authFetch`**: Để gọi API có xác thực.
2.  **Function `initActivityLog(boardId, columnId, taskId, modal)`**:
    -   Hàm khởi tạo, được gọi khi mở modal.
    -   Lấy element container của activity log (sẽ tạo ở Bước 2).
    -   Gọi hàm `fetchActivityLogs`.
3.  **Function `fetchActivityLogs(boardId, columnId, taskId, container)`**:
    -   Gọi API `GET`.
    -   Nhận dữ liệu JSON.
    -   Gọi `renderActivityLogs`.
4.  **Function `renderActivityLogs(logs, container)`**:
    -   Xóa nội dung cũ của container.
    -   Duyệt qua danh sách logs.
    -   Tạo HTML cho từng log item (Avatar user, tên user, hành động, thời gian).
    -   Append vào container.

### Bước 2: Cập nhật `wwwroot/js/taskUI.js`

Cần sửa hàm `createTaskDetailModalHtml` để thêm Tab và Container cho Activity Log.

**Thay đổi cần làm:**
1.  **Thêm nút Tab**:
    Trong phần danh sách các nút tab (Comments, Subtasks), thêm nút "Activity".
    ```html
    <button id="tab-activity-btn" class="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none">Activity</button>
    ```
2.  **Thêm Container nội dung**:
    Thêm `div` chứa nội dung activity log, mặc định ẩn (`hidden`).
    ```html
    <div id="tab-content-activity" class="hidden">
        <div id="task-activity-list" class="flex flex-col gap-4 max-h-60 overflow-y-auto py-2">
            <!-- Activity logs will be loaded here -->
        </div>
    </div>
    ```

### Bước 3: Cập nhật `wwwroot/js/taskDetail.js`

Cần tích hợp logic của Activity Log vào luồng mở modal và xử lý chuyển tab.

**Thay đổi cần làm:**
1.  **Import**:
    ```javascript
    import { initActivityLog } from "./activityLog.js";
    ```
2.  **Gọi `initActivityLog`**:
    Trong hàm `openTaskDetailModal`, sau khi render modal, gọi:
    ```javascript
    initActivityLog(boardId, columnId, taskId, modal);
    ```
3.  **Xử lý chuyển Tab**:
    Cập nhật logic `setActiveTab` và event listener để xử lý tab mới "Activity".
    -   Khi click "Activity": Ẩn Comment/Subtask, hiện Activity. Active style cho nút Activity.

## 3. Chi tiết mã nguồn (Tham khảo)

### `wwwroot/js/activityLog.js` (Dự kiến)

```javascript
import { authFetch } from './auth.js';

export function initActivityLog(boardId, columnId, taskId, modal) {
    const container = modal.querySelector('#task-activity-list');
    if (!container) return;

    fetchActivityLogs(boardId, columnId, taskId, container);
}

async function fetchActivityLogs(boardId, columnId, taskId, container) {
    try {
        container.innerHTML = '<div class="text-sm text-gray-500">Loading activity...</div>';
        const res = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}/activity`);
        if (!res.ok) throw new Error('Failed to fetch activity logs');
        
        const logs = await res.json();
        renderActivityLogs(logs, container);
    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="text-sm text-red-500">Error loading activity.</div>';
    }
}

function renderActivityLogs(logs, container) {
    container.innerHTML = '';
    if (logs.length === 0) {
        container.innerHTML = '<div class="text-sm text-gray-500">No activity recorded.</div>';
        return;
    }

    logs.forEach(log => {
        const date = new Date(log.createdAt).toLocaleString('vi-VN');
        const userInitial = log.userName ? log.userName.charAt(0).toUpperCase() : '?';
        
        // Giả sử không có avatarUrl trong log response hiện tại, dùng fallback
        // Nếu muốn avatar ảnh, cần update backend trả về avatarUrl hoặc fetch user detail
        const avatarHtml = `<div class="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-semibold">${userInitial}</div>`;

        const itemHtml = `
            <div class="flex gap-3 items-start">
                ${avatarHtml}
                <div class="flex flex-col">
                    <div class="text-sm text-gray-800">
                        <span class="font-semibold">${log.userName || 'Unknown'}</span>
                        <span class="text-gray-600">${log.action}</span>
                        ${log.oldValue || log.newValue ? `<div class="text-xs text-gray-500 mt-1">Changed from "<b>${log.oldValue}</b>" to "<b>${log.newValue}</b>"</div>` : ''}
                    </div>
                    <span class="text-xs text-gray-400">${date}</span>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', itemHtml);
    });
}
```

## 4. Kiểm thử

1.  Mở một task bất kỳ.
2.  Click vào tab "Activity".
3.  Kiểm tra xem danh sách log có hiện ra không.
4.  Thực hiện một thay đổi (ví dụ: đổi tên task), sau đó đóng và mở lại modal (hoặc reload) để xem log mới có xuất hiện không.
