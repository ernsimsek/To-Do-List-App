document.addEventListener('DOMContentLoaded', () => {
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
    const el = {
        taskInput: $('#new-task'), addButton: $('#add-btn'), taskList: $('#task-list'), dateInput: $('#task-date'),
        timeInput: $('#task-time'), categoryInput: $('#task-category'), searchInput: $('#search-input'), searchClear: $('#search-clear'), searchBox: $('.search-box'),
        sortSelect: $('#sort-select'), composer: $('#composer'), openComposer: $('#open-composer'),
        modeToggle: $('#mode-toggle'), clearCompleted: $('#clear-completed'), pageTitle: $('#page-title'),
        pageSubtitle: $('#page-subtitle'), dateLabel: $('#date-label'), resultSummary: $('#result-summary'),
        progressRing: $('#progress-ring'), progressValue: $('#progress-value'), progressCopy: $('#progress-copy'),
        miniProgress: $('#mini-progress-bar'), toast: $('#toast'), openCount: $('#open-count'), overdueCount: $('#overdue-count'),
        mobileProgressValue: $('#mobile-progress-value'), mobileProgressBar: $('#mobile-progress-bar'),
        mobileOpenCount: $('#mobile-open-count'), mobileDoneCount: $('#mobile-done-count'), mobileOverdueCount: $('#mobile-overdue-count'),
        mobileNextTask: $('#mobile-next-task'), mobileNextTime: $('#mobile-next-time'),
        mobileOpenComposer: $('#mobile-open-composer'), mobileModeToggle: $('#mobile-mode-toggle')
    };
    const accents = {
        coral: { accent: '#ee7558', deep: '#c85238', soft: '#fae8e1', rgb: '238, 117, 88' },
        violet: { accent: '#7c6ce7', deep: '#5d4bc9', soft: '#ece9ff', rgb: '124, 108, 231' },
        ocean: { accent: '#208f9b', deep: '#116b74', soft: '#e2f2f3', rgb: '32, 143, 155' },
        sage: { accent: '#6fa889', deep: '#4f8067', soft: '#e9f2ec', rgb: '111, 168, 137' },
        amber: { accent: '#d89b45', deep: '#a66d22', soft: '#f8eddc', rgb: '216, 155, 69' }
    };
    const viewCopy = {
        all: ['All tasks', 'Clear your mind and make space for the day.'],
        today: ['Today', "Focus only on today's rhythm."],
        upcoming: ['Upcoming', 'Meet the days ahead with clarity.'],
        completed: ['Completed', 'Seeing your progress is part of the journey.']
    };
    let tasks = loadTasks();
    let currentView = 'all', currentFilter = 'all', currentPriority = 'medium', searchTerm = '', toastTimer;

    function loadTasks() {
        try {
            return (JSON.parse(localStorage.getItem('tasks')) || []).map(task => ({
                ...task, id: task.id || Date.now() + Math.random(), text: String(task.text || ''),
                priority: String(task.priority || 'medium').toLowerCase(), category: translateLegacyCategory(task.category),
                createdAt: task.createdAt || new Date().toISOString()
            }));
        } catch { return []; }
    }
    function translateLegacyCategory(category) {
        return ({ 'Kişisel': 'Personal', 'İş': 'Work', 'Sağlık': 'Health', 'Öğrenme': 'Learning' })[category] || category || 'Personal';
    }
    function saveTasks() { localStorage.setItem('tasks', JSON.stringify(tasks)); }
    function localDate(date = new Date()) {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 10);
    }
    function dueTimestamp(task) { return task.dueDate ? new Date(`${task.dueDate}T${task.dueTime || '23:59'}`).getTime() : Number.POSITIVE_INFINITY; }
    function isToday(task) { return task.dueDate === localDate(); }
    function isUpcoming(task) { return task.dueDate && task.dueDate > localDate() && !task.completed; }
    function isOverdue(task) { return task.dueDate && dueTimestamp(task) < Date.now() && !task.completed && !isToday(task); }

    function setDefaults() {
        el.dateInput.value = localDate();
        el.dateLabel.textContent = new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
        const savedTheme = localStorage.getItem('luma-theme') || localStorage.getItem('akis-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.dataset.theme = savedTheme;
        applyAccent(localStorage.getItem('luma-accent') || localStorage.getItem('akis-accent') || 'coral');
        updateThemeButton();
    }

    function addTask() {
        const text = el.taskInput.value.trim();
        if (!text) {
            el.taskInput.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 260 });
            el.taskInput.focus(); return;
        }
        tasks.unshift({ id: Date.now(), text, completed: false, priority: currentPriority, category: el.categoryInput.value,
            dueDate: el.dateInput.value, dueTime: el.timeInput.value, createdAt: new Date().toISOString() });
        saveTasks();
        el.taskInput.value = '';
        if (searchTerm) {
            el.searchInput.value = '';
            searchTerm = '';
            el.searchBox.classList.remove('has-value');
        }
        render(true); showToast('Task added to Luma'); el.taskInput.focus();
    }
    function toggleTask(id) {
        const task = tasks.find(item => item.id === id); if (!task) return;
        task.completed = !task.completed; task.completedAt = task.completed ? new Date().toISOString() : null;
        saveTasks(); render(); if (task.completed) showToast('Nice work — one more step complete ✨');
    }
    function deleteTask(id) {
        const task = tasks.find(item => item.id === id);
        tasks = tasks.filter(item => item.id !== id); saveTasks(); render(); showToast(`“${task?.text || 'Task'}” deleted`);
    }
    function editTask(id, taskElement) {
        const task = tasks.find(item => item.id === id); if (!task || taskElement.classList.contains('editing')) return;
        taskElement.classList.add('editing');
        const main = $('.task-main', taskElement), input = document.createElement('input');
        input.className = 'edit-input'; input.value = task.text; main.replaceChildren(input); input.focus(); input.select();
        let finished = false;
        const finish = save => {
            if (finished) return; finished = true;
            if (save && input.value.trim()) { task.text = input.value.trim(); saveTasks(); }
            render();
        };
        input.addEventListener('keydown', event => { if (event.key === 'Enter') finish(true); if (event.key === 'Escape') finish(false); });
        input.addEventListener('blur', () => finish(true), { once: true });
    }

    function getVisibleTasks() {
        let result = tasks.filter(task => {
            if (currentView === 'today') return isToday(task) && !task.completed;
            if (currentView === 'upcoming') return isUpcoming(task);
            if (currentView === 'completed') return task.completed;
            return true;
        });
        if (currentFilter === 'active') result = result.filter(task => !task.completed);
        if (currentFilter === 'completed') result = result.filter(task => task.completed);
        if (searchTerm) result = result.filter(task => `${task.text} ${task.category}`.toLocaleLowerCase('en-US').includes(searchTerm));
        const weights = { high: 0, medium: 1, low: 2 };
        return [...result].sort((a, b) => {
            if (el.sortSelect.value === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
            if (el.sortSelect.value === 'due') return dueTimestamp(a) - dueTimestamp(b);
            if (el.sortSelect.value === 'priority') return weights[a.priority] - weights[b.priority];
            return Number(a.completed) - Number(b.completed) || Number(isOverdue(b)) - Number(isOverdue(a)) || dueTimestamp(a) - dueTimestamp(b);
        });
    }

    function createTaskElement(task, index, animate = false) {
        const item = document.createElement('article');
        item.className = `task${task.completed ? ' completed' : ''}${isOverdue(task) ? ' is-overdue' : ''}${animate ? ' animate-in' : ''}`;
        item.dataset.id = task.id;
        if (animate) item.style.animationDelay = `${Math.min(index * 28, 140)}ms`;
        const check = document.createElement('button');
        check.className = 'task-check'; check.type = 'button'; check.setAttribute('aria-label', task.completed ? 'Reopen task' : 'Complete task');
        check.textContent = task.completed ? '✓' : ''; check.dataset.action = 'toggle';
        const main = document.createElement('div'); main.className = 'task-main';
        const title = document.createElement('p'); title.className = 'task-title'; title.textContent = task.text; title.title = task.text;
        const meta = document.createElement('div'); meta.className = 'task-meta';
        const priority = document.createElement('span'); priority.className = `priority-mark ${task.priority}`; priority.title = `${priorityText(task.priority)} priority`; meta.append(priority);
        const category = document.createElement('span'); category.className = 'category-tag'; category.textContent = task.category; meta.append(category);
        const date = document.createElement('span');
        if (task.dueDate) { date.className = isOverdue(task) ? 'overdue-label' : ''; date.textContent = `${isOverdue(task) ? 'Overdue · ' : ''}${formatDueDate(task)}`; }
        else date.textContent = 'No due date';
        meta.append(date); main.append(title, meta);
        const actions = document.createElement('div'); actions.className = 'task-actions';
        const edit = actionButton('✎', 'Edit task', 'edit');
        const remove = actionButton('×', 'Delete task', 'delete');
        actions.append(edit, remove); item.append(check, main, actions); return item;
    }
    function actionButton(label, title, className) {
        const button = document.createElement('button'); button.type = 'button'; button.className = `task-action ${className}`;
        button.textContent = label; button.title = title; button.dataset.action = className; button.setAttribute('aria-label', title); return button;
    }
    function priorityText(value) { return ({ low: 'Low', medium: 'Medium', high: 'High' })[value] || 'Medium'; }
    function formatDueDate(task) {
        if (isToday(task)) return `Today${task.dueTime ? `, ${task.dueTime}` : ''}`;
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
        if (task.dueDate === localDate(tomorrow)) return `Tomorrow${task.dueTime ? `, ${task.dueTime}` : ''}`;
        const formatted = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short' }).format(new Date(`${task.dueDate}T12:00:00`));
        return `${formatted}${task.dueTime ? `, ${task.dueTime}` : ''}`;
    }
    function compactDueLabel(task) {
        if (!task) return 'Now';
        if (task.dueTime && isToday(task)) return task.dueTime;
        if (isToday(task)) return 'Today';
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
        if (task.dueDate === localDate(tomorrow)) return 'Tomorrow';
        if (!task.dueDate) return 'Anytime';
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${task.dueDate}T12:00:00`));
    }

    function render(animate = false) {
        const visible = getVisibleTasks(); el.taskList.replaceChildren();
        if (!visible.length) renderEmptyState(); else visible.forEach((task, index) => el.taskList.append(createTaskElement(task, index, animate)));
        updateStats(visible.length);
    }
    function renderEmptyState() {
        const empty = document.createElement('div'); empty.className = 'empty-state';
        const message = searchTerm ? ['No matching tasks', 'Try searching with a different word.'] : currentView === 'completed'
            ? ['Nothing completed yet', 'Your first checkmark is a great place to start.'] : ['Plenty of room to breathe', 'Add a new task and find your flow.'];
        empty.innerHTML = `<div><div class="empty-visual" aria-hidden="true"></div><h3>${message[0]}</h3><p>${message[1]}</p></div>`;
        el.taskList.append(empty);
    }
    function updateStats(visibleCount) {
        const total = tasks.length, completed = tasks.filter(task => task.completed).length;
        const today = tasks.filter(task => isToday(task) && !task.completed).length, upcoming = tasks.filter(isUpcoming).length;
        const open = total - completed, overdue = tasks.filter(isOverdue).length;
        const rate = total ? Math.round((completed / total) * 100) : 0;
        $('#all-count').textContent = total; $('#today-count').textContent = today; $('#upcoming-count').textContent = upcoming; $('#completed-count').textContent = completed;
        el.openCount.textContent = open;
        el.overdueCount.textContent = overdue;
        el.resultSummary.textContent = `${visibleCount} ${visibleCount === 1 ? 'task' : 'tasks'} shown`; el.progressRing.style.setProperty('--progress', rate);
        el.progressValue.textContent = `${rate}%`; el.miniProgress.style.width = `${rate}%`;
        el.mobileProgressValue.textContent = `${rate}%`;
        el.mobileProgressBar.style.width = `${rate}%`;
        el.mobileOpenCount.textContent = open;
        el.mobileDoneCount.textContent = completed;
        el.mobileOverdueCount.textContent = overdue;
        const nextTask = [...tasks].filter(task => !task.completed).sort((a, b) => dueTimestamp(a) - dueTimestamp(b))[0];
        el.mobileNextTask.textContent = nextTask?.text || (total ? 'Everything is complete' : 'Add your first task');
        el.mobileNextTime.textContent = nextTask ? compactDueLabel(nextTask) : (total ? 'Done' : 'Now');
        el.progressCopy.textContent = !total ? 'Add your first task to begin.' : rate === 100 ? "Today's flow is complete!" : `${completed} done, ${total - completed} to go.`;
        el.clearCompleted.disabled = completed === 0; el.clearCompleted.style.opacity = completed ? '1' : '.35';
    }
    function switchView(view) {
        currentView = view; $$('.nav-item, .mobile-nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === view));
        [el.pageTitle.textContent, el.pageSubtitle.textContent] = viewCopy[view];
        if (view === 'completed') { currentFilter = 'all'; $$('.filter-btn').forEach(button => button.classList.toggle('active', button.dataset.filter === 'all')); }
        render();
    }
    function applyAccent(name) {
        const theme = accents[name] || accents.coral;
        document.documentElement.style.setProperty('--accent', theme.accent); document.documentElement.style.setProperty('--accent-deep', theme.deep);
        document.documentElement.style.setProperty('--accent-soft-light', theme.soft);
        document.documentElement.style.setProperty('--accent-rgb', theme.rgb);
        $$('.palette-dot').forEach(dot => dot.classList.toggle('active', dot.dataset.accent === name)); localStorage.setItem('luma-accent', name);
    }
    function toggleTheme() {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next; localStorage.setItem('luma-theme', next); updateThemeButton();
    }
    function updateThemeButton() {
        const dark = document.documentElement.dataset.theme === 'dark';
        el.modeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
        el.modeToggle.textContent = dark ? '☀' : '◐';
        el.mobileModeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
        el.mobileModeToggle.textContent = dark ? '☀' : '◐';
        $('meta[name="theme-color"]').setAttribute('content', dark ? '#11110f' : '#e9e5de');
    }
    function showToast(message) {
        clearTimeout(toastTimer); el.toast.textContent = message; el.toast.classList.add('show'); toastTimer = setTimeout(() => el.toast.classList.remove('show'), 2200);
    }

    function toggleComposer(forceOpen = null) {
        const shouldOpen = forceOpen === null ? !el.composer.classList.contains('open') : forceOpen;
        el.composer.classList.toggle('open', shouldOpen);
        el.openComposer.setAttribute('aria-expanded', String(shouldOpen));
        el.mobileOpenComposer.setAttribute('aria-expanded', String(shouldOpen));
        el.mobileOpenComposer.setAttribute('aria-label', shouldOpen ? 'Close task composer' : 'Open task composer');
        el.mobileOpenComposer.classList.toggle('is-open', shouldOpen);
        if (!shouldOpen) return;
        requestAnimationFrame(() => {
            if (window.innerWidth <= 840) el.composer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => el.taskInput.focus(), 180);
        });
    }

    el.openComposer.addEventListener('click', () => toggleComposer());
    el.mobileOpenComposer.addEventListener('click', () => toggleComposer());
    el.addButton.addEventListener('click', addTask); el.taskInput.addEventListener('keydown', event => { if (event.key === 'Enter') addTask(); });
    el.taskList.addEventListener('click', event => {
        const control = event.target.closest('[data-action]');
        const taskElement = event.target.closest('.task');
        if (!control || !taskElement) return;
        const id = Number(taskElement.dataset.id);
        if (control.dataset.action === 'toggle') toggleTask(id);
        if (control.dataset.action === 'edit') editTask(id, taskElement);
        if (control.dataset.action === 'delete') deleteTask(id);
    });
    el.taskList.addEventListener('dblclick', event => {
        const title = event.target.closest('.task-title');
        const taskElement = title?.closest('.task');
        if (title && taskElement) editTask(Number(taskElement.dataset.id), taskElement);
    });
    el.searchInput.addEventListener('input', event => {
        searchTerm = event.target.value.trim().toLocaleLowerCase('en-US');
        el.searchBox.classList.toggle('has-value', Boolean(searchTerm));
        render();
    });
    el.searchClear.addEventListener('click', () => {
        el.searchInput.value = '';
        searchTerm = '';
        el.searchBox.classList.remove('has-value');
        render();
        el.searchInput.focus();
    });
    el.sortSelect.addEventListener('change', render); el.modeToggle.addEventListener('click', toggleTheme); el.mobileModeToggle.addEventListener('click', toggleTheme);
    el.clearCompleted.addEventListener('click', () => { const count = tasks.filter(task => task.completed).length; if (!count) return; tasks = tasks.filter(task => !task.completed); saveTasks(); render(); showToast(`${count} completed ${count === 1 ? 'task' : 'tasks'} cleared`); });
    $$('.nav-item, .mobile-nav-item').forEach(button => button.addEventListener('click', () => switchView(button.dataset.view)));
    $$('.filter-btn').forEach(button => button.addEventListener('click', () => { currentFilter = button.dataset.filter; $$('.filter-btn').forEach(item => item.classList.toggle('active', item === button)); render(); }));
    $$('.priority-chip').forEach(button => button.addEventListener('click', () => { currentPriority = button.dataset.priority; $$('.priority-chip').forEach(item => item.classList.toggle('active', item === button)); }));
    $$('.quick-dates button').forEach(button => button.addEventListener('click', () => { const date = new Date(); if (button.dataset.quickDate === 'tomorrow') date.setDate(date.getDate() + 1); el.dateInput.value = localDate(date); }));
    $$('.palette-dot').forEach(dot => dot.addEventListener('click', () => applyAccent(dot.dataset.accent)));
    document.addEventListener('keydown', event => {
        if (event.key === '/' && document.activeElement.tagName !== 'INPUT') { event.preventDefault(); el.searchInput.focus(); }
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') toggleComposer(true);
    });
    setDefaults(); render();
});
