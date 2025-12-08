import { authFetch } from "../auth/auth.js";

const VIEW_MODES = {
    DAY: { dayWidth: 40, label: 'Day' },
    WEEK: { dayWidth: 15, label: 'Week' },
    MONTH: { dayWidth: 5, label: 'Month' }
};

const ROW_HEIGHT = 50;
const HEADER_HEIGHT = 50;

export async function initProjectGantt() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    if (!projectId) {
        console.error('No project ID found');
        return;
    }
    const container = document.getElementById('project-content');
    if (!container) {
        console.error("Container not found");
        return;
    }

    try {
        const response = await authFetch(`/projects/${projectId}/gantt-chart`);
        if (!response.ok) throw new Error("Failed to fetch gantt data");
        const tasks = await response.json();
        renderGanttChart(tasks, container, projectId, 'DAY');
    } catch (err) {
        console.error(err);
        container.innerHTML = `<p class="text-red-500">Error loading Gantt Chart: ${err.message}</p>`;
    }
}

function renderGanttChart(tasks, container, projectId, viewMode = 'DAY') {
    container.innerHTML = '';
    const currentMode = VIEW_MODES[viewMode] || VIEW_MODES.DAY;
    const DAY_WIDTH_DYNAMIC = currentMode.dayWidth;

    // --- 1. Layout Structure ---
    const controlsHtml = `
        <div class="flex justify-between items-center mb-4">
            <div class="flex items-center gap-4">
                <h2 class="text-xl font-bold text-gray-800">Gantt Chart</h2>
                <div class="flex bg-gray-100 p-1 rounded-lg">
                    <button class="px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === 'DAY' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}" id="view-day">Day</button>
                    <button class="px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === 'WEEK' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}" id="view-week">Week</button>
                    <button class="px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === 'MONTH' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}" id="view-month">Month</button>
                </div>
            </div>
            <button id="gantt-add-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition-colors flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Add Task
            </button>
        </div>
        <div class="flex gap-2 h-[500px]">
            <div id="gantt-sidebar" class="flex flex-col w-1/3 border border-gray-200 rounded-lg relative bg-white">
                
            </div>
            <div id="gantt-scroll-area" class="w-2/3 overflow-auto border border-gray-200 rounded-lg bg-white shadow-inner relative">
                <svg id="gantt-svg" class="block"></svg>
            </div>
        </div>
    `;
    container.innerHTML = controlsHtml;

    // --- 2. Data Processing ---
    if (tasks.length === 0) tasks = [];

    const taskObjs = tasks.map(t => ({
        ...t,
        startDate: new Date(t.start),
        endDate: new Date(t.end)
    }));

    let minDate = new Date();
    let maxDate = new Date();

    if (taskObjs.length > 0) {
        minDate = new Date(Math.min(...taskObjs.map(t => t.startDate)));
        maxDate = new Date(Math.max(...taskObjs.map(t => t.endDate)));
    } else {
        minDate = new Date();
        maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
    }

    // Add Buffer
    minDate.setDate(minDate.getDate() - 10);
    maxDate.setDate(maxDate.getDate() + 40);

    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
    const svgWidth = totalDays * DAY_WIDTH_DYNAMIC;
    const svgHeight = Math.max((taskObjs.length * ROW_HEIGHT) + HEADER_HEIGHT, 500);

    const svg = document.getElementById('gantt-svg');
    svg.setAttribute('width', svgWidth);
    svg.setAttribute('height', svgHeight);

    // --- 3. Render Sidebar ---
    const sidebar = document.getElementById('gantt-sidebar');
    const scrollArea = document.getElementById('gantt-scroll-area');

    let sidebarHtml = `
        <div class="flex items-center border-b border-gray-200 bg-gray-50 font-bold text-gray-700" style="height: ${HEADER_HEIGHT}px; padding-left: 10px; flex-shrink: 0;">
            Task Name
        </div>
        <div id="gantt-sidebar-content" class="overflow-hidden flex-1 relative">
    `;

    if (taskObjs.length > 0) {
        taskObjs.forEach(task => {
            sidebarHtml += `
                <div class="flex items-center border-b border-gray-100 text-sm text-gray-700 hover:bg-gray-50 transition-colors" style="height: ${ROW_HEIGHT}px; padding-left: 10px;">
                    <span class="truncate" title="${task.name}">${task.name}</span>
                </div>
            `;
        });
    } else {
        sidebarHtml += `
            <div class="flex items-center justify-center text-gray-400 italic" style="height: ${ROW_HEIGHT}px;">
                No tasks
            </div>
        `;
    }
    sidebarHtml += `</div>`;
    sidebar.innerHTML = sidebarHtml;

    // Scroll Synchronization
    const sidebarContent = document.getElementById('gantt-sidebar-content');
    scrollArea.addEventListener('scroll', () => {
        sidebarContent.scrollTop = scrollArea.scrollTop;
    });

    // --- 4. Drawing Helpers ---
    const createEl = (tag, attrs) => {
        const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
        return el;
    };

    const getX = (date) => {
        const diff = Math.ceil((date - minDate) / (1000 * 60 * 60 * 24));
        return diff * DAY_WIDTH_DYNAMIC;
    };

    // --- 5. Draw Grid ---
    svg.appendChild(createEl('rect', {
        x: 0, y: 0, width: svgWidth, height: HEADER_HEIGHT,
        fill: '#f3f4f6', stroke: '#e5e7eb'
    }));

    for (let i = 0; i < totalDays; i++) {
        const d = new Date(minDate);
        d.setDate(minDate.getDate() + i);
        const x = i * DAY_WIDTH_DYNAMIC;

        let showLine = false;
        let showLabel = false;
        let isMinor = false;

        if (viewMode === 'DAY') {
            showLine = true;
            showLabel = true;
        } else if (viewMode === 'WEEK') {
            if (d.getDay() === 1) {
                showLine = true;
                showLabel = true;
            } else {
                isMinor = true;
            }
        } else if (viewMode === 'MONTH') {
            if (d.getDate() === 1) {
                showLine = true;
                showLabel = true;
            }
        }

        if (showLine) {
            svg.appendChild(createEl('line', {
                x1: x, y1: HEADER_HEIGHT, x2: x, y2: svgHeight,
                stroke: '#d1d5db', 'stroke-width': 1
            }));
        } else if (isMinor) {
            svg.appendChild(createEl('line', {
                x1: x, y1: HEADER_HEIGHT, x2: x, y2: svgHeight,
                stroke: '#f3f4f6', 'stroke-width': 1
            }));
        }

        if (showLabel) {
            let labelText = '';
            let labelSubText = '';

            if (viewMode === 'DAY') {
                const day = d.getDate().toString().padStart(2, '0');
                const month = (d.getMonth() + 1).toString().padStart(2, '0');
                labelText = `${day}/${month}`;
                const daysVI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                labelSubText = daysVI[d.getDay()];
            } else if (viewMode === 'WEEK') {
                const day = d.getDate().toString().padStart(2, '0');
                const month = (d.getMonth() + 1).toString().padStart(2, '0');
                labelText = `W ${getWeekNumber(d)}`;
                labelSubText = `${day}/${month}`;
            } else if (viewMode === 'MONTH') {
                labelText = d.toLocaleString('default', { month: 'short' });
                labelSubText = d.getFullYear().toString();
            }

            const textEl = createEl('text', {
                x: x + 5, y: 35,
                fill: '#374151', 'font-size': '12px', 'font-family': 'sans-serif', 'font-weight': '500'
            });
            textEl.textContent = labelText;
            svg.appendChild(textEl);

            const subTextEl = createEl('text', {
                x: x + 5, y: 18,
                fill: '#6b7280', 'font-size': '10px', 'font-family': 'sans-serif'
            });
            subTextEl.textContent = labelSubText;
            svg.appendChild(subTextEl);
        }

        const today = new Date();
        if (d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) {
            svg.appendChild(createEl('line', {
                x1: x, y1: 0, x2: x, y2: svgHeight,
                stroke: '#ef4444', 'stroke-width': 1, 'stroke-dasharray': '5,5'
            }));
        }
    }

    // --- 6. Draw Tasks ---
    taskObjs.forEach((task, index) => {
        const xStart = getX(task.startDate);
        const xEnd = getX(task.endDate);
        const width = Math.max(xEnd - xStart, DAY_WIDTH_DYNAMIC);
        const y = HEADER_HEIGHT + (index * ROW_HEIGHT) + 10;
        const barHeight = ROW_HEIGHT - 20;

        const g = createEl('g', { class: 'gantt-task-group cursor-pointer' });

        const title = createEl('title', {});
        title.textContent = `${task.name}\nStart: ${task.startDate.toLocaleDateString()}\nEnd: ${task.endDate.toLocaleDateString()}\nProgress: ${task.progress}%`;
        g.appendChild(title);

        g.appendChild(createEl('rect', {
            x: xStart, y: y, width: width, height: barHeight,
            fill: '#e0e7ff', rx: 4, ry: 4
        }));

        const progressWidth = (width * task.progress) / 100;
        if (progressWidth > 0) {
            let color = '#3b82f6';
            if (task.progress >= 100) color = '#10b981';
            else if (task.progress === 0) color = '#9ca3af';

            g.appendChild(createEl('rect', {
                x: xStart, y: y, width: progressWidth, height: barHeight,
                fill: color, rx: 4, ry: 4
            }));
        }

        const textLabel = createEl('text', {
            x: xStart + 5, y: y + barHeight / 2 + 4,
            fill: '#1f2937', 'font-size': '12px', 'font-weight': '500'
        });

        const maxChars = Math.floor(width / 7);
        textLabel.textContent = task.name.length > maxChars && maxChars > 3
            ? task.name.substring(0, maxChars - 3) + '...'
            : task.name;

        if (width < 30) textLabel.textContent = '';
        g.appendChild(textLabel);
        svg.appendChild(g);
    });

    // --- 7. Event Listeners ---
    document.getElementById('gantt-add-btn').addEventListener('click', () => {
        openAddTaskModal(projectId, () => initProjectGantt());
    });

    document.getElementById('view-day').addEventListener('click', () => renderGanttChart(tasks, container, projectId, 'DAY'));
    document.getElementById('view-week').addEventListener('click', () => renderGanttChart(tasks, container, projectId, 'WEEK'));
    document.getElementById('view-month').addEventListener('click', () => renderGanttChart(tasks, container, projectId, 'MONTH'));
}

function openAddTaskModal(projectId, onSuccess) {
    let modal = document.getElementById('gantt-add-modal');
    if (modal) {
        modal.classList.remove('hidden');
    } else {
        const modalHtml = `
            <div id="gantt-add-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white p-6 rounded-lg shadow-xl w-96 transform transition-all scale-100">
                    <h3 class="text-xl font-bold mb-4 text-gray-800">Add Gantt Task</h3>
                    <form id="gantt-add-form">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
                            <input type="text" id="g-name" class="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" required>
                        </div>
                        <div class="flex gap-4 mb-4">
                            <div class="w-1/2">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input type="date" id="g-start" class="w-full border border-gray-300 p-2 rounded outline-none" required>
                            </div>
                            <div class="w-1/2">
                                <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <input type="date" id="g-end" class="w-full border border-gray-300 p-2 rounded outline-none" required>
                            </div>
                        </div>
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Progress (%)</label>
                            <input type="number" id="g-progress" min="0" max="100" value="0" class="w-full border border-gray-300 p-2 rounded outline-none">
                            <p class="text-xs text-gray-500 mt-1">0% = To Do, 50% = In Progress, 100% = Done</p>
                        </div>
                        <div class="flex justify-end gap-2">
                            <button type="button" id="g-cancel" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                            <button type="submit" class="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded shadow">Create</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        modal = document.getElementById('gantt-add-modal');

        document.getElementById('g-cancel').addEventListener('click', () => modal.classList.add('hidden'));
        document.getElementById('gantt-add-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                Name: document.getElementById('g-name').value,
                Start: document.getElementById('g-start').value || new Date().toISOString(),
                End: document.getElementById('g-end').value || new Date().toISOString(),
                Progress: parseInt(document.getElementById('g-progress').value) || 0
            };

            try {
                const res = await authFetch(`/projects/${projectId}/gantt-chart/create`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    modal.classList.add('hidden');
                    document.getElementById('gantt-add-form').reset();
                    if (onSuccess) onSuccess();
                } else {
                    alert("Error creating task");
                }
            } catch (err) {
                console.error(err);
                alert("Error creating task");
            }
        });
    }

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('g-start').value = today;
    document.getElementById('g-end').value = today;
}

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}
