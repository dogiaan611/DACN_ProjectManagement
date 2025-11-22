
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

export function createTaskCardHtml(task) {
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }) : '';
    const assigneeInitial = task.assigneeName ? task.assigneeName.charAt(0).toUpperCase() : '?';
    const assigneeAvatar = task.assigneeAvatarUrl
        ? `<img src="${task.assigneeAvatarUrl}" alt="${task.assigneeName}" class="w-5 h-5 rounded-full border object-cover">`
        : `<div class="w-5 h-5 border flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-semibold">${assigneeInitial}</div>`;
    return `
        <div class="bg-white p-4 rounded-md border cursor-pointer group" draggable="true" data-task-id="${task.taskId}">
            <div class="mb-2 flex items-center justify-between">
                ${getPriorityChip(task.priority)}
                <div class="flex items-center justify-center px-1 group-hover:opacity-100 opacity-0 transition-opacity duration-200">
                    <div type="button" id="task-detail-btn" class="border rounded-l-md hover:bg-gray-50 flex items-center justify-center p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pen-line-icon lucide-pen-line"><path d="M13 21h8"/><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
                    </div>
                    <div type="button" class="rounded-r-md border-y border-r hover:bg-gray-50 flex items-center justify-center p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ellipsis-icon lucide-ellipsis"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
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
                    <div type="button" class="flex items-center justify-center p-1 border rounded-md hover:bg-gray-50 text-xs text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-messages-square-icon lucide-messages-square"><path d="M16 10a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 14.286V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/><path d="M20 9a2 2 0 0 1 2 2v10.286a.71.71 0 0 1-1.212.502l-2.202-2.202A2 2 0 0 0 17.172 19H10a2 2 0 0 1-2-2v-1"/></svg>    
                    </div>
                    <div type="button" class="flex items-center justify-center p-1 border rounded-md hover:bg-gray-50 text-xs text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-paperclip-icon lucide-paperclip"><path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"/></svg>
                    </div>
                </div>
            </div>
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

export function createTaskDetailModalHtml(task) {
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }) : 'No due date';

    const assigneeAvatar = task.assigneeAvatarUrl
        ? `<img src="${task.assigneeAvatarUrl}" alt="${task.assigneeName}" class="w-7 h-7 rounded-full border object-cover">`
        : `<div class="w-7 h-7 border flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-sm font-semibold">${task.assigneeName ? task.assigneeName.charAt(0).toUpperCase() : '?'}</div>`;

    return `
        <div id="task-detail-modal-backdrop" class="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ease-in-out opacity-0"></div>
        <div id="task-detail-modal" data-task-id="${task.taskId}" class="fixed top-4 right-2 h-[95vh] w-[600px] max-w-3xl rounded-lg bg-white shadow-2xl z-50 transform translate-x-full transition-transform duration-300 ease-in-out">
            <div class="flex flex-col overflow-y-auto h-full">
                <div class="p-3 border-b flex justify-between items-center flex-shrink-0">
                    <div></div>
                    <div class="flex items-center justify-center gap-2">
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
                                <div id="task-detail-calendar-btn" class="p-2 cursor-pointer text-sm text-gray-600">${dueDate}</div>
                                <div id="task-detail-calendar-dropdown" class="absolute z-10 p-2 w-fit bg-white mt-1 hidden" >
                                    <div id="calendar" class="p-2 bg-white"></div>
                                </div>
                            </div>

                            <div class="flex items-center">
                                <div class="w-40 flex items-center gap-2 text-sm text-gray-400 font-normal ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tag-icon lucide-tag"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>
                                    Tags
                                </div>
                                
                            </div>

                            <div class="flex items-center">
                                <div class="w-40 flex items-center gap-2 text-sm text-gray-400 font-normal ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users-icon lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>
                                    Assignee
                                </div>
                                <div class="flex items-center gap-5 p-2">
                                    <div id="task-detail-assignee-avt">${assigneeAvatar}</div>
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
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text-icon lucide-file-text"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                                    Description
                                </div>
                                
                            </div>
                            <textarea id="task-description" class="w-full p-2 border rounded-md outline-none text-sm text-gray-700 min-h-[70px]">${task.description || ''}</textarea>

                            <div class="flex flex-col">
                                <div class="flex justify-between">
                                    <div class="w-40 flex items-center gap-2 text-sm text-gray-400 font-normal">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-paperclip-icon lucide-paperclip"><path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"/></svg>
                                        Attachments
                                    </div>
                                    <div type="button" id="download-attachment" class="flex gap-1 items-center justify-center text-blue-400 hover:text-blue-500 cursor-pointer text-base">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download-icon lucide-download"><path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/></svg>
                                        Download all
                                    </div>
                                </div>
                                
                            </div>

                            <div class="flex flex-col gap-3">
                                <div class="w-40 flex items-center gap-2 text-sm text-gray-400 font-normal ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square-dot-icon lucide-message-square-dot"><path d="M12.7 3H4a2 2 0 0 0-2 2v16.286a.71.71 0 0 0 1.212.502l2.202-2.202A2 2 0 0 1 6.828 19H20a2 2 0 0 0 2-2v-4.7"/><circle cx="19" cy="6" r="3"/></svg>
                                    Comment
                                </div>
                                <div class="flex flex-col border rounded-md p-3">
                                    <textarea class="w-full text-sm text-gray-800 outline-none rounded-md" placeholder="Add a comment..."></textarea>
                                    <div class="flex justify-end mt-2">
                                        <button class="px-3 py-1 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600">Comment</button>
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

export function toggleDropdown(triggerBtn, dropdownContent, portalId, setupCallback) {
    const existing = document.getElementById(portalId);
    const wasOpen = !!existing;

    closeAllPortals();

    if (wasOpen) return;

    const portal = dropdownContent.cloneNode(true);
    portal.id = portalId;
    portal.classList.remove('hidden');
    portal.classList.add('z-50');
    portal.style.position = 'fixed';

    const rect = triggerBtn.getBoundingClientRect();
    portal.style.top = `${rect.top + window.scrollY}px`;
    portal.style.left = `${rect.right + window.scrollX + 4}px`;
    portal.style.minWidth = `${rect.width}px`;

    document.body.appendChild(portal);

    const closePortal = (ev) => {
        if (!portal.contains(ev.target) && ev.target !== triggerBtn && !triggerBtn.contains(ev.target)) {
            if (portal._picker && typeof portal._picker.destroy === 'function') {
                portal._picker.destroy();
            }
            portal.remove();
            document.removeEventListener('click', closePortal);
        }
    };
    document.addEventListener('click', closePortal);

    const explicitClose = () => {
        if (portal._picker && typeof portal._picker.destroy === 'function') {
            portal._picker.destroy();
        }
        portal.remove();
        document.removeEventListener('click', closePortal);
    };

    if (setupCallback) {
        setupCallback(portal, explicitClose);
    }
}
