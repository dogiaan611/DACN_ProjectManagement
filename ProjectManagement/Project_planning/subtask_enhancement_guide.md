# Subtask Enhancement Implementation Guide

This guide outlines the step-by-step process to enhance the subtask functionality in the frontend, adding support for Assignee, Priority, and Due Date.

## Prerequisites
-   Ensure `taskUI.js` exports `toggleDropdown` and `getPriorityChip`.
-   Ensure `calendar.js` is available for dynamic import.

## Step 1: Update Imports in `subtask.js`
Modify `wwwroot/js/subtask.js` to import necessary UI helpers.

```javascript
import { authFetch } from "./auth.js";
import { toggleDropdown, getPriorityChip } from "./taskUI.js";
```

## Step 2: Update `renderSubtasks` Function
Update the HTML generation within `renderSubtasks` to include the new fields.

1.  **Assignee**: Display avatar or default icon. Add a click handler to open the assignee dropdown.
2.  **Priority**: Display priority chip using `getPriorityChip`. Add a click handler to open the priority dropdown.
3.  **Due Date**: Display formatted date or "No Date". Add a click handler to open the calendar.

**HTML Structure for a Subtask Item:**
```html
<div class="subtask-item ...">
    <!-- Checkbox & Title (Existing) -->
    ...
    
    <!-- New Metadata Controls -->
    <div class="flex items-center gap-2">
        <!-- Assignee -->
        <div class="assignee-btn ...">...</div>
        
        <!-- Priority -->
        <div class="priority-btn ...">...</div>
        
        <!-- Due Date -->
        <div class="duedate-btn ...">...</div>
        
        <!-- Delete Button (Existing) -->
        ...
    </div>
</div>
```

## Step 3: Implement Inline Editing Logic
For each subtask item, attach event listeners to the new controls.

### 3.1 Assignee Dropdown
-   Reuse the assignee dropdown logic from `taskDetail.js` or `task.js`.
-   On click, fetch project members.
-   On selection, call `PUT /subtasks/{subtaskId}` with `assigneeId`.
-   Update local state and re-render.

### 3.2 Priority Dropdown
-   Create a simple dropdown with High, Medium, Low options.
-   On selection, call `PUT /subtasks/{subtaskId}` with `priority`.
-   Update local state and re-render.

### 3.3 Due Date Picker
-   Dynamically import `calendar.js`.
-   Initialize calendar on the dropdown portal.
-   On change, call `PUT /subtasks/{subtaskId}` with `dueDate`.
-   Update local state and re-render.

## Step 4: Update "Add Subtask" Form
Enhance the creation form to allow setting these fields initially.

1.  **Add UI Elements**: Insert Assignee, Priority, and Due Date buttons into the `addSubtaskFormHtml`.
2.  **Handle Selection**: Store selected values in variables (e.g., `selectedAssigneeId`, `selectedPriority`, `selectedDueDate`).
3.  **Update Submit**: Modify the `POST` request payload to include these values.

```javascript
const payload = {
    title: title,
    assigneeId: selectedAssigneeId,
    priority: selectedPriority,
    dueDate: selectedDueDate
};
```

## Step 5: Verify Changes
1.  **Create**: Add a new subtask with all fields set. Verify it appears correctly.
2.  **Read**: Reload the page/modal to ensure data persists.
3.  **Update**: Change each field on an existing subtask and verify the update persists.
4.  **Delete**: Ensure delete functionality still works.
