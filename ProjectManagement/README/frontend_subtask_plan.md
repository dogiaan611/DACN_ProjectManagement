# Frontend Subtask Implementation Plan

This plan outlines the steps to implement subtask functionality in the frontend, connecting to the existing `SubtaskController`.

## 1. Overview
We need to implement the following features for Subtasks within the Task Detail Modal:
- **List Subtasks**: Fetch and display subtasks for a specific task.
- **Create Subtask**: Allow users to add a new subtask.
- **Toggle Status**: Allow users to mark a subtask as done/undone.
- **Delete Subtask**: Allow users to delete a subtask.
- **Update Subtask**: Allow users to rename a subtask (optional but recommended).

## 2. File Structure & Responsibilities

### `wwwroot/js/subtask.js`
This file will contain all the logic for handling subtasks.
- **`initSubtasks(taskId, boardId, columnId, projectId, modal)`**: Main entry point called from `taskDetail.js`.
- **`fetchSubtasks(...)`**: Calls `GET /boards/.../subtasks`.
- **`renderSubtasks(...)`**: Generates HTML for the subtask list.
- **`handleAddSubtask(...)`**: Calls `POST /boards/.../subtasks`.
- **`handleToggleSubtask(...)`**: Calls `PATCH /boards/.../subtasks/{id}/toggle`.
- **`handleDeleteSubtask(...)`**: Calls `DELETE /boards/.../subtasks/{id}`.

### `wwwroot/js/taskUI.js`
- Update `createTaskDetailModalHtml` to include the "Add Subtask" input form within the `#tab-content-subtask` container.

### `wwwroot/js/taskDetail.js`
- Call `initSubtasks` when the modal opens.

## 3. Detailed Function Logic

### 3.1. `initSubtasks`
**Purpose**: Initialize the subtask module for a specific task.
**Steps**:
1.  Accept `taskId`, `boardId`, `columnId`, `projectId`, and the `modal` element.
2.  Find the subtask container elements (`#task-subtasks-list`, `#add-subtask-input`, `#add-subtask-btn`) within the modal.
3.  Call `fetchSubtasks` to load initial data.
4.  Attach event listeners to the "Add" button and "Enter" key on the input field.

### 3.2. `fetchSubtasks`
**Purpose**: Get data from the server.
**Steps**:
1.  Call `authFetch` to `GET /boards/{boardId}/columns/{columnId}/tasks/{taskId}/subtasks`.
2.  If successful, receive an array of subtasks.
3.  Call `renderSubtasks` with the data.

### 3.3. `renderSubtasks`
**Purpose**: Display the list of subtasks.
**Steps**:
1.  Clear the current list.
2.  Loop through subtasks.
3.  For each subtask, create an HTML element:
    -   **Checkbox**: Checked if `isDone` is true. Click triggers `handleToggleSubtask`.
    -   **Title**: Text content. Strikethrough if `isDone` is true.
    -   **Delete Button**: Visible on hover. Click triggers `handleDeleteSubtask`.
4.  Append to the list container.
5.  Update any progress indicators (e.g., "2/5 completed") if we decide to add one.

### 3.4. `handleAddSubtask`
**Purpose**: Create a new subtask.
**Steps**:
1.  Get value from input field. Validate (not empty).
2.  Call `authFetch` to `POST /boards/.../subtasks` with `{ title: value }`.
3.  If successful, receive the new subtask object.
4.  Append the new subtask to the list (or re-fetch).
5.  Clear the input field.

### 3.5. `handleToggleSubtask`
**Purpose**: Change completion status.
**Steps**:
1.  Call `authFetch` to `PATCH /boards/.../subtasks/{subtaskId}/toggle`.
2.  If successful, update the UI (toggle checkbox and strikethrough style).

### 3.6. `handleDeleteSubtask`
**Purpose**: Remove a subtask.
**Steps**:
1.  Confirm with user (optional, maybe skip for simple subtasks).
2.  Call `authFetch` to `DELETE /boards/.../subtasks/{subtaskId}`.
3.  If successful, remove the element from the DOM.

## 4. Step-by-Step Implementation Guide

### Step 1: Update HTML Structure in `taskUI.js`
Modify `createTaskDetailModalHtml` to add the input form in the subtask tab.

```javascript
// In taskUI.js, inside the #tab-content-subtask div:
<div id="tab-content-subtask" class="hidden">
    <!-- Progress Bar (Optional) -->
    <div id="subtask-progress-bar" class="w-full bg-gray-200 rounded-full h-2.5 mb-4 hidden">
        <div class="bg-blue-600 h-2.5 rounded-full" style="width: 0%"></div>
    </div>
    
    <!-- List -->
    <div id="task-subtasks-list" class="flex flex-col gap-2 mb-2 max-h-80 overflow-y-auto py-2">
        <!-- Subtasks go here -->
    </div>

    <!-- Add Form -->
    <div class="flex items-center gap-2 mt-2">
        <input type="text" id="add-subtask-input" class="flex-1 p-2 border rounded-md text-sm outline-none focus:border-blue-500" placeholder="Add a subtask...">
        <button id="add-subtask-btn" class="px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600">Add</button>
    </div>
</div>
```

### Step 2: Implement `subtask.js`
Write the functions described in section 3.

```javascript
import { authFetch } from "./auth.js";

export function initSubtasks(taskId, boardId, columnId, projectId, modal) {
    const listContainer = modal.querySelector('#task-subtasks-list');
    const addInput = modal.querySelector('#add-subtask-input');
    const addBtn = modal.querySelector('#add-subtask-btn');
    // ... implementation
}
```

### Step 3: Integrate in `taskDetail.js`
Import `initSubtasks` and call it.

```javascript
// In taskDetail.js
import { initSubtasks } from "./subtask.js";

// Inside openTaskDetailModal:
initSubtasks(taskId, boardId, columnId, projectId, modal);
```

### Step 4: Add Styles (Optional)
Ensure checkbox and delete button styles look good (Tailwind classes).
- Checkbox: `w-4 h-4 text-blue-600 rounded focus:ring-blue-500`
- Delete Btn: `text-gray-400 hover:text-red-500`
