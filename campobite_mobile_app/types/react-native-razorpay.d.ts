declare module "react-native-razorpay" {
    interface RazorpayCheckoutOptions {
        description?: string;
        image?: string;
        currency: string;
        key: string;
        amount: string;
        name: string;
        order_id: string;
        prefill?: {
            email?: string;
            contact?: string;
            name?: string;
        };
        theme?: {
            color?: string;
        };
    }

    interface RazorpaySuccessResponse {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
    }

    const RazorpayCheckout: {
        open(options: RazorpayCheckoutOptions): Promise<RazorpaySuccessResponse>;
    };

    export default RazorpayCheckout;
}
