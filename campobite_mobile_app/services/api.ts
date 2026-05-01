import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Android emulator uses 10.0.2.2 to reach host machine's localhost
// iOS simulator can use localhost directly
// For physical devices, use your machine's IP address
const getBaseUrl = () => {
    if (Platform.OS === "android") {
       // return "http://10.0.2.2:8082";
         return "https://campobite.onrender.com";
    }
    return "https://campobite.onrender.com";
};

export const API_BASE_URL = getBaseUrl();

const TOKEN_KEY = "campobite_jwt";
const USER_KEY = "campobite_user";

// ── Token Management ──────────────────────────────────────
export async function getToken(): Promise<string | null> {
    try {
        return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
        return null;
    }
}

export async function setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
}

export async function setUser(user: any): Promise<void> {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getUser(): Promise<any | null> {
    try {
        const raw = await SecureStore.getItemAsync(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

// ── API Helpers ───────────────────────────────────────────
async function buildHeaders(
    includeAuth: boolean = true
): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (includeAuth) {
        const token = await getToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
    }
    return headers;
}

export async function apiGet<T = any>(
    path: string,
    requireAuth: boolean = true
): Promise<T> {
    const headers = await buildHeaders(requireAuth);
    const res = await fetch(`${API_BASE_URL}${path}`, { headers });

    if (res.status === 401 && requireAuth) {
        await clearToken();
        throw new Error("Session expired. Please login again.");
    }

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with status ${res.status}`);
    }

    return res.json();
}

export async function apiPost<T = any>(
    path: string,
    body: any,
    requireAuth: boolean = true
): Promise<T> {
    const headers = await buildHeaders(requireAuth);
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
    });

    if (res.status === 401 && requireAuth) {
        await clearToken();
        throw new Error("Session expired. Please login again.");
    }

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with status ${res.status}`);
    }

    // Some endpoints return empty body
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return res.json();
    }
    return (await res.text()) as any;
}

export async function apiPut<T = any>(
    path: string,
    body: any,
    requireAuth: boolean = true
): Promise<T> {
    const headers = await buildHeaders(requireAuth);
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
    });

    if (res.status === 401 && requireAuth) {
        await clearToken();
        throw new Error("Session expired. Please login again.");
    }

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with status ${res.status}`);
    }

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return res.json();
    }
    return (await res.text()) as any;
}
