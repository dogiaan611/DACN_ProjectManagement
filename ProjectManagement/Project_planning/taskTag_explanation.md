# Giải thích chi tiết file `wwwroot/js/taskTag.js`

File `taskTag.js` chịu trách nhiệm quản lý toàn bộ logic liên quan đến việc hiển thị, thêm, xóa và tạo mới các nhãn (tags) cho một công việc (task) cụ thể trong giao diện chi tiết công việc (Task Detail Modal).

## 1. Tổng quan về chức năng
File này export một hàm chính là `initTaskTags`. Hàm này được gọi khi modal chi tiết task được mở ra. Nó thiết lập các biến trạng thái, gọi API để lấy dữ liệu và gắn các sự kiện (event listeners) cho các thành phần giao diện.

Các chức năng chính:
- **Hiển thị danh sách tag** hiện có của task.
- **Xóa tag** khỏi task.
- **Hiển thị dropdown** chứa danh sách các tag có sẵn trong dự án.
- **Tìm kiếm tag** trong dropdown.
- **Gán tag** có sẵn vào task.
- **Tạo tag mới** ngay lập tức nếu tag chưa tồn tại.

---

## 2. Cách tiếp cận và Tư duy lập trình (How to think)

Để xây dựng chức năng này, chúng ta cần tư duy theo các bước sau:

### Bước 1: Xác định Dữ liệu (State)
Chúng ta cần quản lý 2 loại dữ liệu chính:
1.  **`currentTaskTags`**: Danh sách các tag *đang được gán* cho task này. Dùng để hiển thị các "chip" màu trên giao diện.
2.  **`allProjectTags`**: Danh sách *toàn bộ* các tag của dự án. Dùng để hiển thị trong dropdown cho người dùng chọn.

### Bước 2: Xác định Luồng dữ liệu (Data Flow)
- **Khi mở modal**: Cần gọi API lấy `currentTaskTags` ngay lập tức để hiển thị.
- **Khi bấm nút "Add Tag"**: Cần kiểm tra xem đã có `allProjectTags` chưa. Nếu chưa thì gọi API lấy về. Điều này giúp tối ưu hiệu năng (lazy loading), không cần load nếu người dùng không định thêm tag.
- **Khi gán/xóa tag**: Sau khi gọi API thành công, cần cập nhật lại giao diện. Cách đơn giản nhất là gọi lại hàm lấy `currentTaskTags` để đảm bảo dữ liệu đồng bộ với server.

### Bước 3: Tư duy về Giao diện (UI/UX)
- **Hiển thị**: Tag cần có màu sắc (background hoặc border) để dễ nhận diện.
- **Thao tác**:
    - Nút "xóa" (dấu x) nên nằm ngay trên tag.
    - Dropdown cần có ô tìm kiếm để người dùng dễ dàng lọc trong danh sách nhiều tag.
    - **UX nâng cao**: Nếu người dùng tìm một tag chưa có, cho phép họ nhấn Enter để tạo mới ngay lập tức thay vì phải vào trang quản lý tag riêng.

---

## 3. Giải thích chi tiết Code

### 3.1. Khởi tạo và Biến cục bộ
```javascript
export async function initTaskTags(boardId, columnId, projectId, taskId) {
    // ... lấy các DOM elements ...
    let currentTaskTags = []; // State lưu tag của task
    let allProjectTags = [];  // State lưu toàn bộ tag của project
    // ...
}
```
Hàm nhận vào các ID cần thiết để gọi API đúng địa chỉ.

### 3.2. Lấy danh sách Tag của Task (`fetchTaskTags`)
```javascript
async function fetchTaskTags() {
    // Gọi API: GET /boards/.../tasks/{taskId}/tags
    // Nếu thành công: Cập nhật currentTaskTags và gọi renderTaskTags()
}
```
**Tư duy**: Đây là hàm quan trọng nhất để đồng bộ giao diện với dữ liệu thực tế. Bất cứ khi nào có thay đổi (thêm/xóa), ta chỉ cần gọi lại hàm này.

### 3.3. Render Tags (`renderTaskTags`)
```javascript
function renderTaskTags() {
    tagsContainer.innerHTML = ''; // Xóa nội dung cũ
    currentTaskTags.forEach(tag => {
        // Tạo element div cho từng tag
        // Thêm nút xóa (x) và gắn sự kiện click cho nút xóa
    });
}
```
**Tư duy**: Luôn clear container trước khi render lại để tránh trùng lặp. Mỗi tag được render kèm theo một nút xóa có gắn `tagId` để biết cần xóa tag nào.

### 3.4. Logic Dropdown và Tìm kiếm (`renderTagDropdown`)
```javascript
function renderTagDropdown(filterText = '') {
    // 1. Lọc bỏ các tag đã có trong task (không hiển thị tag đã gán rồi)
    const availableTags = allProjectTags.filter(tag => !assignedTagIds.has(tag.tagId));

    // 2. Lọc theo từ khóa tìm kiếm (filterText)
    const filteredTags = availableTags.filter(...)

    // 3. Xử lý trường hợp không tìm thấy
    if (filteredTags.length === 0) {
        // Hiển thị gợi ý "Press Enter to create..."
    }

    // 4. Render danh sách
}
```
**Tư duy**:
- Dropdown không nên hiển thị những tag mà task đã có rồi (tránh gán trùng).
- Logic tìm kiếm giúp người dùng thao tác nhanh hơn.

### 3.5. Xử lý sự kiện "Enter" để Tạo/Gán Tag
```javascript
tagSearchInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        // 1. Kiểm tra xem tag người dùng gõ có trùng với tag nào có sẵn không
        const existingTag = allProjectTags.find(...)

        if (existingTag) {
            // Nếu có -> Gán luôn tag đó
            await assignTagToTask(existingTag.tagId);
        } else {
            // Nếu chưa có -> Tạo tag mới (Create) -> Sau đó Gán (Assign)
            // Random màu sắc cho tag mới để sinh động
            const newTag = await createProjectTag(...);
            await assignTagToTask(newTag.tagId);
        }
    }
});
```
**Tư duy**: Đây là tính năng tiện ích (Convenience). Thay vì bắt người dùng tạo tag ở chỗ khác rồi quay lại chọn, ta gộp quy trình đó vào một nút Enter.
1. Check tồn tại.
2. Nếu chưa tồn tại -> Gọi API tạo tag ở level Project.
3. Sau khi có tag mới -> Gọi API gán tag đó vào Task.

### 3.6. Các hàm API (`assignTagToTask`, `removeTagFromTask`)
Các hàm này thực hiện gọi `authFetch` với method `POST` hoặc `DELETE`.
**Quan trọng**: Sau khi gọi API thành công, chúng gọi lại `fetchTaskTags()` để cập nhật giao diện ngay lập tức.

## 4. Tổng kết
File `taskTag.js` là một ví dụ điển hình của mô hình **MVC đơn giản phía Client**:
- **Model**: `currentTaskTags`, `allProjectTags`.
- **View**: `renderTaskTags`, `renderTagDropdown`.
- **Controller**: Các hàm xử lý sự kiện (click, keydown) và gọi API.

Cách tổ chức này giúp code rõ ràng, dễ bảo trì và tách biệt được logic dữ liệu với logic hiển thị.
