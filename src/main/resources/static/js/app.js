// ===========================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ===========================================
let currentUser = null;      // Текущий пользователь
let jwtToken = null;        // JWT токен
let taskModal = null;       // Объект модального окна Bootstrap

// ===========================================
// БАЗОВЫЕ НАСТРОЙКИ
// ===========================================
const API = {
    // !!! ВАЖНО: Выбери один путь, который работает в твоем контроллере
    // Если у тебя UserController с @RequestMapping("/v1/api")
    BASE: '/v1/api',
    // Если у тебя TaskRestController с @RequestMapping("/api/v1")
    TASKS: '/api/v1/tasks'
};

// ===========================================
// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
// ===========================================
$(document).ready(function() {
    console.log('Приложение запущено!');

    // Инициализируем модальные окна Bootstrap
    taskModal = new bootstrap.Modal(document.getElementById('taskModal'));

    // Проверяем, есть ли сохраненный токен
    checkSavedAuth();

    // Навешиваем обработчики событий
    bindEvents();
});

// ===========================================
// ПРОВЕРКА СОХРАНЕННОЙ АВТОРИЗАЦИИ
// ===========================================
function checkSavedAuth() {
    const savedToken = localStorage.getItem('jwt_token');
    const savedUser = localStorage.getItem('current_user');

    if (savedToken && savedUser) {
        jwtToken = savedToken;
        currentUser = JSON.parse(savedUser);
        updateUIForAuthUser();
        loadTasks(); // Загружаем задачи
    }
}

// ===========================================
// НАВЕШИВАНИЕ ОБРАБОТЧИКОВ СОБЫТИЙ
// ===========================================
function bindEvents() {
    // Регистрация
    $('#registerBtn').on('click', registerUser);

    // Вход
    $('#loginBtn').on('click', loginUser);

    // Выход
    $('#logoutBtn').on('click', logoutUser);

    // Добавление задачи
    $('#addTaskBtn').on('click', addTask);

    // Добавление задачи по Enter
    $('#taskTitle').on('keypress', function(e) {
        if (e.which === 13) {
            addTask();
        }
    });

    // Удаление задачи
    $('#deleteTaskBtn').on('click', deleteTask);
}

// ===========================================
// РЕГИСТРАЦИЯ
// ===========================================
function registerUser() {
    // Получаем данные из формы
    const email = $('#regEmail').val();
    const name = $('#regName').val();
    const password = $('#regPassword').val();
    const passwordRepeat = $('#regPasswordRepeat').val();

    // Скрываем старую ошибку
    $('#registerError').hide();

    // Валидация на клиенте
    if (!email || !name || !password || !passwordRepeat) {
        showRegisterError('Все поля обязательны для заполнения');
        return;
    }

    if (password !== passwordRepeat) {
        showRegisterError('Пароли не совпадают');
        return;
    }

    if (password.length < 8) {
        showRegisterError('Пароль должен содержать минимум 8 символов');
        return;
    }

    // Отправляем запрос на сервер
    $.ajax({
        url: `${API.BASE}/auth/register`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            email: email,
            name: name,
            password: password
        }),
        success: function(response) {
            console.log('Регистрация успешна:', response);

            // Сохраняем токен и пользователя
            jwtToken = response.token;
            currentUser = response.user;

            // Сохраняем в localStorage (чтобы не терять после перезагрузки)
            localStorage.setItem('jwt_token', jwtToken);
            localStorage.setItem('current_user', JSON.stringify(currentUser));

            // Закрываем модальное окно
            $('#registerModal').modal('hide');

            // Очищаем форму
            $('#registerForm')[0].reset();
            $('#registerError').hide();

            // Обновляем интерфейс
            updateUIForAuthUser();

            // Загружаем задачи
            loadTasks();
        },
        error: function(xhr) {
            console.error('Ошибка регистрации:', xhr);

            // Парсим ошибку с сервера (как в Thymeleaf)
            let errorMessage = 'Ошибка регистрации';

            if (xhr.responseJSON) {
                if (xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                } else if (xhr.responseJSON.errors) {
                    // Если приходят ошибки валидации
                    const errors = xhr.responseJSON.errors;
                    errorMessage = Object.values(errors).join('<br>');
                } else if (xhr.responseJSON.error) {
                    errorMessage = xhr.responseJSON.error;
                }
            } else if (xhr.responseText) {
                errorMessage = xhr.responseText;
            }

            showRegisterError(errorMessage);
        }
    });
}

// Показать ошибку регистрации
function showRegisterError(message) {
    $('#registerError').html(message).show();
}

// ===========================================
// ВХОД В СИСТЕМУ
// ===========================================
function loginUser() {
    const email = $('#loginEmail').val();
    const password = $('#loginPassword').val();

    $('#loginError').hide();

    if (!email || !password) {
        showLoginError('Введите email и пароль');
        return;
    }

    $.ajax({
        url: `${API.BASE}/auth/login`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            email: email,
            password: password
        }),
        success: function(response) {
            console.log('Вход выполнен:', response);

            // Сохраняем токен и данные пользователя
            jwtToken = response.token;
            currentUser = {
                email: response.email,
                name: response.name,
                role: response.role
            };

            localStorage.setItem('jwt_token', jwtToken);
            localStorage.setItem('current_user', JSON.stringify(currentUser));

            // Закрываем модальное окно
            $('#loginModal').modal('hide');

            // Очищаем форму
            $('#loginForm')[0].reset();
            $('#loginError').hide();

            // Обновляем интерфейс
            updateUIForAuthUser();

            // Загружаем задачи
            loadTasks();
        },
        error: function(xhr) {
            console.error('Ошибка входа:', xhr);

            let errorMessage = 'Неверный email или пароль';

            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            } else if (xhr.status === 401) {
                errorMessage = 'Неверный email или пароль';
            } else if (xhr.status === 403) {
                errorMessage = 'Доступ запрещен';
            }

            showLoginError(errorMessage);
        }
    });
}

function showLoginError(message) {
    $('#loginError').html(message).show();
}

// ===========================================
// ВЫХОД ИЗ СИСТЕМЫ
// ===========================================
function logoutUser() {
    // Очищаем localStorage
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('current_user');

    // Сбрасываем переменные
    jwtToken = null;
    currentUser = null;

    // Обновляем интерфейс для неавторизованного пользователя
    updateUIForUnauthUser();

    // Очищаем список задач
    $('#active-tasks, #completed-tasks').empty();
}

// ===========================================
// ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
// ===========================================
function updateUIForAuthUser() {
    // Показываем блок для авторизованных
    $('#authorized-header').show();
    $('#main-content').show();
    $('#unauthorized-header').hide();

    // Показываем имя пользователя
    if (currentUser) {
        $('#current-user').text(currentUser.name || currentUser.email);
    }
}

function updateUIForUnauthUser() {
    // Показываем блок для неавторизованных
    $('#unauthorized-header').show();
    $('#authorized-header').hide();
    $('#main-content').hide();
}

// ===========================================
// AJAX ЗАГОЛОВКИ С ТОКЕНОМ
// ===========================================
function getAuthHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (jwtToken) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
    }

    return headers;
}

// ===========================================
// ЗАГРУЗКА ЗАДАЧ
// ===========================================
function loadTasks() {
    if (!currentUser) return;

    // Показываем загрузку
    $('#active-tasks').html('<div class="loading">Загрузка...</div>');
    $('#completed-tasks').html('<div class="loading">Загрузка...</div>');

    $.ajax({
        url: `${API.TASKS}/tasks`,
        method: 'GET',
        headers: getAuthHeaders(),
        success: function(tasks) {
            console.log('Задачи загружены:', tasks);

            // Разделяем задачи на активные и выполненные
            const activeTasks = tasks.filter(task => task.status !== 'COMPLETED');
            const completedTasks = tasks.filter(task => task.status === 'COMPLETED');

            // Отображаем задачи
            renderTasks(activeTasks, 'active');
            renderTasks(completedTasks, 'completed');
        },
        error: function(xhr) {
            console.error('Ошибка загрузки задач:', xhr);

            if (xhr.status === 401 || xhr.status === 403) {
                // Токен протух или недействителен
                logoutUser();
                showLoginError('Сессия истекла, войдите снова');
                $('#loginModal').modal('show');
            }
        }
    });
}

// ===========================================
// ОТОБРАЖЕНИЕ ЗАДАЧ
// ===========================================
function renderTasks(tasks, type) {
    const container = type === 'active' ? '#active-tasks' : '#completed-tasks';

    if (tasks.length === 0) {
        $(container).html('<p class="text-muted">Нет задач</p>');
        return;
    }

    let html = '';
    tasks.forEach(task => {
        html += `
            <div class="task-item ${type === 'active' ? 'active-task' : 'completed-task'}"
                 onclick="openTaskModal('${task.id}')">
                <strong>${escapeHtml(task.name)}</strong>
                <br>
                <small>${escapeHtml(task.description || 'Нет описания')}</small>
                <br>
                <small class="text-muted">Дедлайн: ${task.deadline || 'Не указан'}</small>
            </div>
        `;
    });

    $(container).html(html);
}

// Экранирование HTML (защита от XSS)
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===========================================
// ДОБАВЛЕНИЕ НОВОЙ ЗАДАЧИ
// ===========================================
function addTask() {
    const title = $('#taskTitle').val().trim();

    if (!title) {
        alert('Введите название задачи');
        return;
    }

    $.ajax({
        url: `${API.TASKS}/tasks`,
        method: 'POST',
        headers: getAuthHeaders(),
        contentType: 'application/json',
        data: JSON.stringify({
            name: title,
            description: '',
            deadline: null
        }),
        success: function(response) {
            console.log('Задача добавлена:', response);

            // Очищаем поле ввода
            $('#taskTitle').val('');

            // Перезагружаем список задач
            loadTasks();
        },
        error: function(xhr) {
            console.error('Ошибка добавления задачи:', xhr);
            alert('Не удалось добавить задачу');
        }
    });
}

// ===========================================
// ОТКРЫТИЕ МОДАЛЬНОГО ОКНА ЗАДАЧИ
// ===========================================
function openTaskModal(taskId) {
    console.log('Открываем задачу:', taskId);

    // Загружаем данные задачи
    $.ajax({
        url: `${API.TASKS}/tasks/${taskId}`,
        method: 'GET',
        headers: getAuthHeaders(),
        success: function(task) {
            console.log('Данные задачи:', task);

            // Заполняем форму
            $('#taskId').val(task.id);
            $('#taskName').val(task.name || '');
            $('#taskDescription').val(task.description || '');
            $('#taskStatus').prop('checked', task.status === 'COMPLETED');

            // Открываем модальное окно
            taskModal.show();
        },
        error: function(xhr) {
            console.error('Ошибка загрузки задачи:', xhr);
            alert('Не удалось загрузить задачу');
        }
    });
}

// ===========================================
// СОХРАНЕНИЕ ПОЛЯ ЗАДАЧИ
// ===========================================
// !!! ВАЖНО: Эта функция вызывается при каждом изменении поля
function saveTaskField(fieldName) {
    const taskId = $('#taskId').val();
    if (!taskId) return;

    let value;
    let updateData = {};

    // Получаем значение в зависимости от поля
    switch(fieldName) {
        case 'name':
            value = $('#taskName').val();
            updateData.name = value;
            break;
        case 'description':
            value = $('#taskDescription').val();
            updateData.description = value;
            break;
        case 'status':
            const isCompleted = $('#taskStatus').is(':checked');
            updateData.status = isCompleted ? 'COMPLETED' : 'ACTIVE';
            break;
    }

    // Добавляем ID задачи
    updateData.id = taskId;

    console.log(`Сохраняем поле ${fieldName}:`, updateData);

    // Отправляем запрос на обновление
    $.ajax({
        url: `${API.TASKS}/tasks`,
        method: 'PATCH',
        headers: getAuthHeaders(),
        contentType: 'application/json',
        data: JSON.stringify(updateData),
        success: function() {
            console.log(`Поле ${fieldName} сохранено`);

            // Если изменили статус, обновляем список задач
            if (fieldName === 'status') {
                loadTasks();
            }
        },
        error: function(xhr) {
            console.error(`Ошибка сохранения ${fieldName}:`, xhr);

            // Восстанавливаем предыдущее значение
            if (fieldName === 'status') {
                $('#taskStatus').prop('checked', !$('#taskStatus').is(':checked'));
            }

            alert('Не удалось сохранить изменения');
        }
    });
}

// ===========================================
// УДАЛЕНИЕ ЗАДАЧИ
// ===========================================
function deleteTask() {
    const taskId = $('#taskId').val();

    if (!taskId) return;

    if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
        $.ajax({
            url: `${API.TASKS}/tasks/${taskId}`,
            method: 'DELETE',
            headers: getAuthHeaders(),
            success: function() {
                console.log('Задача удалена');

                // Закрываем модальное окно
                taskModal.hide();

                // Перезагружаем список задач
                loadTasks();
            },
            error: function(xhr) {
                console.error('Ошибка удаления задачи:', xhr);
                alert('Не удалось удалить задачу');
            }
        });
    }
}