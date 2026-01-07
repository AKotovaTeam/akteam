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
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
} else {
    console.warn('Firebase не загружен. Убедитесь, что скрипты Firebase подключены в index.html');
}

