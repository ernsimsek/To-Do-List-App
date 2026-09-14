# Luma — Daily Planner

Luma is a dependency-free personal planner designed to make each day feel clearer, calmer, and easier to manage.

## Luma 2.0

The second-generation interface introduces a premium three-panel desktop workspace, a focused task canvas, live daily insights, five complete accent palettes, and an app-like mobile navigation pattern. The visual upgrade remains lightweight: there are no framework, image, icon-font, or web-font dependencies.

## Features

- Smart All Tasks, Today, Upcoming, and Completed views
- Instant search across task names and categories (`/` shortcut)
- Smart, due-date, priority, and creation-date sorting
- Add, complete, delete, and inline-edit tasks
- Due date, time, category, and three priority levels
- Today/Tomorrow quick date selection
- Automatic overdue-task highlighting
- Completion rate and daily progress summary
- Light/dark appearance and three accent colors
- Persistent browser storage through LocalStorage
- Responsive layouts for desktop, tablet, and mobile
- Mobile-only momentum, task metrics, and next-focus dashboard
- Keyboard navigation and reduced-motion support
- Render containment and delegated task events for long-list performance

## Usage

No installation or build step is required. Open `index.html` in a browser.

- Select **New task** to open the task composer.
- Press `/` to search or `Ctrl + Enter` to jump to the task composer.
- Double-click a task name to edit it. Press `Enter` to save or `Esc` to cancel.

## Technical structure

The project uses semantic HTML, modern CSS, and Vanilla JavaScript. Existing `tasks` LocalStorage data is migrated into the new data model, including legacy Turkish category values.

## Suggested roadmap

1. Recurring tasks and natural-language dates
2. Drag-and-drop ordering and a focus/Pomodoro mode
3. Subtasks and task notes
4. Import/export and cross-device synchronization
5. Weekly productivity insights

<img width="1917" height="867" alt="to-do-list-app" src="https://github.com/user-attachments/assets/27a55696-f958-407c-bc20-47efbda9e251" />
