import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

/* --------------------------------------------------
   Firebase Config (FRONTEND ONLY)
-------------------------------------------------- */
const firebaseConfig = {
 apiKey: "AIzaSyDSfcNspKnmTuRsAzD2JJERxoK4-urvZ-g",
  authDomain: "campobite-fc485.firebaseapp.com",
  projectId: "campobite-fc485",
  storageBucket: "campobite-fc485.firebasestorage.app",
  messagingSenderId: "148663601397",
  appId: "1:148663601397:web:7b066b60bfcec059239dbc",
  measurementId: "G-J8TJENCSZM"
};

console.log("[FCM] Firebase config loaded");

/* --------------------------------------------------
   Initialize Firebase
-------------------------------------------------- */
const app = initializeApp(firebaseConfig);
console.log("[FCM] Firebase initialized");

const messaging = getMessaging(app);
console.log("[FCM] Messaging initialized");

/* --------------------------------------------------
   Register Service Worker (REQUIRED)
-------------------------------------------------- */
export const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );
      console.log("[FCM] Service Worker registered:", registration);
      return registration;
    } catch (error) {
      console.error("[FCM] Service Worker registration failed:", error);
    }
  }
};

/* --------------------------------------------------
   Get FCM Token
-------------------------------------------------- */
export const getFcmToken = async () => {
  try {
    console.log("[FCM] Requesting notification permission");

    const permission = await Notification.requestPermission();
    console.log("[FCM] Notification permission:", permission);

    if (permission !== "granted") {
      console.warn("[FCM] Permission not granted");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration:
        await navigator.serviceWorker.ready,
    });

    console.log("[FCM] FCM Token generated:", token);
    return token;
  } catch (error) {
    console.error("[FCM] Error while getting token:", error);
    return null;
  }
};

/* --------------------------------------------------
   Foreground Message Listener
-------------------------------------------------- */
export const listenNotifications = () => {
  onMessage(messaging, (payload) => {
    console.log("[FCM] Foreground message received:", payload);

    if (payload?.notification) {
      new Notification(payload.notification.title ?? "New Notification", {
        body: payload.notification.body,
        icon: "/logo.png",
      });
    }
  });
};

/* --------------------------------------------------
   Custom Listener (optional)
-------------------------------------------------- */
export const onMessageListener = (
  callback: (payload: any) => void
) => {
  return onMessage(messaging, (payload) => {
    console.log("[FCM] onMessageListener payload:", payload);
    callback(payload);
  });
};
