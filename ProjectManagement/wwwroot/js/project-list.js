export async function initProjectList() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    const container = document.getElementById('project-content');

    if(!projectId) return;
        const tasks = [
        { id: 1, title: 'Thiết kế giao diện người dùng', description: 'Tạo wireframe và mockup cho trang chủ.', status: 'ToDo', priority: 'Low' },
        { id: 2, title: 'Phát triển API đăng nhập', description: 'Xây dựng endpoint cho việc xác thực người dùng.', status: 'InProgress', priority: 'Medium' },
        { id: 3, title: 'Viết tài liệu kỹ thuật', description: 'Tài liệu hóa các API đã hoàn thành.', status: 'InReview', priority: 'High' },
        { id: 4, title: 'Kiểm thử tính năng thanh toán', description: 'Kiểm tra luồng thanh toán với các trường hợp khác nhau.', status: 'Done', priority: 'Low' },
        { id: 5, title: 'Cấu hình server', description: 'Cài đặt và cấu hình môi trường production.', status: 'InProgress', priority: 'Medium' },
        { id: 6, title: 'Sửa lỗi hiển thị trên mobile', description: 'Lỗi vỡ giao diện trên màn hình nhỏ.', status: 'Done', priority: 'Medium' },
    ];

    container.innerHTML = createList(tasks);

}

function createTaskRow(task) {
    const priorityClasses = {
        'High': 'border border-red-200 text-red-600',
        'Medium': 'border border-blue-200 text-blue-600',
        'Low': 'border border-green-200 text-green-600'
    };

    const statusClasses = {
        'ToDo': 'bg-gray-100 text-gray-800',
        'InProgress': 'bg-blue-100 text-blue-800',
        'InReview': 'bg-purple-100 text-purple-800',
        'Done': 'bg-green-100 text-green-800'
    };

    const statusText = {
        'ToDo': 'To Do',
        'InProgress': 'In Progress',
        'InReview': 'In Review',
        'Done': 'Done'
    };

    return `
        <tr class="bg-white border-b hover:bg-gray-50 transition-colors duration-200" data-task-id="${task.id}">
            <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900 whitespace-nowrap">${task.title}</div>
                <div class="text-xs font-normal text-gray-500 whitespace-nowrap">${task.description}</div>
            </td>
            <td class="px-6 py-4">
                <span class="text-xs font-medium px-2.5 py-0.5 rounded-md ${priorityClasses[task.priority] || 'border-gray-100 text-gray-600'}">
                    ${task.priority}
                </span>
            </td>
        </tr>
    `;
}

function createList(tasks) {
    const statusOrder = ['ToDo', 'InProgress', 'InReview', 'Done'];
    const statusText = {
        'ToDo': 'To Do',
        'InProgress': 'In Progress',
        'InReview': 'In Review',
        'Done': 'Done'
    };

    const groupedTasks = tasks.reduce((groups, task) => {
        const { status } = task;
        if (!groups[status]) {
            groups[status] = [];
        }
        groups[status].push(task);
        return groups;
    }, {});

    return statusOrder.map(status => {
        const tasksInStatus = groupedTasks[status];
        if (!tasksInStatus || tasksInStatus.length === 0) return '';

        const taskRowsHtml = tasksInStatus.map(createTaskRow).join('');
        return `
            <h2 class="text-xl font-semibold text-gray-800 mt-8 mb-4">${statusText[status]}</h2>
            <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table class="w-full text-sm text-left text-gray-500">
                    <thead class="text-xs text-gray-400">
                        <tr>
                            <th scope="col" class="px-6 py-3 font-normal">Name</th>
                            <th scope="col" class="px-6 py-3 font-normal">Priority</th>
                            <th scope="col" class="px-6 py-3 font-normal">Tag</th>
                            <th scope="col" class="px-6 py-3 font-normal">Due Date</th>
                            <th scope="col" class="px-6 py-3 font-normal">Assigne</th>
                        </tr>
                    </thead>
                    <tbody>${taskRowsHtml}</tbody>
                </table>
            </div>`;
    }).join('');
}