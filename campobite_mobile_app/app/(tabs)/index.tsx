import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useCart, MenuItem } from "../../context/CartContext";
import { apiGet } from "../../services/api";

// Fallback image for items without imageUrl
const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400";

// ── Component ──────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { addItem, totalItems } = useCart();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const data = await apiGet<MenuItem[]>("/api/admin/menu", true);
      setMenuItems(data);
    } catch (e) {
      console.error("Failed to fetch menu:", e);
    } finally {
      setLoading(false);
    }
  };

  // Derive categories from menu items
  const categories = [
    "All",
    ...Array.from(new Set(menuItems.map((item) => item.category).filter(Boolean))),
  ];

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    if (!item.available) return false;
    const matchCategory =
      activeCategory === "All" || item.category === activeCategory;
    const matchSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  // Split: first 5 as "trending", rest as "specials"
  const trendingItems = filteredItems.slice(0, 5);
  const specialItems = filteredItems.slice(5);

  // Greeting based on time
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning,";
    if (h < 17) return "Good Afternoon,";
    return "Good Evening,";
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              {user?.picture ? (
                <Image
                  source={{ uri: user.picture }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarInitial}>
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </Text>
              )}
            </View>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.name}>
                {user?.name?.split(" ")[0] || "User"} 👋
              </Text>
            </View>
          </View>
          <Pressable style={styles.cartWrap} onPress={() => router.push("/cart")}>
            <Ionicons name="cart-outline" size={26} color="#0F172A" />
            {totalItems > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalItems}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* ── Search Bar ── */}
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color="#94A3B8"
            style={{ marginRight: 10 }}
          />
          <TextInput
            placeholder="What are you craving?"
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* ── Category Pills ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillRow}
          contentContainerStyle={{ gap: 10 }}
        >
          {categories.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.pill,
                activeCategory === cat && styles.pillActive,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  activeCategory === cat && styles.pillTextActive,
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {loading ? (
          <View style={{ marginTop: 60, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#22C55E" />
            <Text style={{ marginTop: 10, color: "#94A3B8" }}>
              Loading menu...
            </Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={{ marginTop: 60, alignItems: "center" }}>
            <Text style={{ fontSize: 40 }}>🍽️</Text>
            <Text
              style={{
                fontSize: 16,
                color: "#64748B",
                marginTop: 10,
                textAlign: "center",
              }}
            >
              No items found
            </Text>
          </View>
        ) : (
          <>
            {/* ── Trending Now ── */}
            {trendingItems.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Trending Now 🔥</Text>
                </View>
                <FlatList
                  data={trendingItems}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => String(item.id)}
                  contentContainerStyle={{ gap: 14 }}
                  renderItem={({ item }) => (
                    <View style={styles.trendCard}>
                      <View style={styles.trendImageWrap}>
                        <Image
                          source={{ uri: item.imageUrl || PLACEHOLDER_IMAGE }}
                          style={styles.trendImage}
                        />
                        {item.preparationTime && (
                          <View style={styles.timeBadge}>
                            <Ionicons
                              name="time-outline"
                              size={12}
                              color="#fff"
                            />
                            <Text style={styles.timeBadgeText}>
                              {item.preparationTime}m
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.trendTitle} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.trendDesc} numberOfLines={1}>
                        {item.description}
                      </Text>
                      <View style={styles.trendBottom}>
                        <Text style={styles.trendPrice}>₹{item.price}</Text>
                        <Pressable
                          style={styles.addBtn}
                          onPress={() => addItem(item)}
                        >
                          <Ionicons name="add" size={20} color="#22C55E" />
                        </Pressable>
                      </View>
                    </View>
                  )}
                />
              </>
            )}

            {/* ── All Items ── */}
            {specialItems.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 30 }]}>
                  More Items
                </Text>
                {specialItems.map((item) => (
                  <View key={item.id} style={styles.specialCard}>
                    <Image
                      source={{ uri: item.imageUrl || PLACEHOLDER_IMAGE }}
                      style={styles.specialImage}
                    />
                    <View style={styles.specialInfo}>
                      <View style={styles.specialTitleRow}>
                        <Text style={styles.specialTitle} numberOfLines={1}>
                          {item.name}
                        </Text>
                        {item.category && (
                          <View
                            style={[
                              styles.specialBadge,
                              { backgroundColor: "#22C55E20" },
                            ]}
                          >
                            <Text
                              style={[
                                styles.specialBadgeText,
                                { color: "#22C55E" },
                              ]}
                            >
                              {item.category}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.specialDesc} numberOfLines={1}>
                        {item.description}
                      </Text>
                      <View style={styles.specialBottom}>
                        <Text style={styles.specialPrice}>₹{item.price}</Text>
                        {item.preparationTime && (
                          <View style={styles.specialTime}>
                            <Ionicons
                              name="time-outline"
                              size={13}
                              color="#94A3B8"
                            />
                            <Text style={styles.specialTimeText}>
                              {item.preparationTime}m
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Pressable
                      style={styles.specialAddBtn}
                      onPress={() => addItem(item)}
                    >
                      <Ionicons name="add" size={20} color="#22C55E" />
                    </Pressable>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* ── Floating Chatbot FAB ── */}
      <Pressable style={styles.fab} onPress={() => router.push("/chatbot")}>
        <LinearGradient
          colors={["#1E3A5F", "#0F172A"]}
          style={styles.fabGradient}
        >
          <Ionicons name="chatbubbles" size={22} color="#fff" />
        </LinearGradient>
      </Pressable>
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
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: "700",
    color: "#64748B",
  },
  greeting: { fontSize: 14, color: "#64748B" },
  name: { fontSize: 20, fontWeight: "700", color: "#0F172A" },
  cartWrap: { position: "relative" },
  cartBadge: {
    position: "absolute",
    top: -5,
    right: -8,
    backgroundColor: "#22C55E",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: { flex: 1, fontSize: 15, color: "#0F172A" },

  // Category Pills
  pillRow: { marginTop: 18, flexGrow: 0 },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  pillActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  pillText: { fontSize: 14, fontWeight: "500", color: "#64748B" },
  pillTextActive: { color: "#fff" },

  // Section
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#0F172A" },

  // Trending Cards
  trendCard: {
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  trendImageWrap: { position: "relative" },
  trendImage: { width: "100%", height: 140, borderRadius: 16 },
  timeBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  trendTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
    color: "#0F172A",
  },
  trendDesc: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  trendBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  trendPrice: { fontSize: 17, fontWeight: "700", color: "#0F172A" },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },

  // Specials
  specialCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 12,
    marginTop: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  specialImage: { width: 75, height: 75, borderRadius: 14 },
  specialInfo: { flex: 1, marginLeft: 14 },
  specialTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  specialTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  specialBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  specialBadgeText: { fontSize: 11, fontWeight: "700" },
  specialDesc: { fontSize: 12, color: "#94A3B8", marginTop: 3 },
  specialBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  specialPrice: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  specialTime: { flexDirection: "row", alignItems: "center", gap: 4 },
  specialTimeText: { fontSize: 12, color: "#94A3B8" },
  specialAddBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },

  // FAB
  fab: { position: "absolute", bottom: 90, right: 20 },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
