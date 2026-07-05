import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log("[FCM] Firebase config loaded");

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

console.log("[FCM] Firebase initialized");
console.log("[FCM] Messaging initialized");

let firebaseSWRegistration: ServiceWorkerRegistration | null = null;

/* ---------------- SERVICE WORKER ---------------- */
export const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) return null;

  firebaseSWRegistration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
    { scope: "/" }
  );

  await navigator.serviceWorker.ready;

  // Wait until the service worker is active
  if (firebaseSWRegistration.active) {
    firebaseSWRegistration.active.postMessage({
      type: "FIREBASE_CONFIG",
      config: firebaseConfig,
    });
  }

  console.log("[FCM] Firebase SW registered");

  return firebaseSWRegistration;
};

/* ---------------- TOKEN ---------------- */
export const getFcmToken = async () => {
  try {
    if (!firebaseSWRegistration) {
      await registerServiceWorker();
    }

    if (!firebaseSWRegistration) {
      throw new Error("Service Worker not registered");
    }

    const permission = await Notification.requestPermission();

    console.log("[FCM] Notification permission:", permission);

    if (permission !== "granted") {
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: firebaseSWRegistration,
    });

    console.log("[FCM] FCM Token:", token);

    return token;
  } catch (error) {
    console.error("[FCM] Error getting token:", error);
    return null;
  }
};

/* ---------------- FOREGROUND ---------------- */
export const listenNotifications = () => {
  onMessage(messaging, (payload) => {
    console.log("[FCM] Foreground message:", payload);

    const title =
      payload.notification?.title ??
      payload.data?.title ??
      "CampoBite";

    const body =
      payload.notification?.body ??
      payload.data?.body ??
      "New update";

    new Notification(title, {
      body,
      icon: "/logo.png",
    });
  });
};