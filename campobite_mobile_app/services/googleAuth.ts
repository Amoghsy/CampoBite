import { GoogleSignin } from "@react-native-google-signin/google-signin";

// Web OAuth Client ID from Google Cloud Console
// Set EXPO_PUBLIC_GOOGLE_CLIENT_ID in your .env file
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "";

/**
 * Call this once at app startup (e.g. in RootLayout) to configure the SDK.
 */
export function configureGoogleSignin() {
    GoogleSignin.configure({
        webClientId: WEB_CLIENT_ID,
    });
}

/**
 * Opens the native Google Sign-In prompt.
 * Returns the idToken string on success, or throws on failure/cancellation.
 */
export async function promptGoogleSignIn(): Promise<string> {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();

    // SDK v13+ returns userInfo.data; older versions return the token directly
    const idToken =
        (userInfo as any)?.data?.idToken ?? (userInfo as any)?.idToken;

    if (!idToken) {
        throw new Error("Google Sign-In did not return an ID token.");
    }

    return idToken;
}

