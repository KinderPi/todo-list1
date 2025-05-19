// Получаем элементы
const form = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const totalTasksSpan = document.getElementById('total-tasks');
const completedTasksSpan = document.getElementById('completed-tasks');
const filterButtons = document.querySelectorAll('.filter-btn');
const clearAllBtn = document.getElementById('clear-all');

let currentFilter = 'all'; // all, active, completed
let isDragging = false; // Флаг для отключения рендера при drag & drop

// Загружаем задачи
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
renderTasks();

// Добавление новой задачи
form.addEventListener('submit', function (event) {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (text) {
    const newTask = {
      id: Date.now(),
      text: text,
      completed: false
    };
    tasks.push(newTask);
    saveTasks();
    renderTasks();
    taskInput.value = '';
  }
});

// Переключение фильтров
filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    currentFilter = button.getAttribute('data-filter');
    renderTasks();
  });
});

// Отображение задач
function renderTasks() {
  if (isDragging) return;

  const filteredTasks = tasks.filter(task => {
    if (currentFilter === 'active') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true;
  });

  taskList.innerHTML = filteredTasks.map(task => `
    <li 
      class="${task.completed ? 'completed' : ''}" 
      draggable="true" 
      data-id="${task.id}">
      <span style="cursor: pointer;">${task.text}</span>
      <button class="edit">Редактировать</button>
      <button class="delete">Удалить</button>
    </li>
  `).join('');

  updateStats();
}

// Обработчик кликов по списку задач (делегирование)
taskList.addEventListener('click', function(e) {
  if (e.target.tagName === 'BUTTON' && e.target.classList.contains('delete')) {
    const id = parseInt(e.target.closest('li').dataset.id);
    deleteTask(id);
    return;
  }

  if (e.target.tagName === 'BUTTON' && e.target.classList.contains('edit')) {
    const li = e.target.closest('li');
    const span = li.querySelector('span');
    const id = parseInt(li.dataset.id);
    const oldText = span.textContent;

    // Создаем инпут
    const input = document.createElement('input');
    input.type = 'text';
    input.value = oldText;
    input.className = 'edit-input';

    // Заменяем span на инпут
    li.innerHTML = '';
    li.appendChild(input);
    input.focus();

    // Сохранение при Enter
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const newText = input.value.trim();
        if (newText !== '') {
          tasks = tasks.map(task => 
            task.id === id ? { ...task, text: newText } : task
          );
          saveTasks();
          renderTasks();
        }
      }
    });

    // Возврат при потере фокуса
    input.addEventListener('blur', () => {
      renderTasks();
    });
  }
});

// Переключение выполнения
function toggleTask(id) {
  tasks = tasks.map(task =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderTasks();
}

// Удаление задачи с анимацией
function deleteTask(id) {
  const task = tasks.find(t => t.id === id);
  const li = [...taskList.children].find(li =>
    li.querySelector('span')?.textContent === task?.text
  );

  if (li) {
    li.classList.add('fade-out');
    setTimeout(() => {
      tasks = tasks.filter(t => t.id !== id);
      saveTasks();
      renderTasks();
    }, 300);
  } else {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
  }
}

// Кнопка "Очистить все"
clearAllBtn.addEventListener('click', () => {
  if (confirm('Вы уверены, что хотите удалить все задачи?')) {
    tasks = [];
    saveTasks();
    renderTasks();
  }
});

// Обновление статистики
function updateStats() {
  totalTasksSpan.textContent = tasks.length;
  completedTasksSpan.textContent = tasks.filter(task => task.completed).length;
}

// Сохраняем в localStorage
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Drag and drop — сортировка
taskList.addEventListener('dragstart', (e) => {
  if (e.target.tagName === 'LI') {
    e.target.classList.add('dragging');
    isDragging = true;
  }
});

taskList.addEventListener('dragend', (e) => {
  if (e.target.tagName === 'LI') {
    e.target.classList.remove('dragging');
    isDragging = false;

    const newOrder = [...taskList.children].map(li => parseInt(li.dataset.id));
    const newTasks = [];

    newOrder.forEach(id => {
      const task = tasks.find(t => t.id === id);
      if (task) newTasks.push(task);
    });

    tasks = newTasks;
    saveTasks();
    renderTasks();
  }
});

taskList.addEventListener('dragover', (e) => {
  e.preventDefault();
  const dragging = document.querySelector('.dragging');
  const afterElement = getDragAfterElement(taskList, e.clientY);
  if (afterElement == null) {
    taskList.appendChild(dragging);
  } else {
    taskList.insertBefore(dragging, afterElement);
  }
});

function getDragAfterElement(container, y) {
  const elements = [...container.querySelectorAll('li:not(.dragging)')];

  return elements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}