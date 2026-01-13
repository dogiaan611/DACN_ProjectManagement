# Gantt Chart Implementation Guide

This guide details the specific steps to implement the Gantt Chart feature for this "ProjectManagement" application. It covers how the backend processes data and how the frontend should visualize it.

## Part 1: Backend Architecture (Completed)

The backend provides two critical endpoints in `ProjectController.cs`.

### 1. Retrieve Gantt Data (`GET`)
**Endpoint**: `GET /projects/{projectId}/gantt-chart`

**Logic & "Why"**:
- **Why**: The frontend needs a simplified view of tasks (ID, Name, Start, End, Progress) rather than the heavy `ProjectTask` entity.
- **Mapping Strategy**:
    - **Start Date**: Uses `CreatedAt`.
    - **End Date**: Uses `DueDate`. If `DueDate` is null or invalid (before Start), it defaults to `Start + 1 day` to ensure the bar has length.
    - **Progress**: Calculated based on Column mapping.
        - "Done" column -> 100%.
        - "In Progress" column -> 50%.
        - Others -> 0%.

**Response Format**:
```json
[
  {
    "id": "t101",
    "name": "Design Database",
    "start": "2023-12-01",
    "end": "2023-12-05",
    "progress": 50
  }
]
```

### 2. Create Task via Gantt (`POST`)
**Endpoint**: `POST /projects/{projectId}/gantt-chart/create`

**Logic & "Why"**:
- **Why**: Users may want to define a task by "Time" (Start/End) first, rather than status.
- **Mapping Strategy**:
    - **Status inference**: The backend intelligently places the new task into a column based on the `Progress` value sent. (100 -> Done col, >0 -> Progress col, 0 -> First col).
    - **Date mapping**: `Start` -> `CreatedAt`, `End` -> `DueDate`.

---

## Part 2: Frontend Implementation Steps

Follow these steps to build the frontend visualizer.

### Step 1: The UI Skeleton (HTML)
**Goal**: Create a container for the chart.

**Code Structure**:
```html
<div class="gantt-container">
    <div class="gantt-header-controls">
         <!-- Buttons: Zoom In/Out, Add Task -->
         <button onclick="openAddTaskModal()">+ Add Task</button>
    </div>
    <div class="gantt-chart-wrapper">
        <!-- SVG will reference this ID -->
        <svg id="gantt-canvas" width="100%" height="500"></svg>
    </div>
</div>
```

### Step 2: Fetching Data
**Goal**: Get the data from the API into a usable JavaScript variable.

**Implementation**:
```javascript
async function loadGanttData(projectId) {
    const response = await fetch(`/projects/${projectId}/gantt-chart`);
    const tasks = await response.json();
    renderGanttChart(tasks);
}
```

### Step 3: Determining the Time Scale (The "Physics")
**Goal**: Before drawing, we need to know the bounding box of our timeline.

**Why**: If the earliest task starts on Jan 1 and the latest ends on Jan 30, our chart needs to cover roughly 30 days.

**Logic**:
1.  **Find Min/Max**: Loop through all `tasks` to find `min(start)` and `max(end)`.
2.  **Add Buffer**: Subtract 2 days from Min and add 2 days to Max so bars don't touch the edges.
3.  **Calculate Total Days**: `(Max - Min) / (24 * 60 * 60 * 1000)`.

### Step 4: Drawing the Grid (X-Axis)
**Goal**: Visualize time as columns.

**Why**: Users need vertical lines to align tasks with dates.

**Logic**:
1.  **Column Width**: Define a constant `DAY_WIDTH = 50` (pixels).
2.  **Loop**: Iterate from `Start Date` to `End Date`.
3.  **Draw**:
    -   For each day, draw a generic gray line at `x = index * DAY_WIDTH`.
    -   Add a text label (e.g., "Dec 1") at the top.

### Step 5: Drawing the Bars (Y-Axis)
**Goal**: Place the tasks on the grid.

**Why**: This is the core visualization.

**Logic**:
1.  **Row Height**: Define a constant `ROW_HEIGHT = 40`.
2.  **Loop**: Iterate through `tasks`.
3.  **Calculate Position**:
    -   `x`: `daysDiff(task.start, GlobalStart) * DAY_WIDTH`.
    -   `y`: `taskIndex * ROW_HEIGHT + HEADER_HEIGHT`.
    -   `width`: `daysDiff(task.end, task.start) * DAY_WIDTH`.
4.  **Draw Rect**: Create an `<rect>` SVG element with these attributes.
    -   Fill color based on progress (e.g., Green for 100%, Blue for In Progress).

### Step 6: Handling Task Creation
**Goal**: Allow adding tasks directly from this view.

**Implementation**:
1.  **Modal**: Open a standard modal with Start Date and End Date pickers.
2.  **Submit**:
    ```javascript
    const payload = {
        Name: "New Task",
        Start: "2023-12-08",
        End: "2023-12-10",
        Progress: 0
    };
    await fetch(`/projects/${projectId}/gantt-chart/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    // Reload chart
    loadGanttData(projectId);
    ```

### Step 7: Advanced Polish (Optional)
-   **Tooltips**: Add `<title>` tags or custom hover divs to bars showing exact dates.
-   **Date Lines**: Draw a red vertical line at `x = Today`.

---
**Summary**:
The Gantt chart is a direct translation of 
`Date Time` (Time Domain) -> `Pixel Coordinates` (Visual Domain). 
By using the backend endpoints provided, we remove the complexity of calculating status/dates on the client side, allowing the frontend to focus purely on drawing the SVGs.

