# Kế Hoạch Kiểm Thử Chức Năng Sprint (Frontend)

Tài liệu này hướng dẫn chi tiết các bước để kiểm thử thủ công (manual test) các chức năng quản lý Sprint trên giao diện người dùng (Frontend).

## 1. Tạo Sprint Mới (Create Sprint)

**Mục tiêu:** Đảm bảo người dùng có thể tạo một sprint mới với các thông tin mặc định hợp lý.

*   **Bước 1:** Truy cập vào trang **Backlog** của dự án.
*   **Bước 2:** Nhấn vào nút **"Create Sprint"** ở góc trên bên phải.
*   **Bước 3:** Kiểm tra Modal "Create Sprint":
    *   [ ] Modal hiển thị với hiệu ứng animation mượt mà.
    *   [ ] **Sprint Name**: Tự động điền (VD: "Sprint 1", "Sprint 2").
    *   [ ] **Start Date**: Tự động chọn ngày hôm nay.
    *   [ ] **End Date**: Tự động chọn ngày này tuần sau (7 ngày sau).
*   **Bước 4:** Nhấn **"Create"**.
*   **Kết quả mong đợi:**
    *   Modal đóng lại.
    *   Sprint mới xuất hiện ngay lập tức ở cuối danh sách Sprint.
    *   Thông báo thành công (nếu có).

## 2. Chỉnh Sửa Sprint (Edit Sprint)

**Mục tiêu:** Đảm bảo người dùng có thể cập nhật thông tin của một Sprint chưa hoàn thành.

*   **Bước 1:** Tại header của một Sprint bất kỳ, nhấn vào nút **Menu (...)** (3 chấm).
*   **Bước 2:** Chọn **"Edit Sprint"** (biểu tượng cây bút).
*   **Bước 3:** Kiểm tra Modal "Edit Sprint":
    *   [ ] Modal mở ra với thông tin cũ được điền sẵn (Tên, Mục tiêu, Ngày bắt đầu, Ngày kết thúc).
*   **Bước 4:** Thay đổi một số thông tin (ví dụ: đổi tên, chọn lại ngày kết thúc).
*   **Bước 5:** Nhấn **"Save Changes"**.
*   **Kết quả mong đợi:**
    *   Modal đóng lại.
    *   Thông tin trên header của Sprint đó được cập nhật ngay lập tức mà không cần reload trang.

## 3. Xóa Sprint (Delete Sprint)

**Mục tiêu:** Đảm bảo quy trình xóa an toàn và có xác nhận.

*   **Bước 1:** Nhấn vào nút **Menu (...)** của một Sprint.
*   **Bước 2:** Chọn **"Delete Sprint"** (biểu tượng thùng rác).
*   **Bước 3:** Kiểm tra Modal Xác Nhận (Confirmation Modal):
    *   [ ] Modal hiển thị cảnh báo: "Are you sure you want to delete this sprint? All tasks...".
    *   [ ] Nút "Confirm" có màu đỏ (cảnh báo hành động nguy hiểm).
*   **Bước 4:** Nhấn **"Confirm"**.
*   **Kết quả mong đợi:**
    *   Sprint biến mất khỏi danh sách.
    *   Các task trong Sprint đó (nếu có) sẽ được chuyển về Product Backlog (kiểm tra lại Backlog để xác nhận).

## 4. Bắt Đầu Sprint (Start Sprint)

**Mục tiêu:** Đảm bảo chỉ có thể bắt đầu sprint đầu tiên trong hàng đợi và chuyển trạng thái thành công.

*   **Điều kiện:** Đảm bảo chưa có Sprint nào đang chạy (Active).
*   **Bước 1:** Tìm Sprint đầu tiên trong danh sách (trạng thái *Planning*).
*   **Bước 2:** Kiểm tra nút **"Start Sprint"**:
    *   [ ] Nút này CHỈ hiển thị ở Sprint đầu tiên. Các Sprint phía sau không có nút này.
*   **Bước 3:** Nhấn **"Start Sprint"**.
*   **Bước 4:** Trong Modal hiện ra, kiểm tra lại thông tin và nhấn **"Start"**.
*   **Kết quả mong đợi:**
    *   Trạng thái Sprint đổi từ *Planning* (màu xám/xanh nhạt) sang *Active* (màu xanh lá).
    *   Nút "Start Sprint" biến mất, thay thế bằng nút "Complete Sprint".

## 5. Hoàn Thành Sprint (Complete Sprint)

**Mục tiêu:** Kiểm tra luồng kết thúc Sprint và xử lý các task chưa hoàn thành.

*   **Điều kiện:** Đang có một Sprint ở trạng thái *Active*.
*   **Bước 1:** Nhấn nút **"Complete Sprint"** trên header của Sprint đó.
*   **Bước 2:** Kiểm tra Modal "Complete Sprint":
    *   [ ] Hiển thị số lượng task đã hoàn thành (Completed).
    *   [ ] Hiển thị số lượng task chưa hoàn thành (Incomplete).
    *   [ ] Nếu có task chưa hoàn thành, hiển thị dropdown chọn nơi chuyển task đến (New Sprint hoặc Backlog).
*   **Bước 3:** Chọn tùy chọn di chuyển task (ví dụ: "Move to Product Backlog") và nhấn **"Complete"**.
*   **Kết quả mong đợi:**
    *   Sprint biến mất khỏi giao diện Backlog (vì đã hoàn thành).
    *   Các task chưa hoàn thành xuất hiện tại Product Backlog (hoặc Sprint mới tùy chọn).

## 6. Kéo Thả Task (Drag & Drop)

**Mục tiêu:** Đảm bảo thao tác phân bổ công việc mượt mà.

*   **Bước 1:** Kéo một task từ **Product Backlog** thả vào một **Sprint**.
    *   -> Task phải nằm yên trong Sprint đó.
*   **Bước 2:** Kéo một task từ **Sprint** thả ngược về **Product Backlog**.
    *   -> Task phải quay về Backlog.
*   **Bước 3:** (Nếu có nhiều Sprint) Kéo task từ **Sprint 1** sang **Sprint 2**.
    *   -> Task chuyển sang Sprint 2.
