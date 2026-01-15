// Firebase конфигурация
const firebaseConfig = {
    apiKey: "AIzaSyBJKo8yFy1Gtob0raHOMJaqC4mF_8NVkxI",
    authDomain: "air-rfc.firebaseapp.com",
    projectId: "air-rfc",
    storageBucket: "air-rfc.firebasestorage.app",
    messagingSenderId: "409531141968",
    appId: "1:409531141968:web:1e6148b2389c57e87fe655",
    // databaseURL будет добавлен после создания Realtime Database
    databaseURL: "https://air-rfc-default-rtdb.firebaseio.com/"
};

// Инициализация Firebase (CDN версия)
let database; // Глобальная переменная для доступа из других скриптов

// Функция инициализации Firebase
function initializeFirebase() {
    // Проверяем наличие firebase несколько раз с задержкой
    let attempts = 0;
    const maxAttempts = 30; // Еще больше попыток
    
    const tryInit = () => {
        attempts++;
        
        // Проверяем наличие firebase и его методов
        if (typeof firebase === 'undefined') {
            if (attempts < maxAttempts) {
                if (attempts % 5 === 0) { // Логируем каждую 5-ю попытку
                    console.log(`Попытка ${attempts}/${maxAttempts}: Ожидание загрузки Firebase...`);
                }
                setTimeout(tryInit, 500); // Увеличиваем задержку до 500мс
                return;
            } else {
                console.error('❌ Firebase SDK не загружен после', maxAttempts, 'попыток!');
                console.error('Диагностика:');
                console.error('1. Проверьте вкладку Network - загружаются ли firebase-app.js и firebase-database.js?');
                console.error('2. Проверьте, нет ли ошибок CORS (красные записи в Network)');
                console.error('3. Отключите блокировщики рекламы и расширения браузера');
                console.error('4. Попробуйте открыть сайт в режиме инкогнито');
                console.error('5. Проверьте консоль на наличие других ошибок выше');
                return false;
            }
        }
        
        // Проверяем наличие метода initializeApp
        if (typeof firebase.initializeApp === 'undefined') {
            if (attempts < maxAttempts) {
                if (attempts % 5 === 0) {
                    console.log(`Попытка ${attempts}/${maxAttempts}: Firebase загружен, но initializeApp еще не доступен...`);
                }
                setTimeout(tryInit, 500);
                return;
            } else {
                console.error('❌ firebase.initializeApp не найден после загрузки!');
                console.error('firebase объект:', firebase);
                return false;
            }
        }
        
        try {
            // Проверяем, не инициализирован ли уже Firebase
            if (!firebase.apps || firebase.apps.length === 0) {
                firebase.initializeApp(firebaseConfig);
            }
            database = firebase.database();
            console.log('✅ Firebase инициализирован успешно');
            console.log('📊 Database URL:', firebaseConfig.databaseURL);
            
            // Уведомляем о готовности Firebase
            window.firebaseReady = true;
            const event = new CustomEvent('firebaseReady');
            window.dispatchEvent(event);
            
            return true;
        } catch (error) {
            console.error('❌ Ошибка инициализации Firebase:', error);
            console.error('Stack trace:', error.stack);
            return false;
        }
    };
    
    return tryInit();
}

// Пытаемся инициализировать Firebase после загрузки всех скриптов
function startFirebaseInit() {
    // Ждем полной загрузки страницы
    if (document.readyState === 'loading') {
        window.addEventListener('load', function() {
            console.log('📄 Страница загружена, начинаем инициализацию Firebase...');
            setTimeout(initializeFirebase, 2000); // Даем 2 секунды на загрузку всех скриптов
        });
    } else if (document.readyState === 'interactive') {
        window.addEventListener('load', function() {
            console.log('📄 Страница интерактивна, начинаем инициализацию Firebase...');
            setTimeout(initializeFirebase, 2000);
        });
    } else {
        // DOM уже полностью загружен
        console.log('📄 DOM готов, начинаем инициализацию Firebase...');
        setTimeout(initializeFirebase, 2000);
    }
}

// Запускаем инициализацию
startFirebaseInit();

