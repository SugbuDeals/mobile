import {
    Image,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
} from "react-native";

interface TextFieldProps extends TextInputProps {
  label?: string;
  icon?: any;
  iconComponent?: React.ReactNode;
  error?: string;
}

export default function TextField({
  label,
  icon,
  iconComponent,
  style,
  error,
  ...props
}: TextFieldProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        {icon && <Image source={icon} style={styles.icon} />}
        {iconComponent && <View style={styles.iconContainer}>{iconComponent}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="#94a3b8"
          {...props}
        />
      </View>
      {error && <Text style={styles.error} >{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    color: "#0f172a",
    marginBottom: 6,
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#277874",
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 10,
    height: 46,
  },
  icon: {
    width: 18,
    height: 18,
    marginRight: 8,
    resizeMode: "contain",
  },
  iconContainer: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#0f172a",
    fontSize: 16,
  },
  error: {
    color: "#EF5350"
  }
});
