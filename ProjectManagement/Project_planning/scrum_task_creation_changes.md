# Scrum Task Creation Implementation Changes

This document summarizes the changes made to implement Scrum task creation functionality, enabling specific task forms for Scrum projects and integrating them into the Board, List, and Backlog views.

## Modified Files

### 1. `wwwroot/js/taskUI.js`
- **Function Added:** `createTaskScrumHtml()`
  - Generates the HTML for the Scrum-specific task creation form.
  - Includes fields for Title, Assignee, Priority, and Due Date.
  - Uses hidden inputs for storing selected values.

### 2. `wwwroot/js/task.js`
- **Imports:** Imported `createTaskScrumHtml` from `./taskUI.js`.
- **Function Updated:** `initTaskEventListeners(tasks, projectId, container, projectType)`
  - Added `projectType` parameter to the function signature.
  - **Logic Change:** Inside the "Add Task" button click handler:
    - Checks `projectType`.
    - If `projectType === 1` (Scrum), it renders the Scrum task form using `createTaskScrumHtml()`.
    - Otherwise, it falls back to `createTaskFormHtml()` (Kanban) or `createTaskRowFormHtml()` (List View).

### 3. `wwwroot/js/project-board.js`
- **Function Updated:** `initProjectBoard(projectType)`
  - Ensures `projectType` is determined (fetched from API if undefined).
  - Passes `projectType` to the `addEventListeners` helper function.
- **Function Updated:** `addEventListeners(...)`
  - Accepts `projectType` as a parameter.
  - Passes `projectType` along to `initTaskEventListeners`.

### 4. `wwwroot/js/project-list.js`
- **Function Updated:** `addEventListeners(...)`
  - Explicitly passes `0` (representing non-Scrum/Kanban default) as the `projectType` argument to `initTaskEventListeners`.
  - This ensures the List View continues to function correctly without trying to render the Scrum form.

### 5. `wwwroot/js/project-backlog.js`
- **Refactoring:**
  - Integrated `createTaskScrumHtml` for creating tasks directly in the backlog.
  - Implemented `setupCreateTaskForm` to handle form submission logic for both Backlog and Sprint task creation.
  - Added logic to fetch default `boardId` and `columnId` for new tasks.
  - Added "Create Task" buttons to Sprint headers and the Backlog container.

## Summary of Impact
- **Scrum Boards:** Now display a detailed task creation form (Title, Assignee, Priority, Due Date) when clicking "Add Task".
- **Kanban Boards:** Continue to use the simple task creation form.
- **List View:** Continues to use the row-based task creation form.
- **Backlog View:** Users can now create tasks directly in the Backlog or specific Sprints using the detailed Scrum form.
