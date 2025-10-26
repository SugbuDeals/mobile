import { useCatalog } from "@/features/catalog";
import { useStore } from "@/features/store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
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

export default function CategoriesPage() {
  const [selectedCategory, setSelectedCategory] = React.useState("All Items");
  const [searchQuery, setSearchQuery] = React.useState("");

  const {
    state: { categories, products },
    action: { loadCategories, loadProducts },
  } = useCatalog();
  const {
    state: { stores },
    action: { findStores },
  } = useStore();

  useEffect(() => {
    if (!categories || categories.length === 0) loadCategories();
    if (!products || products.length === 0) loadProducts();
    if (!stores || stores.length === 0) findStores();
  }, [categories, products, stores, loadCategories, loadProducts, findStores]);

  // Frontend-only dynamic category derivation from product names
  const deriveCategory = (name: string): string => {
    const n = String(name || "").toLowerCase();
    // Phones / Mobile
    if (
      /(iphone|samsung|pixel|one\s?plus|xiaomi|oppo|vivo|huawei|cell\s?phone|smart\s?phone|phone)/.test(
        n
      )
    )
      return "Phones";
    // Laptops / Computers
    if (
      /(laptop|notebook|macbook|ultrabook|asus|acer|lenovo|dell|msi|thinkpad)/.test(
        n
      )
    )
      return "Laptops";
    if (/(desktop|pc\b|gaming\s?pc|i\d-\d{3,}|ryzen)/.test(n))
      return "Desktops";
    if (/(tablet|ipad|galaxy\s?tab|surface)/.test(n)) return "Tablets";
    // Audio
    if (
      /(headphone|headset|earbud|ear\s?phone|tws|speaker|soundbar|audio)/.test(
        n
      )
    )
      return "Audio";
    // Wearables
    if (/(watch|smart\s?watch|fitbit|band)/.test(n)) return "Wearables";
    // Gaming
    if (
      /(ps5|playstation|xbox|nintendo|switch|gaming|controller|vr\b|oculus|meta\s?quest)/.test(
        n
      )
    )
      return "Gaming";
    // Cameras / Imaging
    if (
      /(camera|dslr|mirrorless|canon|nikon|sony\s?a\d|gopro|instax|webcam|lens)/.test(
        n
      )
    )
      return "Cameras";
    // Displays / TV / Monitor
    if (/(tv\b|uhd|oled|qled|android\s?tv|roku|fire\s?tv)/.test(n))
      return "TVs";
    if (/(monitor|144hz|240hz|ultrawide)/.test(n)) return "Monitors";
    // Networking / Smart Home
    if (/(router|wi-?fi|mesh|modem|ethernet|switch\b)/.test(n))
      return "Networking";
    if (/(smart\s?home|bulb|plug|alexa|google\s?home|homekit)/.test(n))
      return "Smart Home";
    // Appliances / Home
    if (
      /(aircon|air\s?conditioner|fan|refrigerator|fridge|washer|washing\s?machine|dryer|microwave|oven|rice\s?cooker|blender|kettle)/.test(
        n
      )
    )
      return "Appliances";
    if (/(sofa|table|chair|desk|cabinet|drawer|shelf|mattress|bed)/.test(n))
      return "Furniture";
    // Fashion / Beauty / Health
    if (
      /(shirt|t-?shirt|jeans|dress|skirt|jacket|hoodie|shorts|fashion|clothing|apparel)/.test(
        n
      )
    )
      return "Fashion";
    if (/(sneaker|shoe|rubber\s?shoes|footwear|sandals|heels|boots)/.test(n))
      return "Footwear";
    if (
      /(cosmetic|makeup|lipstick|foundation|skincare|serum|moisturizer|beauty)/.test(
        n
      )
    )
      return "Beauty";
    if (
      /(vitamin|supplement|medicine|paracetamol|ibuprofen|mask|sanitizer|health)/.test(
        n
      )
    )
      return "Health";
    // Grocery / Pets / Baby
    if (
      /(grocery|snack|chips|noodles|rice|coffee|tea|milk|egg|bread|canned|beverage|drink)/.test(
        n
      )
    )
      return "Groceries";
    if (/(dog|cat|pet\s?food|litter|leash|aquarium)/.test(n))
      return "Pet Supplies";
    if (/(diaper|stroller|bottle|formula|baby\s?wipes|crib)/.test(n))
      return "Baby";
    // Sports / Outdoors
    if (
      /(sport|basketball|soccer|football|tennis|yoga|gym|fitness|dumbbell|treadmill|bike|bicycle|helmet)/.test(
        n
      )
    )
      return "Sports & Outdoors";
    // Office / School
    if (
      /(notebook\b|paper|pen|ballpen|pencil|stapler|printer|ink|toner|office\s?supplies)/.test(
        n
      )
    )
      return "Office & School";
    // Auto / Tools
    if (/(car\b|motorcycle|helmet|engine\s?oil|wiper|floor\s?mat)/.test(n))
      return "Automotive";
    if (/(tool|drill|screwdriver|wrench|hammer|saw)/.test(n)) return "Tools";
    // Media / Toys
    if (/(book|novel|manga|comic|textbook)/.test(n)) return "Books";
    if (/(toy|lego|figure|rc\b|puzzle|board\s?game)/.test(n)) return "Toys";
    // Bags & Accessories (fallbacks)
    if (/(bag|backpack|luggage)/.test(n)) return "Bags";
    if (
      /(mouse|keyboard|accessor(y|ies)|case|cover|cable|charger|power\s?bank|adapter|hub|dock)/.test(
        n
      )
    )
      return "Accessories";
    return "Other";
  };

  const serverCategoryNames = (categories || [])
    .map((c: any) => c.name)
    .filter(Boolean) as string[];
  const dynamicCategories = Array.from(
    new Set(
      (
        (products || []).map((p: any) => deriveCategory(p?.name)) as string[]
      ).filter(Boolean)
    )
  );
  const categoryNames = [
    "All Items",
    ...serverCategoryNames,
    ...dynamicCategories.filter((d) => !serverCategoryNames.includes(d)),
  ];

  const filteredStores = (stores || [])
    .map((store: any) => {
      const storeProducts = (products || []).filter(
        (p: any) => p.storeId === store.id
      );
      const filteredProducts = storeProducts
        .filter((p: any) => {
          const matchesQuery =
            searchQuery.trim().length === 0 ||
            String(p.name)
              .toLowerCase()
              .includes(searchQuery.trim().toLowerCase());
          const productDerivedCategory = deriveCategory(p?.name);
          const productCategoryName = String(
            (p as any).category?.name ||
              (p as any).categoryName ||
              productDerivedCategory ||
              ""
          );
          const matchesCategory =
            selectedCategory === "All Items" ||
            productCategoryName === selectedCategory;
          return matchesQuery && matchesCategory;
        })
        .map((p: any) => ({
          id: String(p.id),
          name: p.name,
          price: `₱${Number(p.price ?? 0).toFixed(2)}`,
          originalPrice: undefined,
          image: require("../../assets/images/partial-react-logo.png"),
        }));
      return {
        id: String(store.id),
        storeName: store.name,
        distance: "~1.0 km",
        isOpen: true,
        products: filteredProducts,
      };
    })
    .filter((s) => s.products.length > 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <CategoriesHeader />

      <ScrollView
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
      >
        <CategoryFilter
          categories={categoryNames}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search products"
        />

        {filteredStores.map((store) => (
          <StoreSection
            key={store.id}
            storeName={store.storeName}
            distance={store.distance}
            isOpen={store.isOpen}
            products={store.products}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoriesHeader() {
  const router = useRouter();
  return (
    <View style={headerStyles.pageHeader}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={headerStyles.backBtn}
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
      <Text style={headerStyles.pageTitle}>Categories</Text>
      <View style={{ width: 24 }} />
    </View>
  );
}

function CategoryFilter({
  categories,
  selectedCategory,
  onCategorySelect,
}: {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (c: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={filterStyles.categoryScroll}
    >
      <View style={filterStyles.categoryContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              filterStyles.categoryBtn,
              selectedCategory === category && filterStyles.categoryBtnActive,
            ]}
            onPress={() => onCategorySelect(category)}
          >
            <Text
              style={[
                filterStyles.categoryText,
                selectedCategory === category &&
                  filterStyles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function SearchBar({
  value,
  onChangeText,
  placeholder = "Search products",
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={searchStyles.container}>
      <View style={searchStyles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#9CA3AF"
          style={searchStyles.searchIcon}
        />
        <TextInput
          style={searchStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
        />
      </View>
    </View>
  );
}

function StoreSection({
  storeName,
  distance,
  isOpen,
  products,
}: {
  storeName: string;
  distance: string;
  isOpen: boolean;
  products: any[];
}) {
  const router = useRouter();
  const {
    state: { stores },
  } = useStore();
  
  const storeInfo = stores.find((s: any) => s.name === storeName);
  const storeId = storeInfo?.id;

  return (
    <View style={sectionStyles.container}>
      <View style={sectionStyles.storeHeader}>
        <View style={sectionStyles.storeInfo}>
          <Text style={sectionStyles.storeName}>{storeName}</Text>
          <View style={sectionStyles.distanceRow}>
            <Ionicons name="location-outline" size={14} color="#9CA3AF" />
            <Text style={sectionStyles.distance}>{distance}</Text>
          </View>
        </View>
        <View
          style={[
            sectionStyles.statusPill,
            { backgroundColor: isOpen ? "#D1FAE5" : "#FEE2E2" },
          ]}
        >
          <Text
            style={[
              sectionStyles.statusText,
              { color: isOpen ? "#1B6F5D" : "#DC2626" },
            ]}
          >
            {isOpen ? "Open" : "Closed"}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={sectionStyles.productsScroll}
      >
        <View style={sectionStyles.productsContainer}>
          {products.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={sectionStyles.productCard}
              onPress={() =>
                router.push({
                  pathname: "/(consumers)/product",
                  params: {
                    name: product.name,
                    store: storeName,
                    storeId: storeId,
                    price: product.price?.replace("₱", ""),
                    productId: product.id,
                  },
                })
              }
            >
              <Image
                source={product.image}
                style={sectionStyles.productImage}
              />
              <Text style={sectionStyles.productName} numberOfLines={2}>
                {product.name}
              </Text>
              <View style={sectionStyles.priceContainer}>
                <Text style={sectionStyles.currentPrice}>{product.price}</Text>
                {product.originalPrice && (
                  <Text style={sectionStyles.originalPrice}>
                    {product.originalPrice}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  mainContent: { flex: 1, backgroundColor: "#fff", paddingBottom: 60 },
});

const headerStyles = StyleSheet.create({
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#fff",
  },
  backBtn: { padding: 5 },
  pageTitle: { fontSize: 24, fontWeight: "bold", color: "#000" },
});

const filterStyles = StyleSheet.create({
  categoryScroll: { marginBottom: 20 },
  categoryContainer: { flexDirection: "row", paddingHorizontal: 20, gap: 10 },
  categoryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  categoryBtnActive: { backgroundColor: "#F9AD3F" },
  categoryText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  categoryTextActive: { color: "#000" },
});

const searchStyles = StyleSheet.create({
  container: { paddingHorizontal: 20, marginBottom: 20 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: "#000" },
});

const sectionStyles = StyleSheet.create({
  container: { marginBottom: 30 },
  storeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  storeInfo: { flex: 1 },
  storeName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  distanceRow: { flexDirection: "row", alignItems: "center" },
  distance: { fontSize: 14, color: "#9CA3AF", marginLeft: 4 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  statusText: { fontSize: 12, fontWeight: "600" },
  productsScroll: { paddingLeft: 20 },
  productsContainer: { flexDirection: "row", gap: 15 },
  productCard: {
    width: 120,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productImage: {
    width: "100%",
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
    marginBottom: 8,
    resizeMode: "contain",
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 6,
  },
  priceContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  currentPrice: { fontSize: 16, fontWeight: "bold", color: "#000" },
  originalPrice: {
    fontSize: 14,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
});
