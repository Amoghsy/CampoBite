import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Splash() {
    const router = useRouter();

    useEffect(() => {
        setTimeout(() => router.replace("/login"), 2000);
    }, []);

    return (
        <LinearGradient
            colors={["#26AF7B", "#138F71"]}
            style={styles.container}
        >
            <View style={styles.logoBox}>
                <Text style={{ fontSize: 40 }}>🍴</Text>
            </View>

            <Text style={styles.title}>CampoBite</Text>

            <Text style={styles.tagline}>SMART CAMPUS DINING</Text>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    logoBox: {
        backgroundColor: "#fff",
        padding: 30,
        borderRadius: 24,
        marginBottom: 20,
    },
    title: {
        color: "#fff",
        fontSize: 32,
        fontWeight: "700",
    },
    tagline: {
        position: "absolute",
        bottom: 40,
        color: "#fff",
        letterSpacing: 2,
    },
});