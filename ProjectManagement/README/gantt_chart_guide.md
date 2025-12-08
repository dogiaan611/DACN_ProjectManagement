# Gantt Chart Implementation Guide

This guide provides a comprehensive overview of Gantt charts and a logically structured, step-by-step plan to build one using JavaScript.

## Part 1: Information about Gantt Chart

### What is a Gantt Chart?
A Gantt chart is a type of bar chart that illustrates a project schedule. It maps "Tasks" (Y-axis) against "Time" (X-axis). It is the standard tool for project management because it transforms a list of to-dos into a visual timeline.

### What does it show?
A Gantt chart acts as a coordinate system where:
1.  **The X-Axis (Time)**: Represents the project duration broken down by days, weeks, or months.
2.  **The Y-Axis (Tasks)**: Represents the specific activities that need completion.
3.  **The Bars (Duration & Position)**: The length of the bar shows duration, and its position shows the start/end dates.
4.  **Dependencies**: Lines connecting bars show that Task B cannot start until Task A ends.

---

## Part 2: Creation Plan in JavaScript (Logical Flow)

Building a Gantt chart is fundamentally a **mapping problem**: You are mapping *Dates* (Time) to *pixels* (Screen Space).

### Phase 1: Preparation (Data & Settings)

#### Step 1: Define the Data Model
**Explanation**: You cannot build a chart without structured input. The data determines everything.
**Data Structure**:
Use a Javascript Array of Objects. Each object represents a task.
```javascript
const tasks = [
    {
        id: "t1",
        name: "Planning",
        start: "2023-10-01",
        end: "2023-10-05",
        progress: 100 // 100% complete
    },
    {
        id: "t2", 
        name: "Design", 
        start: "2023-10-06", 
        end: "2023-10-10", 
        progress: 50 
    }
];
```
**Logic**: This is your "Source of Truth". If the data changes, the chart redraws.

#### Step 1.5: Data Fetching Strategy (Backend vs Frontend)
**Question**: Do you need a new Controller?
**Option A: Reuse Existing APIs (Frontend Aggregation)**
*   **How**: Fetch `Sprints` -> Loop through each Sprint to fetch `SprintTasks` -> Fetch `BacklogTasks` -> Merge all arrays.
*   **Pros**: No backend changes required.
*   **Cons**: Slow. Requires `1 + N + 1` API calls (where N is the number of sprints). Latency issues.
*   **Verdict**: Good for prototyping, bad for production.

**Option B: Create New Controller (Backend Aggregation)**
*   **How**: Create a generic endpoint `GET /projects/{id}/all-tasks` in `ProjectController` (or `TaskController`).
*   **Pros**: 1 API call. Fast. Backend handles logic (e.g., defaulting null start dates to `CreatedAt`).
*   **Cons**: Requires compiling C# code.
*   **Verdict**: **Recommended** for a Gantt chart to ensure smooth loading.

#### Step 2: Define Configuration Constants
**Explanation**: You need fixed values to convert "time" into "space".
**Key Constants**:
*   `DAY_WIDTH`: How many pixels represent **one day**? (e.g., `50px`).
*   `ROW_HEIGHT`: How tall is each task row? (e.g., `40px`).
**Logic**: 
*   If a task is 3 days long, its visual width = `3 * DAY_WIDTH` (150px).
*   If a task is the 2nd item in the list, its top position = `1 * ROW_HEIGHT` (40px).

### Phase 2: The "Brain" (Date Math)

#### Step 3: Implement Date Helper Functions
**Explanation**: Raw date strings ("2023-10-01") are useless for math. You need functions to handle them.
**Required Functions**:
1.  `parseDate(str)`: Converts string to a JS Date object.
2.  `diffInDays(dateA, dateB)`: Returns the number of days between two dates.
    *   *Formula*: `(DateB_Timestamp - DateA_Timestamp) / (1000 * 60 * 60 * 24)`
3.  `formatDate(date)`: Converts a Date object back to a readable string (e.g., "Oct 1") for labels.
**Logic**: Rendering a bar requires knowing "how many days from the start" it is.

#### Step 4: Calculate the Timeline Boundaries
**Explanation**: Your chart needs a Start and End date for the X-axis.
**Action**:
1.  Loop through all tasks.
2.  Find the **minimum** `start` date (Global Start).
3.  Find the **maximum** `end` date (Global End).
4.  (Optional) Subtract 2 days from Global Start and add 2 days to Global End for "padding".
**Logic**: This defines the width of your entire container. The formula for the global start serves as the "Zero Point" (0px) for your coordinate system.

### Phase 3: Rendering (The Visuals)

#### Step 5: Render the Grid (The Canvas)
**Explanation**: The grid provides context. Without it, bars are floating in whitespace.
**Action**:
1.  Create a header row `<div>`.
2.  Loop from `Global Start` to `Global End`.
3.  For each day:
    *   Create a header cell with width `DAY_WIDTH`.
    *   Insert the date label (e.g., "Mon 1").
    *   Create a vertical column line in the body for this day.
**Logic**: This draws the X-axis ruler.

#### Step 6: Calculate Task Coordinates (The "Mapping" Step)
**Explanation**: This is the most critical step. We translate task properties into CSS styles.
**For each task**:
1.  **Calculate Duration**: `diffInDays(task.end, task.start)`.
    *   *Visual Width* = `Duration * DAY_WIDTH`.
2.  **Calculate Offset**: `diffInDays(task.start, Global_Start_Date)`.
    *   *Visual Left Position* = `Offset * DAY_WIDTH`.
**Logic**: 
*   If Project starts on Oct 1st.
*   Task starts on Oct 3rd.
*   Offset is 2 days.
*   `left: 100px` (if width is 50px).

#### Step 7: Render the Bars
**Explanation**: Create the actual DOM elements based on the calculations in Step 6.
**Action**:
1.  Create a simple `div` for the task bar.
2.  Set `style.position = 'absolute'`.
3.  Set `style.left` and `style.width` calculated above.
4.  Set `style.top` based on the task's index (`index * ROW_HEIGHT`).
5.  Append this div to the chart container.
**Logic**: `absolute` positioning is perfect here because we calculated the exact pixel coordinates relative to the container.

### Phase 4: Polish

#### Step 8: Add Dependent Logic (Arrows)
**Explanation**: Visualizing relationships.
**Action**:
1.  Identify dependencies (e.g., Task B needs Task A).
2.  Get the coordinates of Task A's **Right side** (End).
3.  Get the coordinates of Task B's **Left side** (Start).
4.  Draw an SVG line or logical connector between these two points.

#### Step 9: Add Interactivity (Tooltips)
**Explanation**: Bars are small; they can't show everything.
**Action**:
1.  Add `mouseenter` event to the bar.
2.  Show a small floating `div` with `task.name`, `task.start`, and `task.progress`.
**Logic**: Keeps the UI clean while providing details on demand.

### Summary of Logic Flow
1.  **Define Reality**: Input Data (Tasks).
2.  **Define Physics**: Constants (px per day).
3.  **Find Boundaries**: Start/End of the world (Timeline).
4.  **Draw Terrain**: Grid & Header.
5.  **Place Objects**: Calculate & Render Bars.
