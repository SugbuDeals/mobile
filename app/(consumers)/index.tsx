import Card from "@/components/Card";
import { useStore } from "@/features/store";
import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function Home() {
  const {
    action: { findStores },
    state: { stores, loading, error },
  } = useStore();

  useEffect(() => {
    findStores();
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Greetings */}
      <View style={styles.section}>
        <Text style={styles.greetingTitle}>Hello, Sarah! 👋</Text>
        <Text style={styles.greetingSubtitle}>
          What would you like to shop today?
        </Text>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Text style={styles.seeAllLink}>See All</Text>
        </View>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
          {[...Array(4)].map((_, index) => (
            <Card key={index} style={styles.categoryCard}></Card>
          ))}
        </ScrollView>
      </View>

      {/* Recommended */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended for You</Text>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
          {[...Array(3)].map((_, index) => (
            <Card key={index} style={styles.recommendedCard}></Card>
          ))}
        </ScrollView>
      </View>

      {/* Nearby Stores */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Stores</Text>
          <Text style={styles.seeAllLink}>View Map</Text>
        </View>
        <View>
          {!loading &&
            stores.map((store) => (
              <Card key={store.id} style={styles.nearbyCard}>
                <Text>{store.name}</Text>
              </Card>
            ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    backgroundColor: "#ffffff",
  },
  section: {
    marginVertical: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },
  seeAllLink: {
    fontSize: 14,
    color: "#FFBE5D",
    fontWeight: "500",
  },

  // Greeting styles
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

  // Empty box styles
  categoryCard: {
    width: 60,
    height: 60,
    borderRadius: 40,
    marginRight: 15,
    backgroundColor: "#FFBE5D",
  },
  recommendedCard: {
    width: 160,
    height: 200,
    marginRight: 15,
    backgroundColor: "#ffffff",
  },
  nearbyCard: {
    height: 80,
    marginBottom: 12,
    backgroundColor: "#ffffff",
  },
});
