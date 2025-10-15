import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Empty box above search panel */}
        <View style={styles.emptyBox} />

        {/* Search Interface */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <View style={styles.topRow}>
              <LinearGradient
                colors={["#FFBE5D", "#277874"]}
                style={styles.searchIconContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="logo-android" size={24} color="#ffffff" />
              </LinearGradient>
              <TextInput
                style={styles.searchInput}
                placeholder="Searching for something?"
                placeholderTextColor="#6B7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity style={styles.sendButton}>
                <Ionicons name="send" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <View style={styles.bottomRow}>
              <View style={styles.progressLines}>
                <View style={styles.progressLine1} />
                <View style={styles.progressLine2} />
              </View>
              <TouchableOpacity style={styles.micButton}>
                <Ionicons name="mic" size={25} color="#E7A748" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    padding: 20,
    paddingTop: 10,
  },
  searchContainer: {
    marginBottom: 20,
  },
  emptyBox: {
    height: "100%",
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchBox: {
    backgroundColor: "#F3E5BC",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  searchIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  searchInput: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
    flex: 1,
    paddingVertical: 8,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressLines: {
    flexDirection: "column",
    gap: 4,
  },
  progressLine1: {
    width: 150,
    height: 6,
    backgroundColor: "#FFBE5D",
    borderRadius: 2,
  },
  progressLine2: {
    width: 80,
    height: 6,
    backgroundColor: "#277874",
    borderRadius: 2,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#CC8A2C",
    justifyContent: "center",
    alignItems: "center",
  },
  micButton: {
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
});
