# Project Dashboard UI Implementation Guide

This guide outlines the steps to create a comprehensive dashboard for each project in the Project Management application. The dashboard will visualize key statistics using the newly created backend API.

## 1. Overview
**Goal:** specific "Dashboard" tab or view within each project context that displays real-time statistics about tasks, progress, and team workload.

**Data Source:** 
- Endpoint: `GET /projects/{projectId}/dashboard`
- Response Data:
    - Total Tasks
    - Completed vs. Incomplete Tasks
    - Overdue Tasks
    - Tasks by Priority (Breakdown)
    - Tasks by Assignee (Workload distribution)
    - Unassigned Tasks count

## 2. UI Layout Design
The dashboard should differ from the standard board/list views. It should be information-dense but clean.

**Proposed Layout (Grid System):**
- **Top Row (Summary Cards):** 4 Cards acting as Key Performance Indicators (KPIs).
    - Total Tasks
    - Completed Rate (%)
    - Incomplete / In Progress
    - Overdue (Highlighted in Red)
- **Middle Row (Charts):**
    - **Left:** Doughnut Chart - "Task Distribution by Priority" (Critical, High, Medium, Low).
    - **Right:** Bar Chart - "Workload by Member" (Number of tasks per assignee).
- **Bottom Row (Actionable items):** 
    - List of "Unassigned Tasks" (if any).
    - Link/Button to "View All Tasks".

## 3. Implementation Steps

### Step 1: Create Dashboard HTML Container
**What to do:**
Create a new HTML file or a new section within your existing single-page app structure (`project-details.html` or dynamic injection) to hold the dashboard elements.

**Key Elements:**
- A container `div` with ID `project-dashboard-container`.
- HTML skeleton for the 4 summary cards.
- `<canvas>` elements for Chart.js (Priority Chart, Assignee Chart).

### Step 2: Create `project-dashboard.js` Service
**What to do:**
Create a new JavaScript file `wwwroot/js/project-dashboard.js` to handle data fetching and rendering.

**Functions needed:**
1.  `loadProjectDashboard(projectId)`: Main entry point.
    - Calls the API `fetch('/projects/' + projectId + '/dashboard')`.
    - Handles loading states (spinners).
2.  `renderSummaryCards(data)`: Updates the DOM elements for Total, Completed, Incomplete, and Overdue counts.
3.  `renderPriorityChart(data)`: Initializes a Chart.js instance for priority distribution.
4.  `renderAssigneeChart(data)`: Initializes a Chart.js instance for assignee workload.

### Step 3: Install/Include Charting Library
**What to do:**
To make the dashboard professional, use **Chart.js**.
- Add the CDN link to your main layout file (`index.html` or `_Layout.cshtml`):
  ```html
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  ```

### Step 4: Update Project Navigation
**What to do:**
Users need a way to get to this dashboard.
- Update the **Project Sidebar** or **Top Tab Menu** (where Board/List/Timeline are located).
- Add a new tab labeled "Dashboard".
- Add an event listener to this tab that triggers `loadProjectDashboard(currentProjectId)`.

### Step 5: Styling (CSS)
**What to do:**
Ensure the dashboard looks premium.
- Use Flexbox or CSS Grid for the layout.
- Style the Summary Cards with a subtle box-shadow and border-radius.
- Use the "Orange" theme colors defined in your design system for consistency.

## 4. API Response Reference
Use this JSON structure to map your data:
```json
{
  "projectId": 123,
  "projectName": "Mobile App Launch",
  "totalTasks": 45,
  "completedTasks": 20,
  "incompleteTasks": 25,
  "overdueTasks": 2,
  "tasksByPriority": {
    "Critical": 5,
    "High": 10,
    "Medium": 20,
    "Low": 10
  },
  "tasksByAssignee": [
    { "assignee": "Sarah", "count": 15 },
    { "assignee": "John", "count": 12 }
  ],
  "unassignedTasks": 5
}
```
