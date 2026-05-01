import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text } from "react-native";
import { Colors } from "../constants/colors";

interface Props {
    title: string;
    onPress?: () => void;
}

export default function GradientButton({ title, onPress }: Props) {
    return (
        <Pressable onPress={onPress}>
            <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.button}
            >
                <Text style={styles.text}>{title}</Text>
            </LinearGradient>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
    },
    text: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
});
