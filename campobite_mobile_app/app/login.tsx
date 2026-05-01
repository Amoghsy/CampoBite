import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { promptGoogleSignIn } from "../services/googleAuth";
import {
    sendSignupOtp,
    verifySignupOtp,
    sendForgotPasswordOtp,
    resetPassword,
} from "../services/auth";
import { API_BASE_URL } from "../services/api";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

type Screen = "auth" | "signup-otp" | "forgot-email" | "forgot-otp" | "forgot-newpass" | "google-role";

export default function Login() {
    const router = useRouter();
    const { loginUser, googleLoginUser, googleSignupUser, setGoogleSignupRole } = useAuth();

    const [screen, setScreen] = useState<Screen>("auth");
    const [isSignup, setIsSignup] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    // Google signup role selection
    const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null);
    const [googleRole, setGoogleRole] = useState<"STUDENT" | "FACULTY">("STUDENT");

    // Auth fields
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [usn, setUsn] = useState("");

    // OTP fields
    const [otp, setOtp] = useState("");

    // Forgot password fields
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotOtp, setForgotOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    /* ================= SIGNUP: SEND OTP ================= */
    const handleSignupSubmit = async () => {
        if (!email.trim() || !password.trim() || !name.trim()) {
            Alert.alert("Error", "Please fill in all required fields");
            return;
        }
        if (!PASSWORD_REGEX.test(password)) {
            Alert.alert(
                "Weak Password",
                "Password must be at least 8 characters with uppercase, lowercase, and a digit"
            );
            return;
        }

        setLoading(true);
        try {
            await sendSignupOtp(name.trim(), email.trim(), password, "STUDENT", usn.trim() || undefined);
            Alert.alert("OTP Sent", `A verification code has been sent to ${email.trim()}`);
            setScreen("signup-otp");
        } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    /* ================= SIGNUP: VERIFY OTP ================= */
    const handleSignupVerifyOtp = async () => {
        if (otp.length !== 6) {
            Alert.alert("Error", "Please enter the 6-digit OTP");
            return;
        }
        setLoading(true);
        try {
            await verifySignupOtp(email.trim(), otp);
            Alert.alert("Success", "Account created! Please sign in.", [
                {
                    text: "OK",
                    onPress: () => {
                        setIsSignup(false);
                        setScreen("auth");
                        setOtp("");
                        setName("");
                        setUsn("");
                        setPassword("");
                    },
                },
            ]);
        } catch (e: any) {
            Alert.alert("Error", e.message || "OTP verification failed");
        } finally {
            setLoading(false);
        }
    };

    /* ================= LOGIN ================= */
    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert("Error", "Please fill in all required fields");
            return;
        }
        setLoading(true);
        try {
            await loginUser(email.trim(), password);
            router.replace("/");
        } catch (e: any) {
            Alert.alert("Error", e.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    /* ================= FORGOT PASSWORD: SEND OTP ================= */
    const handleForgotSendOtp = async () => {
        if (!forgotEmail.trim()) {
            Alert.alert("Error", "Please enter your email");
            return;
        }
        setLoading(true);
        try {
            await sendForgotPasswordOtp(forgotEmail.trim());
            Alert.alert("OTP Sent", `Reset code sent to ${forgotEmail.trim()}`);
            setScreen("forgot-otp");
        } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    /* ================= FORGOT PASSWORD: VERIFY OTP ================= */
    const handleForgotVerifyOtp = () => {
        if (forgotOtp.length !== 6) {
            Alert.alert("Error", "Please enter the 6-digit OTP");
            return;
        }
        setScreen("forgot-newpass");
    };

    /* ================= FORGOT PASSWORD: RESET ================= */
    const handleForgotReset = async () => {
        if (!PASSWORD_REGEX.test(newPassword)) {
            Alert.alert(
                "Weak Password",
                "Password must be at least 8 characters with uppercase, lowercase, and a digit"
            );
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match");
            return;
        }
        setLoading(true);
        try {
            await resetPassword(forgotEmail.trim(), forgotOtp, newPassword);
            Alert.alert("Success", "Password reset successful. Please sign in.", [
                {
                    text: "OK",
                    onPress: () => {
                        setScreen("auth");
                        setForgotEmail("");
                        setForgotOtp("");
                        setNewPassword("");
                        setConfirmPassword("");
                    },
                },
            ]);
        } catch (e: any) {
            Alert.alert("Error", e.message || "Password reset failed");
        } finally {
            setLoading(false);
        }
    };

    /* ================= GOOGLE ================= */
    const handleGooglePress = async () => {
        setGoogleLoading(true);
        try {
            const idToken = await promptGoogleSignIn();
            if (isSignup) {
                // Store token and go to role selection screen
                setPendingGoogleToken(idToken);
                setGoogleRole("STUDENT");
                setScreen("google-role");
            } else {
                await googleLoginUser(idToken);
                router.replace("/");
            }
        } catch (e: any) {
            Alert.alert("Error", e.message || "Google authentication failed");
        } finally {
            setGoogleLoading(false);
        }
    };

    /* ================= GOOGLE ROLE SELECTION ================= */
    const confirmGoogleSignupWithRole = async (role: "STUDENT" | "FACULTY") => {
        if (!pendingGoogleToken) {
            Alert.alert("Error", "Something went wrong. Please try again.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/google/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: pendingGoogleToken, role }),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Google signup failed");
            }
            Alert.alert(
                "Success",
                "Account created with Google! You can now sign in.",
                [{
                    text: "OK",
                    onPress: () => {
                        setPendingGoogleToken(null);
                        setIsSignup(false);
                        setScreen("auth");
                    },
                }]
            );
        } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to create account");
            setPendingGoogleToken(null);
            setScreen("auth");
        } finally {
            setLoading(false);
        }
    };

    /* ============================================= */
    /*            PASSWORD STRENGTH HINTS            */
    /* ============================================= */
    const renderPasswordHints = (pw: string) => {
        const rules = [
            { label: "8+ characters", ok: pw.length >= 8 },
            { label: "Uppercase letter", ok: /[A-Z]/.test(pw) },
            { label: "Lowercase letter", ok: /[a-z]/.test(pw) },
            { label: "A digit", ok: /\d/.test(pw) },
        ];
        return (
            <View style={styles.hintsRow}>
                {rules.map((r) => (
                    <Text
                        key={r.label}
                        style={[styles.hintText, r.ok ? styles.hintOk : styles.hintWeak]}
                    >
                        {r.ok ? "✓" : "○"} {r.label}
                    </Text>
                ))}
            </View>
        );
    };

    /* ============================================= */
    /*          SIGNUP OTP VERIFICATION SCREEN       */
    /* ============================================= */
    if (screen === "signup-otp") {
        return (
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.heading}>Verify Your Email</Text>
                    <Text style={styles.subHeading}>
                        Enter the 6-digit code sent to{"\n"}
                        <Text style={{ fontWeight: "700" }}>{email}</Text>
                    </Text>

                    <TextInput
                        placeholder="000000"
                        style={[styles.input, styles.otpInput]}
                        placeholderTextColor="#94A3B8"
                        value={otp}
                        onChangeText={(t) => setOtp(t.replace(/\D/g, "").slice(0, 6))}
                        keyboardType="number-pad"
                        maxLength={6}
                    />

                    <Pressable onPress={handleSignupVerifyOtp} disabled={loading || otp.length !== 6}>
                        <LinearGradient
                            colors={["#22C55E", "#138F71"]}
                            style={[styles.button, (loading || otp.length !== 6) && { opacity: 0.7 }]}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Verify & Create Account</Text>
                            )}
                        </LinearGradient>
                    </Pressable>

                    <Pressable onPress={() => { setScreen("auth"); setOtp(""); }} style={styles.toggleRow}>
                        <Text style={styles.toggleLink}>← Go back</Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    /* ============================================= */
    /*         FORGOT PASSWORD: EMAIL SCREEN         */
    /* ============================================= */
    if (screen === "forgot-email") {
        return (
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.heading}>Reset Password</Text>
                    <Text style={styles.subHeading}>
                        Enter your email to receive a reset code
                    </Text>

                    <TextInput
                        placeholder="Email Address"
                        style={styles.input}
                        placeholderTextColor="#94A3B8"
                        value={forgotEmail}
                        onChangeText={setForgotEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Pressable onPress={handleForgotSendOtp} disabled={loading}>
                        <LinearGradient
                            colors={["#E74C3C", "#C0392B"]}
                            style={[styles.button, loading && { opacity: 0.7 }]}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Send Reset Code</Text>
                            )}
                        </LinearGradient>
                    </Pressable>

                    <Pressable onPress={() => setScreen("auth")} style={styles.toggleRow}>
                        <Text style={styles.toggleLink}>← Back to Sign In</Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    /* ============================================= */
    /*         FORGOT PASSWORD: OTP SCREEN           */
    /* ============================================= */
    if (screen === "forgot-otp") {
        return (
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.heading}>Enter Reset Code</Text>
                    <Text style={styles.subHeading}>
                        Enter the 6-digit code sent to{"\n"}
                        <Text style={{ fontWeight: "700" }}>{forgotEmail}</Text>
                    </Text>

                    <TextInput
                        placeholder="000000"
                        style={[styles.input, styles.otpInput]}
                        placeholderTextColor="#94A3B8"
                        value={forgotOtp}
                        onChangeText={(t) => setForgotOtp(t.replace(/\D/g, "").slice(0, 6))}
                        keyboardType="number-pad"
                        maxLength={6}
                    />

                    <Pressable onPress={handleForgotVerifyOtp} disabled={forgotOtp.length !== 6}>
                        <LinearGradient
                            colors={["#E74C3C", "#C0392B"]}
                            style={[styles.button, forgotOtp.length !== 6 && { opacity: 0.7 }]}
                        >
                            <Text style={styles.buttonText}>Continue</Text>
                        </LinearGradient>
                    </Pressable>

                    <Pressable onPress={() => setScreen("forgot-email")} style={styles.toggleRow}>
                        <Text style={styles.toggleLink}>← Go back</Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    /* ============================================= */
    /*      FORGOT PASSWORD: NEW PASSWORD SCREEN     */
    /* ============================================= */
    if (screen === "forgot-newpass") {
        return (
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.heading}>New Password</Text>
                    <Text style={styles.subHeading}>
                        Set a strong password for your account
                    </Text>

                    <TextInput
                        placeholder="New Password"
                        secureTextEntry
                        style={styles.input}
                        placeholderTextColor="#94A3B8"
                        value={newPassword}
                        onChangeText={setNewPassword}
                    />
                    {newPassword.length > 0 && renderPasswordHints(newPassword)}

                    <TextInput
                        placeholder="Confirm Password"
                        secureTextEntry
                        style={styles.input}
                        placeholderTextColor="#94A3B8"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />

                    <Pressable onPress={handleForgotReset} disabled={loading}>
                        <LinearGradient
                            colors={["#E74C3C", "#C0392B"]}
                            style={[styles.button, loading && { opacity: 0.7 }]}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Reset Password</Text>
                            )}
                        </LinearGradient>
                    </Pressable>

                    <Pressable onPress={() => setScreen("forgot-otp")} style={styles.toggleRow}>
                        <Text style={styles.toggleLink}>← Go back</Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    /* ============================================= */
    /*      GOOGLE SIGNUP: ROLE SELECTION SCREEN     */
    /* ============================================= */
    if (screen === "google-role") {
        return (
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.heading}>Select Your Role</Text>
                    <Text style={styles.subHeading}>
                        Please choose whether you are a student or faculty member
                    </Text>

                    {/* Student Role Option */}
                    <Pressable
                        onPress={() => confirmGoogleSignupWithRole("STUDENT")}
                        disabled={loading}
                        style={({ pressed }) => [
                            styles.roleOption,
                            pressed && { opacity: 0.7 },
                            loading && { opacity: 0.5 },
                        ]}
                    >
                        <View style={styles.roleOptionContent}>
                            <Text style={styles.roleEmoji}>👨‍🎓</Text>
                            <Text style={styles.roleTitle}>Student</Text>
                            <Text style={styles.roleDescription}>
                                I'm a student at the institution
                            </Text>
                        </View>
                        {loading ? (
                            <ActivityIndicator color="#22C55E" size="small" />
                        ) : (
                            <Text style={styles.roleArrow}>→</Text>
                        )}
                    </Pressable>

                    {/* Faculty Role Option */}
                    <Pressable
                        onPress={() => confirmGoogleSignupWithRole("FACULTY")}
                        disabled={loading}
                        style={({ pressed }) => [
                            styles.roleOption,
                            pressed && { opacity: 0.7 },
                            loading && { opacity: 0.5 },
                        ]}
                    >
                        <View style={styles.roleOptionContent}>
                            <Text style={styles.roleEmoji}>👨‍🏫</Text>
                            <Text style={styles.roleTitle}>Faculty</Text>
                            <Text style={styles.roleDescription}>
                                I'm a faculty member or staff
                            </Text>
                        </View>
                        {loading ? (
                            <ActivityIndicator color="#22C55E" size="small" />
                        ) : (
                            <Text style={styles.roleArrow}>→</Text>
                        )}
                    </Pressable>

                    <Pressable
                        onPress={() => {
                            setScreen("auth");
                            setIsSignup(true);
                            setPendingGoogleToken(null);
                        }}
                        style={styles.toggleRow}
                    >
                        <Text style={styles.toggleLink}>← Go back</Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    /* ============================================= */
    /*            MAIN AUTH SCREEN                   */
    /* ============================================= */
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Branding */}
                <View style={styles.brandSection}>
                    <Text style={styles.brandEmoji}>🍔</Text>
                    <Text style={styles.brandName}>CampoBite</Text>
                    <Text style={styles.brandSub}>Smart Campus Canteen</Text>
                </View>

                <Text style={styles.heading}>
                    {isSignup ? "Create Account" : "Welcome Back!"}
                </Text>
                <Text style={styles.subHeading}>
                    {isSignup
                        ? "Sign up to start ordering"
                        : "Sign in to continue"}
                </Text>

                {isSignup && (
                    <TextInput
                        placeholder="Full Name"
                        style={styles.input}
                        placeholderTextColor="#94A3B8"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />
                )}

                <TextInput
                    placeholder="Email Address"
                    style={styles.input}
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <TextInput
                    placeholder="Password"
                    secureTextEntry
                    style={styles.input}
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                />

                {isSignup && password.length > 0 && renderPasswordHints(password)}

                {isSignup && (
                    <TextInput
                        placeholder="USN (Optional, for students)"
                        style={styles.input}
                        placeholderTextColor="#94A3B8"
                        value={usn}
                        onChangeText={setUsn}
                        autoCapitalize="characters"
                    />
                )}

                <Pressable
                    onPress={isSignup ? handleSignupSubmit : handleLogin}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={["#22C55E", "#138F71"]}
                        style={[styles.button, loading && { opacity: 0.7 }]}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>
                                {isSignup ? "Sign Up" : "Sign In"}
                            </Text>
                        )}
                    </LinearGradient>
                </Pressable>

                {/* Forgot Password — only show on login */}
                {!isSignup && (
                    <Pressable
                        onPress={() => setScreen("forgot-email")}
                        style={styles.forgotRow}
                    >
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                    </Pressable>
                )}

                {/* ── Divider ── */}
                <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* ── Google Sign-In Button ── */}
                <Pressable
                    onPress={handleGooglePress}
                    disabled={googleLoading}
                    style={[
                        styles.googleButton,
                        googleLoading && { opacity: 0.6 },
                    ]}
                >
                    {googleLoading ? (
                        <ActivityIndicator size="small" color="#0F172A" />
                    ) : (
                        <>
                            <Text style={styles.googleIcon}>G</Text>
                            <Text style={styles.googleButtonText}>
                                {isSignup
                                    ? "Sign up with Google"
                                    : "Sign in with Google"}
                            </Text>
                        </>
                    )}
                </Pressable>

                <Pressable
                    onPress={() => setIsSignup(!isSignup)}
                    style={styles.toggleRow}
                >
                    <Text style={styles.toggleText}>
                        {isSignup
                            ? "Already have an account? "
                            : "Don't have an account? "}
                    </Text>
                    <Text style={styles.toggleLink}>
                        {isSignup ? "Sign In" : "Sign Up"}
                    </Text>
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    scrollContent: {
        flexGrow: 1,
        padding: 25,
        justifyContent: "center",
    },
    brandSection: {
        alignItems: "center",
        marginBottom: 30,
    },
    brandEmoji: {
        fontSize: 48,
    },
    brandName: {
        fontSize: 28,
        fontWeight: "800",
        color: "#0F172A",
        marginTop: 8,
    },
    brandSub: {
        fontSize: 14,
        color: "#64748B",
        marginTop: 4,
    },
    heading: {
        fontSize: 28,
        fontWeight: "700",
        color: "#0F172A",
    },
    subHeading: {
        fontSize: 15,
        color: "#64748B",
        marginTop: 4,
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: "#E2E8F0",
        padding: 15,
        borderRadius: 16,
        marginTop: 15,
        backgroundColor: "#fff",
        fontSize: 15,
        color: "#0F172A",
    },
    otpInput: {
        textAlign: "center",
        fontSize: 28,
        letterSpacing: 12,
        fontWeight: "700",
    },
    button: {
        padding: 16,
        borderRadius: 16,
        alignItems: "center",
        marginTop: 25,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },
    forgotRow: {
        alignItems: "center",
        marginTop: 12,
    },
    forgotText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#E74C3C",
    },
    dividerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 22,
        marginBottom: 4,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#E2E8F0",
    },
    dividerText: {
        marginHorizontal: 14,
        fontSize: 13,
        color: "#94A3B8",
        fontWeight: "600",
    },
    googleButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: "#E2E8F0",
        borderRadius: 16,
        padding: 14,
        marginTop: 14,
        backgroundColor: "#fff",
        gap: 10,
    },
    googleIcon: {
        fontSize: 20,
        fontWeight: "800",
        color: "#4285F4",
    },
    googleButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#0F172A",
    },
    toggleRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 20,
    },
    toggleText: {
        fontSize: 14,
        color: "#64748B",
    },
    toggleLink: {
        fontSize: 14,
        fontWeight: "700",
        color: "#22C55E",
    },
    hintsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 8,
        paddingHorizontal: 4,
    },
    hintText: {
        fontSize: 11,
        fontWeight: "500",
    },
    hintOk: {
        color: "#22C55E",
    },
    hintWeak: {
        color: "#94A3B8",
    },
    roleOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1.5,
        borderColor: "#E2E8F0",
        borderRadius: 16,
        padding: 20,
        marginTop: 16,
        backgroundColor: "#fff",
    },
    roleOptionContent: {
        flex: 1,
        alignItems: "flex-start",
    },
    roleEmoji: {
        fontSize: 32,
    },
    roleTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0F172A",
    },
    roleDescription: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 2,
    },
    roleArrow: {
        fontSize: 20,
        color: "#22C55E",
        fontWeight: "700",
    },
});