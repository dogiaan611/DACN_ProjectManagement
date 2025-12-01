# Plan: Tích hợp NotificationHelper & Xây dựng Giao diện

Bạn đã có các hàm trong `NotificationHelper` (như `NotifyAssigneeAsync`, `AddNotificationAsync`). Đây là nền tảng rất tốt. Dưới đây là phân tích và hướng dẫn chi tiết để sử dụng chúng cho giao diện.

## 1. Phân tích: Sử dụng `NotificationHelper`

### Bản chất
Các hàm trong `NotificationHelper` đóng vai trò là **Producer (Người tạo)**.
- Nhiệm vụ: Ghi dữ liệu thông báo vào Database (bảng `Notifications`).
- **Không thể dùng trực tiếp cho Giao diện (UI)**: Vì UI cần **đọc** dữ liệu ra, còn các hàm này chỉ **ghi** vào.

### Ưu điểm & Nhược điểm

| Đặc điểm | Chi tiết |
| :--- | :--- |
| **Ưu điểm** | **Tái sử dụng cao:** Viết 1 lần, dùng ở mọi nơi (TaskController, CommentController, v.v.).<br>**Gọn code:** Controller chính không bị rối bởi logic tạo thông báo.<br>**Dễ bảo trì:** Muốn sửa format thông báo, chỉ cần sửa trong Helper. |
| **Nhược điểm** | **Chỉ là một chiều (One-way):** Chỉ lưu vào DB, không tự động đẩy ra UI (cần cơ chế Polling hoặc SignalR nếu muốn realtime).<br>**Cần thêm phần "Đọc":** Bắt buộc phải viết thêm API để lấy dữ liệu ra cho UI hiển thị. |

---

## 2. Hướng dẫn chi tiết từng bước

Để "dùng các hàm này cho giao diện", chúng ta cần thực hiện quy trình khép kín: **Ghi (Backend) -> Đọc (API) -> Hiển thị (Frontend)**.

### Bước 1: Kích hoạt thông báo (Backend - Write)
Sử dụng `NotificationHelper` tại các điểm sự kiện quan trọng trong các Controller hiện có.

*Ví dụ: Trong `TaskController.cs` (Bạn đã có, nhưng hãy rà soát lại)*
- **Khi Tạo Task:** Gọi `NotifyAssigneeAsync` (nếu assign cho người khác).
- **Khi Update Task:** Gọi `NotifyAssigneeAsync` (nếu đổi assignee).
- **Khi Comment:** Gọi `NotifyMentionAsync` (nếu có mention).

### Bước 2: Tạo "Cổng đọc" dữ liệu (Backend - Read)
Vì `NotificationHelper` không có hàm đọc, ta cần tạo một nơi để UI lấy dữ liệu.
*Thay vì làm `NotificationController` phức tạp, ta có thể làm đơn giản:*

Thêm 1 API endpoint vào `NotificationController` hiện có (hoặc `UserController`):

```csharp
// GET: /notification/mine
[HttpGet("mine")]
public async Task<IActionResult> GetMyNotifications()
{
    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    var notifs = await _db.Notifications
        .Where(n => n.UserId == userId)
        .OrderByDescending(n => n.CreatedAt)
        .Take(20) // Lấy 20 cái mới nhất
        .Select(n => new {
            n.NotificationId,
            n.Content,
            n.Type,
            n.IsRead,
            TimeAgo = CalculateTimeAgo(n.CreatedAt), // Hàm tự viết hoặc xử lý ở JS
            Link = $"/boards/.../tasks/{n.TaskId}" // Link đến task
        })
        .ToListAsync();
    return Ok(notifs);
}
```

### Bước 3: Xây dựng Giao diện (Frontend - Display)
Tạo giao diện để gọi "Cổng đọc" ở Bước 2.

#### 3.1. Tạo file `wwwroot/js/notification.js`
File này sẽ chịu trách nhiệm:
1.  Gọi API `/notification/mine`.
2.  Vẽ HTML danh sách thông báo.
3.  Gắn vào giao diện.

```javascript
async function loadNotifications() {
    try {
        const res = await fetch('/notification/mine');
        const data = await res.json();
        
        const listContainer = document.getElementById('notification-list');
        listContainer.innerHTML = ''; // Clear cũ

        data.forEach(notif => {
            const item = document.createElement('div');
            item.className = `notif-item ${notif.isRead ? '' : 'unread'}`;
            item.innerHTML = `
                <div class="notif-content">${notif.content}</div>
                <div class="notif-time">${notif.timeAgo}</div>
            `;
            item.onclick = () => {
                // Logic đánh dấu đã đọc và chuyển trang
                window.location.href = notif.link; 
            };
            listContainer.appendChild(item);
        });
    } catch (e) {
        console.error(e);
    }
}
```

#### 3.2. Tạo trang hiển thị `Views/Notification/Index.cshtml`
```html
<div class="notification-page">
    <h2>Thông báo của bạn</h2>
    <div id="notification-list">
        <!-- JS sẽ điền dữ liệu vào đây -->
        <p>Đang tải...</p>
    </div>
</div>

<script src="/js/notification.js"></script>
<script>
    document.addEventListener('DOMContentLoaded', loadNotifications);
</script>
```

## 3. Tổng kết
Bạn **KHÔNG THỂ** dùng trực tiếp `NotificationHelper` để hiển thị lên giao diện.
Nhưng bạn **NÊN** dùng nó để tạo dữ liệu nền.

**Kế hoạch hành động ngay bây giờ:**
1.  [ ] **Backend Read:** Thêm API `GetMyNotifications` vào `NotificationController.cs`.
2.  [ ] **Frontend Logic:** Tạo `notification.js` để fetch và render dữ liệu.
3.  [ ] **Frontend View:** Tạo trang `Index.cshtml` đơn giản.
4.  [ ] **Integration:** Thêm link "Thông báo" vào Header (`_Layout.cshtml`).
