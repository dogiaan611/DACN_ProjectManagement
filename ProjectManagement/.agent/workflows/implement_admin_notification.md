---
description: Implement Admin Notification Management
---

# Admin Notification Implementation Plan

This workflow outlines the steps to create the frontend for the Admin Notification feature, allowing system admins to view and filter all system notifications.

## Phase 1: Sidebar & Navigation Updates

1.  **Update `wwwroot/components/sidebar.html`**:
    -   Add a new link for "System Notifications" under the Admin section (next to Dashboard and User).
    -   ID: `notification-admin-link` (Distinct from personal `notification.html`). Let's use `admin-notification-link`.
    -   Href: `/adminNotification.html`
    -   Default class: `... hidden` (same as other admin links).
    -   Icon: Use a bell or similar (maybe with a different style or badge if possible, but standard is fine).

2.  **Update `wwwroot/js/layout/sidebar.js`**:
    -   Update `loadUser` logic to remove `.hidden` from `admin-notification-link` if the user is a System Admin (`systemRole === 0`).
    -   Update `setupNavigation` to include `admin-notification-link` in the click handler for SPA navigation.
    -   Update `updateSidebarActiveState` to select and highlight `admin-notification-link`.
    -   Update `loadPage` to handle `adminNotification.html` path and call `initAdminNotification`.

## Phase 2: Create HTML Page

3.  **Create `wwwroot/adminNotification.html`**:
    -   Copy the structure from `adminUser.html` to maintain layout consistency (Sidebar wrapper + Main content).
    -   **Statistics Section**: Add a grid at the top for dashboard cards:
        -   Total Notifications
        -   Unread Count
        -   Read Count
        -   Last 24 Hours
    -   **Filter Section**:
        -   Search input (optional, API supports filters but maybe client-side or wait for API update if needed? The API supports `type` and `isRead`. Let's strictly follow API).
        -   **Filter Type**: Dropdown (All, Info, Warning, Error, Success - or whatever types the system uses).
        -   **Filter Status**: Tabs or Radio buttons (All, Read, Unread).
    -   **List/Table Section**:
        -   Table to display notifications.
        -   Columns: Content, Type, User (created/related), Related To (Project/Task), Time, Status.
    -   **Pagination**: Standard Previous/Next buttons.

## Phase 3: Javascript Logic

4.  **Create `wwwroot/js/admin/admin-notification.js`**:
    -   Import `authFetch`.
    -   **State Management**: `state = { page: 1, pageSize: 20, isRead: null, type: null }`.
    -   **Functions**:
        -   `initAdminNotification()`: The entry point.
        -   `loadStatistics()`: Calls `/api/Admin/notifications/statistics` and updates the UI cards.
        -   `loadNotifications()`: Calls `/api/Admin/notifications`.
        -   `renderNotifications(list)`: Generates HTML for the table/list.
        -   `renderPagination()`: Updates pagination controls.
        -   `setupControls()`: Binds events to filters (change) and pagination (click).
    -   **Helpers**:
        -   Date formatter.
        -   Type badge renderer (color-coded).

## Phase 4: Integration Verification

5.  **Verify**:
    -   Clicking "System Notifications" in sidebar loads the page without refresh.
    -   Statistics load correctly.
    -   List loads correctly.
    -   Filtering by Read/Unread works.
    -   Pagination works.
