# Kế Hoạch Cải Thiện UI/UX Trang Backlog

Tài liệu này phác thảo các bước để nâng cấp giao diện người dùng cho trang Project Backlog, tập trung vào trải nghiệm người dùng (UX) và tính thẩm mỹ.

## 1. Hệ Thống Thông Báo (Notification Toast)
**Hiện tại:** Sử dụng `alert()` của trình duyệt gây gián đoạn trải nghiệm và thiếu chuyên nghiệp.
**Mục tiêu:** Hiển thị thông báo dạng Toast (Snackbar) ở góc màn hình, không chặn thao tác người dùng và tự động biến mất.

### Chi tiết thực hiện:
1.  **Component HTML/CSS:**
    *   Tạo container cố định (`fixed`) ở góc phải trên (`top-4 right-4`).
    *   Thiết kế 4 biến thể:
        *   ✅ **Success:** Nền xanh lá, icon check.
        *   ❌ **Error:** Nền đỏ, icon cảnh báo.
        *   ℹ️ **Info:** Nền xanh dương.
        *   ⚠️ **Warning:** Nền vàng.
    *   **Animation:** Slide in từ phải sang, Fade out khi ẩn.
2.  **Helper Function (`toast.js`):**
    *   Tạo hàm `showToast(message, type = 'info', duration = 3000)`.
    *   Logic: Tạo DOM element -> Append vào container -> Set timeout để remove.
3.  **Tích hợp:**
    *   Thay thế toàn bộ các lệnh `alert()` trong `project-backlog.js` (ví dụ: khi tạo sprint thành công, lỗi API...) bằng `showToast()`.

## 2. Sprint Menu & Actions (Menu Tùy Chọn)
**Hiện tại:** Các nút thao tác (như Start, Complete) đang hiển thị trực tiếp. Thiếu chức năng Edit/Delete hoặc chưa có chỗ đặt hợp lý.
**Mục tiêu:** Gom nhóm các hành động phụ vào menu "..." (More Options) để giao diện gọn gàng, chuyên nghiệp.

### Chi tiết thực hiện:
1.  **UI Dropdown Menu:**
    *   Thêm nút icon 3 chấm (...) vào góc phải header của mỗi Sprint.
    *   Menu xổ xuống (Dropdown) chứa các mục:
        *   ✏️ **Edit Sprint:** Chỉnh sửa tên, mục tiêu, ngày tháng.
        *   🗑️ **Delete Sprint:** Xóa sprint (kèm logic kiểm tra điều kiện).
        *   🚀 **Start/Complete Sprint:** (Có thể đưa vào đây hoặc giữ nguyên nút lớn tùy mức độ quan trọng).
2.  **Logic Xử Lý:**
    *   Sử dụng lại hàm `toggleDropdown` trong `taskUI.js`.
    *   Gắn sự kiện cho từng item trong menu (sử dụng Event Delegation).

## 3. Modal Xác Nhận & Edit (Dialogs)
**Hiện tại:** Chưa có modal xác nhận khi xóa, modal Edit chưa rõ ràng.
**Mục tiêu:** Đảm bảo mọi hành động quan trọng đều có xác nhận và giao diện nhập liệu nhất quán.

### Chi tiết thực hiện:
1.  **Confirmation Modal (Modal Xác Nhận):**
    *   Tạo một Modal chung (Generic Modal) để tái sử dụng.
    *   Nội dung: Tiêu đề, Message cảnh báo, Nút "Cancel" và "Confirm" (màu đỏ nếu là hành động xóa).
    *   Áp dụng cho: Xóa Sprint, Xóa Task khỏi Sprint.
2.  **Edit Sprint Modal:**
    *   Tận dụng lại cấu trúc của Modal "Create Sprint" hoặc "Start Sprint".
    *   Prefill dữ liệu cũ khi mở.

## 4. Cải Thiện Trải Nghiệm Kéo Thả (Drag & Drop UX)
**Hiện tại:** Kéo thả cơ bản.
**Mục tiêu:** Tăng phản hồi thị giác để người dùng biết rõ đang thả vào đâu.

### Chi tiết thực hiện:
1.  **Drop Zones:** Highlight vùng thả (Sprint hoặc Backlog) khi đang kéo task (đổi màu nền, viền nét đứt đậm hơn).
2.  **Ghost Image:** Tùy chỉnh hình ảnh "Ghost" khi kéo (hiện tiêu đề task nhỏ gọn thay vì default của trình duyệt).

## 5. Lộ Trình Thực Hiện (Task List)

- [ ] **Bước 1:** Tạo file `components/toast.js` và CSS tương ứng.
- [ ] **Bước 2:** Thay thế `alert()` bằng `showToast()` trong `project-backlog.js`.
- [ ] **Bước 3:** Cập nhật `createSprintElement` để thêm nút Menu (...) và HTML cho Dropdown.
- [ ] **Bước 4:** Xây dựng `ConfirmationModal` và tích hợp vào nút Delete trong Menu.
- [ ] **Bước 5:** Xây dựng logic `Edit Sprint` (API `PUT`) và tích hợp vào Menu.
