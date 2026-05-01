import { Image, StyleSheet, Text, View } from "react-native";
import { Colors } from "../constants/colors";

interface Props {
    title: string;
    price: string;
    image: string;
}

export default function FoodCard({ title, price, image }: Props) {
    return (
        <View style={styles.card}>
            <Image source={{ uri: image }} style={styles.image} />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.price}>{price}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 15,
        marginTop: 15,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    image: {
        height: 150,
        borderRadius: 15,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        marginTop: 10,
    },
    price: {
        color: Colors.primary,
        fontWeight: "600",
        marginTop: 5,
    },
});
