import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

type SavedItem = {
  id: string;
  name: string;
  category: string;
  type: 'product' | 'store';
  image?: string;
};

export default function Save() {
  const [activeTab, setActiveTab] = useState<'products' | 'stores'>('products');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Temporary data arrays for demonstration
  const savedProducts: SavedItem[] = [
    { id: '1', name: 'Wireless Headphones', category: 'electronics', type: 'product' },
    { id: '2', name: 'Cotton T-Shirt', category: 'clothing', type: 'product' },
    { id: '3', name: 'Coffee Maker', category: 'home', type: 'product' },
    { id: '4', name: 'Organic Apples', category: 'food', type: 'product' },
    { id: '5', name: 'Face Moisturizer', category: 'beauty', type: 'product' },
    { id: '6', name: 'Smartphone Case', category: 'electronics', type: 'product' },
    { id: '7', name: 'Denim Jeans', category: 'clothing', type: 'product' },
    { id: '8', name: 'Kitchen Blender', category: 'home', type: 'product' },
  ];

  const savedStores: SavedItem[] = [
    { id: '1', name: 'QuickMart', category: 'grocery', type: 'store' },
    { id: '2', name: 'TechWorld', category: 'electronics', type: 'store' },
    { id: '3', name: 'Fashion Hub', category: 'fashion', type: 'store' },
    { id: '4', name: 'Home Depot', category: 'home', type: 'store' },
    { id: '5', name: 'Pizza Palace', category: 'restaurant', type: 'store' },
    { id: '6', name: 'Fresh Market', category: 'grocery', type: 'store' },
    { id: '7', name: 'Gadget Store', category: 'electronics', type: 'store' },
    { id: '8', name: 'Style Boutique', category: 'fashion', type: 'store' },
  ];

  // Categories for filtering
  const productCategories = ['all', 'electronics', 'clothing', 'home', 'food', 'beauty'];
  const storeCategories = ['all', 'grocery', 'electronics', 'fashion', 'home', 'restaurant'];

  const currentItems = activeTab === 'products' ? savedProducts : savedStores;
  const currentCategories = activeTab === 'products' ? productCategories : storeCategories;

  const filteredItems = currentItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={activeTab === 'products' ? 'bag-outline' : 'storefront-outline'} 
        size={80} 
        color="#d1d5db" 
      />
      <Text style={styles.emptyTitle}>
        No {activeTab === 'products' ? 'Products' : 'Stores'} Saved Yet
      </Text>
      <Text style={styles.emptySubtitle}>
        Start exploring and save your favorite {activeTab === 'products' ? 'products' : 'stores'} to see them here
      </Text>
    </View>
  );

  const renderSavedItem = (item: SavedItem) => (
    <View key={item.id} style={styles.savedItemCard}>
      <View style={styles.itemImage}>
        <Ionicons 
          name={item.type === 'product' ? 'bag' : 'storefront'} 
          size={24} 
          color="#277874" 
        />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemCategory}>{item.category}</Text>
      </View>
      <TouchableOpacity style={styles.removeButton}>
        <Ionicons name="heart" size={20} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search saved ${activeTab}...`}
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'products' && styles.activeTab]}
          onPress={() => setActiveTab('products')}
        >
          <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
            Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stores' && styles.activeTab]}
          onPress={() => setActiveTab('stores')}
        >
          <Text style={[styles.tabText, activeTab === 'stores' && styles.activeTabText]}>
            Stores
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {currentCategories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.activeCategoryChip
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category && styles.activeCategoryChipText
                ]}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Saved Items */}
      <View style={styles.itemsContainer}>
        {filteredItems.length === 0 ? (
          renderEmptyState()
        ) : (
          filteredItems.map(renderSavedItem)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#277874",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  activeTabText: {
    color: "#ffffff",
  },
  categoryContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  activeCategoryChip: {
    backgroundColor: "#277874",
    borderColor: "#277874",
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  activeCategoryChipText: {
    color: "#ffffff",
  },
  itemsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  savedItemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: "#6b7280",
    textTransform: "capitalize",
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginTop: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
});