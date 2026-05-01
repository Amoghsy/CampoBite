import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  NativeModules,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { apiPost } from "../services/api";
import { createRazorpayOrder, openRazorpayCheckout } from "../services/payment";

const { SpeechModule } = NativeModules;

interface Message {
  id: string;
  from: "bot" | "user";
  text: string;
  time?: string;
  loading?: boolean;
}

function getRazorpayDismissInfo(err: any): { dismissed: boolean; message?: string } {
  const description = String(err?.description || err?.error?.description || "");
  const reason = String(err?.error?.reason || err?.reason || "");
  const code = String(err?.code || err?.error?.code || "");
  const combined = `${description} ${reason} ${code}`.toLowerCase();

  const dismissed =
    combined.includes("cancel") ||
    combined.includes("cancelled") ||
    combined.includes("dismiss") ||
    combined.includes("closed") ||
    combined.includes("payment_cancelled");

  if (dismissed) return { dismissed: true };

  return {
    dismissed: false,
    message: "Payment couldn’t be completed. Please try again.",
  };
}

const quickActions = [
  {
    label: "Wait Times",
    query: "What are the wait times?",
  },
  {
    label: "How to pay?",
    query: "How can I pay?",
  },
  {
    label: "Report Issue",
    query: "I want to report an issue",
  },
];

export default function Chatbot() {
  const router = useRouter();
  const flatRef = useRef<FlatList>(null);
  const nextId = useRef(2);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      from: "bot",
      text: "Hi there! I'm CampoBot 🤖. How can I help you today?",
      time: getTime(),
    },
  ]);

  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  function getTime() {
    const d = new Date();
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  }

  const requestMicPermission = async () => {
    if (Platform.OS !== "android") return true;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const toggleListening = async () => {
    if (isListening) {
      SpeechModule?.stopListening?.();
      setIsListening(false);
      return;
    }

    const allowed = await requestMicPermission();
    if (!allowed) return;

    try {
      setIsListening(true);
      const result = await SpeechModule?.startListening?.();
      if (result && String(result).trim()) {
        sendMessage(String(result));
      }
    } catch (e) {
      console.log("Speech error:", e);
    } finally {
      setIsListening(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: String(nextId.current++),
      from: "user",
      text: text.trim(),
      time: getTime(),
    };

    const loadingId = String(nextId.current++);

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: loadingId, from: "bot", text: "", loading: true },
    ]);

    setInput("");

    try {
      const res = await apiPost("/api/chat", { message: text }, true);

      const botReply: Message = {
        id: String(nextId.current++),
        from: "bot",
        text:
          res.reply ||
          res.response ||
          "Sorry, I couldn't understand that.",
        time: getTime(),
      };

      setMessages((prev) =>
        prev.filter((m) => m.id !== loadingId).concat(botReply)
      );

      SpeechModule?.speak?.(botReply.text);

      if (
        res?.action === "OPEN_CHECKOUT" &&
        typeof res?.menuItemId === "number" &&
        typeof res?.quantity === "number" &&
        typeof res?.amount === "number"
      ) {
        try {
          setIsCheckoutLoading(true);

          // Step 1: Create Razorpay order (backend expects rupees; returns paise)
          const razorpayOrder = await createRazorpayOrder(res.amount);

          // Step 2: Open Razorpay native checkout
          const paymentData = await openRazorpayCheckout(
            razorpayOrder.orderId,
            razorpayOrder.amount,
            razorpayOrder.currency,
            user?.email ?? "",
            user?.name ?? ""
          );

          // Step 3: Place the order in backend
          const orderPayload = {
            totalAmount: res.amount,
            items: [
              {
                menuItemId: res.menuItemId,
                quantity: res.quantity,
              },
            ],
            couponCode: null,
            razorpayPaymentId: paymentData.razorpay_payment_id,
            razorpayOrderId: paymentData.razorpay_order_id,
            razorpaySignature: paymentData.razorpay_signature,
          };

          const order = await apiPost("/api/orders", orderPayload, true);

          router.push({
            pathname: "/order-status",
            params: { orderId: String(order.id) },
          });
        } catch (e: any) {
          const dismissInfo = getRazorpayDismissInfo(e);
          if (!dismissInfo.dismissed) {
            Alert.alert("Payment Failed", dismissInfo.message);
          }
        } finally {
          setIsCheckoutLoading(false);
        }
      }
    } catch {
      const errorMsg: Message = {
        id: String(nextId.current++),
        from: "bot",
        text:
          "Sorry, I'm having trouble connecting right now. Please try again!",
        time: getTime(),
      };

      setMessages((prev) =>
        prev.filter((m) => m.id !== loadingId).concat(errorMsg)
      );
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isBot = item.from === "bot";

    if (item.loading) {
      return (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.botLabel}>CampoBot</Text>
          <View style={styles.bubbleRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🤖</Text>
            </View>
            <View style={styles.botBubble}>
              <ActivityIndicator size="small" color="#22C55E" />
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={{ marginTop: 16 }}>
        {isBot && <Text style={styles.botLabel}>CampoBot</Text>}

        <View
          style={[
            styles.bubbleRow,
            isBot
              ? { justifyContent: "flex-start" }
              : { justifyContent: "flex-end" },
          ]}
        >
          {isBot && (
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🤖</Text>
            </View>
          )}

          {isBot ? (
            <View style={styles.botBubble}>
              <Text style={styles.botText}>{item.text}</Text>
            </View>
          ) : (
            <View style={styles.userBubble}>
              <Text style={styles.userText}>{item.text}</Text>
            </View>
          )}
        </View>

        {!isBot && (
          <Text style={styles.readText}>Read {item.time}</Text>
        )}
      </View>
    );
  };

  const headerTime = messages[0]?.time ? `Today, ${messages[0].time}` : "Today";
  const bottomTrayPadding = Math.max(insets.bottom, 12);
  const composerHeight = 118;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.headerIconHit}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={22} color="#0F172A" />
          </Pressable>

          <View style={{ alignItems: "center" }}>
            <Text style={styles.headerTitle}>CampoBot</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>

          <Pressable style={styles.headerIconHit} hitSlop={8}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#0F172A" />
          </Pressable>
        </View>

        {/* CHAT LIST */}
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          ListHeaderComponent={
            <View style={styles.dayPillWrap}>
              <View style={styles.dayPill}>
                <Text style={styles.dayPillText}>{headerTime}</Text>
              </View>
            </View>
          }
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: composerHeight + bottomTrayPadding,
          }}
          onContentSizeChange={() =>
            flatRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* COMPOSER (QUICK ACTIONS + INPUT + MIC) */}
        <SafeAreaView
          edges={["bottom"]}
          style={[styles.bottomTray, { paddingBottom: bottomTrayPadding }]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRow}
          >
            {quickActions.map((action, i) => (
              <Pressable
                key={i}
                style={styles.quickPill}
                onPress={() => sendMessage(action.query)}
              >
                <Text style={styles.quickText}>{action.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.inputRow}>
            <Pressable style={styles.smallIconBtn} hitSlop={8}>
              <Ionicons name="add" size={18} color="#94A3B8" />
            </Pressable>

            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor="#94A3B8"
                value={input}
                onChangeText={setInput}
                returnKeyType="send"
                onSubmitEditing={() => sendMessage(input)}
              />
            </View>

            <Pressable
              onPress={toggleListening}
              style={styles.smallIconBtn}
              hitSlop={8}
            >
              <Ionicons
                name={isListening ? "mic-off-outline" : "mic-outline"}
                size={18}
                color="#94A3B8"
              />
            </Pressable>

            <Pressable
              onPress={() => sendMessage(input)}
              style={[styles.sendBtn, isCheckoutLoading && { opacity: 0.7 }]}
              hitSlop={8}
              disabled={isCheckoutLoading}
            >
              {isCheckoutLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6FA" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F5F6FA",
  },

  headerIconHit: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },

  onlineRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#22C55E",
  },
  onlineText: { fontSize: 12, color: "#94A3B8" },

  dayPillWrap: {
    alignItems: "center",
    marginTop: 6,
    marginBottom: 6,
  },
  dayPill: {
    backgroundColor: "#E9F1FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  dayPillText: { fontSize: 12, color: "#64748B" },

  bubbleRow: { flexDirection: "row", gap: 8, alignItems: "flex-end" },

  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E6F7F2",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: { fontSize: 14 },

  botLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 4,
    marginLeft: 38,
  },

  botBubble: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 14,
    maxWidth: "78%",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },

  botText: { fontSize: 14, color: "#1E293B" },

  userBubble: {
    padding: 12,
    borderRadius: 14,
    maxWidth: "78%",
    backgroundColor: "#22C55E",
  },

  userText: { color: "#fff", fontSize: 14 },

  readText: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "right",
    marginTop: 4,
  },

  bottomTray: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#F5F6FA",
    paddingTop: 6,
  },
  quickRow: {
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  quickPill: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },

  quickText: { fontSize: 13, color: "#22C55E", fontWeight: "600" },

  inputRow: {
    paddingHorizontal: 14,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  smallIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrap: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  input: {
    paddingVertical: 0,
    fontSize: 13,
    color: "#0F172A",
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
});