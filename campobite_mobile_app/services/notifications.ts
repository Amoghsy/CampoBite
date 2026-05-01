import {
    AuthorizationStatus,
    getToken,
    onMessage,
    onTokenRefresh,
    requestPermission,
    setBackgroundMessageHandler
} from "@react-native-firebase/messaging";

import { getApp } from "@react-native-firebase/app";
import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { apiPost } from "./api";

// ─────────────────────────────────────────────
// Initialize Local Notifications
// ─────────────────────────────────────────────

export async function requestLocalNotificationPermission(): Promise<boolean> {
    try {
        const { status } = await Notifications.requestPermissionsAsync();
        console.log("📱 Local notification permission status:", status);
        return status === "granted";
    } catch (error) {
        console.error("❌ Error requesting notification permission:", error);
        return false;
    }
}

export async function initializeNotifications(): Promise<void> {
    try {
        // Request permission for local notifications
        const permissionGranted = await requestLocalNotificationPermission();
        if (!permissionGranted) {
            console.warn("⚠️ Local notification permission not granted");
        }

        // Set default notification behavior
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });

        // Create Android notification channel
        if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync("default", {
                name: "default",
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#FF231F7C",
                bypassDnd: true,
            });

            await Notifications.setNotificationChannelAsync("orders", {
                name: "Order Updates",
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#22C55E",
                bypassDnd: true,
            });
        }

        console.log("✅ Local notifications initialized");
    } catch (error) {
        console.error("Error initializing notifications:", error);
    }
}

// ─────────────────────────────────────────────
// Send Local Notification
// ─────────────────────────────────────────────

export async function sendLocalNotification(
    title: string,
    body: string,
    channelId: string = "default"
): Promise<void> {
    try {
        console.log("🔔 Sending notification:", { title, body, channelId });

        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: "default",
                badge: 1,
                data: {
                    timestamp: new Date().toISOString(),
                },
            },
            trigger: null, // Show immediately
        });
        console.log(`✅ Notification scheduled with ID: ${notificationId}`);
    } catch (error: any) {
        // Expo Go doesn't support expo-keep-awake (used internally by expo-notifications).
        // Silently ignore this error — notifications work correctly in development builds.
        if (
            error?.message?.includes("keep awake") ||
            error?.message?.includes("keepAwake") ||
            error?.code === "ERR_MODULE_NOT_FOUND"
        ) {
            console.warn("⚠️ Local notification skipped (Expo Go limitation):", error.message);
            return;
        }
        console.error("❌ Error sending local notification:", error);
    }
}

// ─────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────

export async function getAndLogFCMToken(): Promise<string | null> {
    try {
        const msg = messaging();
        const token = await getToken(msg);

        if (token) {
            console.log("======================================");
            console.log("🔥 FCM TOKEN:");
            console.log(token);
            console.log("======================================");
            return token;
        } else {
            console.warn("❌ No FCM token available");
            return null;
        }
    } catch (error) {
        console.error("Error retrieving FCM token:", error);
        return null;
    }
}

// Test local notification (for debugging)
export async function testLocalNotification(): Promise<void> {
    console.log("🧪 Testing local notification...");
    await sendLocalNotification(
        "✅ Test Notification",
        "This is a test notification from CampoBite",
        "default"
    );
}

// Test order notification (for debugging)
export async function testOrderNotification(): Promise<void> {
    console.log("🧪 Testing order notification...");
    await sendLocalNotification(
        "🎉 Order Ready!",
        "Your order #12345 is ready for pickup.",
        "orders"
    );
}

// ─────────────────────────────────────────────
// Order Status Config
// ─────────────────────────────────────────────

const ORDER_STATUS_CONFIG: Record<
    string,
    { emoji: string; title: string; getMessage: (token: string) => string }
> = {
    ORDERED: {
        emoji: "✅",
        title: "Order Placed!",
        getMessage: (token) =>
            `Your order #${token} has been placed successfully.`,
    },
    PREPARING: {
        emoji: "🍳",
        title: "Cooking in Progress!",
        getMessage: (token) =>
            `Your order #${token} is now being prepared.`,
    },
    READY: {
        emoji: "🎉",
        title: "Order Ready!",
        getMessage: (token) =>
            `Your order #${token} is ready for pickup.`,
    },
    COMPLETED: {
        emoji: "🏁",
        title: "Order Completed",
        getMessage: (token) =>
            `Your order #${token} has been completed.`,
    },
    CANCELLED: {
        emoji: "❌",
        title: "Order Cancelled",
        getMessage: (token) =>
            `Your order #${token} has been cancelled.`,
    },
};

// ─────────────────────────────────────────────
// Register FCM
// ─────────────────────────────────────────────

// Setup notification channel for Android 8+
async function setupAndroidNotificationChannel(): Promise<void> {
    if (Platform.OS !== "android") return;

    try {
        // Get the default channel ID - messaging creates this automatically
        console.log("Android notification channel will be created by Firebase");
    } catch (error) {
        console.log("Android channel setup error:", error);
    }
}

export async function registerForPushNotifications(): Promise<void> {
    try {
        console.log("Initializing Firebase App...");

        // Ensure Firebase App is initialized
        getApp();

        // Setup Android notification channel
        await setupAndroidNotificationChannel();

        const msg = messaging();

        console.log("Requesting permission...");
        const authStatus = await requestPermission(msg);

        const enabled =
            authStatus === AuthorizationStatus.AUTHORIZED ||
            authStatus === AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
            console.warn("Notifications disabled by user");
            await sendLocalNotification(
                "Notifications Disabled",
                "You can enable notifications in settings"
            );
            return;
        }

        console.log("Getting FCM token...");

        const token = await getToken(msg);

        if (!token) {
            console.error("FCM Token is empty");
            await sendLocalNotification(
                "FCM Error",
                "Failed to get FCM token"
            );
            return;
        }

        console.log("🔥 FCM TOKEN:", token);
        console.log("📱 Full token: " + token);
        await sendLocalNotification(
            "✅ FCM Token Generated",
            "Token synced to backend"
        );

        // Send to backend
        try {
            await apiPost("/api/user/fcm-token", { token }, true);
            console.log("✅ Token saved to backend successfully");
        } catch (err) {
            console.error("Backend save failed:", err);
            await sendLocalNotification(
                "⚠️ Warning",
                "Token registered locally but backend sync failed"
            );
        }

        // Token refresh listener
        onTokenRefresh(msg, async (newToken: string) => {
            console.log("🔄 Token refreshed:", newToken);
            try {
                await apiPost("/api/user/fcm-token", { token: newToken }, true);
                console.log("✅ Refreshed token saved to backend");
            } catch (err) {
                console.error("Failed to update refreshed token:", err);
            }
        });
    } catch (error: any) {
        console.error("❌ FCM Registration Error:", error);
        await sendLocalNotification(
            "❌ FCM Error",
            error?.message || String(error)
        );
    }
}

// ─────────────────────────────────────────────
// Handle Incoming Message
// ─────────────────────────────────────────────

async function handleNotification(remoteMessage: any): Promise<void> {
    try {
        const data = remoteMessage?.data || {};
        const type = data.type;
        const status = data.status;
        const tokenNumber = data.tokenNumber;
        const code = data.code;

        console.log("Processing notification:", { type, status, tokenNumber, code });

        if (type === "ORDER_STATUS" && status && tokenNumber) {
            const config = ORDER_STATUS_CONFIG[status];
            if (config) {
                console.log("Showing order status notification:", status);
                await sendLocalNotification(
                    `${config.emoji} ${config.title}`,
                    config.getMessage(tokenNumber),
                    "orders"
                );
                return;
            } else {
                console.warn("Unknown order status:", status);
            }
        }

        if (code) {
            console.log("Showing offer notification:", code);
            await sendLocalNotification(
                "🎉 New Offer!",
                `Use code ${code} before checkout.`,
                "default"
            );
            return;
        }

        const title =
            data.title ||
            remoteMessage?.notification?.title ||
            "CampoBite";

        const body =
            data.body ||
            remoteMessage?.notification?.body ||
            "";

        if (title || body) {
            console.log("Showing generic notification:", { title, body });
            await sendLocalNotification(title, body, "default");
        } else {
            console.warn("No content in notification");
        }
    } catch (error) {
        console.error("Error handling notification:", error);
    }
}

// ─────────────────────────────────────────────
// Foreground Handler
// ─────────────────────────────────────────────

export function setupForegroundNotificationHandler(): () => void {
    try {
        const msg = messaging();

        const unsubscribe = onMessage(msg, async (remoteMessage) => {
            console.log("📬 Foreground message received:", remoteMessage);
            await handleNotification(remoteMessage);
        });

        // Listen for notification taps
        const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
            console.log("👉 Notification tapped:", response.notification.request.content);
        });

        console.log("✅ Foreground handler registered");
        return () => {
            unsubscribe();
            responseListener.remove();
        };
    } catch (error) {
        console.error("❌ Foreground handler setup error:", error);
        return () => { };
    }
}

// ─────────────────────────────────────────────
// Background Handler
// ─────────────────────────────────────────────

export function setupBackgroundNotificationHandler(): void {
    try {
        const msg = messaging();

        setBackgroundMessageHandler(msg, async (remoteMessage) => {
            console.log("Background message received:", remoteMessage);
            await handleNotification(remoteMessage);
            return Promise.resolve();
        });
    } catch (error) {
        console.log("Background handler setup error:", error);
    }
}