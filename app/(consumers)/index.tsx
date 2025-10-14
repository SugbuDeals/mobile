import Card from "@/components/Card";
import { useLogin } from "@/features/auth";
import { useCatalog } from "@/features/catalog";
import type { Category, Product } from "@/features/catalog/types";
import { useStore } from "@/features/store";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const STATIC_CATEGORIES: Category[] = [
  { id: 1001, name: "Groceries" },
  { id: 1002, name: "Electronics" },
  { id: 1003, name: "Fashion" },
  { id: 1004, name: "Home" },
  { id: 1005, name: "Furniture" },
  { id: 1006, name: "Decor" },
];

export default function Home() {
  const router = useRouter();
  const {
    state: { user },
  } = useLogin();
  const {
    state: { stores, loading },
    action: { findStores },
  } = useStore();
  const {
    state: { categories, products },
    action: { loadCategories, loadProducts },
  } = useCatalog();

  useEffect(() => {
    findStores();
    loadCategories();
    loadProducts();
  }, [findStores, loadCategories, loadProducts]);

  const displayName =
    user?.name || (user as any)?.fullname || user?.email || "there";
  const displayCategories =
    categories?.length > 0 ? categories : STATIC_CATEGORIES;

  return (
    <ScrollView style={styles.container}>
      <Greeting name={displayName} />
      <Categories categories={displayCategories.slice(0, 4)} />
      <Recommendations products={products || []} router={router} />
      <NearbyStores stores={stores || []} loading={loading} router={router} />
    </ScrollView>
  );
}

function Greeting({ name }: { name: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.greetingTitle}>Hello, {name}! 👋</Text>
      <Text style={styles.greetingSubtitle}>
        What would you like to shop today?
      </Text>
    </View>
  );
}

function Categories({ categories }: { categories: Category[] }) {
  return (
    <View style={styles.section}>
      <SectionHeader title="Categories" linkText="See All" />
      <View style={styles.grid}>
        {categories.map((cat) => (
          <View key={cat.id} style={styles.gridItem}>
            <TouchableOpacity activeOpacity={0.8}>
              <View style={styles.iconWrap}>
                <Image
                  source={require("../../assets/images/icon.png")}
                  style={styles.icon}
                />
              </View>
            </TouchableOpacity>
            <Text style={styles.caption} numberOfLines={1}>
              {cat.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Recommendations({
  products,
  router,
}: {
  products: Product[];
  router: any;
}) {
  const handleProductPress = (p: Product) => {
    router.push({
      pathname: "/(consumers)/product",
      params: {
        name: p.name,
        storeId: p.storeId,
        price: p.price,
        productId: p.id,
      },
    });
  };

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Recommended for You"
        linkText="View All"
        onPress={() => router.push("/(consumers)/recommendations")}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {products.map((p) => (
          <Card key={p.id} style={styles.card}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleProductPress(p)}
            >
              <View style={styles.imageWrap}>
                <Image
                  source={require("../../assets/images/react-logo.png")}
                  style={styles.image}
                />
                <Text style={styles.badge}>New</Text>
              </View>
              <View>
                <View style={styles.detailsContainer}>
                  <Text style={styles.title} numberOfLines={1}>
                    {p.name}
                  </Text>
                  {p.price != null && (
                    <Text style={styles.price}>
                      ₱{Number(p.price).toFixed(2)}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

function NearbyStores({
  stores,
  loading,
  router,
}: {
  stores: any[];
  loading: boolean;
  router: any;
}) {
  if (loading) return null;

  const handleStorePress = (store: any) => {
    router.push({
      pathname: "/(consumers)/storedetails",
      params: { store: store.name, storeId: store.id },
    });
  };

  return (
    <View style={styles.section}>
      <SectionHeader title="Nearby Stores" linkText="View Map" />
      {stores.map((s) => (
        <TouchableOpacity
          key={s.id ?? s.name}
          style={styles.nearbyCard}
          activeOpacity={0.8}
          onPress={() => handleStorePress(s)}
        >
          <Image
            source={require("../../assets/images/partial-react-logo.png")}
            style={styles.storeIcon}
          />
          <View style={styles.info}>
            <Text style={[styles.text, styles.bold]} numberOfLines={1}>
              {s.name}
            </Text>
            <Text style={styles.text}>{s.distance ?? "~1.2 km"}</Text>
            <Text style={styles.text}>{s.rating ?? "4.5 ★"}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function SectionHeader({
  title,
  linkText,
  onPress,
}: {
  title: string;
  linkText: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.headerRow}>
      <Text style={styles.header}>{title}</Text>
      <TouchableOpacity onPress={onPress}>
        <Text style={styles.link}>{linkText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // General / Layout
  container: {
    paddingHorizontal: 15,
    backgroundColor: "#ffffff",
  },
  section: {
    marginVertical: 15,
  },

  // Greeting Component
  greetingTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 5,
  },
  greetingSubtitle: {
    fontSize: 16,
    color: "#6b7280",
  },

  // SectionHeader Component
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    fontSize: 15,
    fontWeight: "600",
  },
  link: {
    fontSize: 13,
    color: "#D97706",
  },

  // Categories Component
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gridItem: {
    alignItems: "center",
  },
  iconWrap: {
    width: 55,
    height: 55,
    borderRadius: "100%",
    backgroundColor: "#E5F3F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  icon: {
    width: 22,
    height: 22,
    resizeMode: "contain",
  },
  caption: {
    fontSize: 12,
  },

  // Recommendations Component
  row: {
    paddingVertical: 7,
    paddingHorizontal: 2,
  },
  card: {
    width: 240,
    backgroundColor: "#FFFFFF",
    borderRadius: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  imageWrap: {
    position: "relative",
    width: "100%",
    height: 150,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#1B6F5D",
    color: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 30,
    overflow: "hidden",
  },
  detailsContainer: {
    padding: 10,
  },
  title: {
    paddingHorizontal: 10,
    marginTop: 6,
  },
  price: {
    paddingHorizontal: 10,
  },

  // NearbyStores Component
  nearbyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    height: 80,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 5,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 2,
    overflow: "hidden",
  },
  storeIcon: {
    width: 30,
    height: 30,
    borderRadius: 7,
    padding: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 10,
    resizeMode: "contain",
  },
  info: {
    flex: 1,
  },
  text: {
    lineHeight: 18,
  },
  bold: {
    fontWeight: "bold",
  },
});
