import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { apiGet, apiPost, apiPut } from "../../services/api";

// ── Menu Row Helper ────────────────────────────────────────
interface MenuRowProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    badge?: string;
    onPress?: () => void;
}

function MenuRow({ icon, label, badge, onPress }: MenuRowProps) {
    return (
        <Pressable style={styles.menuRow} onPress={onPress}>
            <View style={styles.menuIconWrap}>
                <Ionicons name={icon} size={20} color="#22C55E" />
            </View>
            <Text style={styles.menuLabel}>{label}</Text>
            {badge && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            )}
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        </Pressable>
    );
}

// ── Component ──────────────────────────────────────────────
export default function Profile() {
    const router = useRouter();
    const { user, logoutUser } = useAuth();

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Edit modals
    const [editModal, setEditModal] = useState(false);
    const [editPhone, setEditPhone] = useState("");
    const [editUsn, setEditUsn] = useState("");
    const [editLoading, setEditLoading] = useState(false);

    // Password modal
    const [passwordModal, setPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [])
    );

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await apiGet("/api/user/me", true);
            setProfile(data);
            setEditPhone(data.phone || "");
            setEditUsn(data.usn || "");
        } catch (e: any) {
            console.error("Failed to fetch profile:", e);
            // If session expired, logout so auth guard redirects to login
            if (e.message?.includes("Session expired")) {
                await logoutUser();
                router.replace("/login");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        setEditLoading(true);
        try {
            const body: any = {};
            if (editPhone.trim()) body.phone = editPhone.trim();
            if (editUsn.trim()) body.usn = editUsn.trim();

            await apiPut("/api/user/update", body, true);
            await fetchProfile();
            setEditModal(false);
            Alert.alert("Success", "Profile updated!");
        } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to update profile");
        } finally {
            setEditLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            Alert.alert("Error", "Please fill in both fields");
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert("Error", "New password must be at least 6 characters");
            return;
        }

        setPasswordLoading(true);
        try {
            await apiPost(
                "/api/user/change-password",
                { currentPassword, newPassword },
                true
            );
            setPasswordModal(false);
            setCurrentPassword("");
            setNewPassword("");
            Alert.alert("Success", "Password updated successfully!");
        } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to change password");
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleLogout = async () => {
        await logoutUser();
        router.replace("/login");
    };

    if (loading) {
        return (
            <View
                style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}
            >
                <ActivityIndicator size="large" color="#22C55E" />
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* ── Header ── */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color="#0F172A" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* ── Avatar ── */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarWrap}>
                        <View style={styles.avatar}>
                            <Text style={{ fontSize: 36 }}>
                                {profile?.name?.[0]?.toUpperCase() || "U"}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.name}>{profile?.name || "User"}</Text>
                    <Text style={styles.studentId}>{profile?.email || ""}</Text>
                    {profile?.usn && (
                        <Text style={styles.usnText}>USN: {profile.usn}</Text>
                    )}
                    {profile?.role && (
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>{profile.role}</Text>
                        </View>
                    )}
                </View>

                {/* ── Account Settings ── */}
                <Text style={styles.sectionLabel}>ACCOUNT SETTINGS</Text>
                <View style={styles.card}>
                    <MenuRow
                        icon="person-outline"
                        label="Personal Info"
                        badge={profile?.phone || "Add phone"}
                        onPress={() => {
                            setEditPhone(profile?.phone || "");
                            setEditUsn(profile?.usn || "");
                            setEditModal(true);
                        }}
                    />
                    <View style={styles.divider} />
                    <MenuRow
                        icon="lock-closed-outline"
                        label="Change Password"
                        onPress={() => setPasswordModal(true)}
                    />
                </View>

                {/* ── Info ── */}
                <Text style={styles.sectionLabel}>DETAILS</Text>
                <View style={styles.card}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{profile?.email || "—"}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Phone</Text>
                        <Text style={styles.infoValue}>{profile?.phone || "Not set"}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>USN</Text>
                        <Text style={styles.infoValue}>{profile?.usn || "Not set"}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Auth Provider</Text>
                        <Text style={styles.infoValue}>
                            {profile?.authProvider || "LOCAL"}
                        </Text>
                    </View>
                </View>

                {/* ── Support ── */}
                <Text style={styles.sectionLabel}>SUPPORT</Text>
                <View style={styles.card}>
                    <MenuRow icon="help-circle-outline" label="Help Center" />
                    <View style={styles.divider} />
                    <MenuRow icon="information-circle-outline" label="About CampoBite" />
                </View>

                {/* ── Log Out ── */}
                <Pressable style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </Pressable>
            </ScrollView>

            {/* ── Edit Profile Modal ── */}
            <Modal
                visible={editModal}
                transparent
                animationType="slide"
                onRequestClose={() => setEditModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>
                            <Pressable onPress={() => setEditModal(false)}>
                                <Ionicons name="close" size={24} color="#64748B" />
                            </Pressable>
                        </View>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Phone Number"
                            placeholderTextColor="#94A3B8"
                            value={editPhone}
                            onChangeText={setEditPhone}
                            keyboardType="phone-pad"
                        />

                        <TextInput
                            style={[styles.modalInput, { marginTop: 12 }]}
                            placeholder="USN (cannot be changed once set)"
                            placeholderTextColor="#94A3B8"
                            value={editUsn}
                            onChangeText={setEditUsn}
                            editable={!profile?.usn}
                            autoCapitalize="characters"
                        />

                        <Pressable onPress={handleUpdateProfile} disabled={editLoading}>
                            <View
                                style={[styles.modalSubmitBtn, editLoading && { opacity: 0.7 }]}
                            >
                                {editLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.modalSubmitText}>Update</Text>
                                )}
                            </View>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* ── Change Password Modal ── */}
            <Modal
                visible={passwordModal}
                transparent
                animationType="slide"
                onRequestClose={() => setPasswordModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Change Password</Text>
                            <Pressable onPress={() => setPasswordModal(false)}>
                                <Ionicons name="close" size={24} color="#64748B" />
                            </Pressable>
                        </View>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Current Password"
                            placeholderTextColor="#94A3B8"
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry
                        />

                        <TextInput
                            style={[styles.modalInput, { marginTop: 12 }]}
                            placeholder="New Password (min 6 chars)"
                            placeholderTextColor="#94A3B8"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                        />

                        <Pressable
                            onPress={handleChangePassword}
                            disabled={passwordLoading}
                        >
                            <View
                                style={[
                                    styles.modalSubmitBtn,
                                    passwordLoading && { opacity: 0.7 },
                                ]}
                            >
                                {passwordLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.modalSubmitText}>Change Password</Text>
                                )}
                            </View>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#F8FAFC",
        paddingTop: 50,
        paddingHorizontal: 20,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerTitle: { fontSize: 20, fontWeight: "700", color: "#0F172A" },

    avatarSection: { alignItems: "center", marginTop: 24 },
    avatarWrap: { position: "relative" },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: "#DCFCE7",
        backgroundColor: "#E2E8F0",
        alignItems: "center",
        justifyContent: "center",
    },
    name: {
        fontSize: 22,
        fontWeight: "700",
        color: "#0F172A",
        marginTop: 14,
    },
    studentId: { fontSize: 14, color: "#94A3B8", marginTop: 2 },
    usnText: { fontSize: 13, color: "#64748B", marginTop: 4 },
    roleBadge: {
        marginTop: 8,
        backgroundColor: "#DCFCE7",
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRadius: 10,
    },
    roleText: { fontSize: 12, fontWeight: "700", color: "#22C55E" },

    sectionLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "#94A3B8",
        letterSpacing: 1.5,
        marginTop: 28,
        marginBottom: 10,
    },

    card: {
        backgroundColor: "#fff",
        borderRadius: 18,
        paddingHorizontal: 16,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    divider: { height: 1, backgroundColor: "#F1F5F9" },

    menuRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
    },
    menuIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: "#F0FDF4",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    menuLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: "#0F172A" },
    badge: {
        backgroundColor: "#F1F5F9",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 8,
    },
    badgeText: { fontSize: 12, fontWeight: "600", color: "#64748B" },

    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 14,
    },
    infoLabel: { fontSize: 14, color: "#64748B" },
    infoValue: { fontSize: 14, fontWeight: "600", color: "#0F172A" },

    logoutBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 28,
        paddingVertical: 16,
        backgroundColor: "#FEE2E2",
        borderRadius: 16,
    },
    logoutText: { fontSize: 16, fontWeight: "700", color: "#EF4444" },

    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "flex-end",
    },
    modalCard: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    modalTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
    modalInput: {
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 14,
        padding: 14,
        fontSize: 15,
        color: "#0F172A",
        backgroundColor: "#F8FAFC",
    },
    modalSubmitBtn: {
        backgroundColor: "#22C55E",
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
        marginTop: 16,
    },
    modalSubmitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});