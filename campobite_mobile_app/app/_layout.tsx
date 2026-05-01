import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { configureGoogleSignin } from "../services/googleAuth";
import {
  getAndLogFCMToken,
  initializeNotifications,
  setupBackgroundNotificationHandler,
  setupForegroundNotificationHandler,
} from "../services/notifications";

// Configure Google Sign-In once at app startup
configureGoogleSignin();

// Initialize local notifications (silently ignore Expo Go keep-awake limitations)
initializeNotifications().catch((e) => {
  if (!e?.message?.includes("keep awake") && !e?.message?.includes("keepAwake")) {
    console.error("Notification init error:", e);
  }
});

// Log and sync FCM token when app opens
(async () => {
  console.log("🚀 App starting - fetching FCM token...");
  const token = await getAndLogFCMToken();
  if (token) {
    try {
      const { apiPost } = await import("../services/api");
      await apiPost("/api/user/fcm-token", { token });
    } catch (e) {
      console.warn("Token sync failed on startup:", e);
    }
  }
})();

function RootNavigator() {
  const { isLoggedIn, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "login" || segments[0] === "splash";

    if (!isLoggedIn && !inAuthGroup) {
      router.replace("/login");
    } else if (isLoggedIn && inAuthGroup) {
      router.replace("/");
    }
  }, [isLoggedIn, isLoading, segments]);

  // Set up FCM notification listeners (Firebase is ready by this point)
  useEffect(() => {
    setupBackgroundNotificationHandler();
    const unsubscribe = setupForegroundNotificationHandler();
    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" }}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="order-status" />
      <Stack.Screen name="cart" />
      <Stack.Screen name="chatbot" />
      <Stack.Screen name="feedback" />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <RootNavigator />
      </CartProvider>
    </AuthProvider>
  );
}