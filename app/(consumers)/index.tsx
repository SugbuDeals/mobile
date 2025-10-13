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
        <Text style={{ fontSize: 20, fontWeight: "600" }}>Hello, User</Text>
        <Text>What would you like to shop today?</Text>
      </View>
      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
          {[...Array(10)].map((_, index) => (
            <Card key={index} style={styles.categoryCard}></Card>
          ))}
        </ScrollView>
      </View>
      {/* Recommended */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended for you</Text>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
          {[...Array(10)].map((_, index) => (
            <Card key={index} style={styles.recommendedSectionCard}></Card>
          ))}
        </ScrollView>
      </View>
      {/* Nearby Stores */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nearby Stores</Text>
        <View>
          { !loading &&
            stores.map((store) => (
              <Card key={store.id} style={styles.recommendedSectionCard}>
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
  },
  section: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  categoryCard: {
    borderRadius: "100%",
    padding: 30,
  },
  recommendedSectionCard: {
    padding: 100,
  },
  nearbyCard: {
    padding: 30,
  },
});
