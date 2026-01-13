# Gantt Chart Implementation Documentation

This document provides a detailed technical explanation of the Gantt Chart feature implementation, covering both the Backend API and the Frontend rendering logic.

## 1. Backend Implementation (`ProjectController.cs`)

The backend is responsible for data retrieval and task creation for the Gantt Chart. It exposes two main endpoints.

### 1.1. Get Gantt Chart Data
**Endpoint:** `GET /projects/{projectId}/gantt-chart`

This endpoint fetches all tasks associated with a project and formats them for the Gantt view.

**Key Logic:**
1.  **Authentication & Authorization:**
    *   Verifies the current user (`User.FindFirstValue`).
    *   Checks if the user is a member of the project (`_db.ProjectMembers`).
2.  **Data Fetching:**
    *   Retrieves `ProjectTask` entities linked to the project via `Column` -> `Board`.
    *   Eager loads (`Include`) `Column`, `Board`, and `Assignee` data to avoid N+1 query issues.
    *   Fetches `ColumnStatusMapping` to correctly determine task status (To Do, In Progress, Done).
3.  **Status & Progress Calculation:**
    *   A local helper function `GetStatus` determines the task status based on:
        *   Explicit `ColumnStatusMapping` if available.
        *   Column name keywords (e.g., "done", "completed" -> Done; "progress", "doing" -> In Progress).
    *   **Progress Logic:**
        *   **Done**: 100%
        *   **In Progress**: Default to 50% if explicit progress isn't stored (currently simplistic logic).
        *   **To Do**: 0%
4.  **Data Transformation:**
    *   The tasks are projected into an anonymous object optimized for the frontend:
        *   `id`: String ID usually prefixed (e.g., "t1").
        *   `realTaskId`: The actual database Integer ID (crucial for linking to details).
        *   `name`, `start`, `end`: Task basic info. **Crucial:** Ensures `end >= start`.
        *   `columnsId`, `boardId`: Context for opening detail modals.
        *   `priority`: Integer enum value.
        *   `assignee`: Object containing `name` and `avatarUrl` (handles nulls).

### 1.2. Create Gantt Task
**Endpoint:** `POST /projects/{projectId}/gantt-chart/create`

Allows creating a task directly from the Gantt view.

**Key Logic:**
1.  **Column Selection:**
    *   Finds the default Board for the project.
    *   Determines the target column based on the provided `Progress`:
        *   **100%**: Searches for a "Done" column.
        *   **> 0%**: Searches for a "Progress" column.
        *   **Default**: Uses the first column (Backlog/To Do).
2.  **Task Creation:**
    *   Creates a new `ProjectTask` entity.
    *   Sets `CreatedAt` as Start Date and `DueDate` as End Date.
    *   Calculates `SortOrder` to append to the end of the column.

---

## 2. Frontend Implementation (`project-gantt.js`)

The frontend is a vanilla JavaScript implementation using SVG for rendering the chart and DOM manipulation for the sidebar.

### 2.1. Initialization (`initProjectGantt`)
*   Reads `projectId` from URL parameters.
*   Calls the backend API.
*   Triggers `renderGanttChart`.

### 2.2. Rendering Logic (`renderGanttChart`)

This is the core function. It accepts `tasks`, a `container` element, `projectId`, and `viewMode` (Day/Week/Month).

#### A. Layout Structure
Divides the container into two panes (Flexbox):
1.  **Sidebar (40%)**: Lists task details.
2.  **Scroll Area (60%)**: Contains the SVG chart.

#### B. Sidebar Rendering
*   **Header**: Displays columns for Task Name, Date, Assignee, Priority.
*   **Rows**: Iterates through tasks to render HTML rows.
    *   **Assignee**: Renders an `<img>` tag for Avatar or a generic initial circle.
    *   **Priority**: Uses a helper `getPriorityLabel` to render color-coded pills (Gray/Blue/Orange/Red).
*   **Interaction**: Adds `click` event listeners to rows. Clicking a row calls `openTaskDetailModal` (imported from `taskDetail.js`) using the `realTaskId`.
*   **Scroll Sync**: Listens to `scroll` event on the chart area to scroll the sidebar vertically in sync.

#### C. SVG Chart Rendering
*   **Grid System**:
    *   Calculates `totalDays` based on min/max task dates (plus buffer).
    *   Draws a header row with dates (formatted based on View Mode).
    *   Draws vertical grid lines for each time unit.
    *   Draws a vertical dashed red line for "Today".
*   **Task Bars**:
    *   Calculates X/Y coordinates based on Date and Row Index.
    *   **Color Logic (Pastel Theme)**:
        *   **Done (100%)**: Pastel Green (`fill: #dcfce7`, `stroke: #4ade80`, `progress: #bbf7d0`).
        *   **In Progress (>0%)**: Pastel Orange (`fill: #ffedd5`, `stroke: #fb923c`, `progress: #fed7aa`).
        *   **To Do (0%)**: Pastel Blue (`fill: #bfdbfe`, `stroke: #60a5fa`).
    *   Draws two `<rect>` elements per task:
        1.  **Background**: Full width (Start to End date).
        2.  **Progress**: Overlay width based on % completion.
    *   Renders task name text next to the bar (truncated if too long).

### 2.3. Task Creation Modal (`openAddTaskModal`)
*   Injects a simple HTML modal into the DOM.
*   Captures Name, Start Date, End Date, and Progress.
*   Submits JSON payload to the `Create` endpoint.
*   Refreshes the chart (`initProjectGantt`) on success.

## 3. Integration Points

*   **Task Details**: The Gantt chart integrates with `taskDetail.js`. When a user clicks a task in the sidebar, the system reuses the existing modal logic found in Kanban/List views to show full details, comments, and subtasks.
*   **Auth**: Uses `authFetch` wrapper to ensure JWT tokens are passed with API requests.

## 4. Key Stylings

*   **Framework**: TailwindCSS (utility first).
*   **Colors**:
    *   Pastel tones created using Tailwind color palette (e.g., `blue-200`, `orange-100`).
    *   Custom SVG styling via attributes `fill` and `stroke`.
*   **Responsiveness**:
    *   The Chart area (`#gantt-scroll-area`) handles overflow horizontally.
    *   Sidebar allows vertical scrolling synced with the chart.

---
**Author**: Google DeepMind Agent
**Date**: 2025-12-08
