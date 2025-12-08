# Home Page UI Guide

## Overview
The Home Page (Dashboard) is the first screen the user sees after logging in. It should provide a high-level overview of their work, quick access to active projects, and immediate visibility into urgent tasks.

## Objectives
- **Personalized Welcome**: Greet the user by name.
- **Quick Access**: List recently used projects.
- **Focus**: Show "My Pending Tasks" across all projects.
- **Activity**: Show recent activity or notifications (optional, but good for "Alive" feel).

## Proposed Layout Structure

### 1. Header Section
- **Greeting**: "Good Morning/Afternoon, [User Name]".
- **Date**: Display current date.
- **Quick Actions**: "Create New Project" button (top right).

### 2. "My Work" Summary (Stats Cards)
A row of 3-4 cards displaying key metrics:
- **Assigned Tasks**: Number of tasks assigned to me (incomplete).
- **Overdue**: Number of tasks past due date.
- **Completed this week**: Productivity metric.

### 3. Recent Projects (Carousel or Grid)
- **Title**: "Recent Projects".
- **Display**: Horizontal scroll or a Grid of Project Cards.
- **Card Content**:
    - Project Icon/Color.
    - Project Name.
    - Last Accessed Date.
    - "Starred" status (optional).
    - Status badge (e.g., "Active", "Archived").

### 4. "My Tasks" List (Priority Focused)
A list section showing specific tasks assigned to the current user, sorted by urgency.
- **Columns**: Task Name | Project Name | Priority | Due Date | Status.
- **Tabs**: "Upcoming", "Overdue", "Recently Completed".
- **Action**: Clicking a task opens the Task Detail modal directly.

## Implementation Details

### HTML Structure (`index.html`)
```html
<main class="flex-1 p-8 overflow-y-auto ml-64 bg-gray-50">
    <!-- Header -->
    <header class="flex justify-between items-center mb-8">
        <div>
            <h1 class="text-3xl font-bold text-gray-900">Good Morning, <span id="user-greeting-name">User</span>!</h1>
            <p class="text-gray-500 mt-1" id="current-date">Today is Friday, Dec 6, 2024</p>
        </div>
        <button id="home-create-project-btn" class="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
            + Create Project
        </button>
    </header>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Stat Card 1 -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <div class="flex items-center gap-4">
                 <div class="p-3 bg-blue-50 text-blue-600 rounded-xl">
                     <svg ... icon ... />
                 </div>
                 <div>
                     <p class="text-sm text-gray-500 font-medium">My Open Tasks</p>
                     <p class="text-2xl font-bold text-gray-900" id="stat-open-tasks">12</p>
                 </div>
             </div>
        </div>
        <!-- Stat Card 2 & 3 ... -->
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left Column: Recent Projects (Span 2) -->
        <div class="lg:col-span-2 space-y-6">
            <h2 class="text-xl font-bold text-gray-900">Recent Projects</h2>
            <div id="home-projects-list" class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <!-- Project Cards injected here via JS -->
                 <!-- Use existing styling but ensure rounded-xl and hover effects -->
            </div>
        </div>

        <!-- Right Column: Urgent Tasks (Span 1) -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
            <h2 class="text-lg font-bold text-gray-900 mb-4">Urgent Tasks</h2>
            <div id="home-urgent-tasks-list" class="space-y-3">
                 <!-- Task Items injected here -->
                 <!-- Simple row: Checkbox - Title - Date (Red if overdue) -->
            </div>
             <button class="w-full mt-4 text-sm text-blue-600 font-medium hover:underline">View all my tasks</button>
        </div>
    </div>
</main>
```

### JavaScript Logic (`home.js`)
1.  **`initHome()`**:
    - Fetch User Info (`/user/read`) to set greeting.
    - Set Current Date.
    - Fetch Projects (`/projects/read`) -> Render Recent Projects.
    - **New**: Fetch "My Tasks" (Need backend API `GET /tasks/my-tasks` or filter from projects if payload allows, but dedicated API is better).
    - Calculate Stats based on fetched tasks.

2.  **`renderRecentProjects(projects)`**:
    - reuse existing logic but update HTML string to match new Design System (Rounded-2xl, etc).

3.  **`renderUrgentTasks(tasks)`**:
    - Filter tasks where `assigneeId == currentUserId` AND `status != 'Done'`.
    - Sort by `dueDate` ascending.
    - Take top 5.
    - Render simple list.

## Design System Checklist
- **Border Radius**: `rounded-2xl` for containers/modals, `rounded-xl` for buttons/cards.
- **Shadows**: `shadow-sm` for cards, `shadow-xl` or `2xl` for modals.
- **Colors**:
    - Background: `bg-gray-50` (Main), `bg-white` (Cards).
    - Text: `text-gray-900` (Headings), `text-gray-500` (Subtitles).
    - Accents: Use colors (Blue, Green, Red) sparingly for icons/badges.
- **Typography**: Sans-serif, clean, good hierarchy.

## Next Steps
1.  Update `wwwroot/index.html` structure.
2.  Update `wwwroot/js/home.js` logic.
3.  Ensure Backend supports "My Tasks" query (Might need `TaskController` update).
