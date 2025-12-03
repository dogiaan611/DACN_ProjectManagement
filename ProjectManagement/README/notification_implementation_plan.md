# Hướng dẫn Implement Chức năng Notification

Tài liệu này hướng dẫn chi tiết từng bước để hiển thị và quản lý thông báo trên trang `notification.html` sử dụng `notification.js`.

## Tổng quan
Chúng ta sẽ thực hiện các chức năng sau:
1.  **Load danh sách thông báo**: Fetch từ API khi trang tải.
2.  **Hiển thị thông báo**: Render HTML cho từng thông báo.
3.  **Đánh dấu đã đọc (1 cái)**: Khi click vào thông báo.
4.  **Đánh dấu đã đọc (tất cả)**: Khi click nút "Check all".

---

## Chi tiết từng bước

### Bước 1: Import và Setup
Mở file `wwwroot/js/notification.js`.
Đảm bảo đã import `authFetch` để gọi API có xác thực.

```javascript
import { authFetch } from "./auth.js";

// Lấy element container
const notificationList = document.getElementById('notification-list');
const markAllBtn = document.getElementById('mark-as-read-all');
```

### Bước 2: Hàm Fetch Notifications
Tạo hàm `loadNotifications` để gọi API lấy danh sách.

*   **Endpoint**: `GET /notification`
*   **Input**: `page`, `pageSize` (tùy chọn, mặc định backend là page 1, size 20).
*   **Output**: Danh sách object `Notification`.

```javascript
async function loadNotifications() {
    try {
        // Gọi API
        const response = await authFetch('/notification?page=1&pageSize=50');
        if (!response.ok) {
            throw new Error('Failed to load notifications');
        }
        const data = await response.json();
        
        // Render dữ liệu
        renderNotifications(data);
    } catch (error) {
        console.error(error);
        notificationList.innerHTML = '<p class="text-center text-gray-500">Không thể tải thông báo.</p>';
    }
}
```

### Bước 3: Hàm Render Notifications
Tạo hàm `renderNotifications` để hiển thị HTML.

*   **Logic**: Duyệt qua mảng data, tạo chuỗi HTML cho mỗi item.
*   **Lưu ý**: Kiểm tra `isRead` để style (ví dụ: chưa đọc thì nền trắng sáng hoặc đậm hơn, đã đọc thì xám nhạt).
*   **Format ngày**: Dùng `new Date(notification.createdAt).toLocaleString()`.

```javascript
function renderNotifications(notifications) {
    notificationList.innerHTML = ''; // Xóa nội dung cũ

    if (notifications.length === 0) {
        notificationList.innerHTML = '<p class="text-center text-gray-500 mt-4">Bạn không có thông báo nào.</p>';
        return;
    }

    notifications.forEach(notif => {
        // Style khác biệt cho tin chưa đọc
        const bgClass = notif.isRead ? 'bg-white' : 'bg-blue-50';
        const iconColor = notif.isRead ? 'text-gray-400' : 'text-blue-500';

        const html = `
            <div class="notification-item ${bgClass} p-4 rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors flex gap-4" 
                 data-id="${notif.notificationId}"
                 onclick="handleNotificationClick(${notif.notificationId}, this, ${notif.isRead})">
                
                <div class="${iconColor} mt-1">
                    <i class="fas fa-bell"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm text-gray-800 mb-1">${notif.content}</p>
                    <span class="text-xs text-gray-500">${new Date(notif.createdAt).toLocaleString()}</span>
                </div>
                ${!notif.isRead ? '<div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>' : ''}
            </div>
        `;
        notificationList.insertAdjacentHTML('beforeend', html);
    });
}
```

> **Lưu ý**: Cần gán hàm `handleNotificationClick` vào `window` hoặc dùng `addEventListener` sau khi render để bắt sự kiện click. Ở đây dùng `onclick` trong HTML string thì cần gán hàm vào `window`.

### Bước 4: Hàm Đánh dấu đã đọc (Một cái)
Khi user click vào một thông báo chưa đọc, gọi API để đánh dấu.

*   **Endpoint**: `PUT /notification/{id}/read`
*   **Function**: `markAsRead(id)`

```javascript
// Gán vào window để gọi được từ onclick HTML
window.handleNotificationClick = async (id, element, isRead) => {
    // Nếu đã đọc rồi thì không làm gì (hoặc tùy logic muốn navigate đi đâu đó)
    if (isRead) return;

    try {
        const response = await authFetch(`/notification/${id}/read`, {
            method: 'PUT'
        });

        if (response.ok) {
            // Update UI ngay lập tức: đổi màu nền, bỏ chấm xanh
            element.classList.remove('bg-blue-50');
            element.classList.add('bg-white');
            
            // Tìm và xóa chấm xanh (nếu có)
            const dot = element.querySelector('.bg-blue-500');
            if (dot) dot.remove();
            
            // Cập nhật lại onclick để không gọi API nữa
            element.setAttribute('onclick', `handleNotificationClick(${id}, this, true)`);
        }
    } catch (error) {
        console.error('Error marking as read:', error);
    }
};
```

### Bước 5: Hàm Đánh dấu tất cả đã đọc
Gắn sự kiện cho nút check-all.

*   **Endpoint**: `PUT /notification/read-all`

```javascript
markAllBtn.addEventListener('click', async () => {
    try {
        const response = await authFetch('/notification/read-all', {
            method: 'PUT'
        });

        if (response.ok) {
            // Reload lại list để cập nhật UI
            loadNotifications();
            // Hoặc loop qua DOM để update class (nhanh hơn)
        }
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
});
```

### Bước 6: Khởi chạy
Cuối cùng, gọi hàm load khi trang đã sẵn sàng.

```javascript
document.addEventListener('DOMContentLoaded', () => {
    loadNotifications();
});
```

---

## Tóm tắt các Endpoint sử dụng
| Chức năng | Method | Endpoint |
|-----------|--------|----------|
| Lấy danh sách | GET | `/notification` |
| Đọc 1 tin | PUT | `/notification/{id}/read` |
| Đọc tất cả | PUT | `/notification/read-all` |
