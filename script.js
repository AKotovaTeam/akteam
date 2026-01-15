// Исходные данные из плана
const phasesData = [
    { id: 1, name: 'Workers', files: 34, lines: 4640, mrs: 18, hours: 25 },
    { id: 2, name: 'Crons', files: 32, lines: 9829, mrs: 22, hours: 32 },
    { id: 3, name: 'Html', files: 64, lines: 17598, mrs: 41, hours: 59 },
    { id: 4, name: 'Rpc', files: 8, lines: 3361, mrs: 6, hours: 9 },
    { id: 5, name: 'Base Controllers', files: 3, lines: 600, mrs: 3, hours: 4 },
    { id: 6, name: 'Components', files: 537, lines: 102875, mrs: 250, hours: 350 },
    { id: 7, name: 'ServiceProvider', files: 137, lines: 23001, mrs: 60, hours: 84 },
    { id: 8, name: 'Models/DAOs', files: 114, lines: 10904, mrs: 35, hours: 49 },
    { id: 9, name: 'System Core', files: 28, lines: 5485, mrs: 18, hours: 25 },
    { id: 10, name: 'Supporting Modules', files: 145, lines: 31500, mrs: 50, hours: 70 },
    { id: 11, name: 'Infrastructure', files: 20, lines: 1000, mrs: 5, hours: 7 }
];

const totalHours = 714;
const totalMRs = 508;

const programmerNames = {
    programmer1: 'Женя',
    programmer2: 'Юра',
    programmer3: 'Рома'
};

const programmerIcons = {
    programmer1: '👨‍💻',
    programmer2: '👨‍💻',
    programmer3: '👨‍💻'
};

// Состояние приложения
let appState = {
    phases: phasesData.map(phase => ({
        ...phase,
        completedMRs: [], // Массив ID завершенных MRs
        mrsList: Array.from({ length: phase.mrs }, (_, i) => ({
            id: `${phase.id}-mr-${i + 1}`,
            number: i + 1,
            assignedTo: null // Программист, назначенный на MR
        }))
    }))
};

// Вычисление прогресса на основе завершенных MRs
function calculateProgress(phase) {
    const totalMRs = phase.mrsList ? phase.mrsList.length : phase.mrs;
    if (totalMRs === 0) return 0;
    return Math.round((phase.completedMRs.length / totalMRs) * 100);
}

// Равномерное распределение MRs между программистами
function distributeTasksEvenly() {
    const programmers = ['programmer1', 'programmer2', 'programmer3'];
    let programmerIndex = 0;
    
    appState.phases.forEach(phase => {
        phase.mrsList.forEach(mr => {
            // Пропускаем уже назначенные MRs, если пользователь хочет сохранить их
            // Но для равномерного распределения назначим всех заново
            mr.assignedTo = programmers[programmerIndex];
            programmerIndex = (programmerIndex + 1) % programmers.length;
        });
    });
    
    saveState();
    renderPhases();
    renderProgrammers();
    updateStats();
}

// Инициализация
function init() {
    try {
        console.log('Инициализация приложения...');
        console.log('Количество фаз:', appState.phases.length);
        
        // Ждем инициализации Firebase (если нужно)
        const checkFirebase = () => {
            if (typeof database !== 'undefined' && firebaseConfig && firebaseConfig.apiKey !== "YOUR_API_KEY") {
                console.log('✅ Firebase готов к использованию');
                // Загружаем состояние (асинхронно для Firebase)
                loadState();
                
                // Настраиваем слушатель изменений в Firebase для синхронизации
                database.ref('refactoringTracker').on('value', (snapshot) => {
                    const saved = snapshot.val();
                    if (saved && saved.phases) {
                        console.log('📥 Получены обновления из Firebase');
                        isUpdatingFromFirebase = true;
                        applySavedState(saved);
                        renderPhases();
                        renderProgrammers();
                        updateStats();
                        isUpdatingFromFirebase = false;
                    }
                });
            } else {
                console.log('⚠️ Firebase не настроен, используем localStorage');
                // Загружаем состояние из localStorage
                loadState();
            }
        };
        
        // Проверяем Firebase сразу или через небольшую задержку
        if (typeof database !== 'undefined') {
            checkFirebase();
        } else {
            // Ждем немного, если Firebase еще загружается
            setTimeout(checkFirebase, 500);
        }
        
        // Рендерим интерфейс сразу (независимо от Firebase)
        renderPhases();
        console.log('Фазы отрендерены');
        renderProgrammers();
        updateStats();
        setupEventListeners();
        
        // Проверяем, есть ли назначенные MRs. Если нет - распределяем автоматически
        setTimeout(() => {
            const hasAssignments = appState.phases.some(phase => 
                phase.mrsList.some(mr => mr.assignedTo !== null)
            );
            if (!hasAssignments) {
                console.log('Автоматическое распределение задач...');
                distributeTasksEvenly();
            }
        }, 1500); // Даем время на загрузку данных из Firebase
        
        console.log('Инициализация завершена');
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        alert('Ошибка загрузки приложения. Проверьте консоль браузера (F12)');
    }
}

// Загрузка состояния из localStorage
function loadState() {
    // Сначала пытаемся загрузить из Firebase
    if (typeof database !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY") {
        database.ref('refactoringTracker').once('value')
            .then((snapshot) => {
                const saved = snapshot.val();
                if (saved && saved.phases) {
                    console.log('Данные загружены из Firebase');
                    applySavedState(saved);
                    renderPhases();
                    renderProgrammers();
                    updateStats();
                } else {
                    // Если в Firebase нет данных, загружаем из localStorage
                    loadFromLocalStorage();
                }
            })
            .catch((error) => {
                console.error('Ошибка загрузки из Firebase:', error);
                // Fallback на localStorage
                loadFromLocalStorage();
            });
    } else {
        // Используем localStorage как fallback
        loadFromLocalStorage();
    }
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('refactoringTracker');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            applySavedState(parsed);
        } catch (e) {
            console.error('Ошибка загрузки данных из localStorage:', e);
        }
    }
}

function applySavedState(saved) {
    // Объединяем сохраненные данные с исходными
    appState.phases = phasesData.map((phase, index) => {
        const savedPhase = saved.phases[index];
        const defaultMRsList = Array.from({ length: phase.mrs }, (_, i) => ({
            id: `${phase.id}-mr-${i + 1}`,
            number: i + 1,
            assignedTo: null
        }));
        
        if (savedPhase) {
            // Восстанавливаем назначения MRs, если они есть
            let mrsList = savedPhase.mrsList || defaultMRsList;
            // Если MRs меньше, чем должно быть, дополняем
            while (mrsList.length < phase.mrs) {
                mrsList.push({
                    id: `${phase.id}-mr-${mrsList.length + 1}`,
                    number: mrsList.length + 1,
                    assignedTo: null
                });
            }
            // Если MRs больше, обрезаем
            if (mrsList.length > phase.mrs) {
                mrsList.splice(phase.mrs);
            }
            
            return {
                ...phase,
                completedMRs: savedPhase.completedMRs || [],
                mrsList: mrsList
            };
        }
        return { 
            ...phase, 
            completedMRs: [],
            mrsList: defaultMRsList
        };
    });
}

// Флаг для предотвращения бесконечного цикла обновлений
let isUpdatingFromFirebase = false;

// Сохранение состояния в Firebase или localStorage (fallback)
function saveState() {
    // Не сохраняем, если обновление идет из Firebase (чтобы избежать бесконечного цикла)
    if (isUpdatingFromFirebase) {
        return;
    }
    
    const dataToSave = {
        phases: appState.phases.map(p => ({
            id: p.id,
            name: p.name,
            completedMRs: p.completedMRs,
            mrsList: p.mrsList
        })),
        lastUpdated: new Date().toISOString(),
        updatedBy: getCurrentUser() || 'anonymous'
    };
    
    // Сохраняем в Firebase, если настроен
    if (typeof database !== 'undefined' && firebaseConfig && firebaseConfig.apiKey !== "YOUR_API_KEY") {
        database.ref('refactoringTracker').set(dataToSave)
            .then(() => {
                console.log('✅ Данные сохранены в Firebase');
            })
            .catch((error) => {
                console.error('❌ Ошибка сохранения в Firebase:', error);
                // Fallback на localStorage
                localStorage.setItem('refactoringTracker', JSON.stringify(dataToSave));
                console.log('💾 Данные сохранены в localStorage (fallback)');
            });
    } else {
        // Используем localStorage как fallback
        localStorage.setItem('refactoringTracker', JSON.stringify(dataToSave));
        console.log('💾 Данные сохранены в localStorage');
    }
}

// Получение текущего пользователя (можно расширить для авторизации)
function getCurrentUser() {
    // Пока возвращаем имя из localStorage или prompt
    let userName = localStorage.getItem('userName');
    if (!userName) {
        userName = prompt('Введите ваше имя для отслеживания изменений:') || 'anonymous';
        localStorage.setItem('userName', userName);
    }
    return userName;
}

// Рендеринг фаз
function renderPhases() {
    const container = document.getElementById('phasesContainer');
    if (!container) {
        console.error('Контейнер phasesContainer не найден!');
        return;
    }
    
    const filterElement = document.getElementById('programmerFilter');
    if (!filterElement) {
        console.error('Элемент programmerFilter не найден!');
        return;
    }
    
    const filter = filterElement.value;
    
    container.innerHTML = '';
    
    if (!appState || !appState.phases || appState.phases.length === 0) {
        console.error('Нет данных о фазах!');
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: red;">Ошибка: данные о фазах не загружены</div>';
        return;
    }
    
    console.log('Рендеринг', appState.phases.length, 'фаз');
    
    appState.phases.forEach(phase => {
        // Фильтрация по программисту - показываем фазу, если у неё есть MRs, назначенные программисту
        if (filter !== 'all') {
            const hasAssignedMRs = phase.mrsList.some(m => m.assignedTo === filter);
            if (!hasAssignedMRs) {
                return;
            }
        }
        
        try {
            const phaseCard = createPhaseCard(phase);
            container.appendChild(phaseCard);
        } catch (error) {
            console.error('Ошибка создания карточки фазы', phase.id, error);
        }
    });
}

// Создание карточки фазы
function createPhaseCard(phase) {
    const card = document.createElement('div');
    const progress = calculateProgress(phase);
    const completedMRsCount = phase.completedMRs.length;
    const completedHours = Math.round((phase.hours * progress) / 100);
    
    card.className = `phase-card ${progress === 100 ? 'completed' : ''}`;
    card.dataset.phaseId = phase.id;
    
    // Подсчет MRs по программистам
    const mrsByProgrammer = {};
    phase.mrsList.forEach(mr => {
        if (mr.assignedTo) {
            mrsByProgrammer[mr.assignedTo] = (mrsByProgrammer[mr.assignedTo] || 0) + 1;
        }
    });
    
    const assignedBadges = Object.keys(mrsByProgrammer).map(progId => 
        `<span class="programmer-badge ${progId}">
            ${programmerIcons[progId]} ${programmerNames[progId]}: ${mrsByProgrammer[progId]} MRs
        </span>`
    ).join(' ');
    
    // Генерируем список MRs с назначениями
    const mrsListHTML = phase.mrsList.map((mr) => {
        const mrId = `${phase.id}-${mr.number}`;
        const isCompleted = phase.completedMRs.includes(mrId);
        const assignedBadge = mr.assignedTo 
            ? `<span class="programmer-badge-small ${mr.assignedTo}">
                ${programmerIcons[mr.assignedTo]} ${programmerNames[mr.assignedTo]}
               </span>`
            : '<span class="text-muted">Не назначен</span>';
        return `
            <div class="mr-item ${isCompleted ? 'completed' : ''}">
                <label class="mr-checkbox-label">
                    <input 
                        type="checkbox" 
                        ${isCompleted ? 'checked' : ''}
                        data-phase-id="${phase.id}"
                        data-mr-id="${mrId}"
                        class="mr-checkbox"
                    >
                    <span class="mr-label">
                        <span class="mr-number">MR #${mr.number}</span>
                        ${isCompleted ? '<span class="mr-checkmark">✓</span>' : ''}
                    </span>
                </label>
                <div class="mr-assignment">
                    ${assignedBadge}
                    <button class="assign-mr-btn-small" data-phase-id="${phase.id}" data-mr-id="${mr.id}">
                        ${mr.assignedTo ? '✏️' : '👤'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    card.innerHTML = `
        <div class="phase-header-compact">
            <div class="phase-title-compact">
                <span class="phase-number">${phase.id}.</span>
                <span class="phase-name">${phase.name}</span>
                <span class="phase-progress-badge">${progress}%</span>
            </div>
            <div class="phase-stats-compact">
                <span>📄 ${phase.files.length}</span>
                <span>📝 ${phase.lines.toLocaleString()}</span>
                <span>🔀 ${completedMRsCount}/${phase.mrsList.length}</span>
                <span>⏱️ ${completedHours}h/${phase.hours}h</span>
            </div>
        </div>
        <div class="progress-bar-compact">
            <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="mrs-container-compact">
            <div class="mrs-list-compact">
                ${mrsListHTML}
            </div>
        </div>
    `;
    
    // Обработчики событий для чекбоксов MRs
    const checkboxes = card.querySelectorAll('.mr-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const phaseId = parseInt(e.target.dataset.phaseId);
            const mrId = e.target.dataset.mrId;
            toggleMR(phaseId, mrId, e.target.checked);
        });
    });
    
    // Обработчики для назначения программиста на MRs
    const assignMRBtns = card.querySelectorAll('.assign-mr-btn-small');
    assignMRBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const phaseId = parseInt(e.target.closest('button').dataset.phaseId);
            const mrId = e.target.closest('button').dataset.mrId;
            openAssignMRModal(phaseId, mrId);
        });
    });
    
    return card;
}

// Переключение статуса MR
function toggleMR(phaseId, mrId, isCompleted) {
    const phase = appState.phases.find(p => p.id === phaseId);
    if (phase) {
        if (isCompleted) {
            if (!phase.completedMRs.includes(mrId)) {
                phase.completedMRs.push(mrId);
            }
        } else {
            phase.completedMRs = phase.completedMRs.filter(id => id !== mrId);
        }
        saveState();
        renderPhases();
        updateStats();
        renderProgrammers();
    }
}

// Открытие модального окна назначения MR
function openAssignMRModal(phaseId, mrId) {
    const modal = document.getElementById('assignModal');
    const phase = appState.phases.find(p => p.id === phaseId);
    const mr = phase?.mrsList.find(m => m.id === mrId);
    
    if (phase && mr) {
        document.getElementById('modalPhaseName').textContent = `${phase.id}. ${phase.name} - MR #${mr.number}`;
        document.getElementById('modalDescription').textContent = `Выберите программиста для MR:`;
        modal.dataset.phaseId = phaseId;
        modal.dataset.mrId = mrId;
        modal.style.display = 'block';
    }
}

// Открытие модального окна назначения (устаревшее, для совместимости)
function openAssignModal(phaseId) {
    // Больше не используется, но оставлено для совместимости
}

// Закрытие модального окна
function closeAssignModal() {
    const modal = document.getElementById('assignModal');
    modal.style.display = 'none';
}

// Назначение программиста на MR
function assignProgrammer(phaseId, programmer, mrId = null) {
    const phase = appState.phases.find(p => p.id === phaseId);
    if (!phase) return;
    
    if (mrId) {
        // Назначение на конкретный MR
        const mr = phase.mrsList.find(m => m.id === mrId);
        if (mr) {
            mr.assignedTo = programmer === 'unassigned' ? null : programmer;
            saveState();
            renderPhases();
            renderProgrammers();
            closeAssignModal();
        }
    }
}

// Рендеринг секции программистов
function renderProgrammers() {
    const container = document.getElementById('programmersGrid');
    container.innerHTML = '';
    
    Object.keys(programmerNames).forEach(programmerId => {
        const programmerCard = createProgrammerCard(programmerId);
        container.appendChild(programmerCard);
    });
}

// Создание карточки программиста
function createProgrammerCard(programmerId) {
    // Собираем все MRs, назначенные программисту
    let assignedMRs = [];
    let totalAssignedHours = 0;
    let totalAssignedMRs = 0;
    let completedHours = 0;
    let completedMRs = 0;
    
    appState.phases.forEach(phase => {
        const programmerMRs = phase.mrsList.filter(m => m.assignedTo === programmerId);
        if (programmerMRs.length > 0) {
            // Вычисляем долю MRs программиста в фазе
            const mrsRatio = programmerMRs.length / phase.mrsList.length;
            const phaseHours = phase.hours * mrsRatio;
            const phaseMRsCount = programmerMRs.length;
            
            totalAssignedHours += phaseHours;
            totalAssignedMRs += phaseMRsCount;
            
            // Считаем завершенные MRs программиста
            const completedMRsInPhase = programmerMRs.filter(mr => {
                const mrId = `${phase.id}-${mr.number}`;
                return phase.completedMRs.includes(mrId);
            }).length;
            
            const progress = completedMRsInPhase / programmerMRs.length;
            completedHours += (phaseHours * progress);
            completedMRs += completedMRsInPhase;
            
            assignedMRs.push({
                phase: phase,
                mrs: programmerMRs,
                mrsCount: programmerMRs.length,
                completedCount: completedMRsInPhase
            });
        }
    });
    
    const progressPercent = totalAssignedHours > 0 
        ? Math.round((completedHours / totalAssignedHours) * 100) 
        : 0;
    
    const card = document.createElement('div');
    card.className = 'programmer-card';
    
    card.innerHTML = `
        <div class="programmer-card-header">
            <span class="programmer-icon-large">${programmerIcons[programmerId]}</span>
            <div>
                <div class="programmer-name">${programmerNames[programmerId]}</div>
                <div style="font-size: 12px; color: var(--text-secondary);">
                    ${totalAssignedMRs} MRs
                </div>
            </div>
        </div>
        <div class="programmer-stats">
            <div class="programmer-stat">
                <div class="programmer-stat-value">${Math.round(completedHours)}h</div>
                <div class="programmer-stat-label">из ${totalAssignedHours}h</div>
            </div>
            <div class="programmer-stat">
                <div class="programmer-stat-value">${Math.round(completedMRs)}</div>
                <div class="programmer-stat-label">из ${totalAssignedMRs} MRs</div>
            </div>
        </div>
        <div style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 12px; color: var(--text-secondary);">Прогресс</span>
                <span style="font-weight: 600; color: var(--primary-color);">${progressPercent}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
            </div>
        </div>
        <div class="programmer-phases">
            ${assignedMRs.length > 0 
                ? assignedMRs.map(item => {
                    const progress = item.mrsCount > 0 
                        ? Math.round((item.completedCount / item.mrsCount) * 100) 
                        : 0;
                    return `
                    <div class="programmer-phase-item">
                        <span class="programmer-phase-name">${item.phase.id}. ${item.phase.name}</span>
                        <span class="programmer-phase-progress">${item.completedCount}/${item.mrsCount} MRs, ${progress}%</span>
                    </div>
                `;
                }).join('')
                : '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">Нет назначенных MRs</div>'
            }
        </div>
    `;
    
    return card;
}

// Обновление общей статистики
function updateStats() {
    let totalCompletedHours = 0;
    let totalCompletedMRs = 0;
    let completedPhases = 0;
    
    appState.phases.forEach(phase => {
        const progress = calculateProgress(phase);
        totalCompletedHours += (phase.hours * progress / 100);
        totalCompletedMRs += phase.completedMRs.length;
        if (progress === 100) {
            completedPhases++;
        }
    });
    
    const totalProgress = Math.round((totalCompletedHours / totalHours) * 100);
    
    document.getElementById('totalProgress').textContent = `${totalProgress}%`;
    document.getElementById('totalProgressBar').style.width = `${totalProgress}%`;
    document.getElementById('completedHours').textContent = `${Math.round(totalCompletedHours)}h`;
    document.getElementById('completedPhases').textContent = completedPhases;
    document.getElementById('completedMRs').textContent = totalCompletedMRs;
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Фильтр по программисту
    document.getElementById('programmerFilter').addEventListener('change', renderPhases);
    
    // Модальное окно
    const modal = document.getElementById('assignModal');
    const closeBtn = modal.querySelector('.close');
    
    closeBtn.addEventListener('click', closeAssignModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeAssignModal();
        }
    });
    
    // Кнопки назначения программиста (делегирование событий)
    modal.addEventListener('click', (e) => {
        if (e.target.closest('.programmer-btn')) {
            const btn = e.target.closest('.programmer-btn');
            const programmer = btn.dataset.programmer;
            const phaseId = parseInt(modal.dataset.phaseId);
            if (phaseId) {
                assignProgrammer(phaseId, programmer);
            }
        }
    });
    
    // Кнопка распределения задач
    document.getElementById('distributeBtn').addEventListener('click', () => {
        if (confirm('Распределить все MRs равномерно между Женей, Юрой и Ромой? Текущие назначения будут перезаписаны.')) {
            distributeTasksEvenly();
        }
    });
    
    // Кнопка распределения задач
    document.getElementById('distributeBtn').addEventListener('click', () => {
        if (confirm('Распределить все MRs равномерно между Женей, Юрой и Ромой? Текущие назначения будут перезаписаны.')) {
            distributeTasksEvenly();
        }
    });
    
    // Кнопка сброса
    document.getElementById('resetBtn').addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите сбросить весь прогресс? Это действие нельзя отменить.')) {
            appState.phases = phasesData.map(phase => ({
                ...phase,
                completedMRs: [],
                mrsList: Array.from({ length: phase.mrs }, (_, i) => ({
                    id: `${phase.id}-mr-${i + 1}`,
                    number: i + 1,
                    assignedTo: null
                }))
            }));
            saveState();
            renderPhases();
            updateStats();
            renderProgrammers();
        }
    });
    
    // Кнопка экспорта
    document.getElementById('exportBtn').addEventListener('click', () => {
        exportData();
    });
}

// Экспорт данных
function exportData() {
    let totalCompletedHours = 0;
    let totalCompletedMRs = 0;
    let completedPhases = 0;
    
    appState.phases.forEach(phase => {
        const progress = calculateProgress(phase);
        totalCompletedHours += (phase.hours * progress / 100);
        totalCompletedMRs += phase.completedMRs.length;
        if (progress === 100) {
            completedPhases++;
        }
    });
    
    const data = {
        timestamp: new Date().toISOString(),
        phases: appState.phases.map(p => ({
            id: p.id,
            name: p.name,
            progress: calculateProgress(p),
            completedMRs: p.completedMRs,
            assignedTo: p.assignedTo,
            hours: p.hours,
            mrs: p.mrs
        })),
        summary: {
            totalProgress: Math.round((totalCompletedHours / totalHours) * 100),
            completedHours: Math.round(totalCompletedHours),
            completedMRs: totalCompletedMRs,
            completedPhases: completedPhases
        }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `refactoring-progress-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', init);

