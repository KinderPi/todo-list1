// Получаем элементы
const form = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const totalTasksSpan = document.getElementById('total-tasks');
const completedTasksSpan = document.getElementById('completed-tasks');
const filterButtons = document.querySelectorAll('.filter-btn');
const clearAllBtn = document.getElementById('clear-all');

let currentFilter = 'all'; // all, active, completed

// Загружаем задачи
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
renderTasks();

// Добавление новой задачи
form.addEventListener('submit', function (event) {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (text !== '') {
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
  taskList.innerHTML = '';

  const filteredTasks = tasks.filter(task => {
    if (currentFilter === 'active') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true;
  });

  filteredTasks.forEach(task => {
    const li = document.createElement('li');
    li.className = task.completed ? 'completed' : '';
    li.setAttribute('draggable', 'true');
    li.dataset.id = task.id;

    // Текст задачи
    const span = document.createElement('span');
    span.textContent = task.text;
    span.style.cursor = 'pointer';
    span.addEventListener('click', () => toggleTask(task.id));

    // Кнопка "Редактировать"
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Редактировать';
    editBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = task.text;
      input.className = 'edit-input';
      li.innerHTML = '';
      li.appendChild(input);
      input.focus();

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const newText = input.value.trim();
          if (newText !== '') {
            task.text = newText;
            saveTasks();
            renderTasks();
          }
        }
      });

      input.addEventListener('blur', () => {
        renderTasks();
      });
    });

    // Кнопка "Удалить"
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Удалить';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    li.appendChild(span);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    li.classList.add('fade-in');
    taskList.appendChild(li);
  });

  updateStats();
}

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
  }
});

taskList.addEventListener('dragend', (e) => {
  if (e.target.tagName === 'LI') {
    e.target.classList.remove('dragging');

    const newOrder = [...taskList.children].map(li => parseInt(li.dataset.id));
    const newTasks = [];

    newOrder.forEach(id => {
      const task = tasks.find(t => t.id === id);
      if (task) newTasks.push(task);
    });

    tasks = newTasks;
    saveTasks();
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
