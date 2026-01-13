export default class Calendar {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = options;
        this.currentDate = new Date();
        this.selectedDate = options.selectedDate ? new Date(options.selectedDate) : null;

        this.init();
    }

    init() {
        this.render();
    }

    render() {
        this.container.innerHTML = '';
        this.container.className = 'p-4 bg-white rounded-md border w-64';

        const header = this.createHeader();
        const grid = this.createGrid();

        this.container.appendChild(header);
        this.container.appendChild(grid);
    }

    createHeader() {
        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-4';

        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600 hover:text-gray-900">
                <path d="m15 18-6-6 6-6"/>
            </svg>
        `;
        prevBtn.className = 'p-1 hover:bg-gray-100 rounded-lg transition-colors';
        prevBtn.onclick = (e) => {
            e.stopPropagation();
            this.prevMonth();
        };

        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600 hover:text-gray-900">
                <path d="m9 18 6-6-6-6"/>
            </svg>
        `;
        nextBtn.className = 'p-1 hover:bg-gray-100 rounded-lg transition-colors';
        nextBtn.onclick = (e) => {
            e.stopPropagation();
            this.nextMonth();
        };

        const title = document.createElement('span');
        title.className = 'font-semibold text-gray-800';
        title.textContent = this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

        header.appendChild(prevBtn);
        header.appendChild(title);
        header.appendChild(nextBtn);

        return header;
    }

    createGrid() {
        const grid = document.createElement('div');

        // Weekday headers
        const daysContainer = document.createElement('div');
        daysContainer.className = 'grid grid-cols-7 gap-1 mb-2';
        // Fallback inline styles in case Tailwind classes are missing
        daysContainer.style.display = 'grid';
        daysContainer.style.gridTemplateColumns = 'repeat(7, 1fr)';
        daysContainer.style.gap = '0.5rem';

        ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.className = 'text-center text-xs font-medium text-gray-500 py-1';
            dayEl.textContent = day;
            daysContainer.appendChild(dayEl);
        });
        grid.appendChild(daysContainer);

        // Days
        const datesContainer = document.createElement('div');
        datesContainer.className = 'grid grid-cols-7 gap-1';
        // Fallback inline styles
        datesContainer.style.display = 'grid';
        datesContainer.style.gridTemplateColumns = 'repeat(7, 1fr)';
        datesContainer.style.gap = '0.5rem';

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Previous month padding
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            datesContainer.appendChild(empty);
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateBtn = document.createElement('button');
            dateBtn.textContent = day;
            dateBtn.className = 'h-6 w-6 flex items-center justify-center text-sm rounded-sm hover:border-2 hover:bg-blue-100 hover:border-blue-500 transition-colors text-gray-700';

            const currentDayDate = new Date(year, month, day);

            // Check if selected
            if (this.selectedDate &&
                this.selectedDate.getDate() === day &&
                this.selectedDate.getMonth() === month &&
                this.selectedDate.getFullYear() === year) {
                dateBtn.classList.add('bg-blue-500', 'text-white', 'hover:bg-blue-600');
                dateBtn.classList.remove('text-gray-700', 'hover:bg-blue-50', 'hover:border-blue-400');
            }

            // Check if today
            const today = new Date();
            if (today.getDate() === day &&
                today.getMonth() === month &&
                today.getFullYear() === year &&
                !dateBtn.classList.contains('bg-blue-500')) {
                dateBtn.classList.add('text-white', 'bg-red-500', 'font-bold');
                dateBtn.classList.remove('text-gray-700');
            }

            dateBtn.onclick = (e) => {
                e.stopPropagation(); // Prevent closing dropdown if inside one
                this.selectDate(currentDayDate);
            };

            datesContainer.appendChild(dateBtn);
        }

        grid.appendChild(datesContainer);
        return grid;
    }

    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    }

    selectDate(date) {
        this.selectedDate = date;
        this.render(); // Re-render to show selection
        if (this.options.onChange) {
            this.options.onChange(date);
        }
    }

    destroy() {
        this.container.innerHTML = '';
    }
}
