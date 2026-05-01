import { apiPost, setToken, setUser, clearToken, getUser, API_BASE_URL } from "./api";

export interface LoginResponse {
    token: string;
    email: string;
    name: string;
    role: string;
    picture?: string;
}

export async function login(
    email: string,
    password: string
): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Login failed");
    }

    const data: LoginResponse = await res.json();
    await setToken(data.token);
    await setUser({ email: data.email, name: data.name, role: data.role, picture: data.picture || "" });
    return data;
}

/* ================= SIGNUP STEP 1: SEND OTP ================= */
export async function sendSignupOtp(
    name: string,
    email: string,
    password: string,
    role: string = "STUDENT",
    usn?: string
): Promise<string> {
    const body: any = { name, email, password, role };
    if (usn) body.usn = usn;

    const res = await fetch(`${API_BASE_URL}/api/auth/signup/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to send OTP");
    }

    return await res.text();
}

/* ================= SIGNUP STEP 2: VERIFY OTP ================= */
export async function verifySignupOtp(
    email: string,
    otp: string
): Promise<string> {
    const res = await fetch(`${API_BASE_URL}/api/auth/signup/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "OTP verification failed");
    }

    return await res.text();
}

/* ================= FORGOT PASSWORD STEP 1: SEND OTP ================= */
export async function sendForgotPasswordOtp(email: string): Promise<string> {
    const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to send reset OTP");
    }

    return await res.text();
}

/* ================= FORGOT PASSWORD STEP 2: RESET ================= */
export async function resetPassword(
    email: string,
    otp: string,
    newPassword: string
): Promise<string> {
    const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Password reset failed");
    }

    return await res.text();
}

/* ================= LEGACY SIGNUP (kept for backward compat) ================= */
export async function signup(
    name: string,
    email: string,
    password: string,
    usn?: string
): Promise<string> {
    const body: any = { name, email, password, role: "STUDENT" };
    if (usn) body.usn = usn;

    const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Signup failed");
    }

    return await res.text();
}

/* ================= GOOGLE LOGIN ================= */
export async function googleLogin(idToken: string): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE_URL}/api/auth/google/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Google login failed");
    }

    const data: LoginResponse = await res.json();
    await setToken(data.token);
    await setUser({ email: data.email, name: data.name, role: data.role, picture: data.picture || "" });
    return data;
}

/* ================= GOOGLE SIGNUP ================= */
export async function googleSignup(idToken: string): Promise<string> {
    const res = await fetch(`${API_BASE_URL}/api/auth/google/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Google signup failed");
    }

    return await res.text();
}

/* ================= UPDATE GOOGLE SIGNUP ROLE ================= */
export async function updateGoogleSignupRole(idToken: string, role: string): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE_URL}/api/auth/google/signup/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken, role }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update role");
    }

    const data: LoginResponse = await res.json();
    await setToken(data.token);
    await setUser({ email: data.email, name: data.name, role: data.role });
    return data;
}

export async function logout(): Promise<void> {
    await clearToken();
}

export async function getStoredUser() {
    return getUser();
}
