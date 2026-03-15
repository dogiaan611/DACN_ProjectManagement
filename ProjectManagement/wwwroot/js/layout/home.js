import { authFetch } from '../auth/auth.js';

export async function initHome() {
    try {
        const response = await authFetch('/api/home/dashboard');
        if (!response.ok) {
            console.error('Failed to fetch dashboard data');
            return;
        }
        const data = await response.json();
        renderDashboard(data);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function renderDashboard(data) {
    if (!data) return;

    // Handle both camelCase and PascalCase from API
    const user = data.user || data.User;
    if (user) {
        const name = user.name || user.Name || 'User';
        const email = user.email || user.Email || '';
        const avatarUrl = user.avatarUrl || user.AvatarUrl;

        const nameDisplay = document.getElementById('user-name-display');
        const headerName = document.getElementById('header-user-name');
        const headerEmail = document.getElementById('header-user-email');
        const avatarDisplay = document.getElementById('user-avatar-display');

        if (nameDisplay) nameDisplay.textContent = name;
        if (headerName) headerName.textContent = name;
        if (headerEmail) headerEmail.textContent = email;
        if (avatarDisplay && avatarUrl) avatarDisplay.src = avatarUrl;
    }

    const totalTasks = data.totalTasks ?? data.TotalTasks ?? 0;
    const completedTasks = data.completedTasks ?? data.CompletedTasks ?? 0;
    const incompleteTasks = data.incompleteTasks ?? data.IncompleteTasks ?? 0;
    const overdueTasks = data.overdueTasks ?? data.OverdueTasks ?? 0;
    const projectCount = data.projectCount ?? data.ProjectCount ?? 0;

    if (document.getElementById('stat-total-tasks')) document.getElementById('stat-total-tasks').textContent = totalTasks;
    if (document.getElementById('stat-completed-tasks')) document.getElementById('stat-completed-tasks').textContent = completedTasks;
    if (document.getElementById('stat-incomplete-tasks')) document.getElementById('stat-incomplete-tasks').textContent = incompleteTasks;
    if (document.getElementById('stat-overdue-tasks')) document.getElementById('stat-overdue-tasks').textContent = overdueTasks;
    if (document.getElementById('stat-project-count')) document.getElementById('stat-project-count').textContent = projectCount;

    renderActiveProjects(data.projects || data.Projects);
    renderProjectTasksChart(data.tasksByProject || data.TasksByProject || []);
    renderCompletionStatusChart(completedTasks, incompleteTasks);

    renderUpcomingTasks(data.upcomingTasks || data.UpcomingTasks);
}

function renderActiveProjects(projects) {
    const list = document.getElementById('active-projects-list');
    if (!list) return;

    list.innerHTML = '';

    if (!projects || projects.length === 0) {
        list.innerHTML = '<div class="text-sm text-gray-400 text-center py-2">No active projects</div>';
        return;
    }

    projects.forEach(p => {
        const typeIcon = p.type === 1 ? 'list-todo' : 'kanban';

        const html = `
            <a href="/project.html?id=${p.projectId}" data-spa-link class="block p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-white hover:border-orange-200 hover:shadow-sm transition-all group">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-white border flex items-center justify-center text-gray-500 shrink-0 group-hover:text-orange-600 transition-colors">
                         <i data-lucide="layout" class="w-5 h-5"></i>
                    </div>
                    <div class="overflow-hidden flex-1">
                        <h4 class="text-sm font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">${p.name}</h4>
                        <p class="text-xs text-gray-500 truncate">${p.description || 'No description'}</p>
                    </div>
                    <div class="text-gray-300 group-hover:text-orange-400">
                        <i data-lucide="chevron-right" class="w-4 h-4"></i>
                    </div>
                </div>
            </a>
        `;
        list.insertAdjacentHTML('beforeend', html);
    });

    // Refresh icons
    if (window.lucide) lucide.createIcons();
}

function renderProjectTasksChart(tasksByProject) {
    const ctx = document.getElementById('chart-project-tasks').getContext('2d');
    const labels = tasksByProject.map(item => item.project);
    const counts = tasksByProject.map(item => item.count);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Incomplete Tasks',
                data: counts,
                backgroundColor: '#F97316', // Orange-500
                borderRadius: 4,
                barThickness: 30,
                maxBarThickness: 50
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { display: true, borderDash: [4, 4], color: '#f3f4f6' },
                    ticks: { stepSize: 1 }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

function renderCompletionStatusChart(completed, incomplete) {
    const ctx = document.getElementById('chart-completion-status').getContext('2d');

    const total = completed + incomplete;
    const dataValues = total === 0 ? [1] : [completed, incomplete];
    const bgColors = total === 0 ? ['#E5E7EB'] : ['#F97316', '#E5E7EB']; // Orange/Gray
    const labels = total === 0 ? ['No Tasks'] : ['Completed', 'Incomplete'];

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: bgColors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { family: "'Inter', sans-serif" }
                    }
                }
            }
        },
        plugins: [{
            id: 'textCenter',
            beforeDraw: function (chart) {
                if (total === 0) return;

                const { ctx, chartArea: { top, bottom, left, right, width, height } } = chart;

                ctx.restore();
                var fontSize = (height / 114).toFixed(2);
                ctx.font = "bold " + fontSize + "em sans-serif";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#111827";

                var text = total.toString();
                var textX = Math.round(left + (width - ctx.measureText(text).width) / 2);
                var textY = Math.round(top + height / 2);

                ctx.fillText(text, textX, textY);
                ctx.save();
            }
        }]
    });
}

function renderUpcomingTasks(tasks) {
    const container = document.getElementById('upcoming-tasks-list');
    container.innerHTML = '';

    if (!tasks || tasks.length === 0) {
        container.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500">No upcoming tasks due soon</td></tr>';
        return;
    }

    tasks.forEach(task => {
        const dueDate = new Date(task.dueDate).toLocaleDateString();

        let priorityClass = 'text-gray-600 bg-gray-100';
        let priorityName = 'Low';
        
        switch (task.priority) {
            case 2:
                priorityClass = 'text-red-700 bg-red-100'; // High
                priorityName = 'High';
                break;
            case 1:
                priorityClass = 'text-orange-700 bg-orange-100'; // Medium
                priorityName = 'Medium';
                break;
            default:
                priorityClass = 'text-blue-700 bg-blue-100'; // Low
                priorityName = 'Low';
                break;
        }

        const row = `
            <tr class="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                <td class="py-3 pr-4">
                    <div class="font-medium text-gray-900 truncate max-w-[200px]">${task.title}</div>
                    <div class="text-xs text-gray-400">#${task.taskId}</div>
                </td>
                <td class="py-3 text-sm text-gray-600">${dueDate}</td>
                <td class="py-3">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${priorityClass}">
                        ${priorityName}
                    </span>
                </td>
                <td class="py-3">
                    <span class="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded-full">
                         Pending
                    </span>
                </td>
            </tr>
        `;
        container.insertAdjacentHTML('beforeend', row);
    });

    // Re-init icons for new content
    if (window.lucide) {
        lucide.createIcons();
    }
}