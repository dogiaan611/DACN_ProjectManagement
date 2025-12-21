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
        <div class="space-y-6">
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

                <!-- Admin Info / Quick Access (Mocking Members List) -->
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
    `;

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
    // Map backend enums to display names/colors
    // Assuming backend returns integers or strings.
    // Based on previous code: Type 0 = Kanban, 1 = Scrum (roughly)

    // Let's deduce from data or use defaults
    const palette = ['#8b5cf6', '#3b82f6', '#10b981']; // Purple, Blue, Green

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
