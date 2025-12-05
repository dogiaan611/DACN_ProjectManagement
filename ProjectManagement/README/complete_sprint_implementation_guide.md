# Hướng Dẫn Triển Khai: Hoàn Thành Sprint (Complete Sprint)

Tài liệu này hướng dẫn chi tiết các bước để thêm tính năng "Complete Sprint" vào `project-backlog.js`.

## 1. Mục Tiêu
Cho phép người dùng kết thúc một Sprint đang chạy (`Active`). Khi kết thúc, hệ thống cần xử lý các task chưa hoàn thành (Incomplete Tasks) bằng cách chuyển chúng sang Sprint tiếp theo hoặc trả về Backlog.

## 2. Các Bước Thực Hiện

### Bước 1: Thêm HTML Modal "Complete Sprint"
Thêm đoạn HTML sau vào hàm `initProjectBacklog` (cùng chỗ với các modal khác):

```html
<!-- Complete Sprint Modal -->
<div id="complete-sprint-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/50 backdrop-blur-sm">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 class="text-lg font-semibold text-gray-800">Complete Sprint</h3>
            <button id="close-complete-sprint-btn" class="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
        </div>
        <form id="complete-sprint-form" class="p-6 space-y-4">
            <input type="hidden" id="complete-sprint-id" name="sprintId">
            
            <!-- Statistics -->
            <div class="flex gap-4 mb-4">
                <div class="flex-1 bg-green-50 p-3 rounded-lg border border-green-100 text-center">
                    <div class="text-2xl font-bold text-green-600" id="complete-sprint-completed-count">0</div>
                    <div class="text-xs text-green-800 font-medium">Completed Tasks</div>
                </div>
                <div class="flex-1 bg-orange-50 p-3 rounded-lg border border-orange-100 text-center">
                    <div class="text-2xl font-bold text-orange-600" id="complete-sprint-incomplete-count">0</div>
                    <div class="text-xs text-orange-800 font-medium">Incomplete Tasks</div>
                </div>
            </div>

            <div id="incomplete-tasks-action-container">
                <label class="block text-sm font-medium text-gray-700 mb-2">Move incomplete tasks to:</label>
                <div class="relative">
                    <select name="action" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
                        <option value="moveToNextSprint">New Sprint (Next Planning Sprint)</option>
                        <option value="moveToBacklog">Product Backlog</option>
                    </select>
                    <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
                <p class="text-xs text-gray-500 mt-2">
                    Tasks currently in "Done" columns will be considered completed. All other tasks will be moved based on your selection.
                </p>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                <button type="button" id="cancel-complete-sprint-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm">Complete Sprint</button>
            </div>
        </form>
    </div>
</div>
```

### Bước 2: Cập Nhật Nút "Complete Sprint"
Trong hàm `createSprintElement`, đảm bảo nút "Complete Sprint" có class và data attribute để bắt sự kiện:

```javascript
// Trong createSprintElement
${sprint.status === 1 ? `
    <button class="complete-sprint-btn px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-dashed border-gray-300 rounded hover:bg-gray-50"
        data-sprint-id="${sprint.sprintId}">
        Complete Sprint
    </button>` : ''}
```

### Bước 3: Xử Lý Logic JavaScript
Thêm code sau vào cuối hàm `initProjectBacklog` (hoặc sau phần Start Sprint Modal):

```javascript
    // --- Complete Sprint Modal Logic ---
    const completeSprintModal = document.getElementById('complete-sprint-modal');
    const closeCompleteSprintBtn = document.getElementById('close-complete-sprint-btn');
    const cancelCompleteSprintBtn = document.getElementById('cancel-complete-sprint-btn');
    const completeSprintForm = document.getElementById('complete-sprint-form');
    
    // Helper để đóng modal
    const closeCompleteModal = () => {
        completeSprintModal.classList.add('hidden');
        completeSprintModal.classList.remove('flex');
        completeSprintForm.reset();
    };

    closeCompleteSprintBtn.addEventListener('click', closeCompleteModal);
    cancelCompleteSprintBtn.addEventListener('click', closeCompleteModal);

    // Xử lý Submit Form
    completeSprintForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(completeSprintForm);
        const sprintId = formData.get('sprintId');
        const actionType = formData.get('action'); // "moveToNextSprint" hoặc "moveToBacklog"

        // Lấy danh sách task chưa xong (đã fetch lúc mở modal, hoặc fetch lại để chắc chắn)
        // Để đơn giản, ta sẽ fetch lại danh sách incomplete tasks để lấy ID
        try {
            const incompleteRes = await authFetch(`/projects/${currentProjectId}/sprints/${sprintId}/incomplete`);
            if (!incompleteRes.ok) throw new Error('Failed to fetch incomplete tasks');
            const incompleteTasks = await incompleteRes.json();

            // Tạo payload
            const payload = {
                incompleteTasks: incompleteTasks.map(t => ({
                    taskId: t.taskId,
                    action: actionType
                }))
            };

            // Gọi API Complete
            const completeRes = await authFetch(`/projects/${currentProjectId}/sprints/${sprintId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (completeRes.ok) {
                closeCompleteModal();
                await loadBacklogData(currentProjectId); // Reload lại giao diện
            } else {
                const err = await completeRes.json();
                alert(`Error: ${err.message}`);
            }

        } catch (error) {
            console.error('Error completing sprint:', error);
            alert('Failed to complete sprint.');
        }
    });

    // Bắt sự kiện click vào nút "Complete Sprint" (Event Delegation)
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.complete-sprint-btn');
        if (btn) {
            const sprintId = btn.dataset.sprintId;
            
            // 1. Mở modal và hiển thị loading (nếu cần)
            completeSprintModal.classList.remove('hidden');
            completeSprintModal.classList.add('flex');
            document.getElementById('complete-sprint-id').value = sprintId;
            
            // 2. Fetch thông tin task chưa xong
            try {
                // Lấy thông tin chi tiết sprint để biết tổng số task
                const sprintRes = await authFetch(`/projects/${currentProjectId}/sprints/${sprintId}`);
                const sprintData = await sprintRes.json();
                
                // Lấy danh sách incomplete
                const incompleteRes = await authFetch(`/projects/${currentProjectId}/sprints/${sprintId}/incomplete`);
                const incompleteTasks = await incompleteRes.json();

                const totalTasks = sprintData.taskCount || 0;
                const incompleteCount = incompleteTasks.length;
                const completedCount = totalTasks - incompleteCount;

                // Cập nhật UI
                document.getElementById('complete-sprint-completed-count').textContent = completedCount;
                document.getElementById('complete-sprint-incomplete-count').textContent = incompleteCount;

                // Nếu không có task chưa xong, có thể ẩn dropdown chọn hành động
                const actionContainer = document.getElementById('incomplete-tasks-action-container');
                if (incompleteCount === 0) {
                    actionContainer.classList.add('hidden');
                } else {
                    actionContainer.classList.remove('hidden');
                }

            } catch (error) {
                console.error('Error fetching sprint details:', error);
                alert('Error loading sprint details');
                closeCompleteModal();
            }
        }
    });
```

## 3. API Sử Dụng
*   `GET /projects/{id}/sprints/{sprintId}/incomplete`: Lấy danh sách task chưa hoàn thành.
*   `POST /projects/{id}/sprints/{sprintId}/complete`: Gửi yêu cầu hoàn thành sprint.
    *   Payload mẫu:
    ```json
    {
      "incompleteTasks": [
        { "taskId": 101, "action": "moveToNextSprint" },
        { "taskId": 102, "action": "moveToNextSprint" }
      ]
    }
    ```
