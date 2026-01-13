import { authFetch } from "../auth/auth.js";

// --- User Notification State ---
let notificationList;
let markAllBtn;
let currentPage = 1;
let isLoading = false;
let hasMore = true;
const pageSize = 20;

// --- Admin Notification State ---
let adminState = {
    page: 1,
    pageSize: 20,
    isRead: '',
    type: '',
    total: 0,
    totalPages: 0
};
let isAdminLoaded = false;

// --- Entry Point ---
export async function initNotification() {
    // Basic User Elements
    notificationList = document.getElementById('notification-list');
    markAllBtn = document.getElementById('mark-as-read-all');

    // Attach Mark All Read Listener
    if (markAllBtn) {
        const newBtn = markAllBtn.cloneNode(true);
        markAllBtn.parentNode.replaceChild(newBtn, markAllBtn);
        markAllBtn = newBtn;
        markAllBtn.addEventListener('click', markAllAsRead);
    }

    // Attach Scroll Listener for User List
    if (notificationList) {
        notificationList.addEventListener('scroll', () => {
            if (notificationList.scrollTop + notificationList.clientHeight >= notificationList.scrollHeight - 50) {
                loadNotification(true);
            }
        });
    }

    // Check System Role to Enable Tabs
    await checkRoleAndSetupTabs();

    // Default Load: User Notifications
    await loadNotification(false);
    await updateNotificationBadge();
}

async function checkRoleAndSetupTabs() {
    try {
        const res = await authFetch('/user/read');
        if (res.ok) {
            const user = await res.json();
            // System Role 0 is typically Admin
            if (user.systemRole === 0) {
                setupTabs();
            }
        }
    } catch (error) {
        console.error("Error checking role:", error);
    }
}

function setupTabs() {
    const tabContainer = document.getElementById('notification-tabs');
    const tabMy = document.getElementById('tab-my-notif');
    const tabSys = document.getElementById('tab-system-notif');

    // View Containers
    const viewMy = document.getElementById('my-notifications-view');
    const viewSys = document.getElementById('system-notifications-view');
    const markAllBtn = document.getElementById('mark-as-read-all');

    if (tabContainer) tabContainer.classList.remove('hidden');

    // Tab Click Handlers
    tabMy.addEventListener('click', () => {
        // UI Toggle
        tabMy.classList.add('bg-white', 'shadow-sm', 'text-gray-900');
        tabMy.classList.remove('text-gray-500');
        tabSys.classList.remove('bg-white', 'shadow-sm', 'text-gray-900');
        tabSys.classList.add('text-gray-500');

        viewMy.classList.remove('hidden');
        viewSys.classList.add('hidden');
        if (markAllBtn) markAllBtn.classList.remove('hidden');
    });

    tabSys.addEventListener('click', () => {
        // UI Toggle
        tabSys.classList.add('bg-white', 'shadow-sm', 'text-gray-900');
        tabSys.classList.remove('text-gray-500');
        tabMy.classList.remove('bg-white', 'shadow-sm', 'text-gray-900');
        tabMy.classList.add('text-gray-500');

        viewSys.classList.remove('hidden');
        viewSys.classList.add('flex'); // System view uses flex-col
        viewMy.classList.add('hidden');
        if (markAllBtn) markAllBtn.classList.add('hidden');

        // Initial Load for Admin
        if (!isAdminLoaded) {
            initAdminView();
            isAdminLoaded = true;
        }
    });
}

// ================= USER NOTIFICATION LOGIC =================

async function markAllAsRead() {
    try {
        const response = await authFetch('/notification/read-all', { method: 'PUT' });
        if (response.ok) {
            loadNotification();
            await updateNotificationBadge();
        }
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
}

async function loadNotification(isAppend = false) {
    if (!notificationList) return;
    if (isLoading || (!hasMore && isAppend)) return;
    isLoading = true;

    if (!isAppend) {
        currentPage = 1;
        hasMore = true;
        notificationList.innerHTML = '';
    }

    try {
        const res = await authFetch(`/notification?page=${currentPage}&pageSize=${pageSize}`);
        if (!res.ok) throw new Error('Failed to get notifications');
        const data = await res.json();

        if (data.length < pageSize) hasMore = false;

        renderNotificationList(data, isAppend);

        if (data.length > 0) currentPage++;

    } catch (err) {
        console.log('Failed to get notifications: ', err);
        if (!isAppend) notificationList.innerHTML = '<p class="text-center text-red-500 mt-4">Không thể tải thông báo.</p>';
    } finally {
        isLoading = false;
    }
}

function renderNotificationList(notifications, isAppend) {
    if (!notificationList) return;
    if (!isAppend) notificationList.innerHTML = '';

    if (notifications.length === 0 && !isAppend) {
        notificationList.innerHTML = `<div class="flex flex-col items-center justify-center py-10">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bell-off text-gray-300"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M17 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 .258-1.742"/><path d="m2 2 20 20"/><path d="M8.668 3.01A6 6 0 0 1 18 8c0 2.687.77 4.653 1.707 6.05"/></svg>
            <p class="text-center text-gray-500 mt-2">Bạn không có thông báo nào</p>
        </div>`;
        return;
    }

    notifications.forEach(notification => {
        const { icon, color } = getNotificationIcon(notification.type);
        const iconColor = notification.isRead ? 'text-gray-400' : color;
        const colorText = notification.isRead ? 'text-gray-500' : 'text-gray-800';
        const dateFormat = formatTimeAgo(notification.createdAt);

        const html = `
            <div class="notification-item py-3 px-4 rounded-lg border bg-white mb-2
            cursor-pointer hover:bg-gray-50 transition-colors flex gap-4 justify-between items-start shadow-sm" 
            data-id="${notification.notificationId}" onclick="handleNotificationClick(${notification.notificationId}, this, ${notification.isRead})">
                <div class="flex gap-3">
                    <div class="${iconColor} bg-gray-50 p-2 rounded-full h-fit shrink-0">
                        ${icon}
                    </div>
                    <div class="flex flex-col gap-1">
                        <p class="${colorText} text-sm font-medium loading-snug">${notification.content}</p>
                        <span class="text-xs text-gray-400">${dateFormat}</span>
                    </div>
                </div>
                ${!notification.isRead ? '<div class="w-2.5 h-2.5 bg-red-500 rounded-full mt-2 shrink-0"></div>' : ''}
            </div>
        `;
        notificationList.insertAdjacentHTML('beforeend', html);
    });
}

// ================= ADMIN SYSTEM NOTIFICATION LOGIC =================

function initAdminView() {
    loadSystemStatistics();
    loadSystemNotifications();

    // Bind filters
    const filterType = document.getElementById('sys-filter-type');
    const filterStatus = document.getElementById('sys-filter-status');
    const refreshBtn = document.getElementById('sys-refresh-btn');

    if (filterType) filterType.addEventListener('change', (e) => {
        adminState.type = e.target.value;
        adminState.page = 1;
        loadSystemNotifications();
    });

    if (filterStatus) filterStatus.addEventListener('change', (e) => {
        adminState.isRead = e.target.value === 'read' ? 'true' : (e.target.value === 'unread' ? 'false' : '');
        adminState.page = 1;
        loadSystemNotifications();
    });

    if (refreshBtn) refreshBtn.addEventListener('click', () => {
        loadSystemStatistics();
        loadSystemNotifications();
    });
}

async function loadSystemStatistics() {
    try {
        const res = await authFetch('/api/Admin/notifications/statistics');
        if (res.ok) {
            const stats = await res.json();
            document.getElementById('stat-total').textContent = stats.total;
            document.getElementById('stat-unread').textContent = stats.unread;
            document.getElementById('stat-read').textContent = stats.read;
            document.getElementById('stat-24h').textContent = stats.last24Hours;
        }
    } catch (error) {
        console.error("Load stats failed:", error);
    }
}

async function loadSystemNotifications() {
    const listContainer = document.getElementById('sys-notification-list');
    listContainer.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-400">Loading...</td></tr>';

    try {
        let qs = `page=${adminState.page}&pageSize=${adminState.pageSize}`;
        if (adminState.type) qs += `&type=${adminState.type}`;
        if (adminState.isRead) qs += `&isRead=${adminState.isRead}`;

        const res = await authFetch(`/api/Admin/notifications?${qs}`);
        if (!res.ok) throw new Error('Load system notifications failed');

        const data = await res.json();
        adminState.total = data.total;
        adminState.totalPages = Math.ceil(data.total / adminState.pageSize);

        renderSystemList(data.notifications);
        renderAdminPagination();

    } catch (error) {
        console.error(error);
        listContainer.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Error: ${error.message}</td></tr>`;
    }
}

function renderSystemList(notifications) {
    const listContainer = document.getElementById('sys-notification-list');
    listContainer.innerHTML = '';

    if (!notifications || notifications.length === 0) {
        listContainer.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No notifications found</td></tr>';
        return;
    }

    notifications.forEach(n => {
        const { icon } = getNotificationIcon(n.type);
        const date = new Date(n.createdAt).toLocaleString();
        const user = n.user ? n.user.name : 'System';

        let statusBadge = n.isRead
            ? '<span class="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">Read</span>'
            : '<span class="px-2 py-0.5 rounded text-xs bg-red-100 text-red-600">Unread</span>';

        const tr = `
            <tr class="bg-white border-b hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                     <div class="flex items-start gap-2 max-h-20 overflow-y-auto">
                        <div class="text-gray-400 shrink-0 scale-75">${icon}</div>
                        <span class="text-gray-800 text-sm">${n.content}</span>
                     </div>
                </td>
                <td class="px-6 py-4 text-gray-500 text-xs font-mono">${n.type}</td>
                <td class="px-6 py-4 text-gray-600 text-sm whitespace-nowrap">${user}</td>
                <td class="px-6 py-4 text-gray-500 text-sm whitespace-nowrap">${date}</td>
                <td class="px-6 py-4 whitespace-nowrap">${statusBadge}</td>
            </tr>
        `;
        listContainer.insertAdjacentHTML('beforeend', tr);
    });
}

function renderAdminPagination() {
    const container = document.getElementById('sys-pagination');
    if (!container) return;

    // Simple pagination
    const prevDisabled = adminState.page === 1 ? 'disabled class="text-gray-300 cursor-not-allowed"' : 'class="text-gray-600 hover:bg-gray-100 rounded px-2"';
    const nextDisabled = adminState.page >= adminState.totalPages ? 'disabled class="text-gray-300 cursor-not-allowed"' : 'class="text-gray-600 hover:bg-gray-100 rounded px-2"';

    container.innerHTML = `
        <div class="text-xs text-gray-500">Page ${adminState.page} of ${Math.max(1, adminState.totalPages)}</div>
        <div class="flex gap-2">
            <button id="sys-prev" ${prevDisabled}>Previous</button>
            <button id="sys-next" ${nextDisabled}>Next</button>
        </div>
    `;

    document.getElementById('sys-prev')?.addEventListener('click', () => {
        if (adminState.page > 1) {
            adminState.page--;
            loadSystemNotifications();
        }
    });

    document.getElementById('sys-next')?.addEventListener('click', () => {
        if (adminState.page < adminState.totalPages) {
            adminState.page++;
            loadSystemNotifications();
        }
    });
}

// ================= SHARED HELPERS =================

export async function updateNotificationBadge() {
    try {
        const res = await authFetch('/notification?page=1&pageSize=20');
        if (res.ok) {
            const data = await res.json();
            const hasUnread = data.some(n => !n.isRead);
            const sidebarLink = document.querySelector('a[href="/notification.html"]');
            if (sidebarLink) {
                let badge = sidebarLink.querySelector('.notification-badge');
                if (hasUnread && !badge) {
                    badge = document.createElement('div');
                    badge.className = 'notification-badge w-2 h-2 bg-red-500 rounded-full absolute right-2';
                    sidebarLink.style.position = 'relative';
                    sidebarLink.appendChild(badge);
                } else if (!hasUnread && badge) {
                    badge.remove();
                }
            }
        }
    } catch { /* ignore */ }
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "vừa xong";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
}

function getNotificationIcon(type) {
    const icons = {
        'Mention': { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-at-sign"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/></svg>', color: 'text-purple-500' },
        'TaskStatusChanged': { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>', color: 'text-blue-500' },
        'CommentCreated': { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>', color: 'text-green-500' },
        'TaskAttachment': { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-paperclip"><path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"/></svg>', color: 'text-orange-500' },
        'TaskAssigned': { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-plus"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>', color: 'text-indigo-500' }
    };

    return icons[type] || {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bell"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
        color: 'text-gray-500'
    };
}

// User Click Handler (Global)
window.handleNotificationClick = async (id, element, isRead) => {
    if (isRead) return;
    try {
        const res = await authFetch(`/notification/${id}/read`, { method: 'PUT' });
        if (res.ok) {
            // UI Update: Remove active styling
            element.classList.remove('bg-white');
            element.classList.add('bg-gray-100', 'opacity-70');
            const dot = element.querySelector('.bg-red-500');
            if (dot) dot.remove();

            // Re-bind to prevent double click call
            element.onclick = null;

            await updateNotificationBadge();
        }
    } catch (err) { console.error(err); }
};