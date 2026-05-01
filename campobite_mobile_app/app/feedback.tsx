import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { apiPost } from "../services/api";

// ── Rating Labels ──────────────────────────────────────────
const ratingLabels = ["", "Poor", "Fair", "Average", "Good", "Excellent"];

const foodQualityOptions = ["Excellent", "Good", "Average", "Poor"];
const deliverySpeedOptions = ["Fast", "Normal", "Slow"];

// ── Component ──────────────────────────────────────────────
export default function Feedback() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        orderId?: string;
        orderToken?: string;
    }>();

    const orderId = params.orderId;
    const orderToken = params.orderToken ?? "#000";

    const [rating, setRating] = useState(0);
    const [foodQuality, setFoodQuality] = useState("");
    const [deliverySpeed, setDeliverySpeed] = useState("");
    const [comment, setComment] = useState("");
    const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert("Rating Required", "Please select a rating");
            return;
        }

        if (!orderId) {
            Alert.alert("Error", "Order ID is missing");
            return;
        }

        setLoading(true);
        try {
            await apiPost(`/api/feedback/${orderId}`, {
                rating,
                foodQuality: foodQuality || null,
                deliverySpeed: deliverySpeed || null,
                comment: comment || null,
                wouldRecommend,
            });
            setSubmitted(true);
            setTimeout(() => router.back(), 1500);
        } catch (e: any) {
            Alert.alert(
                "Feedback Error",
                e.message || "Could not submit feedback"
            );
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <View style={[styles.screen, styles.thankYou]}>
                <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={48} color="#22C55E" />
                </View>
                <Text style={styles.thankTitle}>Thank You! 🎉</Text>
                <Text style={styles.thankSub}>
                    Your feedback helps us serve you better.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* ── Header ── */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()}>
                        <Ionicons name="close" size={26} color="#0F172A" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Rate Your Order</Text>
                    <Pressable onPress={() => router.back()}>
                        <Text style={styles.skipText}>Skip</Text>
                    </Pressable>
                </View>

                {/* ── Order Info ── */}
                <View style={styles.orderInfoCard}>
                    <Ionicons name="receipt-outline" size={24} color="#22C55E" />
                    <View style={{ marginLeft: 12 }}>
                        <Text style={styles.orderInfoTitle}>
                            Order {orderToken}
                        </Text>
                        <Text style={styles.orderInfoSub}>
                            Share your experience
                        </Text>
                    </View>
                </View>

                {/* ── Rating Section ── */}
                <Text style={styles.questionTitle}>How was your meal?</Text>
                <Text style={styles.questionSub}>Help us improve CampoBite</Text>

                <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Pressable key={star} onPress={() => setRating(star)}>
                            <Ionicons
                                name={star <= rating ? "star" : "star-outline"}
                                size={40}
                                color={star <= rating ? "#22C55E" : "#CBD5E1"}
                            />
                        </Pressable>
                    ))}
                </View>
                {rating > 0 && (
                    <Text style={styles.ratingLabel}>{ratingLabels[rating]}</Text>
                )}

                {/* ── Food Quality ── */}
                <Text style={styles.tagHeading}>FOOD QUALITY</Text>
                <View style={styles.tagsWrap}>
                    {foodQualityOptions.map((option) => {
                        const active = foodQuality === option;
                        return (
                            <Pressable
                                key={option}
                                onPress={() => setFoodQuality(option)}
                                style={[styles.tag, active && styles.tagActive]}
                            >
                                <Text
                                    style={[styles.tagText, active && styles.tagTextActive]}
                                >
                                    {option}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                {/* ── Delivery Speed ── */}
                <Text style={styles.tagHeading}>DELIVERY SPEED</Text>
                <View style={styles.tagsWrap}>
                    {deliverySpeedOptions.map((option) => {
                        const active = deliverySpeed === option;
                        return (
                            <Pressable
                                key={option}
                                onPress={() => setDeliverySpeed(option)}
                                style={[styles.tag, active && styles.tagActive]}
                            >
                                <Text
                                    style={[styles.tagText, active && styles.tagTextActive]}
                                >
                                    {option}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                {/* ── Would Recommend ── */}
                <Text style={styles.tagHeading}>WOULD YOU RECOMMEND?</Text>
                <View style={styles.tagsWrap}>
                    <Pressable
                        onPress={() => setWouldRecommend(true)}
                        style={[
                            styles.tag,
                            wouldRecommend === true && styles.tagActive,
                        ]}
                    >
                        <Text
                            style={[
                                styles.tagText,
                                wouldRecommend === true && styles.tagTextActive,
                            ]}
                        >
                            👍 Yes
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setWouldRecommend(false)}
                        style={[
                            styles.tag,
                            wouldRecommend === false && styles.tagActive,
                        ]}
                    >
                        <Text
                            style={[
                                styles.tagText,
                                wouldRecommend === false && styles.tagTextActive,
                            ]}
                        >
                            👎 No
                        </Text>
                    </Pressable>
                </View>

                {/* ── Comments ── */}
                <Text style={styles.commentHeading}>ADDITIONAL COMMENTS</Text>
                <TextInput
                    style={styles.commentInput}
                    placeholder="Tell us more about your experience (optional)..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={4}
                    value={comment}
                    onChangeText={setComment}
                    textAlignVertical="top"
                />
            </ScrollView>

            {/* ── Submit Button ── */}
            <View style={styles.bottomBar}>
                <Pressable onPress={handleSubmit} disabled={loading}>
                    <LinearGradient
                        colors={["#22C55E", "#138F71"]}
                        style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.submitText}>Submit Feedback</Text>
                                <Ionicons name="chevron-forward" size={18} color="#fff" />
                            </>
                        )}
                    </LinearGradient>
                </Pressable>
            </View>
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
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
    skipText: { fontSize: 15, fontWeight: "600", color: "#22C55E" },

    orderInfoCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 18,
        padding: 16,
        marginTop: 24,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    orderInfoTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
    orderInfoSub: { fontSize: 12, color: "#94A3B8", marginTop: 2 },

    questionTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#0F172A",
        textAlign: "center",
        marginTop: 30,
    },
    questionSub: {
        fontSize: 14,
        color: "#94A3B8",
        textAlign: "center",
        marginTop: 4,
    },
    starsRow: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 10,
        marginTop: 24,
    },
    ratingLabel: {
        fontSize: 15,
        fontWeight: "600",
        color: "#22C55E",
        textAlign: "center",
        marginTop: 10,
    },

    tagHeading: {
        fontSize: 12,
        fontWeight: "700",
        color: "#0F172A",
        letterSpacing: 1.2,
        marginTop: 30,
        marginBottom: 12,
    },
    tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    tag: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: "#E2E8F0",
        backgroundColor: "#fff",
    },
    tagActive: {
        borderColor: "#22C55E",
        backgroundColor: "#F0FDF4",
    },
    tagText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
    tagTextActive: { color: "#22C55E" },

    commentHeading: {
        fontSize: 12,
        fontWeight: "700",
        color: "#0F172A",
        letterSpacing: 1.2,
        marginTop: 28,
        marginBottom: 10,
    },
    commentInput: {
        backgroundColor: "#fff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        padding: 16,
        fontSize: 14,
        color: "#0F172A",
        minHeight: 100,
    },

    bottomBar: {
        padding: 20,
        paddingBottom: 34,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
    },
    submitBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 16,
        borderRadius: 16,
    },
    submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },

    thankYou: { alignItems: "center", justifyContent: "center" },
    checkCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#DCFCE7",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    thankTitle: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
    thankSub: { fontSize: 15, color: "#64748B", marginTop: 6 },
});
