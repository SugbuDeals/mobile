import { StyleSheet, Text, View } from "react-native";

interface DividerProps {
  text?: string;
  color?: string;
}

export default function Divider({ text, color = "#666" }: DividerProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.line, { backgroundColor: color }]} />
      <Text style={[styles.text, { color: color }]}>{text}</Text>
      <View style={[styles.line, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  line: {
    flex: 1,
    height: 1,
  },
  text: {
    marginHorizontal: 15,
    fontSize: 14,
    fontWeight: "400",
  },
});
