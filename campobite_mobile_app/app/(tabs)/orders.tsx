import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { apiGet, apiPut } from "../../services/api";

const PLACEHOLDER =
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200";

// ── Types ──────────────────────────────────────────────────
interface BackendOrderItem {
    id: number;
    menuItem: {
        id: number;
        name: string;
        description: string;
        price: number;
        imageUrl: string | null;
    };
    quantity: number;
    priceAtOrder: number;
}

interface BackendOrder {
    id: number;
    tokenNumber: number;
    status: string;
    totalAmount: number;
    itemNames: string;
    createdAt: string;
    completedAt: string | null;
    items: BackendOrderItem[];
    couponCode: string | null;
    discountAmount: number | null;
    paymentStatus: string | null;
    razorpayOrderId: string | null;
}

// ── Helpers ────────────────────────────────────────────────
const statusConfig: Record<
    string,
    {
        label: string;
        color: string;
        bg: string;
        icon: keyof typeof Ionicons.glyphMap;
    }
> = {
    ORDERED: {
        label: "Ordered",
        color: "#3B82F6",
        bg: "#DBEAFE",
        icon: "receipt-outline",
    },
    PREPARING: {
        label: "Preparing",
        color: "#F59E0B",
        bg: "#FEF3C7",
        icon: "flame-outline",
    },
    READY: {
        label: "Ready",
        color: "#22C55E",
        bg: "#DCFCE7",
        icon: "checkmark-circle-outline",
    },
    COMPLETED: {
        label: "Completed",
        color: "#64748B",
        bg: "#F1F5F9",
        icon: "checkmark-done-outline",
    },
    CANCELLED: {
        label: "Cancelled",
        color: "#EF4444",
        bg: "#FEE2E2",
        icon: "close-circle-outline",
    },
};

const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (isToday) return `Today, ${time}`;
    if (isYesterday) return `Yesterday, ${time}`;
    return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${time}`;
};

// ── Component ──────────────────────────────────────────────
export default function Orders() {
    const router = useRouter();
    const [activeOrders, setActiveOrders] = useState<BackendOrder[]>([]);
    const [pastOrders, setPastOrders] = useState<BackendOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<number | null>(null);

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [])
    );

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await apiGet("/api/dashboard", true);

            const active = (data.activeOrders || []) as BackendOrder[];
            const history = (data.orderHistory || []) as BackendOrder[];

            setActiveOrders(active);

            // Past = completed + cancelled (exclude active ones)
            const activeIds = new Set(active.map((o: BackendOrder) => o.id));
            setPastOrders(history.filter((o: BackendOrder) => !activeIds.has(o.id)));
        } catch (e) {
            console.error("Failed to fetch orders:", e);
        } finally {
            setLoading(false);
        }
    };

    const cancelOrder = (orderId: number, tokenNumber: number) => {
        Alert.alert(
            "Cancel Order",
            `Are you sure you want to cancel Order #${tokenNumber}? If payment was made, a refund will be initiated.`,
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        setCancellingId(orderId);
                        try {
                            await apiPut(`/api/orders/${orderId}/cancel`, {});
                            Alert.alert("Order Cancelled", "Your order has been cancelled successfully.");
                            fetchOrders();
                        } catch (e: any) {
                            Alert.alert("Error", e.message || "Failed to cancel order");
                        } finally {
                            setCancellingId(null);
                        }
                    },
                },
            ]
        );
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
                style={styles.container}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* ── Header ── */}
                <Text style={styles.pageTitle}>My Orders</Text>

                {/* ── Active Orders ── */}
                {activeOrders.length > 0 && (
                    <>
                        <Text style={styles.sectionLabel}>ACTIVE</Text>
                        {activeOrders.map((order) => {
                            const cfg =
                                statusConfig[order.status] || statusConfig.ORDERED;
                            return (
                                <View key={order.id} style={styles.activeCard}>
                                    <View style={styles.activeTopRow}>
                                        <View>
                                            <Text style={styles.activeToken}>
                                                Order #{order.tokenNumber}
                                            </Text>
                                            <Text style={styles.activeDate}>
                                                {formatDate(order.createdAt)}
                                            </Text>
                                        </View>
                                        <View
                                            style={[styles.statusBadge, { backgroundColor: cfg.bg }]}
                                        >
                                            <Ionicons name={cfg.icon} size={14} color={cfg.color} />
                                            <Text style={[styles.statusText, { color: cfg.color }]}>
                                                {cfg.label}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* item thumbnails */}
                                    <View style={styles.thumbRow}>
                                        {order.items?.slice(0, 3).map((item, i) => (
                                            <Image
                                                key={i}
                                                source={{
                                                    uri: item.menuItem?.imageUrl || PLACEHOLDER,
                                                }}
                                                style={styles.thumbImg}
                                            />
                                        ))}
                                        {order.items?.length > 3 && (
                                            <Text style={{ fontSize: 12, color: "#94A3B8" }}>
                                                +{order.items.length - 3}
                                            </Text>
                                        )}
                                        <Text style={styles.thumbTotal}>₹{order.totalAmount}</Text>
                                    </View>

                                    {/* Payment Status */}
                                    {order.paymentStatus && (
                                        <View style={styles.paymentRow}>
                                            <Text style={styles.paymentLabel}>
                                                {order.paymentStatus === "CAPTURED" ? "💳 Paid" :
                                                    order.paymentStatus === "REFUNDED" ? "↩️ Refunded" :
                                                        "⏳ Payment Pending"}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Action buttons */}
                                    <View style={styles.actionRow}>
                                        {order.status === "ORDERED" && (
                                            <Pressable
                                                style={styles.cancelBtn}
                                                onPress={() => cancelOrder(order.id, order.tokenNumber)}
                                                disabled={cancellingId === order.id}
                                            >
                                                {cancellingId === order.id ? (
                                                    <ActivityIndicator size="small" color="#EF4444" />
                                                ) : (
                                                    <>
                                                        <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                                                        <Text style={styles.cancelBtnText}>Cancel</Text>
                                                    </>
                                                )}
                                            </Pressable>
                                        )}
                                        <Pressable
                                            style={{ flex: 1 }}
                                            onPress={() =>
                                                router.push({
                                                    pathname: "/order-status",
                                                    params: { orderId: String(order.id) },
                                                })
                                            }
                                        >
                                            <LinearGradient
                                                colors={["#22C55E", "#138F71"]}
                                                style={styles.statusBtn}
                                            >
                                                <Text style={styles.statusBtnText}>View Status</Text>
                                                <Ionicons name="arrow-forward" size={16} color="#fff" />
                                            </LinearGradient>
                                        </Pressable>
                                    </View>
                                </View>
                            );
                        })}
                    </>
                )}

                {/* ── Order History ── */}
                <View style={styles.historyHeader}>
                    <Text style={styles.sectionLabel}>ORDER HISTORY</Text>
                    <Text style={styles.historyCount}>{pastOrders.length} orders</Text>
                </View>

                {pastOrders.length === 0 ? (
                    <View style={{ alignItems: "center", marginTop: 30 }}>
                        <Text style={{ fontSize: 36 }}>📜</Text>
                        <Text
                            style={{ fontSize: 14, color: "#94A3B8", marginTop: 8 }}
                        >
                            No past orders yet
                        </Text>
                    </View>
                ) : (
                    pastOrders.map((order) => {
                        const cfg =
                            statusConfig[order.status] || statusConfig.COMPLETED;
                        return (
                            <View key={order.id} style={styles.historyCard}>
                                <View style={styles.historyTopRow}>
                                    <View style={{ flex: 1 }}>
                                        <View style={styles.historyTokenRow}>
                                            <Text style={styles.historyToken}>
                                                Order #{order.tokenNumber}
                                            </Text>
                                            <View
                                                style={[
                                                    styles.statusBadge,
                                                    { backgroundColor: cfg.bg },
                                                ]}
                                            >
                                                <Text
                                                    style={[styles.statusText, { color: cfg.color }]}
                                                >
                                                    {cfg.label}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={styles.historyDate}>
                                            {formatDate(order.createdAt)}
                                        </Text>
                                    </View>
                                    <Text style={styles.historyTotal}>₹{order.totalAmount}</Text>
                                </View>

                                {/* Coupon / Discount info */}
                                {order.couponCode && (
                                    <View style={styles.couponInfoRow}>
                                        <Ionicons name="pricetag" size={14} color="#22C55E" />
                                        <Text style={styles.couponInfoText}>
                                            {order.couponCode} — ₹{Math.round(order.discountAmount || 0)} off
                                        </Text>
                                    </View>
                                )}

                                {/* Payment Status */}
                                {order.paymentStatus && (
                                    <View style={styles.paymentRow}>
                                        <Text style={styles.paymentLabel}>
                                            {order.paymentStatus === "CAPTURED" ? "💳 Paid" :
                                                order.paymentStatus === "REFUNDED" ? "↩️ Refunded" :
                                                    order.paymentStatus === "FAILED" ? "❌ Payment Failed" :
                                                        "⏳ Payment Pending"}
                                        </Text>
                                    </View>
                                )}

                                {/* items list */}
                                {order.items?.map((item, i) => (
                                    <View key={i} style={styles.historyItem}>
                                        <Image
                                            source={{
                                                uri: item.menuItem?.imageUrl || PLACEHOLDER,
                                            }}
                                            style={styles.historyItemImg}
                                        />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.historyItemName}>
                                                {item.menuItem?.name || "Unknown Item"}
                                            </Text>
                                            <Text style={styles.historyItemNote}>
                                                ₹{item.priceAtOrder} each
                                            </Text>
                                        </View>
                                        <Text style={styles.historyItemQty}>x{item.quantity}</Text>
                                    </View>
                                ))}

                                {/* Feedback button for completed orders */}
                                {order.status === "COMPLETED" && (
                                    <Pressable
                                        style={styles.leaveReviewBtn}
                                        onPress={() =>
                                            router.push({
                                                pathname: "/feedback",
                                                params: {
                                                    orderId: String(order.id),
                                                    orderToken: `#${order.tokenNumber}`,
                                                },
                                            })
                                        }
                                    >
                                        <Ionicons
                                            name="chatbubble-outline"
                                            size={16}
                                            color="#22C55E"
                                        />
                                        <Text style={styles.leaveReviewText}>Leave Feedback</Text>
                                    </Pressable>
                                )}
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#F8FAFC" },
    container: { flex: 1, padding: 20, paddingTop: 50 },
    pageTitle: { fontSize: 26, fontWeight: "800", color: "#0F172A" },

    sectionLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "#94A3B8",
        letterSpacing: 1.5,
        marginTop: 24,
        marginBottom: 12,
    },

    // Active Card
    activeCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    activeTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    activeToken: { fontSize: 17, fontWeight: "700", color: "#0F172A" },
    activeDate: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    statusText: { fontSize: 12, fontWeight: "700" },
    thumbRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 14,
        gap: 8,
    },
    thumbImg: { width: 40, height: 40, borderRadius: 12 },
    thumbTotal: {
        marginLeft: "auto",
        fontSize: 16,
        fontWeight: "700",
        color: "#0F172A",
    },
    statusBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 14,
        borderRadius: 14,
        marginTop: 16,
    },
    statusBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

    // History
    historyHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 24,
        marginBottom: 12,
    },
    historyCount: { fontSize: 13, color: "#94A3B8", fontWeight: "500" },
    historyCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    historyTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    historyTokenRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    historyToken: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
    historyDate: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
    historyTotal: { fontSize: 17, fontWeight: "700", color: "#0F172A" },
    historyItem: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
    },
    historyItemImg: {
        width: 42,
        height: 42,
        borderRadius: 12,
        marginRight: 12,
    },
    historyItemName: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
    historyItemNote: { fontSize: 12, color: "#94A3B8", marginTop: 1 },
    historyItemQty: { fontSize: 14, fontWeight: "600", color: "#64748B" },

    // Cancel & Action
    actionRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 16,
    },
    cancelBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: "#FEE2E2",
        backgroundColor: "#FEF2F2",
    },
    cancelBtnText: { fontSize: 14, fontWeight: "700", color: "#EF4444" },

    // Payment
    paymentRow: {
        marginTop: 10,
    },
    paymentLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#64748B",
    },

    // Coupon Info
    couponInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
    },
    couponInfoText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#22C55E",
    },

    // Feedback
    leaveReviewBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginTop: 14,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: "#DCFCE7",
        backgroundColor: "#F0FDF4",
    },
    leaveReviewText: { fontSize: 14, fontWeight: "700", color: "#22C55E" },
});