import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useCart, MenuItem } from "../context/CartContext";
import { apiGet, apiPost } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
    createRazorpayOrder,
    openRazorpayCheckout,
} from "../services/payment";

// Fallback image
const PLACEHOLDER =
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200";

export default function Cart() {
    const router = useRouter();
    const { items, updateQuantity, clearCart, totalAmount, totalItems } =
        useCart();
    const { user } = useAuth();

    const [couponCode, setCouponCode] = useState("");
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [couponApplied, setCouponApplied] = useState(false);
    const [couponLoading, setCouponLoading] = useState(false);
    const [orderLoading, setOrderLoading] = useState(false);
    const [recommended, setRecommended] = useState<MenuItem[]>([]);
    const { addItem } = useCart();

    const tax = Math.round(totalAmount * 0.05);
    const discount = couponApplied
        ? Math.round(totalAmount * (couponDiscount / 100))
        : 0;
    const total = totalAmount + tax - discount;

    useEffect(() => {
        fetchRecommended();
    }, []);

    const fetchRecommended = async () => {
        try {
            const data = await apiGet<MenuItem[]>(
                "/api/admin/menu/recommended",
                true
            );
            setRecommended(data);
        } catch {
            // silently fail — recommendations are optional
        }
    };

    const validateCoupon = async () => {
        if (!couponCode.trim()) return;
        setCouponLoading(true);
        try {
            const res = await apiPost(
                "/api/coupons/validate",
                { code: couponCode.trim() },
                false
            );
            setCouponDiscount(res.discountPercentage);
            setCouponApplied(true);
            Alert.alert(
                "Coupon Applied! 🎉",
                `${res.discountPercentage}% discount applied`
            );
        } catch (e: any) {
            Alert.alert("Invalid Coupon", e.message || "Coupon code is not valid");
            setCouponApplied(false);
            setCouponDiscount(0);
        } finally {
            setCouponLoading(false);
        }
    };

    const placeOrder = async () => {
        if (items.length === 0) {
            Alert.alert("Empty Cart", "Add some items before placing an order");
            return;
        }

        setOrderLoading(true);
        try {
            // Step 1: Create a Razorpay order via backend
            const razorpayOrder = await createRazorpayOrder(total);

            // Step 2: Open Razorpay native checkout
            const paymentData = await openRazorpayCheckout(
                razorpayOrder.orderId,
                razorpayOrder.amount,
                razorpayOrder.currency,
                user?.email ?? "",
                user?.name ?? ""
            );

            // Step 3: Payment succeeded — place the order in backend
            const orderPayload = {
                totalAmount: total,
                items: items.map((ci) => ({
                    menuItemId: ci.menuItem.id,
                    quantity: ci.quantity,
                })),
                couponCode: couponApplied ? couponCode.trim().toUpperCase() : null,
                razorpayPaymentId: paymentData.razorpay_payment_id,
                razorpayOrderId: paymentData.razorpay_order_id,
                razorpaySignature: paymentData.razorpay_signature,
            };

            const order = await apiPost("/api/orders", orderPayload, true);
            clearCart();
            setCouponCode("");
            setCouponApplied(false);
            setCouponDiscount(0);

            router.push({
                pathname: "/order-status",
                params: { orderId: String(order.id) },
            });
        } catch (e: any) {
            // Razorpay dismissal returns an error with code
            if (e?.code === "PAYMENT_CANCELLED" || e?.description?.includes("cancelled")) {
                Alert.alert("Payment Cancelled", "You cancelled the payment. Order was not placed.");
            } else {
                Alert.alert("Payment Failed", e.message || e.description || "Could not complete payment");
            }
        } finally {
            setOrderLoading(false);
        }
    };

    return (
        <View style={styles.screen}>
            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 200 }}
            >
                {/* ── Header ── */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={26} color="#0F172A" />
                    </Pressable>
                    <Text style={styles.headerTitle}>
                        My Cart{" "}
                        <Text style={styles.headerCount}>({totalItems})</Text>
                    </Text>
                    <Pressable onPress={() => clearCart()}>
                        <Text style={styles.clearAll}>Clear All</Text>
                    </Pressable>
                </View>

                {items.length === 0 ? (
                    <View style={{ alignItems: "center", marginTop: 60 }}>
                        <Text style={{ fontSize: 48 }}>🛒</Text>
                        <Text
                            style={{ fontSize: 16, color: "#64748B", marginTop: 10 }}
                        >
                            Your cart is empty
                        </Text>
                        <Pressable
                            onPress={() => router.back()}
                            style={{
                                marginTop: 20,
                                backgroundColor: "#DCFCE7",
                                paddingHorizontal: 24,
                                paddingVertical: 12,
                                borderRadius: 14,
                            }}
                        >
                            <Text style={{ color: "#22C55E", fontWeight: "700" }}>
                                Browse Menu
                            </Text>
                        </Pressable>
                    </View>
                ) : (
                    <>
                        {/* ── Cart Items ── */}
                        {items.map((ci) => (
                            <View key={ci.menuItem.id} style={styles.cartCard}>
                                <Image
                                    source={{
                                        uri: ci.menuItem.imageUrl || PLACEHOLDER,
                                    }}
                                    style={styles.cartImage}
                                />
                                <View style={styles.cartInfo}>
                                    <Text style={styles.cartTitle} numberOfLines={1}>
                                        {ci.menuItem.name}
                                    </Text>
                                    <Text style={styles.cartNote} numberOfLines={1}>
                                        {ci.menuItem.description}
                                    </Text>
                                    <Text style={styles.cartPrice}>
                                        ₹{ci.menuItem.price * ci.quantity}
                                    </Text>
                                </View>
                                <View style={styles.qtyRow}>
                                    <Pressable
                                        style={styles.qtyBtn}
                                        onPress={() => updateQuantity(ci.menuItem.id, -1)}
                                    >
                                        <Ionicons name="remove" size={18} color="#64748B" />
                                    </Pressable>
                                    <Text style={styles.qtyText}>{ci.quantity}</Text>
                                    <Pressable
                                        style={styles.qtyBtnActive}
                                        onPress={() => updateQuantity(ci.menuItem.id, 1)}
                                    >
                                        <Ionicons name="add" size={18} color="#fff" />
                                    </Pressable>
                                </View>
                            </View>
                        ))}

                        {/* ── Coupon Code ── */}
                        <View style={styles.couponRow}>
                            <TextInput
                                placeholder="Enter coupon code"
                                placeholderTextColor="#94A3B8"
                                style={styles.couponInput}
                                value={couponCode}
                                onChangeText={(t) => {
                                    setCouponCode(t);
                                    if (couponApplied) {
                                        setCouponApplied(false);
                                        setCouponDiscount(0);
                                    }
                                }}
                                autoCapitalize="characters"
                            />
                            <Pressable
                                style={[
                                    styles.couponBtn,
                                    couponApplied && { backgroundColor: "#DCFCE7" },
                                ]}
                                onPress={validateCoupon}
                                disabled={couponLoading || couponApplied}
                            >
                                {couponLoading ? (
                                    <ActivityIndicator size="small" color="#22C55E" />
                                ) : (
                                    <Text
                                        style={[
                                            styles.couponBtnText,
                                            couponApplied && { color: "#22C55E" },
                                        ]}
                                    >
                                        {couponApplied ? "Applied ✓" : "Apply"}
                                    </Text>
                                )}
                            </Pressable>
                        </View>

                        {/* ── Recommendations ── */}
                        {recommended.length > 0 && (
                            <>
                                <Text style={styles.suggestTitle}>
                                    ✨ You might also like
                                </Text>
                                <FlatList
                                    data={recommended.filter(
                                        (r) => !items.find((ci) => ci.menuItem.id === r.id)
                                    )}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    keyExtractor={(item) => String(item.id)}
                                    contentContainerStyle={{ gap: 14 }}
                                    renderItem={({ item }) => (
                                        <View style={styles.suggestCard}>
                                            <View style={styles.suggestImageWrap}>
                                                <Image
                                                    source={{
                                                        uri: item.imageUrl || PLACEHOLDER,
                                                    }}
                                                    style={styles.suggestImage}
                                                />
                                                <Pressable
                                                    style={styles.suggestAdd}
                                                    onPress={() => addItem(item)}
                                                >
                                                    <Ionicons name="add" size={14} color="#22C55E" />
                                                </Pressable>
                                            </View>
                                            <Text style={styles.suggestName} numberOfLines={1}>
                                                {item.name}
                                            </Text>
                                            <Text style={styles.suggestPrice}>₹{item.price}</Text>
                                        </View>
                                    )}
                                />
                            </>
                        )}

                        {/* ── Order Summary ── */}
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryHeading}>ORDER SUMMARY</Text>

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Subtotal</Text>
                                <Text style={styles.summaryValue}>₹{totalAmount}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Tax (5%)</Text>
                                <Text style={styles.summaryValue}>₹{tax}</Text>
                            </View>
                            {couponApplied && (
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>
                                        Coupon ({couponDiscount}%)
                                    </Text>
                                    <Text style={[styles.summaryValue, { color: "#22C55E" }]}>
                                        - ₹{discount}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.divider} />

                            <View style={styles.summaryRow}>
                                <Text style={styles.totalLabel}>Total</Text>
                                <Text style={styles.totalValue}>₹{total}</Text>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>

            {/* ── Bottom Bar ── */}
            {items.length > 0 && (
                <View style={styles.bottomBar}>
                    <View style={styles.payRow}>
                        <LinearGradient
                            colors={["#22C55E", "#138F71"]}
                            style={styles.payLeft}
                        >
                            <Text style={styles.payLabel}>Total to pay</Text>
                            <Text style={styles.payAmount}>₹{total}</Text>
                        </LinearGradient>

                        <Pressable
                            style={styles.payBtn}
                            onPress={placeOrder}
                            disabled={orderLoading}
                        >
                            {orderLoading ? (
                                <ActivityIndicator size="small" color="#0F172A" />
                            ) : (
                                <Text style={styles.payBtnText}>Pay & Order →</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            )}
        </View>
    );
}

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#F8FAFC" },
    container: { flex: 1, padding: 20, paddingTop: 50 },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    headerTitle: { fontSize: 20, fontWeight: "700", color: "#0F172A" },
    headerCount: { fontWeight: "400", color: "#94A3B8" },
    clearAll: { fontSize: 14, fontWeight: "600", color: "#22C55E" },

    // Cart Card
    cartCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 18,
        padding: 12,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    cartImage: { width: 75, height: 75, borderRadius: 14 },
    cartInfo: { flex: 1, marginLeft: 14 },
    cartTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
    cartNote: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
    cartPrice: {
        fontSize: 16,
        fontWeight: "700",
        color: "#22C55E",
        marginTop: 4,
    },
    qtyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    qtyBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "#F1F5F9",
        alignItems: "center",
        justifyContent: "center",
    },
    qtyBtnActive: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "#22C55E",
        alignItems: "center",
        justifyContent: "center",
    },
    qtyText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#0F172A",
        minWidth: 14,
        textAlign: "center",
    },

    // Coupon
    couponRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 14,
        gap: 10,
    },
    couponInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        backgroundColor: "#fff",
        color: "#0F172A",
    },
    couponBtn: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: "#0F172A",
    },
    couponBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

    // Suggestions
    suggestTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0F172A",
        marginTop: 28,
        marginBottom: 14,
    },
    suggestCard: { width: 110, alignItems: "center" },
    suggestImageWrap: { position: "relative" },
    suggestImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#F1F5F9",
    },
    suggestAdd: {
        position: "absolute",
        bottom: 2,
        right: 2,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: "#DCFCE7",
        alignItems: "center",
        justifyContent: "center",
    },
    suggestName: {
        fontSize: 13,
        fontWeight: "600",
        color: "#0F172A",
        marginTop: 8,
        textAlign: "center",
    },
    suggestPrice: {
        fontSize: 13,
        fontWeight: "700",
        color: "#22C55E",
        marginTop: 2,
    },

    // Summary
    summaryCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        marginTop: 28,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    summaryHeading: {
        fontSize: 13,
        fontWeight: "800",
        color: "#0F172A",
        letterSpacing: 1,
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    summaryLabel: { fontSize: 14, color: "#64748B" },
    summaryValue: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
    divider: {
        height: 1,
        backgroundColor: "#E2E8F0",
        marginVertical: 12,
    },
    totalLabel: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
    totalValue: { fontSize: 20, fontWeight: "800", color: "#0F172A" },

    // Bottom Bar
    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 30,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
        elevation: 10,
    },
    payRow: {
        flexDirection: "row",
        borderRadius: 18,
        overflow: "hidden",
    },
    payLeft: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 18,
        justifyContent: "center",
    },
    payLabel: { fontSize: 11, color: "#fff", opacity: 0.85 },
    payAmount: { fontSize: 20, fontWeight: "800", color: "#fff" },
    payBtn: {
        flex: 1,
        backgroundColor: "#F0FDF4",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
    },
    payBtnText: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
});
