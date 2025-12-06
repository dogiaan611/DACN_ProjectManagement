# Hướng dẫn triển khai Tìm kiếm và Lọc (Search & Filter) cho Backlog

Tài liệu này hướng dẫn chi tiết các bước để thêm chức năng tìm kiếm và lọc (theo Người được giao và Độ ưu tiên) vào trang Backlog.

## Bước 1: Cập nhật UI (HTML)

Chúng ta cần thêm thanh tìm kiếm và các dropdown bộ lọc vào đầu phần **Product Backlog**.

Trong file `wwwroot/js/project-backlog.js`, tìm đến hàm `initProjectBacklog` (khoảng dòng 35), nơi định nghĩa `innerHTML` cho `product-backlog-container`.

Chèn đoạn HTML sau vào trước thẻ `<div id="backlog-tasks" ...>`:

```html
<!-- Search & Filter Toolkit -->
<div class="flex flex-col gap-3 mb-4 px-1 sticky top-12 bg-gray-50 z-10 pb-2">
    <!-- Search Bar -->
    <div class="relative">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="text" id="backlog-search-input" placeholder="Search tasks..." class="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
    </div>

    <!-- Filters -->
    <div class="flex gap-2">
        <!-- Priority Filter -->
        <select id="backlog-filter-priority" class="px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:border-gray-300">
            <option value="all">All Priorities</option>
            <option value="1">High</option>
            <option value="2">Medium</option>
            <option value="3">Low</option>
        </select>

        <!-- Assignee Filter -->
        <select id="backlog-filter-assignee" class="px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:border-gray-300">
            <option value="all">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            <!-- Members will be populated dynamically -->
        </select>
    </div>
</div>
```

## Bước 2: Thêm Logic Lọc (JavaScript)

Thêm các biến và hàm xử lý logic lọc vào file.

### 1. Khai báo biến toàn cục
Thêm các biến này vào đầu file cùng với các biến `currentProjectId`, `selectedTaskIds`...

```javascript
let currentSearchTerm = '';
let currentFilterPriority = 'all';
let currentFilterAssignee = 'all';
let allBacklogTasks = []; // Lưu trữ toàn bộ task gốc để lọc
```

### 2. Cập nhật hàm `renderProductBacklog`
Trong hàm `renderProductBacklog(tasks)`, hãy lưu tasks vào biến toàn cục trước khi render.

```javascript
function renderProductBacklog(tasks) {
    allBacklogTasks = tasks; // Lưu lại data gốc
    // ... code render hiện tại
}
```

### 3. Thêm hàm lọc và render lại

```javascript
function filterBacklogTasks() {
    const filteredTasks = allBacklogTasks.filter(task => {
        // 1. Filter by Search Term
        const term = currentSearchTerm.toLowerCase();
        const matchSearch = task.title.toLowerCase().includes(term) || 
                          (task.description && task.description.toLowerCase().includes(term));

        // 2. Filter by Priority
        let matchPriority = true;
        if (currentFilterPriority !== 'all') {
            matchPriority = task.priority == currentFilterPriority;
        }

        // 3. Filter by Assignee
        let matchAssignee = true;
        if (currentFilterAssignee === 'unassigned') {
            matchAssignee = !task.assignee;
        } else if (currentFilterAssignee !== 'all') {
            matchAssignee = task.assignee && task.assignee.userId === currentFilterAssignee;
        }

        return matchSearch && matchPriority && matchAssignee;
    });

    renderFilteredBacklog(filteredTasks);
}

function renderFilteredBacklog(tasks) {
    const container = document.getElementById('backlog-tasks');
    const stats = document.getElementById('backlog-stats');
    container.innerHTML = '';
    
    // Update stats text
    if (stats) stats.textContent = `${tasks.length} tasks`;

    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="text-center p-8 text-gray-500 italic">
                No tasks match your filters.
            </div>`;
        return;
    }

    tasks.forEach(task => {
        container.appendChild(createTaskElement(task));
    });
}
```

## Bước 3: Gắn Sự kiện (Event Listeners)

Trong hàm `initProjectBacklog`, sau khi gán `innerHTML`, hãy thêm đoạn code sau:

```javascript
    // ... code init UI search/filters HTML ...

    // Setup Search & Filter Inputs
    const searchInput = document.getElementById('backlog-search-input');
    const filterPriority = document.getElementById('backlog-filter-priority');
    const filterAssignee = document.getElementById('backlog-filter-assignee');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value;
            filterBacklogTasks();
        });
    }

    if (filterPriority) {
        filterPriority.addEventListener('change', (e) => {
            currentFilterPriority = e.target.value;
            filterBacklogTasks();
        });
    }

    if (filterAssignee) {
        filterAssignee.addEventListener('change', (e) => {
            currentFilterAssignee = e.target.value;
            filterBacklogTasks();
        });
    }
    
    // Load members for filter
    loadProjectMembersForFilter(currentProjectId);
```

## Bước 4: Load danh sách thành viên vào Dropdown

Thêm hàm này vào cuối file:

```javascript
async function loadProjectMembersForFilter(projectId) {
    const select = document.getElementById('backlog-filter-assignee');
    if (!select) return;

    try {
        const res = await authFetch(`/projects/${projectId}/readProject`);
        if (res.ok) {
            const data = await res.json();
            // Reset options (keep default)
            select.innerHTML = `
                <option value="all">All Assignees</option>
                <option value="unassigned">Unassigned</option>
            `;
            
            if (data.members) {
                data.members.forEach(member => {
                    const option = document.createElement('option');
                    option.value = member.userId;
                    option.textContent = member.name || member.email || 'Unnamed';
                    select.appendChild(option);
                });
            }
        }
    } catch (err) {
        console.error('Error loading members for filter:', err);
    }
}
```

## Tóm tắt kế hoạch
1. Cập nhật HTML UI trong `initProjectBacklog`.
2. Định nghĩa các biến toàn cục cho state filter.
3. Thêm hàm `filterBacklogTasks`, `renderFilteredBacklog`, `loadProjectMembersForFilter`.
4. Gọi `allBacklogTasks = tasks` trong `renderProductBacklog`.
5. Đăng ký sự kiện `input` và `change` cho các element mới.
