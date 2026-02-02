document.addEventListener('DOMContentLoaded',function (){
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const taskInput = document.getElementById('new-task');
    const addBtn = document.getElementById('add-btn');
    const taskList = document.getElementById('task-list');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const totalTasksEl = document.getElementById('total-task');
    const completedTasksEl = document.getElementById('completed-task');
    const themeButtons = document.querySelectorAll('.theme-btn');
    const priorityOptions = document.querySelectorAll('.priority-option');
    const modeToggle = document.getElementById('mode-toggle');
    const prioritySelector = document.getElementById('priority-selector');
    const prioritySlider = document.getElementById('priority-slider');
    const taskDateInput = document.getElementById('task-date');
    const taskTimeInput = document.getElementById('task-time');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let currentPriority = 'high';
    let currentTheme = 'purple-blue';
    let darkMode = localStorage.getItem('darkMode') !== 'false';
    
    document.documentElement.style.setProperty('--primary-rgb', '138, 43, 226');
    document.documentElement.style.setProperty('--secondary-rgb', '0, 198, 251');
    document.documentElement.style.setProperty('--succes-rgb', '0, 230, 118');
    document.documentElement.style.setProperty('--danger-rgb', '255, 77, 77');

    function hexToRgb(hex){
        const r = parseInt(hex.slice(1,3), 16);
        const g = parseInt(hex.slice(3,5), 16);
        const b = parseInt(hex.slice(5,7), 16);
        return [r, g, b];
    }

    function init () {
        setTheme(darkMode ? 'dark' : 'light');

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const time = now.getHours().toString().padStart(2, '0')+ ':'+
        now.getMinutes().toString().padStart(2, '0');

        taskDateInput.value = today;
        taskTimeInput.value = time;

        renderTasks();
        updateStats();
        setupEventListeners();
        updatePrioritySlider();

        setTimeout(() => {
            prioritySelector.style.transform = 'scale(1.05)';
            setTimeout(() => {
                prioritySelector.style.transform = 'scale(1)';
            }, 300);
        }, 500)
    }

    function updatePrioritySlider() {
        const selectedOption = document.querySelector('.priority-option.selected');
        if(selectedOption) {
            const optionRect = selectedOption.getBoundingClientRect();
            const containerRect = prioritySelector.getBoundingClientRect();

            const left = optionRect.left - containerRect.left;
            prioritySlider.style.transform = `translateX(${left}px) translateY(-50%)`;

            let color;
            switch(currentPriority){
                case 'high':
                    color = 'var(--high-priority)';
                    break;
                
                case 'medium':
                    color = 'var(--medium-priority)';
                    break;

                case 'low':
                    color = 'var(--low-priority)';
                    break;
            }

            prioritySlider.style.boxShadow = `0 0 10px ${color}`;
        }
    }

    function setupEventListeners() {
        addBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', function(e) {
            if(e.key === 'Enter') addTask();
        });

        filterButtons.forEach(button => {
            button.addEventListener('click', function () {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.dataset.filter;
                renderTasks();
            })
        })

        themeButtons.forEach(button => {
            button.addEventListener('click', function() {
                themeButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                currentTheme = this.dataset.theme;
                applyColorTheme(currentTheme)
            })
        })

        priorityOptions.forEach(option => {
            option.addEventListener('click', function() {
                priorityOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected')
                currentPriority = this.dataset.priority.toLowerCase();
                updatePrioritySlider();
            });
        })

        modeToggle.addEventListener('click', toggleDarkMode);
        window.addEventListener('resize', updatePrioritySlider);
    }

    function toggleDarkMode() {
        darkMode = !darkMode;
        localStorage.setItem('darkMode', darkMode);
        setTheme(darkMode ? 'dark' : 'light');
        modeToggle.style.transform = 'scale(1.2) rotate(180deg)';
        setTimeout(() => {
            modeToggle.style.transform = 'scale(1) rotate(0)';
        }, 300)
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        modeToggle.innerHTML = theme === 'dark' ? '<i class = "fas fa-sun"></i>' : '<i class = "fas fa-moon"></i>';
        modeToggle.setAttribute('title',  theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    }

    function applyColorTheme(theme) {
        let primary, primaryDark, secondary;

        switch(theme) {
            case 'purple-blue':
                primary = '#8a2be2';
                primaryDark = '#5f1d9e';
                secondary = '#00c6fb';
                break;
            
            case 'red-yellow':
                primary = '#ff4d4d';
                secondary = '#fdcb6e';
                primaryDark = '#d63031';
                break;    

            case 'green-blue':
                primary = '#00b894';
                primaryDark = '#0984e3';
                secondary = '#0984e3';
                break;

            case 'purple-pink':
                primary = '#6c5ce7';
                primaryDark = '#5649d2';
                secondary = '#fd79e8';
                break;
                
            case 'orange-yellow':
                primary = '#e17055';
                primaryDark = '#d63031';
                secondary = '#fdcb6e';
                break;
                
            default : 
                primary = '#8a2be2';
                primaryDark = '#5f1d9e';
                secondary = '#00c6fb';    
        }

        document.documentElement.style.setProperty('--primary', primary);
        document.documentElement.style.setProperty('--primary-dark', primaryDark);
        document.documentElement.style.setProperty('--secondary', secondary);

        const primaryRgb = hexToRgb(primary).join(', ');
        const secondaryRgb = hexToRgb(secondary).join(', ');
        document.documentElement.style.setProperty('--primary-rgb', primaryRgb);
        document.documentElement.style.setProperty('--secondary-rgb', secondaryRgb);

        // Update filter colors 
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const filterActiveOpacity = isLight ? '0.1' : '0.2';
        const filterHoverOpacity = isLight ? '0.08' : '0.15';
        document.documentElement.style.setProperty('--filter-active', `rgba(${primaryRgb}, ${filterActiveOpacity})`);
        document.documentElement.style.setProperty('--filter-hover', `rgba(${primaryRgb}, ${filterHoverOpacity})`);

        updatePrioritySlider();
    }

    function addTask() {
        const taskText = taskInput.value.trim();
        if(taskText === '') {
            animateInputError();
            return;
        }

        const date = taskDateInput.value;
        const time = taskTimeInput.value;
        let formattedDate = '';

        if(date) {
            const dateObj = new Date(date);
            formattedDate = dateObj.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });

            if(time) {
                const [hours, minutes] = time.split(':');
                dateObj.setHours(parseInt(hours));
                dateObj.setMinutes(parseInt(minutes));
                formattedDate += ` at  ${time}`;
            }
        }

        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            priority: currentPriority,
            createdAt: new Date(),
            dueDate: date,
            dueTime: time,
            formattedDate: formattedDate
        };

        tasks.unshift(newTask);
        saveTasks();
        renderTasks();
        updateStats();
        taskInput.value = '';
        taskInput.focus();

        setTimeout(()=> {
            const taskElement = document.querySelector(`[data-id="${newTask.id}"]`);
            if(taskElement) {
                taskElement.classList.add('task-enter');
                setTimeout(() => {
                    taskElement.classList.remove('task-enter');
                }, 500)
            }
        }, 10)

        addBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            addBtn.style.transform = 'scale(1)';
        }, 150)
    }

    function animateInputError() {
        taskInput.style.borderColor = 'var(--danger)';

        const animation = taskInput.animate([
            {transform: 'translateX(0)'},
            {transform: 'translateX(-5px)'},
            {transform: 'translateX(5px)'},
            {transform: 'translateX(0)'}
        ], {
            duration: 100,
            iterations: 3
        });

        setTimeout(() => {
            taskInput.style.borderColor = 'var(--card-border)';
        }, 1000);
    }

    function toggleTaskComplete(taskId) {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if(taskIndex === -1)
            return;

        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        saveTasks();
        renderTasks();
        updateStats();
    }

    function deleteTask(taskId) {
        const taskElement = document.querySelector(`[data-id="${taskId}"]`);
        if(taskElement) {
            taskElement.classList.add('task-exit');
            setTimeout(()=> {
                tasks = tasks.filter(task => task.id !== taskId);
                saveTasks();
                renderTasks();
                updateStats();
            }, 400);
        }
    }

    function renderTasks() {
        taskList.innerHTML = '';

        let filteredTasks = tasks;
        if(currentFilter === 'active') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        }

        if(filteredTasks.length === 0 ){
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-state';

            if(currentFilter === 'all') {
                emptyMessage.innerHTML =   `
                                            <i class="fas fa-tasks"></i>
                                            <h3>No tasks yet!</h3>
                                            <p>Add your first task to get started</p>`;
            } else if (currentFilter === 'active') {
                emptyMessage.innerHTML = `
                                            <i class = "fas fa-clock"></i>
                                            <h3> No Active tasks</h3>
                                            <p>You're doing great </p>`;
            } else {
                emptyMessage.innerHTML = `
                                            <i class = "fas fa-check-circle"></i>
                                            <h3> No Completed tasks </h3>
                                            <p> Complete some tasks to see them here </p>`;
            }

            taskList.appendChild(emptyMessage);
            return;
        }

        filteredTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `task ${task.completed ? 'completed' : ''}`;
            taskElement.setAttribute('data-id', task.id);

            const priorityClass = `priority-${task.priority}`;
            const priorityIndicator = `<div class = "priority-indicator ${priorityClass}"></div>`;

            const dateDisplay = task.formattedDate ? `
            <div class = "task-meta">
                <div class = "task-date">
                    <i class = "fas fa-calendar-alt"></i>
                    <span>${task.formattedDate}</span>
                </div> 
            </div>` : '';

            taskElement.innerHTML = `
                                    ${priorityIndicator}
                                    <label class = "checkbox-container">
                                        <input type = "checkbox" ${task.completed ? 'checked' : ''}>
                                        <span class= "checkmark"></span>
                                    </label>
                                    
                                    <div class= "task-content">
                                    ${task.text}
                                    ${dateDisplay}
                                    </div>
                                    <div class= "task-actions">
                                        <button class = "task-btn complete-btn" title = "${task.completed ? 'Mark as incomplete' : 'Mark as Completed'}">
                                            <i class = " fas ${task.completed ? 'fa-undo' : 'fa-check'}"> </i>
                                        </button>
                                        <button class= "task-btn delete-btn" title = "Delete task">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div> `;

            taskList.appendChild(taskElement);
            
            const checkbox = taskElement.querySelector('input[type="checkbox"]');
            const completeBtn = taskElement.querySelector('.complete-btn');
            const deleteBtn = taskElement.querySelector('.delete-btn');

            checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
            completeBtn.addEventListener('click', ()=> toggleTaskComplete(task.id));
            deleteBtn.addEventListener('click', ()=> deleteTask(task.id));
        });
    }

    function updateStats() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter( task => task.completed).length;
        totalTasksEl.textContent = `${totalTasks} ${totalTasks === 1 ? 'task' : 'tasks'}`;
        completedTasksEl.textContent = `${completedTasks} completed`;
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    init();
});
