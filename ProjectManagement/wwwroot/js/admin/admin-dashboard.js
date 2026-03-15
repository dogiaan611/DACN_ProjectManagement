import { authFetch } from '../auth/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    initAdminDashboard();
});

export async function initAdminDashboard() {
    console.log("Initializing Admin Dashboard...");
    const container = document.getElementById('admin-dashboard-container');

    // Load Admin Profile Info
    loadAdminProfile();

    // Ensure Chart.js is loaded
    if (typeof Chart === 'undefined') {
        await loadChartJs();
    }

    try {
        // Parallel requests
        const [statsRes, userGrowthRes, projStatsRes] = await Promise.all([
            authFetch('/api/Admin/dashboard/statistics'),
            authFetch('/api/Admin/dashboard/user-growth?days=30'),
            authFetch('/api/Admin/dashboard/projects')
        ]);

        if (!statsRes.ok || !userGrowthRes.ok || !projStatsRes.ok) {
            throw new Error("Failed to fetch dashboard data");
        }

        const statsData = await statsRes.json();
        const userGrowthData = await userGrowthRes.json();
        const projStatsData = await projStatsRes.json();

        renderDashboard(container, statsData, userGrowthData, projStatsData);

    } catch (error) {
        console.error("Error loading admin dashboard:", error);
        if (container) {
            container.innerHTML = `<div class="p-4 text-red-500 bg-red-50 rounded-lg border border-red-200">
                Error loading dashboard data: ${error.message}
            </div>`;
        }
    }
}

async function loadAdminProfile() {
    try {
        const res = await authFetch('/user/read');
        if (res.ok) {
            const user = await res.json();
            const nameEl = document.getElementById('admin-name');
            const avatarEl = document.getElementById('admin-avatar');

            if (nameEl) nameEl.textContent = user.name;
            if (avatarEl) avatarEl.src = user.avatarUrl || '/images/default-avatar.png';
        }
    } catch (err) {
        console.error('Failed to load admin profile', err);
    }
}

function loadChartJs() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => {
            console.log("Chart.js loaded dynamically");
            resolve();
        };
        script.onerror = () => reject(new Error("Failed to load Chart.js"));
        document.head.appendChild(script);
    });
}

function renderDashboard(container, stats, userGrowth, projStats) {
    if (!container) return;

    container.innerHTML = `
        <div class="flex flex-col h-full">
            <!--Tabs Navigation-->
            <div class="flex items-center gap-6 mb-6 border-b border-gray-200">
                <button id="tab-overview" class="px-1 py-3 text-sm font-medium border-b-2 border-blue-600 text-blue-600 transition-colors">
                    Overview
                </button>
                <button id="tab-tasks" class="px-1 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors">
                    Task Management
                </button>
            </div>

            <!--VIEW: OVERVIEW-->
            <div id="view-overview" class="space-y-6">
                <!-- Summary Cards Row -->
                <div class="flex items-center justify-center gap-4">
                    ${createStatCard('Total Users', stats.totalUsers, 'users', 'blue')}
                    ${createStatCard('Total Projects', stats.totalProjects, 'folder-kanban', 'purple')}
                    ${createStatCard('Total Tasks', stats.totalTasks, 'check-square', 'green')}
                    ${createStatCard('Active Admins', stats.adminCount, 'shield', 'orange')}
                </div>

                <!-- Charts Row -->
                <div class="flex gap-5">
                    <!-- User Growth Chart (2/3) -->
                    <div class="w-2/3 p-4 border rounded-xl bg-white shadow-sm flex flex-col">
                        <div class="flex items-center justify-between mb-4">
                             <div>
                                <h5 class="text-lg font-bold text-gray-800">User Growth</h5>
                                <p class="text-sm text-gray-500">New users over last 30 days</p>
                            </div>
                             <div class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                                +${stats.newUsersLast30Days} New
                            </div>
                        </div>
                        <div class="flex-1 relative w-full h-[300px]">
                            <canvas id="userGrowthChart"></canvas>
                        </div>
                    </div>
                    
                    <!-- Project Types Chart (1/3) -->
                    <div class="w-1/3 p-4 border rounded-xl bg-white shadow-sm flex flex-col">
                        <h5 class="text-lg font-bold text-gray-800 mb-4">Project Types</h5>
                        <div class="flex-1 relative flex items-center justify-center">
                            <canvas id="projectTypeChart"></canvas>
                        </div>
                         <div class="mt-4 space-y-2">
                             ${renderProjectLegend(projStats.projectsByType)}
                        </div>
                    </div>
                </div>

                <!-- Additional Stats / Activity Row -->
                <div class="flex gap-5">
                     <!-- Active Projects (Mocking a List/Table Section) -->
                    <div class="w-2/3 p-5 border rounded-xl bg-white shadow-sm">
                        <div class="flex items-center justify-between mb-4">
                            <h5 class="text-lg font-bold text-gray-800">System Activity Overview</h5>
                        </div>
                        <div class="flex flex-col gap-4">
                            <div class="p-4 rounded-xl border border-gray-200 bg-white shadow-sm flex items-center justify-between transition-colors hover:border-gray-300">
                                <div>
                                    <p class="text-gray-800 text-sm font-bold">Active Projects (7d)</p>
                                    <h4 class="text-2xl font-bold text-gray-800 mt-1">${stats.activeProjects}</h4>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-900"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>
                            </div>
                             <div class="p-4 rounded-xl border border-gray-200 bg-white shadow-sm flex items-center justify-between transition-colors hover:border-gray-300">
                                <div>
                                    <p class="text-gray-800 text-sm font-bold">Total Sprints</p>
                                    <h4 class="text-2xl font-bold text-gray-800 mt-1">${stats.totalSprints}</h4>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-900"><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/></svg>
                            </div>
                            <div class="p-4 rounded-xl border border-gray-200 bg-white shadow-sm flex items-center justify-between transition-colors hover:border-gray-300">
                                <div>
                                    <p class="text-gray-800 text-sm font-bold">New Projects (7d)</p>
                                    <h4 class="text-2xl font-bold text-gray-800 mt-1">${projStats.recentProjects}</h4>
                                </div>
                                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-900"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/></svg>
                            </div>
                        </div>
                    </div>

                    <!-- Admin Info / Quick Access -->
                    <div class="w-1/3 p-5 border rounded-xl bg-white shadow-sm flex flex-col">
                        <div class="flex items-center justify-between mb-4">
                            <h5 class="text-lg font-bold text-gray-800">Quick Actions</h5>
                        </div>
                        <div class="space-y-3">
                             <button onclick="location.href='/adminUser.html'" class="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors group">
                                <div class="flex items-center gap-3">
                                    <div class="bg-blue-100 text-blue-600 p-2 rounded-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                    </div>
                                    <div class="text-left">
                                        <h6 class="text-sm font-semibold text-gray-800">Manage Users</h6>
                                        <p class="text-xs text-gray-500">View and edit users</p>
                                    </div>
                                </div>
                                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400 group-hover:translate-x-1 transition-transform"><path d="m9 18 6-6-6-6"/></svg>
                             </button>
                        </div>
                    </div>
                </div>
            </div>

            <!--VIEW: TASKS(Initially Hidden)-->
            <div id="view-tasks" class="hidden space-y-6">
                <!-- Task Stats -->
                <!-- Task Stats -->
            <div class="flex flex-row gap-4 w-full" id="task-stats-container">
                <!-- Loaded dynamically -->
            </div>

                <!-- Task List -->
                <div class="bg-white rounded-xl border shadow-sm flex flex-col h-full">
                     <div class="p-4 border-b flex justify-between items-center gap-4">
                        <div class="relative flex items-center justify-start max-w-md gap-3 border rounded-md py-2 px-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="flex items-center justify-center text-gray-400 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                            <input type="text" id="admin-task-search" placeholder="Search tasks..." 
                                class=" w-full focus:outline-none focus:border-none focus:ring-none focus:border-transparent">
                        </div>
                        <select id="admin-task-priority" class="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                            <option value="">All Priorities</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="bg-gray-50 text-gray-500 font-medium whitespace-nowrap">
                                <tr>
                                    <th class="px-6 py-3">Task Info</th>
                                    <th class="px-6 py-3">Project</th>
                                    <th class="px-6 py-3">Assignee</th>
                                    <th class="px-6 py-3">Status</th>
                                    <th class="px-6 py-3">Priority</th>
                                    <th class="px-6 py-3">Due Date</th>
                                </tr>
                            </thead>
                            <tbody id="admin-task-list" class="divide-y divide-gray-100">
                                <!-- Loaded dynamically -->
                            </tbody>
                        </table>
                    </div>
                    
                    <div id="admin-task-pagination" class="p-4 border-t flex justify-between items-center text-sm text-gray-500">
                        <!-- Loaded dynamically -->
                    </div>
                </div>
            </div>
        </div>
    `;

    setupTabs();


    // Re-initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Initialize Charts
    initUserGrowthChart(userGrowth);
    initProjectTypeChart(projStats.projectsByType);
}

function createStatCard(title, value, iconName, color) {
    const colorClasses = {
        'blue': 'text-blue-500 bg-blue-50',
        'purple': 'text-purple-500 bg-purple-50',
        'green': 'text-green-500 bg-green-50',
        'orange': 'text-orange-500 bg-orange-50'
    };

    const iconClass = colorClasses[color] || colorClasses['blue'];

    return `
        <div class="w-1/4">
            <div class="p-4 flex items-center gap-3 border rounded-xl shadow-sm bg-white hover:shadow-md transition-shadow">
                <div class="${iconClass} p-3 rounded-lg">
                    <i data-lucide="${iconName}" class="w-6 h-6"></i>
                </div>
                <div>
                    <h6 class="text-gray-500 text-sm font-medium">${title}</h6>
                    <h2 class="text-2xl font-bold text-gray-800">${value}</h2>
                </div>
            </div>
        </div>
    `;
}

function renderProjectLegend(types) {
    const palette = ['#8b5cf6', '#3b82f6', '#10b981'];

    return types.map((t, index) => {
        const color = palette[index % palette.length];
        const label = t.type === '0' ? 'Kanban' : (t.type === '1' ? 'Scrum' : t.type);
        const percent = ((t.count / types.reduce((a, b) => a + b.count, 0)) * 100).toFixed(1);

        return `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full" style="background-color: ${color}"></span>
                    <span class="text-sm text-gray-600">${label}</span>
                </div>
                <span class="text-sm font-bold text-gray-800">${t.count} (${percent}%)</span>
            </div>
        `;
    }).join('');
}

function initUserGrowthChart(data) {
    const ctx = document.getElementById('userGrowthChart');
    if (!ctx) return;

    // Format data
    const labels = data.map(d => new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    const counts = data.map(d => d.count);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'New Users',
                data: counts,
                borderColor: '#2563eb', // Blue-600
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 3,
                tension: 0.4, // Smooth curve
                fill: true,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#2563eb',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1f2937',
                    padding: 12,
                    titleFont: { size: 13 },
                    bodyFont: { size: 14 },
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f3f4f6',
                        drawBorder: false
                    },
                    ticks: {
                        stepSize: 1,
                        font: { size: 12, family: "'Inter', sans-serif" },
                        color: '#9ca3af'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: { size: 12, family: "'Inter', sans-serif" },
                        color: '#9ca3af',
                        maxTicksLimit: 10
                    }
                }
            }
        }
    });
}

function initProjectTypeChart(types) {
    const ctx = document.getElementById('projectTypeChart');
    if (!ctx) return;

    const palette = ['#8b5cf6', '#3b82f6', '#10b981']; // Purple, Blue, Green
    const counts = types.map(t => t.count);
    const labels = types.map(t => t.type === '0' ? 'Kanban' : (t.type === '1' ? 'Scrum' : t.type));

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: palette,
                borderWidth: 0,
                hoverOffset: 4,
                borderRadius: 20,
                spacing: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1f2937',
                    padding: 12,
                    cornerRadius: 8
                }
            }
        }
    });
}


function setupTabs() {
    const tabOverview = document.getElementById('tab-overview');
    const tabTasks = document.getElementById('tab-tasks');
    const viewOverview = document.getElementById('view-overview');
    const viewTasks = document.getElementById('view-tasks');

    if (!tabOverview || !tabTasks) return;

    tabOverview.addEventListener('click', () => {
        // Active Overview
        tabOverview.classList.add('border-blue-600', 'text-blue-600');
        tabOverview.classList.remove('border-transparent', 'text-gray-500');

        // Inactive Tasks
        tabTasks.classList.remove('border-blue-600', 'text-blue-600');
        tabTasks.classList.add('border-transparent', 'text-gray-500');

        viewOverview.classList.remove('hidden');
        viewTasks.classList.add('hidden');
    });

    tabTasks.addEventListener('click', () => {
        // Active Tasks
        tabTasks.classList.add('border-blue-600', 'text-blue-600');
        tabTasks.classList.remove('border-transparent', 'text-gray-500');

        // Inactive Overview
        tabOverview.classList.remove('border-blue-600', 'text-blue-600');
        tabOverview.classList.add('border-transparent', 'text-gray-500');

        viewTasks.classList.remove('hidden');
        viewOverview.classList.add('hidden');

        // Lazy load tasks if not loaded
        const taskList = document.getElementById('admin-task-list');
        if (taskList && !taskList.querySelector('tr')) {
            initAdminTasks();
        }
    });
}

let taskState = {
    page: 1,
    pageSize: 10,
    search: '',
    priority: '',
    total: 0,
    totalPages: 0
};

async function initAdminTasks() {
    loadTaskStats();
    loadTasksList();

    // Bind Search & Filter
    const searchInput = document.getElementById('admin-task-search');
    const prioritySelect = document.getElementById('admin-task-priority');
    let debounceTimer;

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                taskState.search = e.target.value;
                taskState.page = 1;
                loadTasksList();
            }, 500);
        });
    }

    if (prioritySelect) {
        prioritySelect.addEventListener('change', (e) => {
            taskState.priority = e.target.value;
            taskState.page = 1;
            loadTasksList();
        });
    }
}

async function loadTaskStats() {
    try {
        const res = await authFetch('/api/Admin/tasks/statistics');
        if (res.ok) {
            const stats = await res.json();
            renderTaskStats(stats);
        }
    } catch (error) {
        console.error("Load task stats failed:", error);
    }
}

async function loadTasksList() {
    const listContainer = document.getElementById('admin-task-list');
    listContainer.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-400">Loading tasks...</td></tr>';

    try {
        let qs = `page=${taskState.page}&pageSize=${taskState.pageSize}`;
        if (taskState.priority) qs += `&priority=${taskState.priority}`;
        if (taskState.search) qs += `&search=${encodeURIComponent(taskState.search)}`;

        const res = await authFetch(`/api/Admin/tasks?${qs}`);
        if (!res.ok) throw new Error('Failed to load tasks');

        const data = await res.json();
        taskState.total = data.total;
        taskState.totalPages = Math.ceil(data.total / taskState.pageSize);

        renderTaskList(data.tasks);
        renderTaskPagination();

    } catch (error) {
        console.error(error);
        listContainer.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-red-500">Error loading tasks</td></tr>';
    }
}

function renderTaskStats(stats) {
    const container = document.getElementById('task-stats-container');
    if (!container) return;

    // Helper for cards
    const card = (label, value, color) => `
        <div class="bg-white p-4 rounded-xl border shadow-sm flex-1">
            <div class="text-gray-500 text-sm font-medium">${label}</div>
            <div class="text-2xl font-bold mt-1 ${color}">${value}</div>
        </div>
    `;

    // Calculate In Progress (approximation or mapping needed if API doesn't send explicit "In Progress")
    if (stats.byPriority) {
        highUrgent = stats.byPriority.reduce((acc, curr) => {
            return (curr.priority === 'High') ? acc + curr.count : acc;
        }, 0);
    }

    container.innerHTML = `
        ${card('Total Tasks', stats.total, 'text-gray-900')}
        ${card('Overdue Tasks', stats.overdue, 'text-red-600')}
        ${card('High Priority', highUrgent, 'text-orange-600')}
        ${card('Active Columns', stats.byColumn ? stats.byColumn.length : 0, 'text-blue-600')}
    `;
}

function renderTaskList(tasks) {
    const listContainer = document.getElementById('admin-task-list');
    listContainer.innerHTML = '';

    if (!tasks || tasks.length === 0) {
        listContainer.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">No tasks found.</td></tr>';
        return;
    }

    const priorityColors = {
        'Low': 'bg-gray-100 text-gray-700',
        'Medium': 'bg-blue-100 text-blue-700',
        'High': 'bg-red-100 text-red-700'
    };

    tasks.forEach(t => {
        const date = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-';
        const pColor = priorityColors[t.priority] || 'bg-gray-100 text-gray-600';
        const assignee = t.assignee ?
            `<div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold uppercase">
                    ${t.assignee.name.charAt(0)}
                </div>
                <span class="truncate max-w-[100px] text-gray-700" title="${t.assignee.name}">${t.assignee.name}</span>
             </div>` :
            '<span class="text-gray-400 italic text-xs">Unassigned</span>';

        // Check if description is null
        const desc = t.description || '';

        const tr = `
            <tr class="hover:bg-gray-50 transition-colors group border-b last:border-0 border-gray-50">
                <td class="px-6 py-4">
                    <div class="font-medium text-gray-900">${t.title}</div>
                    <div class="text-xs text-gray-500 truncate max-w-[200px] mt-0.5" title="${desc}">${desc}</div>
                </td>
                <td class="px-6 py-4 text-gray-600 text-sm">
                    <div class="truncate max-w-[150px]" title="${t.project ? t.project.name : ''}">${t.project ? t.project.name : '-'}</div>
                    <div class="text-[10px] text-gray-400">#${t.project ? t.project.projectId : ''}</div>
                </td>
                <td class="px-6 py-4 text-gray-600 text-sm">${assignee}</td>
                <td class="px-6 py-4">
                    <span class="px-2.5 py-1 rounded text-xs bg-gray-100 text-gray-700 font-medium border border-gray-200 shadow-sm">
                        ${t.columnName}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-md text-xs font-semibold ${pColor}">
                        ${t.priority}
                    </span>
                </td>
                <td class="px-6 py-4 text-gray-500 font-mono text-xs">${date}</td>
            </tr>
        `;
        listContainer.insertAdjacentHTML('beforeend', tr);
    });
}

function renderTaskPagination() {
    const container = document.getElementById('admin-task-pagination');
    if (!container) return;

    const prevDisabled = taskState.page === 1 ? 'disabled class="opacity-50 cursor-not-allowed"' : 'class="hover:bg-gray-100 rounded px-2 py-1 transition-colors"';
    const nextDisabled = taskState.page >= taskState.totalPages ? 'disabled class="opacity-50 cursor-not-allowed"' : 'class="hover:bg-gray-100 rounded px-2 py-1 transition-colors"';

    container.innerHTML = `
        <div class="text-gray-600">
            Page <span class="font-medium text-gray-900">${taskState.page}</span> of ${Math.max(1, taskState.totalPages)}
        </div>
        <div class="flex gap-2 text-sm font-medium text-gray-600">
            <button id="task-prev" ${prevDisabled}>Previous</button>
            <button id="task-next" ${nextDisabled}>Next</button>
        </div>
    `;

    document.getElementById('task-prev')?.addEventListener('click', () => {
        if (taskState.page > 1) {
            taskState.page--;
            loadTasksList();
        }
    });

    document.getElementById('task-next')?.addEventListener('click', () => {
        if (taskState.page < taskState.totalPages) {
            taskState.page++;
            loadTasksList();
        }
    });
}
