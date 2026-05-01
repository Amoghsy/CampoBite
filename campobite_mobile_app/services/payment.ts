import { apiPost } from "./api";
import RazorpayCheckout from "react-native-razorpay";

// Read Razorpay key from environment — user must set EXPO_PUBLIC_RAZORPAY_KEY_ID
const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? "";

interface RazorpayOrderResponse {
    orderId: string;
    amount: number;
    currency: string;
}

/**
 * Creates a Razorpay order on the backend.
 * @param amount — total amount in INR (rupees, not paise)
 */
export async function createRazorpayOrder(
    amount: number
): Promise<RazorpayOrderResponse> {
    return apiPost<RazorpayOrderResponse>(
        "/api/payment/create-order",
        { amount },
        true
    );
}

interface RazorpaySuccessData {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

/**
 * Opens Razorpay native checkout.
 * Resolves with payment details on success, rejects on failure/dismiss.
 */
export async function openRazorpayCheckout(
    orderId: string,
    amount: number, // in paise (as returned from backend)
    currency: string,
    userEmail: string,
    userName: string
): Promise<RazorpaySuccessData> {
    const options = {
        description: "CampoBite Order Payment",
        image: "", // can set app logo URL here
        currency,
        key: RAZORPAY_KEY_ID,
        amount: String(amount), // Razorpay expects amount in paise as string
        name: "CampoBite",
        order_id: orderId,
        prefill: {
            email: userEmail,
            name: userName,
        },
        theme: { color: "#22C55E" },
    };

    // RazorpayCheckout.open returns a promise
    const data: RazorpaySuccessData = await RazorpayCheckout.open(options);
    return data;
}
