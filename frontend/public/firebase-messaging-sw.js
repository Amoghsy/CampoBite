importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

// Wait until the main app provides the Firebase config
self.addEventListener("message", (event) => {
  if (event.data?.type === "FIREBASE_CONFIG") {

    if (firebase.apps.length === 0) {
      firebase.initializeApp(event.data.config);
      console.log("[SW] Firebase initialized");
    }

    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log("[SW] Background message:", payload);

      const title =
        payload.notification?.title ||
        payload.data?.title ||
        "CampoBite";

      const body =
        payload.notification?.body ||
        payload.data?.body ||
        "New notification";

      self.registration.showNotification(title, {
        body,
        icon: "/logo.png",
      });
    });
  }
});