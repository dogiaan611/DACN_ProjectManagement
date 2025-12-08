import { authFetch } from "../auth/auth.js";

let notificationList;
let markAllBtn;
let currentPage = 1;
let isLoading = false;
let hasMore = true;
const pageSize = 20;

export async function initNotification() {
    notificationList = document.getElementById('notification-list');
    markAllBtn = document.getElementById('mark-as-read-all');

    if (markAllBtn) {
        // Remove old listeners to avoid duplicates if any (though usually elements are new)
        const newBtn = markAllBtn.cloneNode(true);
        markAllBtn.parentNode.replaceChild(newBtn, markAllBtn);
        markAllBtn = newBtn;

        markAllBtn.addEventListener('click', async () => {
            try {
                const response = await authFetch('/notification/read-all', {
                    method: 'PUT'
                });

                if (response.ok) {
                    loadNotification();
                    await updateNotificationBadge();
                }
            } catch (error) {
                console.error('Error marking all as read:', error);
            }
        });
    }

    if (notificationList) {
        notificationList.addEventListener('scroll', () => {
            if (notificationList.scrollTop + notificationList.clientHeight >= notificationList.scrollHeight - 50) {
                loadNotification(true);
            }
        });
    }

    await loadNotification(false);
    await updateNotificationBadge();
}

async function loadNotification(isAppend = false) {
    if (!notificationList) return;
    if (isLoading || (!hasMore && isAppend)) return;

    isLoading = true;

    if (!isAppend) {
        currentPage = 1;
        hasMore = true;
        notificationList.innerHTML = ''; // Clear list if reloading
    }

    try {
        const res = await authFetch(`/notification?page=${currentPage}&pageSize=${pageSize}`);
        if (!res.ok) {
            throw new Error('Failed to get notifications');
        }
        const data = await res.json();

        if (data.length < pageSize) {
            hasMore = false;
        }

        renderNotification(data, isAppend);

        if (data.length > 0) {
            currentPage++;
        }

    } catch (err) {
        console.log('Failed to get notifications: ', err);
        if (!isAppend) {
            notificationList.innerHTML = '<p class="text-center text-red-500 mt-4">Không thể tải thông báo.</p>';
        }
    } finally {
        isLoading = false;
    }
}

export async function updateNotificationBadge() {
    try {
        // Fetch first page to check if there are any unread notifications
        // Ideally backend should provide an endpoint for unread count
        const res = await authFetch('/notification?page=1&pageSize=20');
        if (res.ok) {
            const data = await res.json();
            const hasUnread = data.some(n => !n.isRead);

            const sidebarLink = document.querySelector('a[href="/notification.html"]');
            if (sidebarLink) {
                let badge = sidebarLink.querySelector('.notification-badge');
                if (hasUnread) {
                    if (!badge) {
                        badge = document.createElement('div');
                        badge.className = 'notification-badge w-2 h-2 bg-red-500 rounded-full absolute right-2';
                        sidebarLink.style.position = 'relative';
                        sidebarLink.appendChild(badge);
                    }
                } else {
                    if (badge) badge.remove();
                }
            }
        }
    } catch (error) {
        console.error('Error updating notification badge:', error);
    }
}

function formatTimeAgo(dateString) {
    const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const date = new Date(utcDateString);

    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 10) {
        return 'vừa xong';
    }

    let interval = seconds / 31536000; // 1 year
    if (interval > 1) {
        return Math.floor(interval) + " năm trước";
    }
    interval = seconds / 2592000; // 1 month
    if (interval > 1) {
        return Math.floor(interval) + " tháng trước";
    }
    interval = seconds / 86400; // 1 day
    if (interval > 1) {
        return Math.floor(interval) + " ngày trước";
    }
    interval = seconds / 3600; // 1 hour
    if (interval > 1) {
        return Math.floor(interval) + " tiếng trước";
    }
    interval = seconds / 60; // 1 minute
    if (interval > 1) {
        return Math.floor(interval) + " phút trước";
    }
    return Math.floor(seconds) + " giây trước";
}

function getNotificationIcon(type) {
    switch (type) {
        case 'Mention':
            return {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-at-sign-icon lucide-at-sign"><circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" /></svg>',
                color: 'text-purple-500'
            };
        case 'TaskStatusChanged':
            return {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text-icon lucide-file-text"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>',
                color: 'text-blue-500'
            };
        case 'CommentCreated':
            return {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-circle-icon lucide-message-circle"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/></svg>',
                color: 'text-green-500'
            };
        case 'TaskAttachment':
            return {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-paperclip-icon lucide-paperclip"><path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"/></svg>',
                color: 'text-orange-500'
            };
        case 'TaskAssigned':
            return {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-check-icon lucide-user-check"><path d="m16 11 2 2 4-4"/><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
                color: 'text-blue-500'
            };
        case 'TaskAttachmentDeleted':
        case 'TagRemoved':
        case 'SubtaskDeleted':
        case 'TaskDeleted':
            return {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
                color: 'text-red-500'
            };
        default:
            return {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bell-dot-icon lucide-bell-dot"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M13.916 2.314A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.74 7.327A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673 9 9 0 0 1-.585-.665"/><circle cx="18" cy="8" r="3"/></svg>',
                color: 'text-red-500'
            };
    }
}

function renderNotification(notifications, isAppend) {
    if (!notificationList) return;

    if (!isAppend) {
        notificationList.innerHTML = '';
    }

    if (notifications.length === 0 && !isAppend) {
        notificationList.innerHTML = `<div class="flex items-center justify-center">
            <p class="text-center text-gray-500 mt-4">Bạn không có thông báo nào</p>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bell-off-icon lucide-bell-off"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M17 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 .258-1.742"/><path d="m2 2 20 20"/><path d="M8.668 3.01A6 6 0 0 1 18 8c0 2.687.77 4.653 1.707 6.05"/></svg>
        </div>`;
        return;
    }

    notifications.forEach(notification => {
        const { icon, color } = getNotificationIcon(notification.type);
        const iconColor = notification.isRead ? 'text-gray-400' : color;
        const colorText = notification.isRead ? 'text-gray-500' : 'text-gray-800';
        const colorDate = notification.isRead ? 'text-gray-500' : 'text-blue-500';
        const dateFormat = formatTimeAgo(notification.createdAt);

        const html = `
            <div class="notification-item py-2 px-3 rounded-lg border 
            cursor-pointer hover:bg-gray-200 transition-colors flex gap-4 justify-between items-center" 
            data-id="${notification.notificationId}" onclick="handleNotificationClick(${notification.notificationId}, this, ${notification.isRead})">
                <div class="flex gap-2">
                    <div class="${iconColor} mt-1 p-2 rounded-full">
                        ${icon}
                    </div>
                    <div>
                        <p class="${colorText}">${notification.content}</p>
                        <span class="${colorDate}">${dateFormat}</span>
                    </div>
                </div>
                ${!notification.isRead ? '<div class="w-2 h-2 bg-red-500 rounded-full mt-2"></div>' : ''}
            </div>
        `;
        notificationList.insertAdjacentHTML('beforeend', html);
    });
}

window.handleNotificationClick = async (id, element, isRead) => {
    if (isRead) return;
    try {
        const res = await authFetch(`/notification/${id}/read`, {
            method: 'PUT'
        });
        if (res.ok) {
            // Update background
            element.classList.remove('bg-blue-50');
            element.classList.add('bg-white');

            // Update onclick to prevent re-triggering
            element.setAttribute('onclick', `handleNotificationClick(${id}, this, true)`);

            // Remove red dot
            const dot = element.querySelector('.bg-red-500');
            if (dot) dot.remove();

            // Update text colors to gray
            const contentText = element.querySelector('p');
            if (contentText) {
                contentText.classList.remove('text-gray-800');
                contentText.classList.add('text-gray-500');
            }

            const dateText = element.querySelector('span');
            if (dateText) {
                dateText.classList.remove('text-blue-500');
                dateText.classList.add('text-gray-500');
            }

            // Update icon color to gray
            const iconContainer = element.querySelector('div.rounded-full');
            if (iconContainer) {
                // Remove all possible color classes
                iconContainer.classList.remove('text-purple-500', 'text-blue-500', 'text-green-500', 'text-gray-500');
                iconContainer.classList.add('text-gray-400');
            }

            await updateNotificationBadge();
        }
    } catch (err) {
        console.log('Failed to mark as read: ', err);
    }
}