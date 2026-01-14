/* public/firebase-messaging-sw.js */

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
 apiKey: "AIzaSyDSfcNspKnmTuRsAzD2JJERxoK4-urvZ-g",
  authDomain: "campobite-fc485.firebaseapp.com",
  projectId: "campobite-fc485",
  storageBucket: "campobite-fc485.firebasestorage.app",
  messagingSenderId: "148663601397",
  appId: "1:148663601397:web:7b066b60bfcec059239dbc",
  measurementId: "G-J8TJENCSZM"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log('[firebase-messaging-sw.js] Background message ', payload);

  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/logo.png',
  });
});
