import { authFetch } from '../auth/auth.js';
import { toggleDropdown, createTaskScrumHtml } from '../task/taskUI.js';
import { openTaskDetailModal } from '../task/taskDetail.js';
import { getDragAfterElement } from './drag-drop.js';

let currentProjectId = null;
let defaultBoardId = null;
let defaultColumnId = null;
let selectedTaskIds = new Set();
let lastSelectedTaskId = null;

export async function initProjectBacklog() {
    const urlParams = new URLSearchParams(window.location.search);
    currentProjectId = urlParams.get('id');

    if (!currentProjectId) {
        console.error("Project ID not found");
        return;
    }

    const container = document.getElementById('project-content');
    container.innerHTML = `
        <div class="flex flex-col gap-10 h-full">
            <div id="sprints-container" class="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 rounded-lg ">
                <div class="flex justify-between items-center mb-2">
                     <h2 class="text-lg font-bold text-gray-800">Sprints</h2>
                     <button id="create-sprint-btn" class="px-3 py-1.5 bg-black text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        Create Sprint
                     </button>
                </div>
                <!-- Sprints will be loaded here -->
                <div id="sprints-list" class="space-y-6">
                    <div class="text-center text-gray-500 mt-10">Loading Sprints...</div>
                </div>
            </div>
            <div id="product-backlog-container" class="h-[40%] border bg-gray-50 rounded-lg p-4 overflow-y-auto flex flex-col">
                <div class="flex justify-between items-center mb-4 sticky top-0 bg-gray-50 z-10 py-2">
                    <h2 class="text-lg font-bold text-gray-800">Product Backlog</h2>
                    <div class="text-sm text-gray-500" id="backlog-stats">0 tasks</div>
                </div>
                <div id="backlog-tasks" class="space-y-2 flex-1">
                    <!-- Backlog tasks will be loaded here -->
                    <div class="text-center text-gray-500">Loading Backlog...</div>
                </div>
                <div id="create-backlog-task-container" class="mt-4">
                    <button id="create-backlog-task-btn" class="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-black hover:text-black transition-colors">
                        + Create Task in Backlog
                    </button>
                </div>
            </div>
        </div>

        <!-- Drag Ghost Image -->
        <img id="drag-ghost" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" class="hidden">

        <!-- Create Sprint Modal -->
        <div id="create-sprint-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 opacity-0">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden transform transition-all duration-300 scale-95 opacity-0">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-5">
                        <div class="flex flex-col">
                            <h3 class="text-2xl font-medium text-gray-900">Create Sprint</h3>
                            <p class="mt-1 text-sm text-gray-600">Plan your next iteration of work.</p>
                        </div>
                        <button id="close-sprint-modal-btn" class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                    </div>

                    <form id="create-sprint-form" class="space-y-5">
                        <div>
                            <label for="sprint-name" class="block text-sm font-medium text-gray-700 mb-1">Sprint Name <span class="text-red-500">*</span></label>
                            <input type="text" id="sprint-name" name="name" required class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" placeholder="e.g. Sprint 1">
                        </div>
                        <div>
                            <label for="sprint-goal" class="block text-sm font-medium text-gray-700 mb-1">Sprint Goal</label>
                            <textarea id="sprint-goal" name="goal" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" placeholder="What is the goal of this sprint?"></textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="relative">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <div id="sprint-start-date-btn" class="w-full px-3 py-2 border border-gray-300 rounded-xl cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors focus-within:border-black focus-within:ring-1 focus-within:ring-black">
                                    <span class="text-gray-500 text-sm" id="sprint-start-date-text">Select date</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar text-gray-400"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                                </div>
                                <input type="hidden" name="startDate" id="sprint-start-date-input">
                                <div id="sprint-start-date-dropdown" class="absolute z-50 mt-1 hidden bg-white shadow-lg rounded-xl border overflow-hidden">
                                    <div id="sprint-start-calendar-container"></div>
                                </div>
                            </div>
                            <div class="relative">
                                <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <div id="sprint-end-date-btn" class="w-full px-3 py-2 border border-gray-300 rounded-xl cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors focus-within:border-black focus-within:ring-1 focus-within:ring-black">
                                    <span class="text-gray-500 text-sm" id="sprint-end-date-text">Select date</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar text-gray-400"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                                </div>
                                <input type="hidden" name="endDate" id="sprint-end-date-input">
                                <div id="sprint-end-date-dropdown" class="absolute z-50 mt-1 hidden bg-white shadow-lg rounded-xl border overflow-hidden">
                                    <div id="sprint-end-calendar-container"></div>
                                </div>
                            </div>
                        </div>
                        <div class="flex justify-end gap-3 pt-2">
                            <button type="button" id="cancel-sprint-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-black transition-colors">Cancel</button>
                            <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-black transition-colors shadow-sm">Create Sprint</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <!-- Start Sprint Modal -->
        <div id="start-sprint-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 opacity-0">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden transform transition-all duration-300 scale-95 opacity-0">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-5">
                         <div class="flex flex-col">
                            <h3 class="text-2xl font-medium text-gray-900">Start Sprint</h3>
                            <p class="mt-1 text-sm text-gray-600">Launch your sprint to start tracking progress.</p>
                        </div>
                        <button id="close-start-sprint-modal-btn" class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                    </div>
                    <form id="start-sprint-form" class="space-y-5">
                        <input type="hidden" id="start-sprint-id" name="sprintId">
                        <div>
                             <label for="start-sprint-name" class="block text-sm font-medium text-gray-700 mb-1">Sprint Name <span class="text-red-500">*</span></label>
                             <input type="text" id="start-sprint-name" name="name" required class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all">
                        </div>
                        <div>
                            <label for="start-sprint-goal" class="block text-sm font-medium text-gray-700 mb-1">Sprint Goal</label>
                            <textarea id="start-sprint-goal" name="goal" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"></textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                             <div class="relative">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <div id="start-sprint-start-date-btn" class="w-full px-3 py-2 border border-gray-300 rounded-xl cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors focus-within:border-black focus-within:ring-1 focus-within:ring-black">
                                     <span class="text-gray-500 text-sm" id="start-sprint-start-date-text">Select date</span>
                                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar text-gray-400"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                                </div>
                                <input type="hidden" name="startDate" id="start-sprint-start-date-input">
                                <div id="start-sprint-start-date-dropdown" class="absolute z-50 mt-1 hidden bg-white shadow-lg rounded-xl border overflow-hidden">
                                    <div id="start-sprint-start-calendar-container"></div>
                                </div>
                             </div>
                             <div class="relative">
                                <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <div id="start-sprint-end-date-btn" class="w-full px-3 py-2 border border-gray-300 rounded-xl cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors focus-within:border-black focus-within:ring-1 focus-within:ring-black">
                                    <span class="text-gray-500 text-sm" id="start-sprint-end-date-text">Select date</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar text-gray-400"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                                </div>
                                <input type="hidden" name="endDate" id="start-sprint-end-date-input">
                                <div id="start-sprint-end-date-dropdown" class="absolute z-50 mt-1 hidden bg-white shadow-lg rounded-xl border overflow-hidden">
                                     <div id="start-sprint-end-calendar-container"></div>
                                </div>
                             </div>
                        </div>
                        <div class="flex justify-end gap-3 pt-2">
                             <button type="button" id="cancel-start-sprint-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-black transition-colors">Cancel</button>
                             <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-black transition-colors shadow-sm">Start Sprint</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <!-- Complete Sprint Modal -->
        <div id="complete-sprint-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 opacity-0">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden transform transition-all duration-300 scale-95 opacity-0">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-5">
                        <div class="flex flex-col">
                            <h3 class="text-2xl font-medium text-gray-900">Complete Sprint</h3>
                            <p class="mt-1 text-sm text-gray-600">Review your sprint progress and move incomplete items.</p>
                        </div>
                        <button id="close-complete-sprint-modal-btn" class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                    </div>
                    <form id="complete-sprint-form" class="space-y-5">
                        <input type="hidden" id="complete-sprint-id" name="sprintId">
                        
                        <!-- Statistics -->
                        <div class="flex gap-4">
                            <div class="flex-1 bg-green-50 p-4 rounded-xl border border-green-100 text-center">
                                <div class="text-3xl font-bold text-green-600" id="complete-sprint-completed-count">0</div>
                                <div class="text-xs text-green-800 font-medium uppercase tracking-wide mt-1">Completed Tasks</div>
                            </div>
                            <div class="flex-1 bg-orange-50 p-4 rounded-xl border border-orange-100 text-center">
                                <div class="text-3xl font-bold text-orange-600" id="complete-sprint-incomplete-count">0</div>
                                <div class="text-xs text-orange-800 font-medium uppercase tracking-wide mt-1">Incomplete Tasks</div>
                            </div>
                        </div>

                        <div id="incomplete-tasks-action-container">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Move incomplete tasks to:</label>
                            <div class="relative">
                                <select name="action" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black appearance-none bg-white transition-all">
                                    <option value="moveToNextSprint">New Sprint (Next Planning Sprint)</option>
                                    <option value="moveToBacklog">Product Backlog</option>
                                </select>
                                <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                            <p class="text-xs text-gray-500 mt-2">
                                Tasks currently in "Done" columns will be considered completed. All other tasks will be moved based on your selection.
                            </p>
                        </div>

                        <div class="flex justify-end gap-3 pt-2">
                            <button type="button" id="cancel-complete-sprint-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-black transition-colors">Cancel</button>
                            <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-black transition-colors">Complete Sprint</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    <!-- Confirmation Modal -->
    <div id="confirmation-modal" class="fixed inset-0 z-[60] hidden items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 opacity-0">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden transform transition-all duration-300 scale-95 opacity-0">
            <div class="p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-2" id="confirmation-title">Confirm Action</h3>
                <p class="text-sm text-gray-500 mb-6" id="confirmation-message">Are you sure you want to proceed?</p>
                <div class="flex justify-end gap-3">
                    <button id="confirmation-cancel-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                    <button id="confirmation-confirm-btn" class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 shadow-sm">Confirm</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Edit Sprint Modal -->
    <div id="edit-sprint-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 opacity-0">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden transform transition-all duration-300 scale-95 opacity-0">
            <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 class="text-lg font-semibold text-gray-800">Edit Sprint</h3>
                <button id="close-edit-sprint-modal-btn" class="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
            </div>
            <form id="edit-sprint-form" class="p-6 space-y-4">
                <input type="hidden" id="edit-sprint-id" name="sprintId">
                <div>
                    <label for="edit-sprint-name" class="block text-sm font-medium text-gray-700 mb-1">Sprint Name <span class="text-red-500">*</span></label>
                    <input type="text" id="edit-sprint-name" name="name" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow">
                </div>
                <div>
                    <label for="edit-sprint-goal" class="block text-sm font-medium text-gray-700 mb-1">Sprint Goal</label>
                    <textarea id="edit-sprint-goal" name="goal" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"></textarea>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="relative">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <div id="edit-sprint-start-date-btn" class="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <span class="text-gray-500 text-sm" id="edit-sprint-start-date-text">Select date</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar text-gray-400"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                        </div>
                        <input type="hidden" name="startDate" id="edit-sprint-start-date-input">
                        <div id="edit-sprint-start-date-dropdown" class="absolute z-50 mt-1 hidden bg-white shadow-lg rounded-md border">
                            <div id="edit-sprint-start-calendar-container"></div>
                        </div>
                    </div>
                    <div class="relative">
                        <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <div id="edit-sprint-end-date-btn" class="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <span class="text-gray-500 text-sm" id="edit-sprint-end-date-text">Select date</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar text-gray-400"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                        </div>
                        <input type="hidden" name="endDate" id="edit-sprint-end-date-input">
                        <div id="edit-sprint-end-date-dropdown" class="absolute z-50 mt-1 hidden bg-white shadow-lg rounded-md border">
                            <div id="edit-sprint-end-calendar-container"></div>
                        </div>
                    </div>
                </div>
                <div class="flex justify-end gap-3 pt-2">
                    <button type="button" id="cancel-edit-sprint-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">Cancel</button>
                    <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm">Save Changes</button>
                </div>
            </form>
        </div>
    </div>
    </div>

    <!-- Sprint Limit Modal -->
    <div id="sprint-limit-modal" class="fixed inset-0 z-[60] hidden items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 opacity-0">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 overflow-hidden transform transition-all duration-300 scale-95 opacity-0">
            <div class="p-6">
                <div class="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-600 lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                </div>
                <h3 class="text-lg font-semibold text-center text-gray-900 mb-2">Active Sprint Limit Reached</h3>
                <p class="text-sm text-center text-gray-500 mb-6">Only one sprint can be active at a time. Please complete the current active sprint before starting a new one.</p>
                <div class="flex justify-center">
                    <button id="close-sprint-limit-modal-btn" class="px-4 py-2 text-sm font-medium text-white bg-black rounded-md shadow-sm">Okay, I understand</button>
                </div>
            </div>
        </div>
    </div>
    `;

    // Event Listeners for Create Sprint Modal
    const createSprintBtn = document.getElementById('create-sprint-btn');
    const modal = document.getElementById('create-sprint-modal');
    const closeBtn = document.getElementById('close-sprint-modal-btn');
    const cancelBtn = document.getElementById('cancel-sprint-btn');
    const form = document.getElementById('create-sprint-form');

    // Helper for Modal Animation
    const animateModal = (modalEl, show, onHidden) => {
        const content = modalEl.firstElementChild;
        if (show) {
            modalEl.classList.remove('hidden');
            modalEl.classList.add('flex');
            // Small delay to ensure display:flex is applied
            requestAnimationFrame(() => {
                modalEl.classList.remove('opacity-0');
                content.classList.remove('scale-95', 'opacity-0');
                content.classList.add('scale-100', 'opacity-100');
            });
        } else {
            modalEl.classList.add('opacity-0');
            content.classList.remove('scale-100', 'opacity-100');
            content.classList.add('scale-95', 'opacity-0');

            setTimeout(() => {
                modalEl.classList.add('hidden');
                modalEl.classList.remove('flex');
                if (onHidden) onHidden();
            }, 300);
        }
    };

    // Date Picker Elements
    const startDateBtn = document.getElementById('sprint-start-date-btn');
    const startDateDropdown = document.getElementById('sprint-start-date-dropdown');
    const startDateInput = document.getElementById('sprint-start-date-input');
    const startDateText = document.getElementById('sprint-start-date-text');

    const endDateBtn = document.getElementById('sprint-end-date-btn');
    const endDateDropdown = document.getElementById('sprint-end-date-dropdown');
    const endDateInput = document.getElementById('sprint-end-date-input');
    const endDateText = document.getElementById('sprint-end-date-text');

    // Helper to setup calendar
    const setupCalendar = (btn, dropdown, input, textSpan, containerId) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(btn, dropdown, `${containerId}-portal`, (portal, closePortal) => {
                const calendarHost = portal.querySelector(`#${containerId}`);
                if (!calendarHost) return;

                import('../components/calendar.js').then(({ default: Calendar }) => {
                    const calendar = new Calendar(calendarHost, {
                        selectedDate: input.value ? input.value : null,
                        onChange: (date) => {
                            const d = new Date(date);
                            const offset = d.getTimezoneOffset();
                            const localDate = new Date(d.getTime() - (offset * 60 * 1000));
                            input.value = localDate.toISOString().split('T')[0]; // YYYY-MM-DD

                            textSpan.textContent = d.toLocaleDateString('vi-VN');
                            textSpan.classList.remove('text-gray-500');
                            textSpan.classList.add('text-gray-900');

                            closePortal();
                        }
                    });
                    portal._picker = calendar;
                });
            });
        });
    };

    setupCalendar(startDateBtn, startDateDropdown, startDateInput, startDateText, 'sprint-start-calendar-container');
    setupCalendar(endDateBtn, endDateDropdown, endDateInput, endDateText, 'sprint-end-calendar-container');

    const openModal = () => {
        animateModal(modal, true);
        const count = document.getElementById('sprints-list').children.length + 1;
        document.getElementById('sprint-name').value = `Sprint ${count}`;

        // Auto-fill dates
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        const formatDate = (date) => date.toISOString().split('T')[0];
        const formatDisplayDate = (date) => date.toLocaleDateString('vi-VN');

        startDateInput.value = formatDate(today);
        startDateText.textContent = formatDisplayDate(today);
        startDateText.classList.remove('text-gray-500');
        startDateText.classList.add('text-gray-900');

        endDateInput.value = formatDate(nextWeek);
        endDateText.textContent = formatDisplayDate(nextWeek);
        endDateText.classList.remove('text-gray-500');
        endDateText.classList.add('text-gray-900');

        document.getElementById('sprint-name').focus();
    };

    const closeModal = () => {
        animateModal(modal, false, () => {
            form.reset();
            startDateText.textContent = 'Select date';
            startDateText.classList.add('text-gray-500');
            startDateText.classList.remove('text-gray-900');
            startDateInput.value = '';

            endDateText.textContent = 'Select date';
            endDateText.classList.add('text-gray-500');
            endDateText.classList.remove('text-gray-900');
            endDateInput.value = '';
        });
    };

    createSprintBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const payload = {
            name: formData.get('name'),
            goal: formData.get('goal'),
            startDate: formData.get('startDate') || null,
            endDate: formData.get('endDate') || null
        };

        try {
            const res = await authFetch(`/projects/${currentProjectId}/sprints`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                closeModal();
                await loadBacklogData(currentProjectId);
            } else {
                let errorMessage = 'Unknown error';
                try {
                    const errorData = await res.json();
                    errorMessage = errorData.message || JSON.stringify(errorData);
                } catch (e) {
                    errorMessage = res.statusText;
                }
                alert(`Failed to create sprint: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Error creating sprint:', error);
            alert('An error occurred while creating the sprint.');
        }
    });

    // --- Start Sprint Modal Logic ---
    const startSprintModal = document.getElementById('start-sprint-modal');
    const closeStartSprintBtn = document.getElementById('close-start-sprint-modal-btn');
    const cancelStartSprintBtn = document.getElementById('cancel-start-sprint-btn');
    const startSprintForm = document.getElementById('start-sprint-form');

    const startSprintStartDateBtn = document.getElementById('start-sprint-start-date-btn');
    const startSprintStartDateDropdown = document.getElementById('start-sprint-start-date-dropdown');
    const startSprintStartDateInput = document.getElementById('start-sprint-start-date-input');
    const startSprintStartDateText = document.getElementById('start-sprint-start-date-text');

    const startSprintEndDateBtn = document.getElementById('start-sprint-end-date-btn');
    const startSprintEndDateDropdown = document.getElementById('start-sprint-end-date-dropdown');
    const startSprintEndDateInput = document.getElementById('start-sprint-end-date-input');
    const startSprintEndDateText = document.getElementById('start-sprint-end-date-text');

    setupCalendar(startSprintStartDateBtn, startSprintStartDateDropdown, startSprintStartDateInput, startSprintStartDateText, 'start-sprint-start-calendar-container');
    setupCalendar(startSprintEndDateBtn, startSprintEndDateDropdown, startSprintEndDateInput, startSprintEndDateText, 'start-sprint-end-calendar-container');

    const closeStartSprintModal = () => {
        animateModal(startSprintModal, false, () => {
            startSprintForm.reset();
            startSprintStartDateText.textContent = 'Select date';
            startSprintStartDateText.classList.add('text-gray-500');
            startSprintStartDateText.classList.remove('text-gray-900');
            startSprintStartDateInput.value = '';

            startSprintEndDateText.textContent = 'Select date';
            startSprintEndDateText.classList.add('text-gray-500');
            startSprintEndDateText.classList.remove('text-gray-900');
            startSprintEndDateInput.value = '';
        });
    };

    closeStartSprintBtn.addEventListener('click', closeStartSprintModal);
    cancelStartSprintBtn.addEventListener('click', closeStartSprintModal);

    startSprintForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(startSprintForm);
        const sprintId = formData.get('sprintId');

        const updatePayload = {
            name: formData.get('name'),
            goal: formData.get('goal'),
            startDate: formData.get('startDate') || null,
            endDate: formData.get('endDate') || null
        };

        try {
            // 1. Update Sprint Details
            const updateRes = await authFetch(`/projects/${currentProjectId}/sprints/${sprintId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            });

            if (!updateRes.ok) {
                const errorData = await updateRes.json();
                throw new Error(errorData.message || 'Failed to update sprint details');
            }

            // 2. Start Sprint
            const startRes = await authFetch(`/projects/${currentProjectId}/sprints/${sprintId}/start`, {
                method: 'POST'
            });

            if (startRes.ok) {
                closeStartSprintModal();
                await loadBacklogData(currentProjectId);
            } else {
                const errorData = await startRes.json();
                throw new Error(errorData.message || 'Only allow one sprint at a time!');
            }
        } catch (error) {
            console.error('Error starting sprint:', error);
            alert(`Error: ${error.message}`);
        }
    });

    // Delegated event listener for Start Sprint buttons
    document.addEventListener('click', (e) => {
        const startBtn = e.target.closest('.start-sprint-btn');
        if (startBtn) {
            // Check if there is already an active sprint
            const activeSprintBtn = document.querySelector('.complete-sprint-btn');
            if (activeSprintBtn) {
                // Show limit modal
                const limitModal = document.getElementById('sprint-limit-modal');
                const closeLimitBtn = document.getElementById('close-sprint-limit-modal-btn');

                animateModal(limitModal, true);

                const closeLimit = () => animateModal(limitModal, false);

                // Remove existing listeners to prevent duplicates (simple approach)
                const newBtn = closeLimitBtn.cloneNode(true);
                closeLimitBtn.parentNode.replaceChild(newBtn, closeLimitBtn);
                newBtn.addEventListener('click', closeLimit);

                return;
            }

            const sprintId = startBtn.dataset.sprintId;
            const name = startBtn.dataset.name;
            const goal = startBtn.dataset.goal;
            const startDate = startBtn.dataset.startDate;
            const endDate = startBtn.dataset.endDate;

            animateModal(startSprintModal, true);

            document.getElementById('start-sprint-id').value = sprintId;
            document.getElementById('start-sprint-name').value = name;
            document.getElementById('start-sprint-goal').value = goal || '';

            // Auto-fill dates: Start Date = Today, End Date = 1 Week later
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);

            // Helper to format date for input (YYYY-MM-DD) handling timezone
            const formatDateInput = (date) => {
                const offset = date.getTimezoneOffset();
                const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                return localDate.toISOString().split('T')[0];
            };

            // Set Start Date (Today)
            startSprintStartDateInput.value = formatDateInput(today);
            startSprintStartDateText.textContent = today.toLocaleDateString('vi-VN');
            startSprintStartDateText.classList.remove('text-gray-500');
            startSprintStartDateText.classList.add('text-gray-900');

            // Set End Date (Today + 7 days)
            startSprintEndDateInput.value = formatDateInput(nextWeek);
            startSprintEndDateText.textContent = nextWeek.toLocaleDateString('vi-VN');
            startSprintEndDateText.classList.remove('text-gray-500');
            startSprintEndDateText.classList.add('text-gray-900');
        }
    });

    //Complete Sprint modal logic
    const completeSprintModal = document.getElementById('complete-sprint-modal');
    const cancelCompleteSprintBtn = document.getElementById('cancel-complete-sprint-btn');
    const completeSprintForm = document.getElementById('complete-sprint-form');
    const closeCompleteModal = () => {
        animateModal(completeSprintModal, false, () => {
            completeSprintForm.reset();
        });
    }
    cancelCompleteSprintBtn.addEventListener('click', closeCompleteModal);
    const closeCompleteSprintBtn = document.getElementById('close-complete-sprint-modal-btn');
    if (closeCompleteSprintBtn) closeCompleteSprintBtn.addEventListener('click', closeCompleteModal);
    //xu ly submit form
    completeSprintForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(completeSprintForm);
        const sprintId = formData.get('sprintId');
        const actionType = formData.get('action');

        try {
            const incompleteRes = await authFetch(`/projects/${currentProjectId}/sprints/${sprintId}/incomplete`)
            if (!incompleteRes.ok) throw new Error('Failed to get incomplete tasks.');
            const incompleteTasks = await incompleteRes.json();
            const payload = {
                incompleteTasks: incompleteTasks.map(t => ({
                    taskId: t.taskId,
                    action: actionType
                }))
            };
            //Call api complete
            const completeRes = await authFetch(`/projects/${currentProjectId}/sprints/${sprintId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (completeRes.ok) {
                closeCompleteModal();
                await loadBacklogData(currentProjectId);
            } else {
                const err = await completeRes.json();
                alert(`Error: ${err.message}`);
            }
        } catch (err) {
            console.error('Error Complete sprint: ', err);
            alert('Failed to complete sprint');
        }
    })
    //bat su kien click complete sprint
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.complete-sprint-btn');
        if (btn) {
            const sprintId = btn.dataset.sprintId;
            animateModal(completeSprintModal, true);
            document.getElementById('complete-sprint-id').value = sprintId;
            try {
                const sprintRes = await authFetch(`/projects/${currentProjectId}/sprints/${sprintId}`);
                const sprintData = await sprintRes.json();
                //lay ds incomplete task
                const incompleteRes = await authFetch(`/projects/${currentProjectId}/sprints/${sprintId}/incomplete`);
                const incompleteTasks = await incompleteRes.json();
                const totalTasks = sprintData.taskCount || 0;
                const incompleteCount = incompleteTasks.length;
                const completedCount = totalTasks - incompleteCount;
                //update ui
                document.getElementById('complete-sprint-completed-count').textContent = completedCount;
                document.getElementById('complete-sprint-incomplete-count').textContent = incompleteCount;
                const actionContainer = document.getElementById('incomplete-tasks-action-container');
                if (incompleteCount === 0) {
                    actionContainer.classList.add('hidden');
                } else {
                    actionContainer.classList.remove('hidden');
                }
            } catch (err) {
                console.error('Error fetching sprint details:', err);
                alert('Error loading sprint details');
                closeCompleteModal();
            }
        }
    });

    // Sprint Menu Dropdown Toggle
    document.addEventListener('click', async (e) => {
        // Toggle Menu
        const menuBtn = e.target.closest('.sprint-menu-btn');
        if (menuBtn) {
            const dropdown = menuBtn.nextElementSibling;
            document.querySelectorAll('.sprint-menu-dropdown').forEach(d => {
                if (d !== dropdown) d.classList.add('hidden');
            });
            dropdown.classList.toggle('hidden');
            e.stopPropagation();
            return;
        }

        // Close menu if clicked outside
        if (!e.target.closest('.sprint-menu-dropdown')) {
            document.querySelectorAll('.sprint-menu-dropdown').forEach(d => {
                d.classList.add('hidden');
            });
        }

        // Handle Edit Sprint
        const editBtn = e.target.closest('.edit-sprint-btn');
        if (editBtn) {
            const sprintId = editBtn.dataset.sprintId;
            // Fetch sprint details to populate form
            try {
                const res = await authFetch(`/projects/${currentProjectId}/sprints/${sprintId}`);
                if (res.ok) {
                    const sprint = await res.json();
                    document.getElementById('edit-sprint-id').value = sprint.sprintId;
                    document.getElementById('edit-sprint-name').value = sprint.name;
                    document.getElementById('edit-sprint-goal').value = sprint.goal || '';

                    if (sprint.startDate) {
                        const d = new Date(sprint.startDate);
                        editSprintStartDateInput.value = sprint.startDate.split('T')[0];
                        editSprintStartDateText.textContent = d.toLocaleDateString('vi-VN');
                        editSprintStartDateText.classList.remove('text-gray-500');
                        editSprintStartDateText.classList.add('text-gray-900');
                    }

                    if (sprint.endDate) {
                        const d = new Date(sprint.endDate);
                        editSprintEndDateInput.value = sprint.endDate.split('T')[0];
                        editSprintEndDateText.textContent = d.toLocaleDateString('vi-VN');
                        editSprintEndDateText.classList.remove('text-gray-500');
                        editSprintEndDateText.classList.add('text-gray-900');
                    }

                    animateModal(editSprintModal, true);
                }
            } catch (error) {
                console.error('Error fetching sprint details:', error);
                alert('Failed to load sprint details');
            }
        }

        // Handle Delete Sprint
        const deleteBtn = e.target.closest('.delete-sprint-btn');
        if (deleteBtn) {
            const sprintId = deleteBtn.dataset.sprintId;
            showConfirmationModal(
                'Delete Sprint',
                'Are you sure you want to delete this sprint? All tasks in this sprint will be moved to the backlog.',
                async () => {
                    try {
                        const res = await authFetch(`/projects/${currentProjectId}/sprints/${sprintId}`, {
                            method: 'DELETE'
                        });
                        if (res.ok) {
                            await loadBacklogData(currentProjectId);
                        } else {
                            const errorData = await res.json();
                            alert(`Failed to delete sprint: ${errorData.message}`);
                        }
                    } catch (error) {
                        console.error('Error deleting sprint:', error);
                        alert('An error occurred while deleting the sprint.');
                    }
                },
                true // Destructive action
            );
        }
    });

    // --- Confirmation Modal Logic ---
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmationTitle = document.getElementById('confirmation-title');
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmationConfirmBtn = document.getElementById('confirmation-confirm-btn');
    const confirmationCancelBtn = document.getElementById('confirmation-cancel-btn');
    let onConfirmAction = null;

    const showConfirmationModal = (title, message, onConfirm, isDestructive = false) => {
        confirmationTitle.textContent = title;
        confirmationMessage.textContent = message;
        onConfirmAction = onConfirm;

        if (isDestructive) {
            confirmationConfirmBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            confirmationConfirmBtn.classList.add('bg-red-600', 'hover:bg-red-700');
        } else {
            confirmationConfirmBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
            confirmationConfirmBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        }

        animateModal(confirmationModal, true);
    };

    const closeConfirmationModal = () => {
        animateModal(confirmationModal, false);
        onConfirmAction = null;
    };

    confirmationCancelBtn.addEventListener('click', closeConfirmationModal);
    confirmationConfirmBtn.addEventListener('click', () => {
        if (onConfirmAction) onConfirmAction();
        closeConfirmationModal();
    });

    // --- Edit Sprint Modal Logic ---
    const editSprintModal = document.getElementById('edit-sprint-modal');
    const closeEditSprintBtn = document.getElementById('close-edit-sprint-modal-btn');
    const cancelEditSprintBtn = document.getElementById('cancel-edit-sprint-btn');
    const editSprintForm = document.getElementById('edit-sprint-form');

    const editSprintStartDateBtn = document.getElementById('edit-sprint-start-date-btn');
    const editSprintStartDateDropdown = document.getElementById('edit-sprint-start-date-dropdown');
    const editSprintStartDateInput = document.getElementById('edit-sprint-start-date-input');
    const editSprintStartDateText = document.getElementById('edit-sprint-start-date-text');

    const editSprintEndDateBtn = document.getElementById('edit-sprint-end-date-btn');
    const editSprintEndDateDropdown = document.getElementById('edit-sprint-end-date-dropdown');
    const editSprintEndDateInput = document.getElementById('edit-sprint-end-date-input');
    const editSprintEndDateText = document.getElementById('edit-sprint-end-date-text');

    setupCalendar(editSprintStartDateBtn, editSprintStartDateDropdown, editSprintStartDateInput, editSprintStartDateText, 'edit-sprint-start-calendar-container');
    setupCalendar(editSprintEndDateBtn, editSprintEndDateDropdown, editSprintEndDateInput, editSprintEndDateText, 'edit-sprint-end-calendar-container');

    const closeEditSprintModal = () => {
        animateModal(editSprintModal, false, () => {
            editSprintForm.reset();
            editSprintStartDateText.textContent = 'Select date';
            editSprintStartDateText.classList.add('text-gray-500');
            editSprintStartDateText.classList.remove('text-gray-900');
            editSprintStartDateInput.value = '';

            editSprintEndDateText.textContent = 'Select date';
            editSprintEndDateText.classList.add('text-gray-500');
            editSprintEndDateText.classList.remove('text-gray-900');
            editSprintEndDateInput.value = '';
        });
    };

    closeEditSprintBtn.addEventListener('click', closeEditSprintModal);
    cancelEditSprintBtn.addEventListener('click', closeEditSprintModal);

    editSprintForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(editSprintForm);
        const sprintId = formData.get('sprintId');
        const payload = {
            name: formData.get('name'),
            goal: formData.get('goal'),
            startDate: formData.get('startDate') || null,
            endDate: formData.get('endDate') || null
        };

        try {
            const res = await authFetch(`/projects/${currentProjectId}/sprints/${sprintId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                closeEditSprintModal();
                await loadBacklogData(currentProjectId);
            } else {
                const errorData = await res.json();
                alert(`Failed to update sprint: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating sprint:', error);
            alert('An error occurred while updating the sprint.');
        }
    });

    await loadBacklogData(currentProjectId);

    // Setup Backlog Drop Zone
    const backlogContainer = document.getElementById('backlog-tasks');
    backlogContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(backlogContainer, e.clientX, e.clientY);
        const draggable = document.querySelector('.dragging');
        if (!draggable) return;
        if (afterElement == null) {
            backlogContainer.appendChild(draggable);
        } else {
            backlogContainer.insertBefore(draggable, afterElement);
        }
    });

    backlogContainer.addEventListener('drop', async (e) => {
        e.preventDefault();

        let taskIds = [];
        let sourceSprintId = null;
        const jsonData = e.dataTransfer.getData('application/json');

        if (jsonData) {
            try {
                const data = JSON.parse(jsonData);
                taskIds = data.taskIds || [];
                sourceSprintId = data.sourceSprintId;
            } catch (err) {
                console.error('Error parsing drag data', err);
            }
        }

        if (taskIds.length === 0) {
            const singleId = e.dataTransfer.getData('text/plain');
            if (singleId) taskIds.push(singleId);
            sourceSprintId = e.dataTransfer.getData('source-sprint-id');
        }

        // If coming from a sprint, remove it from that sprint (move to backlog)
        if (sourceSprintId) {
            try {
                const promises = taskIds.map(tid =>
                    authFetch(`/projects/${currentProjectId}/sprints/${sourceSprintId}/tasks/${tid}`, {
                        method: 'DELETE'
                    })
                );
                await Promise.all(promises);
                loadBacklogData(currentProjectId);
            } catch (error) {
                console.error('Error moving tasks to backlog:', error);
                loadBacklogData(currentProjectId);
            }
        }
    });
}

async function loadBacklogData(projectId) {
    selectedTaskIds.clear();
    lastSelectedTaskId = null;
    try {
        if (!defaultBoardId) {
            const boardsRes = await authFetch(`/projects/${projectId}/boards`);
            if (boardsRes.ok) {
                const boards = await boardsRes.json();
                if (boards.length > 0) {
                    defaultBoardId = boards[0].boardId;
                    const columnsRes = await authFetch(`/boards/${defaultBoardId}/columns`);
                    if (columnsRes.ok) {
                        const columns = await columnsRes.json();
                        if (columns.length > 0) {
                            defaultColumnId = columns[0].columnId;
                        }
                    }
                }
            }
        }

        const [sprintsRes, backlogRes] = await Promise.all([
            authFetch(`/projects/${projectId}/sprints`),
            authFetch(`/projects/${projectId}/backlog`)
        ]);

        if (!sprintsRes.ok || !backlogRes.ok) {
            throw new Error('Failed to fetch backlog data');
        }

        const sprints = await sprintsRes.json();
        const backlogTasks = await backlogRes.json();

        renderBacklogView(sprints, backlogTasks);
    } catch (error) {
        console.error('Error loading backlog data:', error);
        alert('Failed to load backlog data. Please try again.');
    }
}

function renderBacklogView(sprints, backlogTasks) {
    renderSprints(sprints);
    renderProductBacklog(backlogTasks);
}

function renderSprints(sprints) {
    const container = document.getElementById('sprints-list');
    if (!container) return;
    container.innerHTML = '';

    // Filter out completed sprints (Status 2)
    const visibleSprints = sprints.filter(s => s.status !== 2);

    if (visibleSprints.length === 0) {
        container.innerHTML = `
            <div class="text-center p-10 border-2 border-dashed border-gray-300 rounded-xl">
                <p class="text-gray-500 mb-4">No active or planning sprints found.</p>
                <button onclick="document.getElementById('create-sprint-btn').click()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Sprint</button>
            </div>
        `;
        return;
    }

    let firstPlanningSprintFound = false;

    visibleSprints.forEach(sprint => {
        let canStart = false;
        // Check if this is the first planning sprint
        if (sprint.status === 0 && !firstPlanningSprintFound) {
            canStart = true;
            firstPlanningSprintFound = true;
        }

        const sprintEl = createSprintElement(sprint, canStart);
        container.appendChild(sprintEl);
        loadSprintTasks(sprint.sprintId, sprintEl.querySelector('.sprint-tasks'));

        // Add listener for Create Task in this sprint
        const createTaskBtn = sprintEl.querySelector('.create-task-btn');
        if (createTaskBtn) {
            createTaskBtn.addEventListener('click', () => {
                const taskContainer = sprintEl.querySelector('.sprint-tasks');
                // Check if form already exists
                if (taskContainer.querySelector('.new-task-form-container')) return;

                // Hide button or just append form?
                // Let's append form to top of task list
                taskContainer.insertAdjacentHTML('afterbegin', createTaskScrumHtml());
                const formContainer = taskContainer.querySelector('.new-task-form-container');
                setupCreateTaskForm(formContainer, sprint.sprintId, () => {
                    // On success
                    loadSprintTasks(sprint.sprintId, taskContainer);
                });
            });
        }

        // Add listener for Sprint Menu (Direct attachment for reliability)
        const menuBtn = sprintEl.querySelector('.sprint-menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = menuBtn.nextElementSibling;
                // Close other dropdowns
                document.querySelectorAll('.sprint-menu-dropdown').forEach(d => {
                    if (d !== dropdown) d.classList.add('hidden');
                });
                dropdown.classList.toggle('hidden');
            });
        }
    });
}

function createSprintElement(sprint, canStart = false) {
    const div = document.createElement('div');
    div.className = 'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden';

    const statusColors = {
        0: 'bg-gray-100 text-gray-600', // Planning
        1: 'bg-blue-100 text-blue-700', // Active
        2: 'bg-green-100 text-green-700', // Completed
        3: 'bg-red-100 text-red-700' // Cancelled
    };

    const statusText = {
        0: 'PLANNING',
        1: 'ACTIVE',
        2: 'COMPLETED',
        3: 'CANCELLED'
    };

    const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const startDate = sprint.startDate ? new Date(sprint.startDate).toLocaleDateString('vi-VN', dateOptions) : 'TBD';
    const endDate = sprint.endDate ? new Date(sprint.endDate).toLocaleDateString('vi-VN', dateOptions) : 'TBD';

    const startBtn = canStart ? `
        <button class="start-sprint-btn px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-dashed border-gray-300 rounded hover:bg-gray-50"
            data-sprint-id="${sprint.sprintId}"
            data-name="${sprint.name}"
            data-goal="${sprint.goal || ''}"
            data-start-date="${sprint.startDate || ''}"
            data-end-date="${sprint.endDate || ''}">
            Start Sprint
        </button>` : '';

    div.innerHTML = `
        <div class="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <button class="hid-print text-gray-400 hover:text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                <div id="sprint-list">
                    <div class="flex items-center gap-2">
                        <h3 class="font-semibold text-gray-900">${sprint.name}</h3>
                        <span class="text-xs font-medium px-2 py-0.5 rounded ${statusColors[sprint.status] || 'bg-gray-100'}">
                            ${statusText[sprint.status]}
                        </span>
                    </div>
                    <div class="text-xs text-gray-500 mt-0.5">
                        ${startDate} - ${endDate} • ${sprint.taskCount || 0} issues • ${sprint.totalStoryPoints || 0} story points
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-2">
                ${startBtn}
                ${sprint.status === 1 ? `<button class="complete-sprint-btn px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-dashed border-gray-300 rounded hover:bg-gray-50" data-sprint-id=${sprint.sprintId}>Complete Sprint</button>` : ''}
                <div class="relative">
                    <button class="sprint-menu-btn p-1.5 text-gray-500 hover:bg-gray-200 rounded transition-colors" data-sprint-id="${sprint.sprintId}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-more-horizontal"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                    </button>
                    <div class="sprint-menu-dropdown absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-20 hidden transform origin-top-right transition-all">
                        <div class="p-1">
                            <button class="edit-sprint-btn w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" data-sprint-id="${sprint.sprintId}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                Edit Sprint
                            </button>
                            <button class="delete-sprint-btn w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-500 flex items-center gap-2" data-sprint-id="${sprint.sprintId}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                Delete Sprint
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="sprint-tasks p-2 space-y-1 min-h-[50px]" data-sprint-id="${sprint.sprintId}">
            <div class="text-center text-sm text-gray-400 py-2">Loading tasks...</div>
        </div>
        <div class="px-4 py-2 bg-gray-50 border-t border-gray-200">
             <button class="create-task-btn text-sm text-gray-600 hover:text-black font-medium flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                Create Task
            </button>
        </div>
    `;

    const taskContainer = div.querySelector('.sprint-tasks');

    taskContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(taskContainer, e.clientX, e.clientY);
        const draggable = document.querySelector('.dragging');
        if (!draggable) return;
        if (afterElement == null) {
            taskContainer.appendChild(draggable);
        } else {
            taskContainer.insertBefore(draggable, afterElement);
        }
    });

    taskContainer.addEventListener('drop', async (e) => {
        e.preventDefault();

        let taskIds = [];
        let sourceSprintId = null;
        const jsonData = e.dataTransfer.getData('application/json');

        if (jsonData) {
            try {
                const data = JSON.parse(jsonData);
                taskIds = data.taskIds || [];
                sourceSprintId = data.sourceSprintId;
            } catch (err) { console.error(err); }
        }

        if (taskIds.length === 0) {
            const singleId = e.dataTransfer.getData('text/plain');
            if (singleId) taskIds.push(singleId);
            sourceSprintId = e.dataTransfer.getData('source-sprint-id');
        }

        const targetSprintId = sprint.sprintId;

        if (sourceSprintId == targetSprintId) return;

        try {
            const promises = taskIds.map(tid =>
                authFetch(`/projects/${currentProjectId}/sprints/${targetSprintId}/tasks/${tid}`, {
                    method: 'POST'
                })
            );

            await Promise.all(promises);
            loadBacklogData(currentProjectId);
        } catch (error) {
            console.error('Error moving tasks to sprint:', error);
            loadBacklogData(currentProjectId);
        }
    });

    // Collapse/Expand Sprint Logic
    const toggleBtn = div.querySelector('.hid-print');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isHidden = taskContainer.classList.toggle('hidden');
            const svg = toggleBtn.querySelector('svg');
            if (svg) {
                svg.style.transition = 'transform 0.2s ease';
                svg.style.transform = isHidden ? 'rotate(-90deg)' : 'rotate(0deg)';
            }
        });
    }

    return div;
}

async function loadSprintTasks(sprintId, container) {
    try {
        const res = await authFetch(`/projects/${currentProjectId}/sprints/${sprintId}/backlog`);
        if (!res.ok) throw new Error('Failed to load sprint tasks');
        const data = await res.json();

        container.innerHTML = '';
        if (data.tasks && data.tasks.length > 0) {
            data.tasks.forEach(task => {
                container.appendChild(createTaskElement(task, sprintId));
            });
        } else {
            container.innerHTML = '<div class="text-center text-sm text-gray-400 py-4 italic">No tasks in this sprint. Drag tasks here.</div>';
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="text-red-500 text-sm p-2">Error loading tasks</div>';
    }
}

function renderProductBacklog(tasks) {
    const container = document.getElementById('backlog-tasks');
    const stats = document.getElementById('backlog-stats');
    const createBtn = document.getElementById('create-backlog-task-btn');
    const createContainer = document.getElementById('create-backlog-task-container');

    container.innerHTML = '';
    stats.textContent = `${tasks.length} tasks`;

    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="text-center p-8 text-gray-500 italic">
                Your backlog is empty.
            </div>
        `;
    } else {
        tasks.forEach(task => {
            container.appendChild(createTaskElement(task));
        });
    }

    // Re-attach listener for Create Task in Backlog
    // Note: createBtn is outside 'backlog-tasks' container, so it persists.
    // But we need to make sure we don't add multiple listeners if render is called multiple times.
    // Actually, createBtn is in 'project-content' which is overwritten in init.
    // But renderProductBacklog is called multiple times.
    // The button is in 'create-backlog-task-container' which is NOT cleared by renderProductBacklog (it clears 'backlog-tasks').

    // So we need to handle the click event.
    // Best place is to attach it once in init, OR replace the element to clear listeners.
    const newCreateBtn = createBtn.cloneNode(true);
    createBtn.parentNode.replaceChild(newCreateBtn, createBtn);

    newCreateBtn.addEventListener('click', () => {
        // Check if form exists
        if (createContainer.querySelector('.new-task-form-container')) return;

        // Hide button
        newCreateBtn.classList.add('hidden');

        // Insert form
        createContainer.insertAdjacentHTML('afterbegin', createTaskScrumHtml());
        const formContainer = createContainer.querySelector('.new-task-form-container');

        setupCreateTaskForm(formContainer, null, () => {
            // On success
            newCreateBtn.classList.remove('hidden');
            loadBacklogData(currentProjectId);
        }, () => {
            // On cancel/cleanup
            newCreateBtn.classList.remove('hidden');
        });
    });
}


function clearAllSelections() {
    document.querySelectorAll('.backlog-task-item').forEach(el => {
        el.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50');
        const cb = el.querySelector('.task-select-checkbox');
        if (cb) cb.checked = false;
    });
    selectedTaskIds.clear();
    lastSelectedTaskId = null;
}

function handleTaskSelection(element, taskId, event) {
    if (event.ctrlKey || event.metaKey) {
        if (selectedTaskIds.has(taskId)) {
            selectedTaskIds.delete(taskId);
            element.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50');
            if (lastSelectedTaskId === taskId) lastSelectedTaskId = null;
        } else {
            selectedTaskIds.add(taskId);
            element.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50');
            lastSelectedTaskId = taskId;
        }
    } else if (event.shiftKey && lastSelectedTaskId) {
        const allTasks = Array.from(document.querySelectorAll('.backlog-task-item'));
        const lastIndex = allTasks.findIndex(el => el.dataset.taskId === lastSelectedTaskId);
        const currentIndex = allTasks.findIndex(el => el.dataset.taskId === taskId);

        if (lastIndex !== -1 && currentIndex !== -1) {
            const start = Math.min(lastIndex, currentIndex);
            const end = Math.max(lastIndex, currentIndex);
            for (let i = start; i <= end; i++) {
                const el = allTasks[i];
                const tid = el.dataset.taskId;
                selectedTaskIds.add(tid);
                el.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50');
            }
        }
    }
}

function createTaskElement(task, sprintId = null) {
    const div = document.createElement('div');
    div.className = 'group flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer backlog-task-item';
    div.draggable = true;
    div.dataset.taskId = task.taskId;
    if (sprintId) div.dataset.sprintId = sprintId;

    div.addEventListener('dragstart', (e) => {
        // If the current task is not in selection, clear and select it (standard drag behavior)
        if (!selectedTaskIds.has(task.taskId)) {
            clearAllSelections();
            selectedTaskIds.add(task.taskId);
            div.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50');
        }

        const tasksToMove = Array.from(selectedTaskIds);
        e.dataTransfer.setData('application/json', JSON.stringify({
            taskIds: tasksToMove,
            sourceSprintId: sprintId || ''
        }));

        e.dataTransfer.setData('text/plain', task.taskId);
        e.dataTransfer.setData('source-sprint-id', sprintId || '');

        // Use empty image for ghost
        const emptyImage = document.getElementById('drag-ghost') || new Image();
        if (e.dataTransfer.setDragImage) {
            e.dataTransfer.setDragImage(emptyImage, 0, 0);
        }

        setTimeout(() => {
            div.classList.add('dragging');
            div.style.opacity = '0.5';
        }, 0);
    });

    div.addEventListener('dragend', () => {
        div.classList.remove('dragging');
        div.style.opacity = '1';
    });

    div.addEventListener('click', (e) => {
        const isCheckbox = e.target.classList.contains('task-select-checkbox');

        if (e.ctrlKey || e.metaKey || e.shiftKey || isCheckbox) {
            // e.preventDefault(); // Don't prevent default for checkbox, otherwise it won't check
            if (!isCheckbox) e.preventDefault();
            e.stopPropagation();
            handleTaskSelectionV2(div, task.taskId, e);
            return;
        }

        clearAllSelections();

        if (currentProjectId && defaultBoardId && task.column && task.column.columnId) {
            openTaskDetailModal(task.taskId, currentProjectId, defaultBoardId, task.column.columnId);
        }
    });

    const priorityColors = {
        0: 'bg-gray-200 text-gray-700', // Low
        1: 'bg-red-100 text-red-700', // Medium
        2: 'bg-orange-100 text-orange-700', // High
        3: 'bg-blue-100 text-blue-700' // Urgent
    };

    const priorityText = {
        0: 'Low',
        1: 'High',
        2: 'Medium',
        3: 'Low'
    };
    const due = new Date(task.dueDate);
    const dateFormat = due.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    const assigneeHtml = task.assignee
        ? `<img src="${task.assignee.avatarUrl || '/images/default-avatar.png'}" title="${task.assignee.name}" class="task-assignee w-6 h-6 rounded-full border border-white">`
        : `<div class="task-assignee w-6 h-6 rounded-full bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">?</div>`;

    div.innerHTML = `
        <div class="flex items-center gap-3 overflow-hidden">
            <div class="mr-1 flex items-center" onmousedown="event.stopPropagation()">
                <input type="checkbox" class="task-select-checkbox w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" data-task-id="${task.taskId}">
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                    <span class="task-title text-sm font-medium text-gray-900 truncate">${task.title}</span>
                    <span class="task-priority text-[10px] px-1.5 py-0.5 rounded-full ${priorityColors[task.priority] || 'bg-gray-100'}">
                        ${priorityText[task.priority] || 'Normal'}
                    </span>
                </div>
            </div>
        </div>
        <div class="flex items-center gap-4 shrink-0">
            ${task.storyPoints ? `<span class="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium" title="Story Points">${task.storyPoints}</span>` : ''}
            ${assigneeHtml}
            <span class="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">${dateFormat}</span>
            <div class="text-right">
                <span class="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">${task.column?.name || 'No Status'}</span>
            </div>
        </div>
    `;

    return div;
}

function setupCreateTaskForm(formContainer, sprintId, onSuccess, onCancel) {
    const form = formContainer.querySelector('form');
    const assigneeBtn = formContainer.querySelector('#assignee-btn');
    const assigneeDropdown = formContainer.querySelector('#assignee-dropdown');
    const assigneeInput = form.querySelector('input[name="assigneeId"]');

    const priorityBtn = formContainer.querySelector('#priority-btn');
    const priorityDropdown = formContainer.querySelector('#priority-dropdown');
    const priorityInput = form.querySelector('input[name="priority"]');

    const calendarBtn = formContainer.querySelector('#duedate-btn');
    const calendarDropdown = formContainer.querySelector('#calendar-dropdown');
    const dueDateInput = form.querySelector('input[name="dueDate"]');

    // Cleanup function
    const cleanup = () => {
        formContainer.remove();
        document.removeEventListener('click', handleClickOutside);
        if (onCancel) onCancel();
    };

    const handleClickOutside = (event) => {
        if (formContainer.contains(event.target) || event.target.closest('[id*="-portal"]')) {
            return;
        }
        cleanup();
    };

    setTimeout(() => document.addEventListener('click', handleClickOutside), 0);

    // Assignee Dropdown
    assigneeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown(assigneeBtn, assigneeDropdown, 'assignee-dropdown-portal', async (portal, closePortal) => {
            const assigneeList = portal.querySelector('#assignee-list');
            const assigneeSearch = portal.querySelector('#assignee-search');

            let projectMembers = [];

            const renderMembers = (filteredMembers) => {
                assigneeList.innerHTML = '';
                if (filteredMembers.length === 0) {
                    assigneeList.innerHTML = '<div class="p-2 text-sm text-gray-500">No members found.</div>';
                    return;
                }
                filteredMembers.forEach(member => {
                    const memberEl = document.createElement('div');
                    memberEl.className = 'flex items-center gap-2 w-full p-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer';

                    const avatarInitial = member.name ? member.name.charAt(0).toUpperCase() : '?';
                    const avatarHtml = member.avatarUrl
                        ? `<img src="${member.avatarUrl}" alt="${member.name}" class="w-5 h-5 rounded-full object-cover">`
                        : `<div class="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-semibold">${avatarInitial}</div>`;

                    memberEl.innerHTML = `${avatarHtml}<span>${member.name || 'Unnamed'}</span>`;

                    memberEl.addEventListener('click', () => {
                        assigneeInput.value = member.userId;
                        assigneeBtn.innerHTML = `
                            ${avatarHtml}
                        `;
                        closePortal();
                    });
                    assigneeList.appendChild(memberEl);
                });
            };

            assigneeSearch.addEventListener('input', () => {
                const searchTerm = assigneeSearch.value.toLowerCase();
                const filtered = projectMembers.filter(m => m.name.toLowerCase().includes(searchTerm));
                renderMembers(filtered);
            });

            try {
                const res = await authFetch(`/projects/${currentProjectId}/readProject`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.members) {
                        projectMembers = data.members;
                        renderMembers(projectMembers);
                    }
                }
            } catch (error) {
                console.error('Error fetching members:', error);
            }
        }, 'top');
    });

    // Priority Dropdown
    priorityBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown(priorityBtn, priorityDropdown, 'priority-dropdown-portal', (portal, closePortal) => {
            const priorityBtnText = priorityBtn.querySelector('#priority-btn-text');
            const portalOptions = portal.querySelectorAll('.priority-option');
            portalOptions.forEach(option => {
                option.addEventListener('click', () => {
                    const selectedPriority = option.dataset.priority;
                    priorityInput.value = selectedPriority;
                    priorityBtnText.textContent = `${selectedPriority} Priority`;
                    closePortal();
                });
            });
        }, 'top');
    });

    // Calendar
    calendarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown(calendarBtn, calendarDropdown, 'calendar-dropdown-portal', (portal, closePortal) => {
            const calendarHost = portal.querySelector('#calendar');
            if (!calendarHost) return;

            import('../components/calendar.js').then(({ default: Calendar }) => {
                const calendar = new Calendar(calendarHost, {
                    selectedDate: dueDateInput.value ? dueDateInput.value : null,
                    onChange: (date) => {
                        const d = new Date(date);
                        d.setHours(12, 0, 0, 0);
                        dueDateInput.value = d.toISOString();

                        const dateString = d.toLocaleDateString('vi-VN');
                        calendarBtn.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-days-icon lucide-calendar-days"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                            ${dateString}
                        `;
                        closePortal();
                    }
                });
                portal._picker = calendar;
            });
        }, 'top');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const title = formData.get('title').trim();
        if (!title) return;

        if (!defaultBoardId || !defaultColumnId) {
            alert('Cannot create task: No default board/column found.');
            return;
        }

        const payload = {
            title: title,
            description: '',
            priority: (() => {
                const priorityValue = formData.get('priority');
                switch (priorityValue) {
                    case 'High': return 1;
                    case 'Medium': return 2;
                    case 'Low': return 3;
                    default: return 2;
                }
            })(),
            assigneeId: formData.get('assigneeId') || null,
            dueDate: formData.get('dueDate') || null
        };

        try {
            // 1. Create Task in default column
            const res = await authFetch(`/boards/${defaultBoardId}/columns/${defaultColumnId}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to create task');

            const createdTask = await res.json();

            // 2. If sprintId is provided, add to sprint
            if (sprintId) {
                const addToSprintRes = await authFetch(`/projects/${currentProjectId}/sprints/${sprintId}/tasks/${createdTask.taskId}`, {
                    method: 'POST'
                });
                if (!addToSprintRes.ok) console.warn('Failed to add task to sprint');
            }

            cleanup();
            if (onSuccess) onSuccess();

        } catch (error) {
            console.error('Error creating task:', error);
            alert('Could not create the task. Please try again.');
        }
    });
}

function handleTaskSelectionV2(element, taskId, event) {
    const checkbox = element.querySelector('.task-select-checkbox');
    // Check if the event started on the checkbox or bubbled from it
    const isCheckboxClick = event.target === checkbox || (event.target.classList && event.target.classList.contains('task-select-checkbox'));

    if (isCheckboxClick) {
        if (checkbox.checked) {
            selectedTaskIds.add(taskId);
            element.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50');
            lastSelectedTaskId = taskId;
        } else {
            selectedTaskIds.delete(taskId);
            element.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50');
            if (lastSelectedTaskId === taskId) lastSelectedTaskId = null;
        }
        return;
    }

    if (event.ctrlKey || event.metaKey) {
        if (selectedTaskIds.has(taskId)) {
            selectedTaskIds.delete(taskId);
            element.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50');
            if (checkbox) checkbox.checked = false;
            if (lastSelectedTaskId === taskId) lastSelectedTaskId = null;
        } else {
            selectedTaskIds.add(taskId);
            element.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50');
            if (checkbox) checkbox.checked = true;
            lastSelectedTaskId = taskId;
        }
    } else if (event.shiftKey && lastSelectedTaskId) {
        const allTasks = Array.from(document.querySelectorAll('.backlog-task-item'));
        const lastIndex = allTasks.findIndex(el => el.dataset.taskId === lastSelectedTaskId);
        const currentIndex = allTasks.findIndex(el => el.dataset.taskId === taskId);

        if (lastIndex !== -1 && currentIndex !== -1) {
            const start = Math.min(lastIndex, currentIndex);
            const end = Math.max(lastIndex, currentIndex);
            for (let i = start; i <= end; i++) {
                const el = allTasks[i];
                const tid = el.dataset.taskId;
                selectedTaskIds.add(tid);
                el.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50');
                const cb = el.querySelector('.task-select-checkbox');
                if (cb) cb.checked = true;
            }
        }
    }
}
