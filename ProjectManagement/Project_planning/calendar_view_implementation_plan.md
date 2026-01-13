# Plan Implementation for Calendar View

## 1. Overview
This feature adds a **Calendar View** tab to the Project Details page. It allows users to view tasks on a monthly, weekly, or daily calendar. Tasks will be displayed as events spanning from their start date to their due date.

## 2. Backend Requirements
**Reuse Existing Controller**: `ProjectController`
**Endpoint**: `GET /projects/{projectId}/gantt-chart` (or `GetGanttChart` method)

*Rationale*: The `GetGanttChart` endpoint already returns the exact list of tasks with:
- `id` (Real Task ID)
- `name` (Title)
- `start` (Start Date / Created At)
- `end` (Due Date)
- `priority`
- `assignee`

No new backend code is required for the *read* operation.

## 3. Frontend Implementation

### 3.1. Libraries
We will use **FullCalendar** (v6) for a robust and beautiful calendar interface.
- **CSS**: `https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/main.min.css` (Note: v6 is module based or script tag based, script tags are easier for vanilla JS setups).
- **JS**: `https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.global.min.js`

### 3.2. HTML Updates (`project.html`)
1.  **Add "Calendar" Tab Button**:
    Add a new button in the view switcher (next to Gantt/Board/List) with a Calendar icon.
2.  **Add Container**:
    Ensure the `#project-content` container is ready to be cleared and populated (existing logic handles this).

### 3.3. JavaScript Logic (`js/project/project-calendar.js`)
Create a new module `project-calendar.js` with `initProjectCalendar(projectId)` function.

**Key Logic:**
1.  **Fetch Data**: Call `/projects/{projectId}/gantt-chart`.
2.  **Transform Data**: Map the API response to FullCalendar event objects:
    ```javascript
    {
      title: task.name,
      start: task.start,
      end: task.end,
      extendedProps: {
         priority: task.priority,
         assignee: task.assignee,
         realTaskId: task.realTaskId,
         boardId: task.boardId, // Needed for clicking
         columnId: task.columnId
      },
      backgroundColor: getPriorityColor(task.priority), // or status color
      borderColor: getPriorityColor(task.priority)
    }
    ```
3.  **Render Calendar**: Initialize `FullCalendar.Calendar` on the container.
    -   **Plugins**: `dayGrid`, `timeGrid`, `interaction`.
    -   **HeaderToolbar**: `prev,next today`, `title`, `dayGridMonth,timeGridWeek,timeGridDay`.
    -   **EventClick**: Trigger `openTaskDetailModal`.

### 3.4. Integration (`project-detail.js`)
- Import `initProjectCalendar` from `./project-calendar.js`.
- Add event listener for the new "Calendar" tab button.
- Handle active state switching (highlighting the button).

## 4. UI/UX Features
- **Color Coding**: Tasks will be colored based on **Priority** (e.g., High = Red, Medium = Orange, Low = Blue) to give instant visual cues.
- **Hover Effects**: Show a tooltip with more details (Assignee, Status).
- **Interactivity**: Clicking a calendar event opens the Task Detail Modal (reusing existing modal logic).

## 5. Step-by-Step Plan
1.  **Prepare HTML**: Add the Calendar tab icon/button in `project.html`.
2.  **Create JS Module**: Create `wwwroot/js/project/project-calendar.js`.
3.  **Implement Data Fetching**: Reuse `authFetch` to calling the Gantt endpoint.
4.  **Initialize FullCalendar**: Configure the calendar in the JS module.
5.  **Wire up Events**: Link the tab click in `project-detail.js` to load the calendar.
6.  **Refine Styles**: Adjust grid height and colors to match the "Premium" design aesthetic.
