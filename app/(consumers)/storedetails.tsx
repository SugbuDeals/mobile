import env from "@/config/env";
import { useBookmarks } from "@/features/bookmarks";
import { useCatalog } from "@/features/catalog";
import { useStore } from "@/features/store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function StoreDetailsScreen() {
  const params = useLocalSearchParams() as Record<string, string | undefined>;
  const storeName = (params.store as string) || "Store";
  const storeId = params.storeId ? Number(params.storeId) : undefined;
  // keep hook initialized for products used inside DealsGrid
  useCatalog();
  // keep bookmarks store ready for hero toggle
  useBookmarks();
  const [activeCategory, setActiveCategory] = React.useState("All");
  const [query, setQuery] = React.useState("");

  const categories = ["All", "Office Supplies", "Electronics", "Accessories"];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <StoreHero storeName={storeName} />
        <CategoriesBar
          categories={categories}
          active={activeCategory}
          onChange={setActiveCategory}
        />
        <StoreSearch value={query} onChange={setQuery} />
        <DealsGrid storeId={storeId} category={activeCategory} query={query} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// CategoriesBar (inline)
function CategoriesBar({
  categories,
  active,
  onChange,
}: {
  categories: string[];
  active: string;
  onChange: (c: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={barStyles.row}
    >
      {categories.map((c) => (
        <TouchableOpacity
          key={c}
          onPress={() => onChange(c)}
          style={[
            barStyles.pill,
            active === c ? barStyles.pillActive : barStyles.pillInactive,
          ]}
        >
          <Text
            style={[
              barStyles.text,
              active === c ? barStyles.textActive : barStyles.textInactive,
            ]}
          >
            {c}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// DealsGrid (inline) - uses catalog products filtered by storeId
function DealsGrid({
  storeId,
  query = "",
  category = "All",
}: {
  storeId?: number;
  query?: string;
  category?: string;
}) {
  const router = useRouter();
  const {
    state: { products },
  } = useCatalog();
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = (products || []).filter((p: any) =>
      storeId == null ? true : p.storeId === storeId
    );
    return source.filter((p: any) => {
      const matchesQuery =
        q.length === 0 || String(p.name).toLowerCase().includes(q);
      const matchesCategory =
        category === "All" ||
        String(p.category || "").toLowerCase() === category.toLowerCase();
      return matchesQuery && matchesCategory;
    });
  }, [products, storeId, query, category]);

  const handleProductPress = (p: any) => {
    router.push({
      pathname: "/(consumers)/product",
      params: {
        name: p.name,
        storeId: p.storeId || storeId,
        price: p.price,
        description: p.description,
        productId: p.id,
      },
    });
  };

  return (
    <View style={gridStyles.grid}>
      {filtered.map((p: any) => (
        <TouchableOpacity
          key={p.id}
          style={gridStyles.card}
          onPress={() => handleProductPress(p)}
          activeOpacity={0.8}
        >
          {typeof p.imageUrl === 'string' && p.imageUrl.length > 0 ? (
            <Image source={{ uri: p.imageUrl }} style={gridStyles.image} />
          ) : (
            <Image
              source={require("../../assets/images/partial-react-logo.png")}
              style={gridStyles.image}
            />
          )}
          <View style={gridStyles.textArea}>
            <Text style={gridStyles.productName}>{p.name}</Text>
            {p.price != null && (
              <Text style={gridStyles.price}>
                ₱{Number(p.price).toFixed(2)}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// StoreHero (inline)
function StoreHero({ storeName }: { storeName: string }) {
  const params = useLocalSearchParams() as Record<string, string | undefined>;
  const storeId = params.storeId ? Number(params.storeId) : undefined;
  const { helpers, action } = useBookmarks();
  const { state: { selectedStore, stores }, action: { findStoreById } } = useStore();
  React.useEffect(() => {
    if (storeId) findStoreById(storeId);
  }, [storeId]);
  const storeFromList = stores?.find((s: any) => s.id === storeId);
  const rawLogo = ((selectedStore && selectedStore.id === storeId) ? (selectedStore as any).imageUrl : undefined) || (storeFromList as any)?.imageUrl;
  const logoUrl = (() => {
    if (!rawLogo) return undefined;
    if (/^https?:\/\//i.test(rawLogo)) return rawLogo;
    if (rawLogo.startsWith('/')) return `${env.API_BASE_URL}${rawLogo}`;
    return `${env.API_BASE_URL}/files/${rawLogo}`;
  })();
  const description = (selectedStore && selectedStore.id === storeId ? (selectedStore as any)?.description : undefined) || (storeFromList as any)?.description || "";
  const isSaved = helpers.isStoreBookmarked(storeId);
  const toggle = () => {
    if (storeId == null) return;
    if (helpers.isStoreBookmarked(storeId)) action.removeStoreBookmark(storeId);
    else action.addStoreBookmark(storeId);
  };
  return (
    <View style={heroStyles.container}>
      <View style={heroStyles.bannerWrapper}>
        <Image
          source={require("../../assets/images/partial-react-logo.png")}
          resizeMode="cover"
          style={heroStyles.banner}
        />
      </View>
      <View style={heroStyles.topRightRow}>
        <TouchableOpacity onPress={toggle} activeOpacity={0.8}>
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={22}
            color={isSaved ? "#F59E0B" : "#333"}
          />
        </TouchableOpacity>
      </View>
      <View style={heroStyles.identityBlock}>
        <View style={heroStyles.logoWrapper}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={{ width: 84, height: 84, borderRadius: 20 }} />
          ) : (
            <View style={heroStyles.logoBox} />
          )}
          <Text style={heroStyles.name}>{storeName}</Text>
          {description ? (
            <Text style={heroStyles.desc} numberOfLines={3}>{description}</Text>
          ) : null}
          <View style={heroStyles.chipsRow}>
            <View style={[heroStyles.chip, heroStyles.chipPrimary]}>
              <Text style={heroStyles.chipPrimaryText}>Open Now</Text>
            </View>
            <View style={[heroStyles.chip, heroStyles.chipOutline]}>
              <Text style={heroStyles.chipOutlineText}>Closes at 9:00 PM</Text>
            </View>
          </View>
        </View>
      </View>
      <Text style={heroStyles.sectionTitle}>Store Products</Text>
    </View>
  );
}

// StoreSearch (inline)
function StoreSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (t: string) => void;
}) {
  return (
    <TextInput
      placeholder="Search products..."
      value={value}
      onChangeText={onChange}
      style={searchStyles.input}
      placeholderTextColor="#9CA3AF"
    />
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
});

const barStyles = StyleSheet.create({
  row: { columnGap: 10 },
  pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100 },
  pillActive: { backgroundColor: "#1B6F5D" },
  pillInactive: { backgroundColor: "#E5E7EB" },
  text: { fontWeight: "600" },
  textActive: { color: "#fff" },
  textInactive: { color: "#6B7280" },
});

const gridStyles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#F5F6F7",
    borderRadius: 16,
    paddingTop: 0,
    paddingBottom: 12,
    paddingHorizontal: 0,
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  image: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
  },
  textArea: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10 },
  productName: { fontWeight: "700" },
  price: { color: "#1B6F5D", fontWeight: "900", marginTop: 6 },
});

const heroStyles = StyleSheet.create({
  container: { paddingBottom: 16 },
  bannerWrapper: {
    marginLeft: -20,
    marginRight: -20,
    backgroundColor: "#d1d1d1",
  },
  banner: { width: "100%", height: 200, borderRadius: 12 },
  topRightRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  identityBlock: {
    flexDirection: "row",
    columnGap: 12,
    alignItems: "flex-start",
    marginTop: -8,
  },
  logoWrapper: { marginTop: -52 },
  logoBox: {
    width: 84,
    height: 84,
    borderRadius: 20,
    backgroundColor: "#1D9BF0",
  },
  name: { fontSize: 20, fontWeight: "700", marginTop: 6 },
  desc: { color: "#6B7280", marginTop: 2 },
  chipsRow: { flexDirection: "row", columnGap: 10, marginTop: 10 },
  chip: { borderRadius: 100, paddingVertical: 6, paddingHorizontal: 12 },
  chipPrimary: { backgroundColor: "#1B6F5D" },
  chipPrimaryText: { color: "#fff", fontWeight: "600" },
  chipOutline: {
    backgroundColor: "#fff",
    borderColor: "#1B6F5D",
    borderWidth: 1,
  },
  chipOutlineText: { color: "#1B6F5D", fontWeight: "600" },
  sectionTitle: { marginTop: 18, fontWeight: "700" },
});

const searchStyles = StyleSheet.create({
  input: {
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 10,
  },
});
