import { authFetch } from "./auth.js";

export async function initProjectDashboard() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    if (!projectId) {
        console.error('No project ID found');
        return;
    }
    const container = document.getElementById('project-content');
    if (!container) {
        console.error("Container not found");
        return;
    }
    container.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" role="status"></div></div>';

    try {
        const [dashboardResponse, projectResponse] = await Promise.all([
            authFetch(`/projects/${projectId}/dashboard`),
            authFetch(`/projects/${projectId}/readProject`)
        ]);

        if (!dashboardResponse.ok || !projectResponse.ok) throw new Error("Failed to load data");

        const dashboardData = await dashboardResponse.json();
        const projectData = await projectResponse.json();

        renderDashboard(dashboardData, projectData, container);
    } catch (error) {
        console.error("Error fetching project dashboard data:", error);
        container.innerHTML = `<div class="alert alert-danger">Error loading dashboard: ${error.message}</div>`;
    }
}

function renderDashboard(data, projectData, container) {
    // Helper for Priority Colors
    const getPriorityColor = (p) => {
        switch (p) {
            case 1: return 'text-red-600 bg-red-50'; // Critical
            case 2: return 'text-orange-600 bg-orange-50'; // High
            default: return 'text-blue-600 bg-blue-50'; // Low (0)
        }
    };
    const tasksPriority = (p) => {
        switch (p) {
            case 1: return 'High';
            case 2: return 'Medium';
            default: return 'Low';
        }
    }

    container.innerHTML = `
        <div class="container-fluid py-4 space-y-6">
            <!-- Summary Cards -->
            <div class="flex items-center justify-center gap-4">
                <div class="w-1/4">
                    <div class="p-4 flex items-center gap-3 border rounded-xl shadow-sm bg-white hover:shadow-md transition-shadow">
                        <div class="text-blue-500 p-3 rounded-lg bg-blue-50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>
                        </div>
                        <div>
                            <h6 class="text-gray-500 text-sm font-medium">Total Tasks</h6>
                            <h2 class="text-2xl font-bold text-gray-800">${data.totalTasks}</h2>
                        </div>
                    </div>
                </div>
                <div class="w-1/4">
                     <div class="p-4 flex items-center gap-3 border rounded-xl shadow-sm bg-white hover:shadow-md transition-shadow">
                        <div class="text-green-500 p-3 rounded-lg bg-green-50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/></svg>
                        </div>
                        <div>
                            <h6 class="text-gray-500 text-sm font-medium">Completed</h6>
                            <h2 class="text-2xl font-bold text-gray-800">${data.completedTasks}</h2>
                        </div>
                    </div>
                </div>
                <div class="w-1/4">
                     <div class="p-4 flex items-center gap-3 border rounded-xl shadow-sm bg-white hover:shadow-md transition-shadow">
                        <div class="text-orange-500 p-3 rounded-lg bg-orange-50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                        </div>
                         <div>
                            <h6 class="text-gray-500 text-sm font-medium">In Progress</h6>
                            <h2 class="text-2xl font-bold text-gray-800">${data.incompleteTasks}</h2>
                        </div>
                    </div>
                </div>
                <div class="w-1/4">
                    <div class="p-4 flex items-center gap-3 border rounded-xl shadow-sm bg-white hover:shadow-md transition-shadow">
                        <div class="text-red-500 p-3 rounded-lg bg-red-50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                        </div>
                         <div>
                            <h6 class="text-gray-500 text-sm font-medium">Overdue</h6>
                            <h2 class="text-2xl font-bold text-gray-800">${data.overdueTasks}</h2>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Charts Row -->
            <div class="flex gap-5">
                <!-- Priority Chart -->
                <div class="w-2/3 p-4 border rounded-xl bg-white shadow-sm">
                    <h5 class="text-lg font-bold text-gray-800 mb-4">Task Priority</h5>
                    <div class="flex items-center gap-6">
                        <div class="h-64 w-64 relative">
                            <canvas id="priorityChart"></canvas>
                            <div class="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                <span class="text-3xl font-bold text-gray-800" id="totalTasksCount">0</span>
                                <span class="text-xs text-gray-500 uppercase tracking-wide">Tasks</span>
                            </div>
                        </div>
                        <div id="priorityLegend" class="flex-1 space-y-3"></div>
                    </div>
                </div>
                
                <!-- Assignee Chart -->
                <div class="w-1/3 p-4 border rounded-xl bg-white shadow-sm">
                    <h5 class="text-lg font-bold text-gray-800 mb-4">Workload by Member</h5>
                    <div class="h-64 relative">
                        <canvas id="assigneeChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Upcoming Deadlines & Members Row -->
            <div class="flex gap-5">
                <!-- Upcoming Deadlines -->
                <div class="w-2/3 p-5 border rounded-xl bg-white shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                        <h5 class="text-lg font-bold text-gray-800">Upcoming Deadlines</h5>
                        <a href="#" class="text-sm text-blue-600 hover:underline font-medium">View All</a>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                                    <th class="pb-3 font-medium">Task Name</th>
                                    <th class="pb-3 font-medium">Due Date</th>
                                    <th class="pb-3 font-medium">Priority</th>
                                    <th class="pb-3 font-medium text-right">Assignee</th>
                                </tr>
                            </thead>
                            <tbody class="text-gray-600 text-sm">
                                ${data.upcomingTasks && data.upcomingTasks.length > 0 ? data.upcomingTasks.map(task => `
                                    <tr class="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                        <td class="py-3 font-medium text-gray-800">${task.name}</td>
                                        <td class="py-3 text-gray-500">
                                            <div class="flex items-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                                ${new Date(task.dueDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td class="py-3">
                                            <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}">
                                                ${tasksPriority(task.priority)}
                                            </span>
                                        </td>
                                        <td class="py-3 flex justify-end">
                                             ${task.assigneeAvatar ?
            `<img src="${task.assigneeAvatar}" class="w-8 h-8 rounded-full border border-white shadow-sm" title="${task.assigneeName}">` :
            `<div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 ring-2 ring-white" title="Unassigned">?</div>`
        }
                                        </td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="4" class="py-8 text-center text-gray-400 italic">No upcoming deadlines</td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Project Members -->
                <div class="w-1/3 p-5 border rounded-xl bg-white shadow-sm flex flex-col">
                    <div class="flex items-center justify-between mb-4">
                        <h5 class="text-lg font-bold text-gray-800">Project Members</h5>
                        <span class="bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs font-bold">${projectData.members.length}</span>
                    </div>
                    <div class="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[300px]">
                        ${projectData.members.map(member => `
                            <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group">
                                <div class="flex items-center gap-3">
                                    <img src="${member.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(member.name)}" alt="${member.name}" class="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm">
                                    <div>
                                        <h6 class="text-sm font-semibold text-gray-800">${member.name}</h6>
                                        <p class="text-xs text-gray-500">${member.email}</p>
                                    </div>
                                </div>
                                <span class="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                                    ${member.role === 0 ? 'Admin' : 'Member'}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                    <button class="mt-4 w-full py-2 rounded-lg border border-dashed border-gray-300 text-gray-500 text-sm font-medium hover:border-gray-400 hover:text-gray-700 transition-all flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
                        Add Member
                    </button>
                </div>
            </div>

            <!-- Unassigned Tasks Alert -->
             ${data.unassignedTasks > 0 ? `
            <div class="alert alert-warning d-flex align-items-center shadow-sm" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <div>
                    There are <strong>${data.unassignedTasks}</strong> unassigned tasks that need attention.
                </div>
            </div>` : ''}
        </div>
    `;

    // Render Charts
    renderPriorityChart(data.tasksByPriority);
    renderAssigneeChart(data.tasksByAssignee);
}

function renderPriorityChart(priorityData) {
    const ctx = document.getElementById('priorityChart').getContext('2d');
    const legendContainer = document.getElementById('priorityLegend');
    const totalCountElement = document.getElementById('totalTasksCount');

    // Default values if keys are missing
    const critical = priorityData['Critical'] || 0;
    const high = priorityData['High'] || 0;
    const medium = priorityData['Medium'] || 0;
    const low = priorityData['Low'] || 0;

    const total = critical + high + medium + low;
    if (totalCountElement) totalCountElement.innerText = total;

    const dataValues = [critical, high, medium, low];
    const labels = ['Critical', 'High', 'Medium', 'Low'];
    const backgroundColors = ['#2563eb', '#60a5fa', '#93c5fd', '#e5e7eb'];

    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: backgroundColors,
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 4,
                borderRadius: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            let value = context.parsed;
                            let percentage = total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
                            return label + value + ' (' + percentage + ')';
                        }
                    }
                }
            }
        }
    });

    // Generate Custom Legend
    const legendHTML = labels.map((label, index) => {
        const value = dataValues[index];
        const color = backgroundColors[index];
        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';

        return `
            <div class="flex items-center justify-between mb-3 last:mb-0 group cursor-pointer" onclick="toggleDataset(${index})">
                <div class="flex items-center gap-3">
                    <span class="w-3 h-3 rounded-full" style="background-color: ${color};"></span>
                    <span class="text-sm text-gray-600 font-medium">${label}</span>
                </div>
                <span class="text-sm font-bold text-gray-700">${percentage}</span>
            </div>
        `;
    }).join('');

    if (legendContainer) {
        legendContainer.innerHTML = legendHTML;
    }

    // Helper to toggle data visibility from legend (Optional)
    window.toggleDataset = (index) => {
        const meta = chart.getDatasetMeta(0);
        meta.data[index].hidden = !meta.data[index].hidden;
        chart.update();
    };
}

function renderAssigneeChart(assigneeList) {
    const ctx = document.getElementById('assigneeChart').getContext('2d');

    // Top 10 Assignees
    const topAssignees = assigneeList.slice(0, 10);
    const labels = topAssignees.map(a => a.assignee);
    const counts = topAssignees.map(a => a.count);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tasks',
                data: counts,
                backgroundColor: '#2563eb',
                borderRadius: 20,
                barThickness: 30,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    border: { display: true },
                    grid: {
                        display: true,
                    },
                    ticks: {
                        stepSize: 1,
                        color: '#9ca3af',
                        font: { size: 12 }
                    }
                },
                x: {
                    border: { display: false },
                    grid: {
                        display: false,
                    },
                    ticks: {
                        color: '#9ca3af',
                        font: { size: 12 }
                    }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}