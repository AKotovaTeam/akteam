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
    const maxAttempts = 10;
    
    const tryInit = () => {
        attempts++;
        
        if (typeof firebase === 'undefined' || typeof firebase.initializeApp === 'undefined') {
            if (attempts < maxAttempts) {
                console.log(`Попытка ${attempts}: Ожидание загрузки Firebase...`);
                setTimeout(tryInit, 200);
                return;
            } else {
                console.error('❌ Firebase SDK не загружен после', maxAttempts, 'попыток!');
                console.error('Проверьте подключение скриптов в index.html и консоль на ошибки');
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
            return true;
        } catch (error) {
            console.error('❌ Ошибка инициализации Firebase:', error);
            return false;
        }
    };
    
    return tryInit();
}

// Пытаемся инициализировать сразу, если Firebase уже загружен
if (typeof firebase !== 'undefined') {
    initializeFirebase();
} else {
    // Если Firebase еще не загружен, ждем загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFirebase);
    } else {
        // DOM уже загружен, но Firebase может еще загружаться
        setTimeout(() => {
            if (typeof firebase !== 'undefined') {
                initializeFirebase();
            } else {
                console.error('❌ Firebase не загрузился после ожидания');
            }
        }, 100);
    }
}

