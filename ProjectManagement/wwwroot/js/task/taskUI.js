
export function getPriorityChip(priority) {
    switch (priority) {
        case 1:
            return `<div class="flex gap-1 items-center justify-start">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-red-700 lucide lucide-chevrons-up-icon lucide-chevrons-up"><path d="m17 11-5-5-5 5"/><path d="m17 18-5-5-5 5"/></svg>
                        <span class="text-xs font-semibold leading-none text-red-700">High Priority</span>
                    </div>`;
        case 2:
            return `<div class="flex gap-1 items-center justify-start">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-600 lucide lucide-chevron-up-icon lucide-chevron-up"><path d="m18 15-6-6-6 6"/></svg>
                        <span class="text-xs font-semibold leading-none text-yellow-600">Medium Priority</span>
                    </div>`;
        case 3:
            return `<div class="flex gap-1 items-center justify-start">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600 lucide lucide-chevron-down-icon lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>
                        <span class="text-xs font-semibold leading-none text-blue-600">Low Priority</span>
                    </div>`;
        default:
            return '';
    }
}

export function createTaskCardHtml(task, commentCount, attachmentCount) {
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }) : '';
    const assigneeName = task.assigneeName || (task.assignee ? task.assignee.name : '');
    const assigneeAvatarUrl = task.assigneeAvatarUrl || (task.assignee ? task.assignee.avatarUrl : '');

    const assigneeInitial = assigneeName ? assigneeName.charAt(0).toUpperCase() : '?';
    const assigneeAvatar = assigneeAvatarUrl
        ? `<img src="${assigneeAvatarUrl}" alt="${assigneeName}" class="w-5 h-5 rounded-full border object-cover">`
        : `<div class="w-5 h-5 border flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-semibold">${assigneeInitial}</div>`;
    return `
        <div class="bg-white p-4 rounded-md cursor-pointer group" draggable="true" data-task-id="${task.taskId}">
            <div class="mb-2 flex items-center justify-between">
                ${getPriorityChip(task.priority)}
                <div class="flex items-center justify-center px-1 group-hover:opacity-100 opacity-0 transition-opacity duration-200">
                    <div type="button" class="task-detail-btn border rounded-l-md hover:bg-gray-50 flex items-center justify-center p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pen-line-icon lucide-pen-line"><path d="M13 21h8"/><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
                    </div>
                    <div type="button" class="task-dropdown-btn rounded-r-md border-y border-r hover:bg-gray-50 flex items-center justify-center p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ellipsis-icon lucide-ellipsis"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                    </div>
                </div>
            </div>
            <div class="task-dropdown-menu hidden absolute z-10 w-48 bg-white border rounded-md shadow-lg py-2 px-1">
                <div class="flex flex-col gap-1">
                    <div type="button" class="w-full flex items-center justify-start gap-1 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star-icon lucide-star"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>
                        Add to favourite
                    </div>
                    <div type="button" class="w-full flex items-center justify-start gap-1 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alarm-clock-icon lucide-alarm-clock"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/></svg>
                        Remind me
                    </div>
                    <div type="button" class="w-full flex items-center justify-start gap-1 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left-right-icon lucide-arrow-left-right"><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg>
                        Move to
                    </div>
                    <div type="button" class="w-full flex items-center justify-start gap-1 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link-icon lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        Copy link
                    </div>
                    <div class="border-t border-gray-200"></div>
                    <div type="button" class="delete-task-btn w-full flex items-center justify-start gap-1 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer rounded-md hover:text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-icon lucide-trash"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        Delete
                    </div>
                </div>
            </div>
            <div class="flex justify-between items-start mb-2">
                <div class="flex items-center gap-2 cursor-text">
                    <span class="font-semibold text-gray-800">${task.title}</span>
                </div>
            </div>
            <div class="text-sm text-gray-600 mb-2">${task.description}</div>
            <div class="text-xs text-gray-500 mb-2 rounded-md hover:bg-gray-50 block w-fit">${dueDate}</div> 
            <div class="flex items-center justify-between">
                ${assigneeAvatar}
                <div class="flex items-center justify-center px-1 gap-2">
                    <div type="button" class="flex items-center justify-center gap-1 p-1 border rounded-md hover:bg-gray-50 text-xs text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-messages-square-icon lucide-messages-square"><path d="M16 10a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 14.286V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/><path d="M20 9a2 2 0 0 1 2 2v10.286a.71.71 0 0 1-1.212.502l-2.202-2.202A2 2 0 0 0 17.172 19H10a2 2 0 0 1-2-2v-1"/></svg>    
                    </div>
                    <div type="button" class="flex items-center justify-center gap-1 p-1 border rounded-md hover:bg-gray-50 text-xs text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-paperclip-icon lucide-paperclip"><path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"/></svg>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function createTaskRowFormHtml() {
    return `
    <div class="bg-white border p-2 rounded-md shadow-sm new-task-form-container">
            <form class="new-task-form">
                <div class="flex items-center gap-2 justify-start">
                    <div class="flex items-center justify-center w-1/3">
                        <input name="title" type="text" class="w-full p-2 outline-none rounded-md mb-2" placeholder="Enter task title..." required></input>
                        <button type="submit" class="flex text-sm items-center justify-start gap-1 px-1 py-0.5 bg-blue-500 text-white rounded-md">
                            Tạo
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-corner-down-left-icon lucide-corner-down-left"><path d="M20 4v7a4 4 0 0 1-4 4H4"/><path d="m9 10-5 5 5 5"/></svg>
                        </button>
                    </div>
                    <input type="hidden" name="assigneeId" value="">
                    <input type="hidden" name="priority" value="Medium">
                    <input type="hidden" name="dueDate" value="">
                    <div class="relative">
                        <div type="button" id="assignee-btn" class="w-full flex items-center justify-start px-2 py-1 gap-2 text-sm cursor-pointer text-gray-600 hover:bg-gray-100 rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users-icon lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>
                        </div>
                        <div id="assignee-dropdown" class="absolute z-10 w-fit border rounded-sm mt-1 hidden">
                            <div class="border-b py-1 px-2 flex items-center justify-start bg-white sticky top-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-search-icon lucide-user-search"><circle cx="10" cy="7" r="4"/><path d="M10.3 15H7a4 4 0 0 0-4 4v2"/><circle cx="17" cy="17" r="3"/><path d="m21 21-1.9-1.9"/></svg>
                                <input type="text" id="assignee-search" class="outline-none p-2 w-full text-base text-gray-500" placeholder="Search assignee..." autocomplete="off">
                            </div>
                            <div id="assignee-list" class="flex flex-col bg-white items-start justify-start p-1 max-h-48 overflow-y-auto">
                                <!-- Assignee list will be inserted here -->
                            </div>
                        </div>
                    </div>
                    <div class="relative">
                        <div type="button" id="duedate-btn" class="w-full flex items-center justify-start px-2 py-1 gap-2 text-sm cursor-pointer text-gray-600 hover:bg-gray-100 rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-days-icon lucide-calendar-days"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                        </div>
                        <div id="calendar-dropdown" class="absolute z-10 w-fit mt-1 hidden" >
                            <div id="calendar" class="p-2 bg-white"></div>
                        </div>
                    </div>
                    <div class="relative">
                        <button type="button" id="priority-btn" class="w-full flex items-center justify-start px-2 py-1 gap-2 text-sm cursor-pointer text-gray-600 hover:bg-gray-100 rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-goal-icon lucide-goal"><path d="M12 13V2l8 4-8 4"/><path d="M20.561 10.222a9 9 0 1 1-12.55-5.29"/><path d="M8.002 9.997a5 5 0 1 0 8.9 2.02"/></svg>
                            <span id="priority-btn-text">Medium Priority</span>
                        </button>
                        <div id="priority-dropdown" class="absolute z-10 p-2 w-fit bg-white border rounded-md shadow-lg mt-1 hidden">
                            <span class="p-1 mb-1 text-sm font-medium text-gray-700">Task Priority</span>
                            <div class="p-1 priority-option cursor-pointer hover:bg-gray-100" data-priority="High">
                                ${getPriorityChip(1)}
                            </div>
                            <div class="p-1 priority-option cursor-pointer hover:bg-gray-100" data-priority="Medium">
                                ${getPriorityChip(2)}
                            </div>
                            <div class="p-1 priority-option cursor-pointer hover:bg-gray-100" data-priority="Low">
                                ${getPriorityChip(3)}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    `;
}

export function createTaskFormHtml() {
    return `
        <div class="bg-white border p-2 rounded-md shadow-sm new-task-form-container">
            <form class="new-task-form">
                <div class="flex flex-col items-center gap-2 justify-start">
                    <div class="flex items-center justify-center w-full">
                        <input name="title" type="text" class="w-full p-2 outline-none rounded-md mb-2" placeholder="Enter task title..." required></input>
                        <button type="submit" class="flex text-sm items-center justify-start gap-1 px-1 py-0.5 bg-blue-500 text-white rounded-md">
                            Tạo
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-corner-down-left-icon lucide-corner-down-left"><path d="M20 4v7a4 4 0 0 1-4 4H4"/><path d="m9 10-5 5 5 5"/></svg>
                        </button>
                    </div>
                    <input type="hidden" name="assigneeId" value="">
                    <input type="hidden" name="priority" value="Medium">
                    <input type="hidden" name="dueDate" value="">
                    <div class="relative w-full">
                        <div type="button" id="assignee-btn" class="w-full flex items-center justify-start px-2 py-1 gap-2 text-sm cursor-pointer text-gray-600 hover:bg-gray-100 rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users-icon lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>
                            <span id="assignee-btn-text">Add assigned team members</span>
                        </div>
                        <div id="assignee-dropdown" class="absolute z-10 w-fit border rounded-sm mt-1 hidden">
                            <div class="border-b py-1 px-2 flex items-center justify-start bg-white sticky top-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-search-icon lucide-user-search"><circle cx="10" cy="7" r="4"/><path d="M10.3 15H7a4 4 0 0 0-4 4v2"/><circle cx="17" cy="17" r="3"/><path d="m21 21-1.9-1.9"/></svg>
                                <input type="text" id="assignee-search" class="outline-none p-2 w-full text-base text-gray-500" placeholder="Search assignee..." autocomplete="off">
                            </div>
                            <div id="assignee-list" class="flex flex-col bg-white items-start justify-start p-1 max-h-48 overflow-y-auto">
                                <!-- Assignee list will be inserted here -->
                            </div>
                        </div>
                    </div>
                    <div class="relative w-full">
                        <div type="button" id="duedate-btn" class="w-full flex items-center justify-start px-2 py-1 gap-2 text-sm cursor-pointer text-gray-600 hover:bg-gray-100 rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-days-icon lucide-calendar-days"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                            Due date
                        </div>
                        <div id="calendar-dropdown" class="absolute z-10 w-fit mt-1 hidden" >
                            <div id="calendar" class="p-2 bg-white"></div>
                        </div>
                    </div>
                    <div class="relative w-full">
                        <button type="button" id="priority-btn" class="w-full flex items-center justify-start px-2 py-1 gap-2 text-sm cursor-pointer text-gray-600 hover:bg-gray-100 rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-goal-icon lucide-goal"><path d="M12 13V2l8 4-8 4"/><path d="M20.561 10.222a9 9 0 1 1-12.55-5.29"/><path d="M8.002 9.997a5 5 0 1 0 8.9 2.02"/></svg>
                            <span id="priority-btn-text">Medium Priority</span>
                        </button>
                        <div id="priority-dropdown" class="absolute z-10 p-2 w-fit bg-white border rounded-md shadow-lg mt-1 hidden">
                            <span class="p-1 mb-1 text-sm font-medium text-gray-700">Task Priority</span>
                            <div class="p-1 priority-option cursor-pointer hover:bg-gray-100" data-priority="High">
                                ${getPriorityChip(1)}
                            </div>
                            <div class="p-1 priority-option cursor-pointer hover:bg-gray-100" data-priority="Medium">
                                ${getPriorityChip(2)}
                            </div>
                            <div class="p-1 priority-option cursor-pointer hover:bg-gray-100" data-priority="Low">
                                ${getPriorityChip(3)}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    `;
}

export function createTaskScrumHtml() {
    return `
        <div class="bg-white border p-1 rounded-md shadow-sm new-task-form-container">
            <form class="new-task-form">
                <div class="flex items-center gap-2 justify-start">
                    <div class="flex items-center justify-center w-2/3">
                        <input name="title" type="text" class="w-full p-2 outline-none rounded-md mb-2" placeholder="Enter task title..." required></input>
                        <button type="submit" class="flex text-sm items-center justify-start gap-1 px-1 py-0.5 bg-blue-500 text-white rounded-md">
                            Tạo
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-corner-down-left-icon lucide-corner-down-left"><path d="M20 4v7a4 4 0 0 1-4 4H4"/><path d="m9 10-5 5 5 5"/></svg>
                        </button>
                    </div>
                    <input type="hidden" name="assigneeId" value="">
                    <input type="hidden" name="priority" value="Medium">
                    <input type="hidden" name="dueDate" value="">
                    <div class="relative">
                        <div type="button" id="assignee-btn" class="w-full flex items-center justify-start px-2 py-1 gap-2 text-sm cursor-pointer text-gray-600 hover:bg-gray-100 rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users-icon lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>
                        </div>
                        <div id="assignee-dropdown" class="absolute z-10 w-fit border rounded-sm mt-1 hidden">
                            <div class="border-b py-1 px-2 flex items-center justify-start bg-white sticky top-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-search-icon lucide-user-search"><circle cx="10" cy="7" r="4"/><path d="M10.3 15H7a4 4 0 0 0-4 4v2"/><circle cx="17" cy="17" r="3"/><path d="m21 21-1.9-1.9"/></svg>
                                <input type="text" id="assignee-search" class="outline-none p-2 w-full text-base text-gray-500" placeholder="Search assignee..." autocomplete="off">
                            </div>
                            <div id="assignee-list" class="flex flex-col bg-white items-start justify-start p-1 max-h-48 overflow-y-auto">
                                <!-- Assignee list will be inserted here -->
                            </div>
                        </div>
                    </div>
                    <div class="relative">
                        <div type="button" id="duedate-btn" class="w-full flex items-center justify-start px-2 py-1 gap-2 text-sm cursor-pointer text-gray-600 hover:bg-gray-100 rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-days-icon lucide-calendar-days"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                        </div>
                        <div id="calendar-dropdown" class="absolute z-10 w-fit mt-1 hidden" >
                            <div id="calendar" class="p-2 bg-white"></div>
                        </div>
                    </div>
                    <div class="relative">
                        <button type="button" id="priority-btn" class="w-full flex items-center justify-start px-2 py-1 gap-2 text-sm cursor-pointer text-gray-600 hover:bg-gray-100 rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-goal-icon lucide-goal"><path d="M12 13V2l8 4-8 4"/><path d="M20.561 10.222a9 9 0 1 1-12.55-5.29"/><path d="M8.002 9.997a5 5 0 1 0 8.9 2.02"/></svg>
                            <span id="priority-btn-text">Medium Priority</span>
                        </button>
                        <div id="priority-dropdown" class="absolute z-10 p-2 w-fit bg-white border rounded-md shadow-lg mt-1 hidden">
                            <span class="p-1 mb-1 text-sm font-medium text-gray-700">Task Priority</span>
                            <div class="p-1 priority-option cursor-pointer hover:bg-gray-100" data-priority="High">
                                ${getPriorityChip(1)}
                            </div>
                            <div class="p-1 priority-option cursor-pointer hover:bg-gray-100" data-priority="Medium">
                                ${getPriorityChip(2)}
                            </div>
                            <div class="p-1 priority-option cursor-pointer hover:bg-gray-100" data-priority="Low">
                                ${getPriorityChip(3)}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    `;
}

export function createTaskDetailModalHtml(task) {
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }) : 'No due date';

    const assigneeAvatar = task.assigneeAvatarUrl
        ? `<img src="${task.assigneeAvatarUrl}" alt="${task.assigneeName}" class="w-6 h-6 rounded-full border object-cover">`
        : `<div class="w-6 h-6 border flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-sm font-semibold">${task.assigneeName ? task.assigneeName.charAt(0).toUpperCase() : '?'}</div>`;

    return `
        <div id="task-detail-modal-backdrop" class="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ease-in-out opacity-0"></div>
        <div id="task-detail-modal" data-task-id="${task.taskId}" class="fixed top-4 right-2 h-[95vh] w-[700px] max-w-3xl rounded-lg bg-white shadow-2xl z-50 transform translate-x-full transition-transform duration-300 ease-in-out">
            <div class="flex flex-col h-full">
                <div class="p-3 border-b flex justify-between items-center flex-shrink-0">
                    <div></div>
                    <div class="flex items-center justify-center gap-2">
                        <div id="task-detail-watcher-btn" tabindex='0' type="button" class="text-xs text-gray-400 hover:text-green-500 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-icon lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                        </div>
                        <div tabindex='0' type="button" id="maximize-task-detail-btn" class="text-sm text-gray-400 hover:text-gray-600 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-maximize"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
                        </div>
                        <div tabindex='0' type="button" id="edit-task-detail-btn" class="text-sm text-gray-400 hover:text-gray-600 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pen-line-icon lucide-pen-line"><path d="M13 21h8"/><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
                        </div>
                        <div tabindex='0' type="button" id="close-task-detail-modal-btn" class="text-sm text-gray-400 hover:text-red-500 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </div>
                    </div>
                </div>
                <div class="px-6 py-4 flex-grow overflow-y-auto">
                    <div class="flex flex-col gap-3 justify-start">
                        <div class="flex flex-col justify-start gap-2">

                            <div id="rename-title-btn" type="button" class="flex items-center mb-3">
                                <input id="task-detail-title-input" class="text-3xl text-gray-800 w-full outline-none hover:bg-gray-50 focus:bg-white border-none focus:border focus:cursor-text cursor-pointer rounded-md p-1" value="${task.title}">
                            </div>

                            <div class="flex items-center">
                                <div class="w-40 flex items-center gap-2 text-sm text-gray-400 font-normal ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert-icon lucide-circle-alert"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                                    Priority
                                </div>
                                <div id="task-detail-priority-btn" class="p-2 cursor-pointer rounded-md hover:bg-gray-100">${getPriorityChip(task.priority)}</div>
                                <div id="task-detail-priority-dropdown" class="absolute z-10 p-2 w-fit bg-white border rounded-md shadow-lg mt-1 hidden">
                                    <span class="p-1 mb-1 text-sm font-medium text-gray-700">Task Priority</span>
                                    <div class="p-1 priority-option cursor-pointer hover:bg-gray-100" data-priority="1">
                                        ${getPriorityChip(1)}
                                    </div>
                                    <div class="p-1 priority-option cursor-pointer hover:bg-gray-100" data-priority="2">
                                        ${getPriorityChip(2)}
                                    </div>
                                    <div class="p-1 priority-option cursor-pointer hover:bg-gray-100" data-priority="3">
                                        ${getPriorityChip(3)}
                                </div>
                            </div>
                            </div>

                            <div class="flex items-center">
                                <div class="w-40 flex items-center gap-2 text-sm text-gray-400 font-normal ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-icon lucide-calendar"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
                                    Due date
                                </div>
                                <div id="task-detail-calendar-btn" class="p-2 cursor-pointer text-sm text-gray-600 hover:bg-gray-50 rounded-md">${dueDate}</div>
                                <div id="task-detail-calendar-dropdown" class="absolute z-10 w-fit bg-white mt-1 hidden" >
                                    <div id="calendar" class="p-2 bg-white"></div>
                                </div>
                            </div>

                            <div class="flex items-start">
                                <div class="w-40 flex items-center gap-2 text-sm text-gray-400 font-normal mt-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tag-icon lucide-tag"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>
                                    Tags
                                </div>
                                <div class="flex flex-wrap ml-2 gap-2 items-center relative">
                                    <div id="task-tags-container" class="flex flex-wrap gap-2">
                                        <!-- Tags will be rendered here -->
                                    </div>
                                    <button type="button" id="add-tag-btn" class="flex items-center justify-center w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                    </button>
                                    
                                    <!-- Dropdown chọn tag -->
                                    <div id="tag-dropdown" class="absolute top-8 left-0 z-20 w-48 bg-white border rounded-md shadow-lg hidden">
                                        <div class="p-2 border-b">
                                            <input type="text" id="tag-search-input" class="w-full text-xs p-1 outline-none" placeholder="Search tags...">
                                        </div>
                                        <div id="tag-dropdown-list" class="max-h-40 overflow-y-auto p-1 flex flex-col gap-1">
                                            <!-- Available tags will be listed here -->
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="flex items-center">
                                <div class="w-40 flex items-center gap-2 text-sm text-gray-400 font-normal ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users-icon lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>
                                    Assignee
                                </div>
                                <div class="flex items-center gap-5 p-2">
                                    <div id="task-detail-assignee-avt" class="flex gap-2 items-center justify-center">${assigneeAvatar}<span class="text-sm font-medium text-gray-600">${task.assigneeName || ''}</span></div>
                                    <div type="button" tabindex='0' id="change-assignee" class="text-sm px-2 py-1 rounded flex items-center justify-center border-dashed border text-gray-800 cursor-pointer gap-2 hover:bg-gray-50">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-pen-icon lucide-user-pen"><path d="M11.5 15H7a4 4 0 0 0-4 4v2"/><path d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/><circle cx="10" cy="7" r="4"/></svg>
                                        Change
                                    </div>
                                </div>
                                <div id="assignee-detail-dropdown" class="absolute z-10 w-fit border rounded-sm mt-1 hidden">
                                    <div class="border-b py-1 px-2 flex items-center justify-start bg-white sticky top-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-search-icon lucide-user-search"><circle cx="10" cy="7" r="4"/><path d="M10.3 15H7a4 4 0 0 0-4 4v2"/><circle cx="17" cy="17" r="3"/><path d="m21 21-1.9-1.9"/></svg>
                                        <input type="text" id="assignee-search" class="outline-none p-2 w-full text-base text-gray-500" placeholder="Search assignee..." autocomplete="off">
                                    </div>
                                    <div id="assignee-detail-list" class="flex flex-col bg-white items-start justify-start p-1 max-h-48 overflow-y-auto">
                                        <!-- Assignee list will be inserted here -->
                                    </div>
                                </div>
                            </div>

                            <div class="flex items-center">
                                <div class="w-40 flex items-center gap-2 text-sm text-gray-400 font-normal ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users-icon lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>
                                    Watcher
                                </div>
                                <div class="flex items-center gap-5 p-2">
                                    <div id="task-detail-watcher-avt" class="flex items-center -space-x-3 gap-2 justify-center"></div>
                                    <div type="button" tabindex='0' id="edit-watcher" class="text-sm px-2 py-1 rounded flex items-center justify-center border-dashed border text-gray-800 cursor-pointer gap-2 hover:bg-gray-50">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-pen-icon lucide-user-pen"><path d="M11.5 15H7a4 4 0 0 0-4 4v2"/><path d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/><circle cx="10" cy="7" r="4"/></svg>
                                        Change
                                    </div>
                                </div>
                                <div id="watcher-detail-dropdown" class="absolute z-10 w-fit border rounded-sm mt-1 hidden">
                                    <div class="border-b py-1 px-2 flex items-center justify-start bg-white sticky top-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-search-icon lucide-user-search"><circle cx="10" cy="7" r="4"/><path d="M10.3 15H7a4 4 0 0 0-4 4v2"/><circle cx="17" cy="17" r="3"/><path d="m21 21-1.9-1.9"/></svg>
                                        <input type="text" id="watcher-search" class="outline-none p-2 w-full text-base text-gray-500" placeholder="Search watcher..." autocomplete="off">
                                    </div>
                                    <div id="watcher-detail-list" class="flex flex-col bg-white items-start justify-start p-1 max-h-48 overflow-y-auto">
                                        <!-- Watcher list will be inserted here -->
                                    </div>
                                </div>
                            </div>

                            <div class="flex items-center">
                                <div class="w-40 flex items-center gap-2 text-sm text-gray-400 font-normal ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text-icon lucide-file-text"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                                    Description
                                </div>
                                
                            </div>
                            <textarea id="task-description" class="w-full p-2 border rounded-md outline-none text-sm bg-gray-50 text-gray-600 min-h-[70px]">${task.description || ''}</textarea>

                            <div class="flex flex-col gap-2">
                                <div class="flex justify-between">
                                    <div class="w-40 flex items-center gap-2 text-sm text-gray-400 font-normal">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-paperclip-icon lucide-paperclip"><path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"/></svg>
                                        Attachments
                                    </div>
                                </div>
                                <div class="flex flex-wrap items-center justify-start gap-2">
                                    <div id="task-attachments-list" class="flex flex-wrap items-center justify-start gap-2">
                                        <!-- Attachments will be rendered here -->
                                    </div>
                                    <div class="flex items-center justify-center p-2 border border-dashed rounded-lg hover:bg-gray-50 cursor-pointer text-gray-600" onclick="document.getElementById('task-upload-file').click()">
                                        <input type="file" id="task-upload-file" accept="*" class="hidden" />
                                        <button type="button" class="pointer-events-none">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="flex flex-col gap-3">
                                <div class="flex items-center gap-4 border-b mb-2">
                                    <button id="tab-comment-btn" class="px-3 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600 focus:outline-none">Comments</button>
                                    <button id="tab-subtask-btn" class="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none">Subtasks</button>
                                    <button id="tab-activity-btn" class="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none">Activity</button>
                                </div>

                                <div id="tab-content-comment" class="block">
                                    <div id="task-comments-list" class="flex flex-col gap-2 mb-2 max-h-60 overflow-y-auto py-2">
                                        <!-- Comments will be loaded here -->
                                    </div>
                                    <div class="flex flex-col border rounded-md p-3">
                                        <div id="new-comment-content" contenteditable="true" class="w-full text-sm text-gray-800 outline-none rounded-md p-2 min-h-[40px] empty:before:content-[attr(placeholder)] empty:before:text-gray-400" placeholder="Add a comment..."></div>
                                        <div id="attachment-comment-review" class="flex flex-wrap items-center justify-start gap-2">

                                        </div>
                                        <div class="flex justify-end mt-2 gap-2">
                                            <div class="flex items-center justify-center p-1 rounded-md cursor-pointer border hover:bg-gray-50" onclick="document.getElementById('comment-upload-file').click()">
                                                <input type="file" id="comment-upload-file" accept="*" multiple class="hidden" />
                                                <button type="button" class="pointer-events-none">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-paperclip-icon lucide-paperclip"><path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"/></svg>
                                                </button>
                                            </div>
                                            <button id="add-comment-btn" class="px-3 py-1 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600">Comment</button>
                                        </div>
                                    </div>
                                </div>

                                <div id="tab-content-subtask" class="hidden">
                                    <div id="subtask-progress-container" class="mb-3 hidden">
                                        <div class="flex justify-between items-center mb-1">
                                            <span class="text-xs font-medium text-gray-500">Progress</span>
                                            <span id="subtask-progress-text" class="text-xs font-medium text-gray-700">0%</span>
                                        </div>
                                        <div class="w-full bg-gray-200 rounded-full h-1.5">
                                            <div id="subtask-progress-bar" class="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style="width: 0%"></div>
                                        </div>
                                    </div>
                                    <div id="task-subtasks-list" class="flex flex-col gap-2 max-h-80 overflow-y-auto">

                                    </div>
                                    <div class="flex justify-start items-center gap-2 mt-2">
                                        <button id="add-subtask-btn" class="px-2 py-1 w-full text-sm flex items-center justify-start gap-4 text-gray-600 hover:bg-gray-50">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                            Add task
                                        </button>
                                    </div>
                                </div>

                                <div id="tab-content-activity" class="hidden">
                                    <div id="task-activity-list" class="flex flex-col gap-2 mb-2 max-h-60 overflow-y-auto py-2">
                                        <!-- Activity will be loaded here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function createTaskDetailModalRectHtml(task) {
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }) : 'No due date';

    const assigneeAvatar = task.assigneeAvatarUrl
        ? `<img src="${task.assigneeAvatarUrl}" alt="${task.assigneeName}" class="w-6 h-6 rounded-full border object-cover">`
        : `<div class="w-6 h-6 border flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-sm font-semibold">${task.assigneeName ? task.assigneeName.charAt(0).toUpperCase() : '?'}</div>`;

    return `
        <div id="task-detail-modal-backdrop" class="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ease-in-out opacity-0"></div>
        <div id="task-detail-modal-container" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 opacity-0 transition-opacity duration-300">
            <div id="task-detail-modal-content" class="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[80vh] flex flex-col transform opacity-0 scale-95 transition-all duration-300 ease-out">
                <div id="task-detail-modal" data-task-id="${task.taskId}" class="flex flex-col h-full">
                <div class="p-3 border-b flex justify-between items-center flex-shrink-0">
                    <div></div>
                    <div class="flex items-center justify-center gap-2">
                        <div id="task-detail-watcher-btn" tabindex='0' type="button" class="text-xs text-gray-400 hover:text-green-500 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-icon lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                        </div>
                        <div tabindex='0' type="button" id="minimize-task-detail-btn" class="text-sm text-gray-400 hover:text-gray-600 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shrink"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                        </div>
                        <div tabindex='0' type="button" id="edit-task-detail-btn" class="text-sm text-gray-400 hover:text-gray-600 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pen-line-icon lucide-pen-line"><path d="M13 21h8"/><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
                        </div>
                        <div tabindex='0' type="button" id="close-task-detail-modal-btn" class="text-sm text-gray-400 hover:text-red-500 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </div>
                    </div>
                </div>
                <div class="px-6 py-4 h-full flex-grow overflow-y-auto">
                    <div class="flex flex-row h-full gap-3 justify-start">
                        <div class="w-2/3 flex flex-col justify-start gap-2 pr-2 border-r">

                            <div id="rename-title-btn" type="button" class="flex items-center mb-3">
                                <input id="task-detail-title-input" class="text-3xl text-gray-800 w-full outline-none hover:bg-gray-50 focus:bg-white border-none focus:border focus:cursor-text cursor-pointer rounded-md p-1" value="${task.title}">
                            </div>

                            <div class="flex items-center">
                                <div class="w-40 flex items-center gap-2 text-sm text-gray-400 font-normal ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert-icon lucide-circle-alert"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                                    Priority
                                </div>
                                <div id="task-detail-priority-btn" class="p-2 cursor-pointer rounded-md hover:bg-gray-100">${getPriorityChip(task.priority)}</div>
                                <div id="task-detail-priority-dropdown" class="absolute z-10 p-2 w-fit bg-white border rounded-md shadow-lg mt-1 hidden">
                                    <span class="p-1 mb-1 text-sm font-medium text-gray-700">Task Priority</span>
                                    <div class="p-1 priority-option cursor-pointer hover:bg-gray-100" data-priority="1">
                                        ${getPriorityChip(1)}
                                    </div>
                                    <div class="p-1 priority-option cursor-pointer hover:bg-gray-100" data-priority="2">
                                        ${getPriorityChip(2)}
                                    </div>
                                    <div class="p-1 priority-option cursor-pointer hover:bg-gray-100" data-priority="3">
                                        ${getPriorityChip(3)}
                                </div>
                            </div>
                            </div>

                            <div class="flex items-center">
                                <div class="w-40 flex items-center gap-2 text-sm text-gray-400 font-normal ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-icon lucide-calendar"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
                                    Due date
                                </div>
                                <div id="task-detail-calendar-btn" class="p-2 cursor-pointer text-sm text-gray-600 hover:bg-gray-50 rounded-md">${dueDate}</div>
                                <div id="task-detail-calendar-dropdown" class="absolute z-10 w-fit bg-white mt-1 hidden" >
                                    <div id="calendar" class="p-2 bg-white"></div>
                                </div>
                            </div>

                            <div class="flex items-start">
                                <div class="w-40 flex items-center gap-2 text-sm text-gray-400 font-normal mt-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tag-icon lucide-tag"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>
                                    Tags
                                </div>
                                <div class="flex flex-wrap ml-2 gap-2 items-center relative">
                                    <div id="task-tags-container" class="flex flex-wrap gap-2">
                                        <!-- Tags will be rendered here -->
                                    </div>
                                    <button type="button" id="add-tag-btn" class="flex items-center justify-center w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                    </button>
                                    
                                    <!-- Dropdown chọn tag -->
                                    <div id="tag-dropdown" class="absolute top-8 left-0 z-20 w-48 bg-white border rounded-md shadow-lg hidden">
                                        <div class="p-2 border-b">
                                            <input type="text" id="tag-search-input" class="w-full text-xs p-1 outline-none" placeholder="Search tags...">
                                        </div>
                                        <div id="tag-dropdown-list" class="max-h-40 overflow-y-auto p-1 flex flex-col gap-1">
                                            <!-- Available tags will be listed here -->
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="flex items-center">
                                <div class="w-40 flex items-center gap-2 text-sm text-gray-400 font-normal ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users-icon lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>
                                    Assignee
                                </div>
                                <div class="flex items-center gap-5 p-2">
                                    <div id="task-detail-assignee-avt" class="flex gap-2 items-center justify-center">${assigneeAvatar}<span class="text-sm font-medium text-gray-600">${task.assigneeName || ''}</span></div>
                                    <div type="button" tabindex='0' id="change-assignee" class="text-sm px-2 py-1 rounded flex items-center justify-center border-dashed border text-gray-800 cursor-pointer gap-2 hover:bg-gray-50">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-pen-icon lucide-user-pen"><path d="M11.5 15H7a4 4 0 0 0-4 4v2"/><path d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/><circle cx="10" cy="7" r="4"/></svg>
                                        Change
                                    </div>
                                </div>
                                <div id="assignee-detail-dropdown" class="absolute z-10 w-fit border rounded-sm mt-1 hidden">
                                    <div class="border-b py-1 px-2 flex items-center justify-start bg-white sticky top-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-search-icon lucide-user-search"><circle cx="10" cy="7" r="4"/><path d="M10.3 15H7a4 4 0 0 0-4 4v2"/><circle cx="17" cy="17" r="3"/><path d="m21 21-1.9-1.9"/></svg>
                                        <input type="text" id="assignee-search" class="outline-none p-2 w-full text-base text-gray-500" placeholder="Search assignee..." autocomplete="off">
                                    </div>
                                    <div id="assignee-detail-list" class="flex flex-col bg-white items-start justify-start p-1 max-h-48 overflow-y-auto">
                                        <!-- Assignee list will be inserted here -->
                                    </div>
                                </div>
                            </div>

                            <div class="flex items-center">
                                <div class="w-40 flex items-center gap-2 text-sm text-gray-400 font-normal ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users-icon lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>
                                    Watcher
                                </div>
                                <div class="flex items-center gap-5 p-2">
                                    <div id="task-detail-watcher-avt" class="flex items-center -space-x-3 gap-2 justify-center"></div>
                                    <div type="button" tabindex='0' id="edit-watcher" class="text-sm px-2 py-1 rounded flex items-center justify-center border-dashed border text-gray-800 cursor-pointer gap-2 hover:bg-gray-50">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-pen-icon lucide-user-pen"><path d="M11.5 15H7a4 4 0 0 0-4 4v2"/><path d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/><circle cx="10" cy="7" r="4"/></svg>
                                        Change
                                    </div>
                                </div>
                                <div id="watcher-detail-dropdown" class="absolute z-10 w-fit border rounded-sm mt-1 hidden">
                                    <div class="border-b py-1 px-2 flex items-center justify-start bg-white sticky top-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-search-icon lucide-user-search"><circle cx="10" cy="7" r="4"/><path d="M10.3 15H7a4 4 0 0 0-4 4v2"/><circle cx="17" cy="17" r="3"/><path d="m21 21-1.9-1.9"/></svg>
                                        <input type="text" id="watcher-search" class="outline-none p-2 w-full text-base text-gray-500" placeholder="Search watcher..." autocomplete="off">
                                    </div>
                                    <div id="watcher-detail-list" class="flex flex-col bg-white items-start justify-start p-1 max-h-48 overflow-y-auto">
                                        <!-- Watcher list will be inserted here -->
                                    </div>
                                </div>
                            </div>

                            <div class="flex items-center">
                                <div class="w-40 flex items-center gap-2 text-sm text-gray-400 font-normal ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text-icon lucide-file-text"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                                    Description
                                </div>
                                
                            </div>
                            <textarea id="task-description" class="w-full p-2 border rounded-md outline-none text-sm bg-gray-50 text-gray-600 min-h-[70px]">${task.description || ''}</textarea>

                            <div class="flex flex-col gap-2">
                                <div class="flex justify-between">
                                    <div class="w-40 flex items-center gap-2 text-sm text-gray-400 font-normal">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-paperclip-icon lucide-paperclip"><path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"/></svg>
                                        Attachments
                                    </div>
                                </div>
                                <div class="flex flex-wrap items-center justify-start gap-2">
                                    <div id="task-attachments-list" class="flex flex-wrap items-center justify-start gap-2">
                                        <!-- Attachments will be rendered here -->
                                    </div>
                                    <div class="flex items-center justify-center p-2 border border-dashed rounded-lg hover:bg-gray-50 cursor-pointer text-gray-600" onclick="document.getElementById('task-upload-file').click()">
                                        <input type="file" id="task-upload-file" accept="*" class="hidden" />
                                        <button type="button" class="pointer-events-none">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="flex flex-col gap-2">
                                <div class="flex justify-between">
                                    <div class="w-40 flex items-center gap-2 text-sm text-gray-400 font-normal">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-checks-icon lucide-list-checks"><path d="M13 5h8"/><path d="M13 12h8"/><path d="M13 19h8"/><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/></svg>
                                        Subtasks
                                    </div>
                                </div>
                                <div id="subtask-progress-container" class="mb-3 hidden">
                                    <div class="flex justify-between items-center mb-1">
                                        <span class="text-xs font-medium text-gray-500">Progress</span>
                                        <span id="subtask-progress-text" class="text-xs font-medium text-gray-700">0%</span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-1.5">
                                        <div id="subtask-progress-bar" class="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style="width: 0%"></div>
                                    </div>
                                </div>
                                <div id="task-subtasks-list" class="flex flex-col gap-2 max-h-80 overflow-y-auto">

                                </div>
                                <div class="flex justify-start items-center gap-2 mt-2">
                                    <button id="add-subtask-btn" class="px-2 py-1 w-full text-sm flex items-center justify-start gap-4 text-gray-600 hover:bg-gray-50">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                            Add task
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="w-1/3 flex flex-col gap-3">
                            <div id="tab-content-comment" class="flex flex-col justify-between">
                                <span class="mb-2 flex items-center justify-start gap-2 text-xl text-gray-700 font-bold"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square-icon lucide-message-square"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/></svg>Comments</span>
                                <div id="task-comments-list" class="flex flex-col gap-2 mb-2 max-h-80 overflow-y-auto py-2">
                                    <!-- Comments will be loaded here -->
                                </div>
                                <div class="flex flex-col border rounded-md p-3">
                                    <div id="new-comment-content" contenteditable="true" class="w-full text-sm text-gray-800 outline-none rounded-md p-2 min-h-[40px] empty:before:content-[attr(placeholder)] empty:before:text-gray-400" placeholder="Add a comment..."></div>
                                    <div id="attachment-comment-review" class="flex flex-wrap items-center justify-start gap-2">

                                    </div>
                                    <div class="flex justify-end mt-2 gap-2">
                                        <div class="flex items-center justify-center p-1 rounded-md cursor-pointer border hover:bg-gray-50" onclick="document.getElementById('comment-upload-file').click()">
                                            <input type="file" id="comment-upload-file" accept="*" multiple class="hidden" />
                                            <button type="button" class="pointer-events-none">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-paperclip-icon lucide-paperclip"><path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"/></svg>
                                            </button>
                                        </div>
                                        <button id="add-comment-btn" class="px-3 py-1 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600">Comment</button>
                                    </div>
                                </div>
                            </div>

                                <div id="tab-content-activity" class="flex">
                                    <div id="task-activity-list" class="flex flex-col gap-2 mb-2 max-h-52 overflow-y-auto py-2">
                                        <!-- Activity will be loaded here -->
                                    </div>
                                </div>
                            </div>
                    </div>
                </div>
                </div>
            </div>
            </div>
        </div>
    `;
}

export function closeAllPortals() {
    const ids = ['assignee-dropdown-portal', 'calendar-dropdown-portal', 'priority-dropdown-portal'];
    ids.forEach(id => {
        const portal = document.getElementById(id);
        if (portal) {
            if (portal._picker && typeof portal._picker.destroy === 'function') {
                portal._picker.destroy();
            }
            portal.remove();
        }
    });
}

export function toggleDropdown(triggerBtn, dropdownContent, portalId, setupCallback, position = 'right') {
    const existing = document.getElementById(portalId);

    // Helper function for closing with animation
    const closeWithAnimation = (element) => {
        element.classList.remove('scale-100', 'opacity-100');
        element.classList.add('scale-95', 'opacity-0');

        const onTransitionEnd = () => {
            if (element.parentNode) {
                element.remove();
            }
        };

        element.addEventListener('transitionend', onTransitionEnd, { once: true });
        // Fallback for safety
        setTimeout(onTransitionEnd, 200);
    };

    closeAllPortals();

    if (existing) {
        closeWithAnimation(existing);
        return;
    }

    const portal = dropdownContent.cloneNode(true);
    portal.id = portalId;
    portal.classList.remove('hidden');
    // Add animation classes
    portal.classList.add('z-50', 'fixed', 'transition-all', 'duration-200', 'ease-out', 'transform', 'origin-top-left', 'scale-95', 'opacity-0');

    document.body.appendChild(portal);

    const rect = triggerBtn.getBoundingClientRect();

    // Use fixed positioning relative to viewport (no scrollY/scrollX)
    if (position === 'top') {
        // Position above the button
        // Use bottom property so it grows upwards if height changes
        portal.style.bottom = `${window.innerHeight - rect.top + 4}px`;
        portal.style.top = 'auto';
        portal.style.left = `${rect.left}px`;

        // Change transform origin for better animation
        portal.classList.remove('origin-top-left');
        portal.classList.add('origin-bottom-left');
    } else if (position === 'bottom') {
        // Position below the button
        portal.style.top = `${rect.bottom + 4}px`;
        portal.style.bottom = 'auto';
        portal.style.left = `${rect.left}px`;
    } else {
        // Default 'right'
        portal.style.top = `${rect.top}px`;
        portal.style.left = `${rect.right + 4}px`;
    }

    portal.style.minWidth = `${rect.width}px`;

    // Trigger open animation
    requestAnimationFrame(() => {
        portal.classList.remove('scale-95', 'opacity-0');
        portal.classList.add('scale-100', 'opacity-100');
    });

    const closePortal = (ev) => {
        if (!portal.contains(ev.target) && ev.target !== triggerBtn && !triggerBtn.contains(ev.target)) {
            if (portal._picker && typeof portal._picker.destroy === 'function') {
                portal._picker.destroy();
            }
            document.removeEventListener('click', closePortal);
            closeWithAnimation(portal);
        }
    };
    document.addEventListener('click', closePortal);

    const explicitClose = () => {
        if (portal._picker && typeof portal._picker.destroy === 'function') {
            portal._picker.destroy();
        }
        document.removeEventListener('click', closePortal);
        closeWithAnimation(portal);
    };

    if (setupCallback) {
        setupCallback(portal, explicitClose);
    }
}

export function createTaskRowHtml(task) {
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }) : '';
    const assigneeName = task.assigneeName || (task.assignee ? task.assignee.name : '');
    const assigneeAvatarUrl = task.assigneeAvatarUrl || (task.assignee ? task.assignee.avatarUrl : '');

    const assigneeInitial = assigneeName ? assigneeName.charAt(0).toUpperCase() : '?';
    const assigneeAvatar = assigneeAvatarUrl
        ? `<img src="${assigneeAvatarUrl}" alt="${assigneeName}" class="w-6 h-6 rounded-full border object-cover">`
        : `<div class="w-6 h-6 border flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-semibold">${assigneeInitial}</div>`;

    return `
        <div class="group flex items-center p-3 bg-white border-b hover:bg-gray-50 transition-colors" draggable="true" data-task-id="${task.taskId}">
            <div class="flex items-center gap-4 w-[40%] min-w-[300px]">
                <div class="flex-shrink-0 cursor-pointer task-detail-btn hover:text-blue-600">
                    <span class="font-medium text-gray-800 truncate block">${task.title}</span>
                </div>
                <div class="relative">
                    <div type="button" class="task-dropdown-btn p-1 rounded-md hover:bg-gray-200 cursor-pointer text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ellipsis"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                    </div>
                    <div class="task-dropdown-menu hidden absolute right-0 top-8 z-10 w-48 bg-white border rounded-md shadow-lg py-2 px-1">
                        <div class="flex flex-col gap-1">
                            <div type="button" class="w-full flex items-center justify-start gap-1 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer rounded-md">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star-icon lucide-star"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>
                                Add to favourite
                            </div>
                            <div type="button" class="w-full flex items-center justify-start gap-1 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer rounded-md">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alarm-clock-icon lucide-alarm-clock"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/></svg>
                                Remind me
                            </div>
                            <div type="button" class="w-full flex items-center justify-start gap-1 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer rounded-md">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left-right-icon lucide-arrow-left-right"><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg>
                                Move to
                            </div>
                            <div type="button" class="w-full flex items-center justify-start gap-1 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer rounded-md">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link-icon lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                                Copy link
                            </div>
                            <div class="border-t border-gray-200"></div>
                            <div type="button" class="delete-task-btn w-full flex items-center justify-start gap-1 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer rounded-md hover:text-red-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-icon lucide-trash"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                Delete
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="flex items-center gap-6 flex-shrink-0">
                <div class="w-32 flex justify-start">
                    ${getPriorityChip(task.priority)}
                </div>
                
                <div class="w-32 flex items-center gap-2 text-sm text-gray-600">
                     ${assigneeAvatar}
                     <span class="truncate max-w-[100px]">${assigneeName || 'Unassigned'}</span>
                </div>

                <div class="w-32 text-sm text-gray-500 text-right">
                    ${dueDate}
                </div>

                <div class="text-sm text-gray-500 text-right">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square-more-icon lucide-message-square-more"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/><path d="M12 11h.01"/><path d="M16 11h.01"/><path d="M8 11h.01"/></svg>
                </div>

                <div class="text-sm text-gray-500 text-right">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-paperclip-icon lucide-paperclip"><path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"/></svg>
                </div>
            </div>
        </div>
    `;
}

export function createSubtaskDetailModalHtml(subtask) {
    const dueDate = subtask.dueDate ? new Date(subtask.dueDate).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }) : 'No due date';

    const assigneeAvatar = subtask.assignee
        ? `<img src="${subtask.assignee.avatarUrl}" alt="${subtask.assignee.name}" class="w-6 h-6 rounded-full border object-cover">`
        : `<div class="w-6 h-6 border flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-sm font-semibold">${subtask.assignee ? subtask.assignee.name.charAt(0).toUpperCase() : '?'}</div>`;

    return `
        <div id="subtask-detail-modal-backdrop" class="fixed inset-0 bg-black bg-opacity-50 z-[60] transition-opacity duration-300 ease-in-out opacity-0"></div>
        <div id="subtask-detail-modal" data-subtask-id="${subtask.subtaskId}" class="fixed top-4 right-2 h-[95vh] w-[700px] max-w-3xl rounded-lg bg-white shadow-2xl z-[70] transform translate-x-full transition-transform duration-300 ease-in-out">
            <div class="flex flex-col h-full">
                <div class="p-3 border-b flex justify-between items-center flex-shrink-0">
                    <div class="text-xs text-gray-500 flex items-center gap-1">
                        <span class="bg-gray-100 rounded px-1">Subtask</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        <span class="truncate max-w-[200px]">${subtask.task ? subtask.task.title : 'Parent Task'}</span>
                    </div>
                    <div class="flex items-center justify-center gap-2">
                        <div tabindex='0' type="button" id="close-subtask-detail-modal-btn" class="text-sm text-gray-400 hover:text-red-500 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </div>
                    </div>
                </div>
                <div class="px-6 py-4 flex-grow overflow-y-auto">
                    <div class="flex flex-col gap-3 justify-start">
                        <div class="flex flex-col justify-start gap-2">

                            <div id="subtask-rename-title-btn" type="button" class="flex items-center mb-3">
                                <input id="subtask-detail-title-input" class="text-2xl text-gray-800 w-full outline-none hover:bg-gray-50 focus:bg-white border-none focus:border focus:cursor-text cursor-pointer rounded-md p-1" value="${subtask.title}">
                            </div>

                            <div class="flex items-center">
                                <div class="w-40 flex items-center gap-2 text-sm text-gray-400 font-normal ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert-icon lucide-circle-alert"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                                    Priority
                                </div>
                                <div id="subtask-detail-priority-btn" class="p-2 cursor-pointer rounded-md hover:bg-gray-100">${getPriorityChip(subtask.priority)}</div>
                                <div id="subtask-detail-priority-dropdown" class="absolute z-10 p-2 w-fit bg-white border rounded-md shadow-lg mt-1 hidden">
                                    <span class="p-1 mb-1 text-sm font-medium text-gray-700">Subtask Priority</span>
                                    <div class="p-1 priority-option cursor-pointer hover:bg-gray-100" data-priority="1">${getPriorityChip(1)}</div>
                                    <div class="p-1 priority-option cursor-pointer hover:bg-gray-100" data-priority="2">${getPriorityChip(2)}</div>
                                    <div class="p-1 priority-option cursor-pointer hover:bg-gray-100" data-priority="3">${getPriorityChip(3)}</div>
                                </div>
                            </div>

                            <div class="flex items-center">
                                <div class="w-40 flex items-center gap-2 text-sm text-gray-400 font-normal ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-icon lucide-calendar"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
                                    Due date
                                </div>
                                <div id="subtask-detail-calendar-btn" class="p-2 cursor-pointer text-sm text-gray-600 hover:bg-gray-50 rounded-md">${dueDate}</div>
                                <div id="subtask-detail-calendar-dropdown" class="absolute z-10 w-fit bg-white mt-1 hidden" >
                                    <div id="subtask-calendar" class="p-2 bg-white"></div>
                                </div>
                            </div>

                            <div class="flex items-center">
                                <div class="w-40 flex items-center gap-2 text-sm text-gray-400 font-normal ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users-icon lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>
                                    Assignee
                                </div>
                                <div class="flex items-center gap-5 p-2">
                                    <div id="subtask-detail-assignee-avt" class="flex gap-2 items-center justify-center">${assigneeAvatar}<span class="text-sm font-medium text-gray-600">${subtask.assignee ? subtask.assignee.name : ''}</span></div>
                                    <div type="button" tabindex='0' id="change-subtask-assignee" class="text-sm px-2 py-1 rounded flex items-center justify-center border-dashed border text-gray-800 cursor-pointer gap-2 hover:bg-gray-50">
                                        Change
                                    </div>
                                </div>
                                <div id="subtask-assignee-detail-dropdown" class="absolute z-10 w-fit border rounded-sm mt-1 hidden">
                                    <div class="border-b py-1 px-2 flex items-center justify-start bg-white sticky top-0">
                                        <input type="text" id="subtask-assignee-search" class="outline-none p-2 w-full text-base text-gray-500" placeholder="Search assignee..." autocomplete="off">
                                    </div>
                                    <div id="subtask-assignee-detail-list" class="flex flex-col bg-white items-start justify-start p-1 max-h-48 overflow-y-auto"></div>
                                </div>
                            </div>

                            <div class="flex items-center">
                                <div class="w-40 flex items-center gap-2 text-sm text-gray-400 font-normal ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text-icon lucide-file-text"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                                    Description
                                </div>
                            </div>
                            <textarea id="subtask-description" class="w-full p-2 border rounded-md outline-none text-sm bg-gray-50 text-gray-600 min-h-[70px]">${subtask.description || ''}</textarea>

                            <div class="flex flex-col gap-2">
                                <div class="flex justify-between">
                                    <div class="w-40 flex items-center gap-2 text-sm text-gray-400 font-normal">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-paperclip-icon lucide-paperclip"><path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"/></svg>
                                        Attachments
                                    </div>
                                </div>
                                <div class="flex flex-wrap items-center justify-start gap-2">
                                    <div id="subtask-attachments-list" class="flex flex-wrap items-center justify-start gap-2">
                                        <!-- Attachments -->
                                    </div>
                                    <div class="flex items-center justify-center p-2 border border-dashed rounded-lg hover:bg-gray-50 cursor-pointer text-gray-600" onclick="document.getElementById('subtask-upload-file').click()">
                                        <input type="file" id="subtask-upload-file" accept="*" class="hidden" />
                                        <button type="button" class="pointer-events-none">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div class="flex flex-col gap-3">
                                <div class="flex items-center gap-4 border-b mb-2">
                                    <button id="tab-subtask-comment-btn" class="px-3 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600 focus:outline-none">Comments</button>
                                    <button id="tab-subtask-activity-btn" class="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none">Activity</button>
                                </div>

                                <div id="tab-content-subtask-comment" class="block">
                                    <div id="subtask-comments-list" class="flex flex-col gap-2 mb-2 max-h-60 overflow-y-auto py-2">
                                        <!-- Comments -->
                                    </div>
                                    <div class="flex flex-col border rounded-md p-3">
                                        <div id="new-subtask-comment-content" contenteditable="true" class="w-full text-sm text-gray-800 outline-none rounded-md p-2 min-h-[40px] empty:before:content-[attr(placeholder)] empty:before:text-gray-400" placeholder="Add a comment..."></div>
                                        <div class="flex justify-end mt-2 gap-2">
                                            <button id="add-subtask-comment-btn" class="px-3 py-1 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600">Comment</button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div id="tab-content-subtask-activity" class="hidden">
                                     <div id="subtask-activity-list" class="flex flex-col gap-2 mb-2 max-h-60 overflow-y-auto py-2">
                                         <!-- Activity will be loaded here -->
                                     </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
