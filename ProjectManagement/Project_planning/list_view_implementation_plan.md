# Implementation Plan - List View for Tasks

This plan outlines the steps to implement a List View for tasks in the project management application. This view will provide an alternative to the Kanban board, allowing users to see all tasks in a structured table format.

## User Review Required

> [!NOTE]
> **Approach Change**: Instead of creating a new API endpoint, we will reuse the existing `Column` and `Task` APIs. This avoids backend changes but requires multiple API calls (one per column) to load the list view.

## Proposed Changes

### Backend

*No changes required.*

### Frontend

#### [MODIFY] [project-list.js](file:///d:/GITHUB/DACN_ProjectManagement/ProjectManagement/wwwroot/js/project-list.js)
- Update `initProjectList` to:
    - Fetch the project's board: `GET /projects/{projectId}/boards`.
    - Fetch columns for the board: `GET /boards/{boardId}/columns`.
    - For each column, fetch tasks: `GET /boards/{boardId}/columns/{columnId}/tasks`.
    - Aggregate all tasks and render them in the list view, grouped by column (Status).
    - **Structure**: Render each group as a `.tasks-container` with `data-column-id` and `data-board-id`.
    - **Drag and Drop**: Reuse `initializeDragAndDrop` from `drag-drop.js`. Implement `initListEventListeners` to handle drag-and-drop events (similar to `task.js` but adapted for list layout) and task detail clicks.
    - Reuse `createTaskRow` (or similar) to generate table rows.

#### [MODIFY] [project-detail.js](file:///d:/GITHUB/DACN_ProjectManagement/ProjectManagement/wwwroot/js/project-detail.js)
- Ensure `viewSwitcher` correctly toggles the active class and calls `initProjectList`. (This seems to be already implemented, but I will verify and tweak if necessary).

## Verification Plan

### Automated Tests
- Since there are no existing frontend tests, I will rely on manual verification.
- For backend, I can use the Swagger UI to test the new endpoint `GET /projects/{projectId}/tasks`.

### Manual Verification
1.  **Open Project**: Navigate to a project detail page.
2.  **Switch View**: Click the "List" button.
3.  **Verify Data**: Check if the tasks are displayed in a list/table format.
    - Verify all tasks from the Kanban board are present.
    - Verify task details (Title, Priority, Status, Assignee) are correct.
4.  **Switch Back**: Click "Kanban" to ensure the board view still works.
5.  **Interaction**: Click on a task in the list to open the task detail modal.
6.  **Drag and Drop**: Verify that tasks can be dragged between status groups in the list view, updating their status.
