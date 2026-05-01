import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { apiGet, apiPut } from "../services/api";

const PLACEHOLDER =
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200";

interface OrderData {
    id: number;
    tokenNumber: number;
    status: string;
    totalAmount: number;
    createdAt: string;
    paymentStatus: string | null;
    couponCode: string | null;
    discountAmount: number | null;
    items: {
        id: number;
        menuItem: {
            name: string;
            imageUrl: string | null;
        };
        quantity: number;
        priceAtOrder: number;
    }[];
}

const statusSteps = [
    { key: "ORDERED", label: "Order Placed", icon: "checkmark-circle" as const },
    { key: "PREPARING", label: "Preparing", icon: "flame" as const },
    { key: "READY", label: "Ready for Pickup", icon: "bag-check-outline" as const },
];

const statusOrder = ["ORDERED", "PREPARING", "READY", "COMPLETED"];

export default function OrderStatus() {
    const router = useRouter();
    const params = useLocalSearchParams<{ orderId?: string }>();
    const [order, setOrder] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        fetchOrder();
    }, []);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const data = await apiGet("/api/dashboard", true);
            const allOrders = [
                ...(data.activeOrders || []),
                ...(data.orderHistory || []),
            ];
            const found = allOrders.find(
                (o: any) => String(o.id) === params.orderId
            );
            setOrder(found || null);
        } catch (e) {
            console.error("Failed to fetch order:", e);
        } finally {
            setLoading(false);
        }
    };

    const cancelOrder = () => {
        if (!order) return;
        Alert.alert(
            "Cancel Order",
            `Are you sure you want to cancel Order #${order.tokenNumber}? If payment was made, a refund will be initiated.`,
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        setCancelling(true);
                        try {
                            await apiPut(`/api/orders/${order.id}/cancel`, {});
                            Alert.alert("Order Cancelled", "Your order has been cancelled successfully.");
                            router.back();
                        } catch (e: any) {
                            Alert.alert("Error", e.message || "Failed to cancel order");
                        } finally {
                            setCancelling(false);
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

    if (!order) {
        return (
            <View
                style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}
            >
                <Text style={{ fontSize: 40 }}>❌</Text>
                <Text style={{ fontSize: 16, color: "#64748B", marginTop: 10 }}>
                    Order not found
                </Text>
                <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: "#22C55E", fontWeight: "700" }}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    const currentStepIndex = statusOrder.indexOf(order.status);
    const formatTime = (dateStr: string) =>
        new Date(dateStr).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

    // Estimate prep time
    const totalPrepTime = order.items?.reduce(
        (sum, item) => sum + (item.quantity * 3),
        0
    ) || 10;
    const progressPercent =
        order.status === "COMPLETED" || order.status === "READY"
            ? 100
            : order.status === "PREPARING"
                ? 60
                : 20;

    return (
        <View style={styles.screen}>
            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 60 }}
            >
                {/* ── Header ── */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()}>
                        <Ionicons name="close" size={26} color="#0F172A" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Order Status</Text>
                    <View style={{ width: 26 }} />
                </View>

                {/* ── Token Number ── */}
                <Text style={styles.tokenLabel}>TOKEN NUMBER</Text>
                <LinearGradient
                    colors={["#22C55E", "#138F71"]}
                    style={styles.tokenPill}
                >
                    <Text style={styles.tokenText}>#{order.tokenNumber}</Text>
                </LinearGradient>

                <Text style={styles.holdText}>
                    {order.status === "READY"
                        ? "Your order is ready! 🎉\nHead to the pickup counter."
                        : order.status === "COMPLETED"
                            ? "Order completed! ✅\nThank you for ordering."
                            : order.status === "CANCELLED"
                                ? "This order was cancelled."
                                : `Hold tight! We're crafting your\nmeal with care.`}
                </Text>

                {/* ── OTP Info Banner (READY status) ── */}
                {order.status === "READY" && (
                    <View style={styles.otpBanner}>
                        <Ionicons name="mail-outline" size={20} color="#3B82F6" />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.otpBannerTitle}>Pickup OTP Sent!</Text>
                            <Text style={styles.otpBannerText}>
                                Check your email for the 4-digit OTP. Show it at the counter to collect your order.
                            </Text>
                        </View>
                    </View>
                )}

                {/* ── Estimated Wait Time ── */}
                {order.status !== "COMPLETED" && order.status !== "CANCELLED" && order.status !== "READY" && (
                    <View style={styles.waitCard}>
                        <Text style={styles.waitLabel}>ESTIMATED WAIT TIME</Text>
                        <View style={styles.waitTimeRow}>
                            <Text style={styles.waitNumber}>
                                {String(totalPrepTime)}
                            </Text>
                            <Text style={styles.waitUnit}>min</Text>
                        </View>
                        <View style={styles.progressTrack}>
                            <View
                                style={[
                                    styles.progressFill,
                                    { width: `${progressPercent}%` },
                                ]}
                            />
                        </View>
                    </View>
                )}

                {/* ── Timeline ── */}
                <View style={styles.timeline}>
                    {statusSteps.map((step, i) => {
                        const stepIndex = statusOrder.indexOf(step.key);
                        const done = currentStepIndex > stepIndex;
                        const active = currentStepIndex === stepIndex;
                        const isLast = i === statusSteps.length - 1;

                        return (
                            <View key={i} style={styles.timelineRow}>
                                <View style={styles.timelineIconCol}>
                                    <View
                                        style={[
                                            styles.timelineIcon,
                                            done && styles.timelineIconDone,
                                            active && styles.timelineIconActive,
                                        ]}
                                    >
                                        <Ionicons
                                            name={step.icon}
                                            size={18}
                                            color={done ? "#fff" : active ? "#22C55E" : "#CBD5E1"}
                                        />
                                    </View>
                                    {!isLast && (
                                        <View
                                            style={[
                                                styles.timelineLine,
                                                done && { backgroundColor: "#22C55E" },
                                            ]}
                                        />
                                    )}
                                </View>
                                <View style={styles.timelineContent}>
                                    <Text
                                        style={[
                                            styles.timelineLabel,
                                            active && { color: "#22C55E", fontWeight: "700" },
                                            !done && !active && { color: "#CBD5E1" },
                                        ]}
                                    >
                                        {step.label}
                                    </Text>
                                    {done && step.key === "ORDERED" && (
                                        <Text style={styles.timelineSub}>
                                            {formatTime(order.createdAt)}
                                        </Text>
                                    )}
                                    {active && (
                                        <Text style={styles.timelineSub}>
                                            {step.key === "PREPARING"
                                                ? "Currently cooking"
                                                : step.key === "ORDERED"
                                                    ? "Awaiting confirmation"
                                                    : "Waiting for pickup"}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* ── Pickup Info Card ── */}
                <View style={styles.pickupCard}>
                    <View style={styles.pickupHandle} />

                    <View style={styles.pickupHeaderRow}>
                        <View>
                            <Text style={styles.pickupLabel}>ORDER DETAILS</Text>
                            <Text style={styles.pickupLocation}>
                                Total: ₹{order.totalAmount}
                            </Text>
                        </View>
                    </View>

                    {order.items?.map((item, i) => (
                        <View key={i} style={styles.pickupItem}>
                            <Image
                                source={{ uri: item.menuItem?.imageUrl || PLACEHOLDER }}
                                style={styles.pickupItemImg}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.pickupItemName}>
                                    {item.menuItem?.name || "Item"}
                                </Text>
                                <Text style={styles.pickupItemNote}>
                                    ₹{item.priceAtOrder} each
                                </Text>
                            </View>
                            <Text style={styles.pickupItemQty}>x{item.quantity}</Text>
                        </View>
                    ))}

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
                        <View style={styles.paymentInfoRow}>
                            <Text style={styles.paymentInfoText}>
                                {order.paymentStatus === "CAPTURED" ? "💳 Paid" :
                                    order.paymentStatus === "REFUNDED" ? "↩️ Refunded" :
                                        order.paymentStatus === "FAILED" ? "❌ Payment Failed" :
                                            "⏳ Payment Pending"}
                            </Text>
                        </View>
                    )}
                </View>

                {/* ── Cancel Order Button (only for ORDERED) ── */}
                {order.status === "ORDERED" && (
                    <Pressable
                        style={styles.cancelOrderBtn}
                        onPress={cancelOrder}
                        disabled={cancelling}
                    >
                        {cancelling ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                            <>
                                <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                                <Text style={styles.cancelOrderBtnText}>Cancel Order</Text>
                            </>
                        )}
                    </Pressable>
                )}

                {/* ── Feedback button (COMPLETED) ── */}
                {order.status === "COMPLETED" && (
                    <Pressable
                        style={styles.feedbackBtn}
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
                        <Ionicons name="chatbubble-outline" size={16} color="#22C55E" />
                        <Text style={styles.feedbackBtnText}>Leave Feedback</Text>
                    </Pressable>
                )}
            </ScrollView>
        </View>
    );
}

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#F8FAFC" },
    container: { flex: 1, padding: 20, paddingTop: 50 },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerTitle: { fontSize: 20, fontWeight: "700", color: "#0F172A" },

    tokenLabel: {
        textAlign: "center",
        fontSize: 12,
        fontWeight: "700",
        color: "#94A3B8",
        letterSpacing: 1.5,
        marginTop: 36,
    },
    tokenPill: {
        alignSelf: "center",
        paddingHorizontal: 50,
        paddingVertical: 28,
        borderRadius: 60,
        marginTop: 14,
    },
    tokenText: { fontSize: 44, fontWeight: "800", color: "#fff" },
    holdText: {
        textAlign: "center",
        fontSize: 16,
        color: "#0F172A",
        marginTop: 20,
        lineHeight: 24,
    },

    waitCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 24,
        marginTop: 28,
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    waitLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "#94A3B8",
        letterSpacing: 1.2,
    },
    waitTimeRow: {
        flexDirection: "row",
        alignItems: "baseline",
        marginTop: 8,
        gap: 4,
    },
    waitNumber: { fontSize: 42, fontWeight: "800", color: "#0F172A" },
    waitUnit: { fontSize: 18, fontWeight: "500", color: "#64748B" },
    progressTrack: {
        width: "60%",
        height: 5,
        backgroundColor: "#E2E8F0",
        borderRadius: 3,
        marginTop: 16,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#22C55E",
        borderRadius: 3,
    },

    timeline: { marginTop: 30 },
    timelineRow: { flexDirection: "row", minHeight: 70 },
    timelineIconCol: { alignItems: "center", width: 40 },
    timelineIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F1F5F9",
    },
    timelineIconDone: { backgroundColor: "#22C55E" },
    timelineIconActive: {
        backgroundColor: "#DCFCE7",
        borderWidth: 2,
        borderColor: "#22C55E",
    },
    timelineLine: {
        flex: 1,
        width: 2,
        backgroundColor: "#E2E8F0",
        marginVertical: 4,
    },
    timelineContent: { marginLeft: 14, paddingTop: 6, flex: 1 },
    timelineLabel: { fontSize: 15, fontWeight: "600", color: "#0F172A" },
    timelineSub: { fontSize: 12, color: "#94A3B8", marginTop: 2 },

    pickupCard: {
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: 20,
        marginTop: 28,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    pickupHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#E2E8F0",
        alignSelf: "center",
        marginBottom: 16,
    },
    pickupHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    pickupLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: "#94A3B8",
        letterSpacing: 1,
    },
    pickupLocation: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0F172A",
        marginTop: 4,
    },
    pickupItem: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
    },
    pickupItemImg: {
        width: 44,
        height: 44,
        borderRadius: 14,
        marginRight: 12,
    },
    pickupItemName: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
    pickupItemNote: { fontSize: 12, color: "#94A3B8", marginTop: 1 },
    pickupItemQty: { fontSize: 14, fontWeight: "600", color: "#64748B" },

    // OTP Banner
    otpBanner: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#EFF6FF",
        borderWidth: 1,
        borderColor: "#BFDBFE",
        borderRadius: 16,
        padding: 16,
        marginTop: 24,
    },
    otpBannerTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1E40AF",
    },
    otpBannerText: {
        fontSize: 13,
        color: "#3B82F6",
        marginTop: 2,
        lineHeight: 18,
    },

    // Coupon Info
    couponInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
    },
    couponInfoText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#22C55E",
    },

    // Payment Info
    paymentInfoRow: {
        marginTop: 12,
    },
    paymentInfoText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#64748B",
    },

    // Cancel Order
    cancelOrderBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginTop: 20,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: "#FEE2E2",
        backgroundColor: "#FEF2F2",
    },
    cancelOrderBtnText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#EF4444",
    },

    // Feedback
    feedbackBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginTop: 16,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: "#DCFCE7",
        backgroundColor: "#F0FDF4",
    },
    feedbackBtnText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#22C55E",
    },
});
