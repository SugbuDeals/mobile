import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Animated,
  Platform,
  Dimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, spacing, borderRadius, typography, shadows } from "@/styles/theme";

export interface SelectOption<T = string | number> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface SelectProps<T = string | number> {
  /** Array of options to display */
  options: SelectOption<T>[];
  /** Selected value (controlled) */
  value?: T;
  /** Default value (uncontrolled) */
  defaultValue?: T;
  /** Callback when selection changes */
  onValueChange?: (value: T) => void;
  /** Placeholder text when no value is selected */
  placeholder?: string;
  /** Label text displayed above the select */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text displayed below select */
  helperText?: string;
  /** Disable the select */
  disabled?: boolean;
  /** Custom styles */
  style?: View["props"]["style"];
  /** Custom container styles */
  containerStyle?: View["props"]["style"];
  /** Custom option renderer */
  renderOption?: (option: SelectOption<T>, isSelected: boolean) => React.ReactNode;
  /** Custom selected value renderer */
  renderSelected?: (option: SelectOption<T> | null) => React.ReactNode;
  /** Searchable select */
  searchable?: boolean;
  /** Maximum height of dropdown */
  maxHeight?: number;
  /** Accessibility label */
  accessibilityLabel?: string;
}

export function Select<T = string | number>({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select an option",
  label,
  error,
  helperText,
  disabled = false,
  style,
  containerStyle,
  renderOption,
  renderSelected,
  maxHeight = 300,
  accessibilityLabel,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<T | undefined>(value ?? defaultValue);
  const [searchQuery, setSearchQuery] = useState("");
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const dropdownRef = useRef<View>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // Update selected value when controlled value changes
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  // Filter options based on search query
  const filteredOptions = searchQuery
    ? options.filter((option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Find selected option
  const selectedOption = options.find((opt) => opt.value === selectedValue) || null;

  // Handle open/close with animations
  const handleOpen = () => {
    if (disabled) return;
    
    // Measure dropdown position
    dropdownRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setDropdownPosition({
        top: pageY + height,
        left: pageX,
        width: width,
      });
    });

    setIsOpen(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsOpen(false);
      setSearchQuery("");
    });
  };

  const handleSelect = (option: SelectOption<T>) => {
    if (option.disabled) return;
    
    setSelectedValue(option.value);
    onValueChange?.(option.value);
    handleClose();
  };

  const slideY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });

  const renderDefaultOption = (option: SelectOption<T>, isSelected: boolean) => (
    <View
      style={[
        styles.option,
        isSelected && styles.optionSelected,
        option.disabled && styles.optionDisabled,
      ]}
    >
      <Text
        style={[
          styles.optionText,
          isSelected && styles.optionTextSelected,
          option.disabled && styles.optionTextDisabled,
        ]}
      >
        {option.label}
      </Text>
      {isSelected && (
        <Ionicons name="checkmark" size={20} color={colors.primary} />
      )}
    </View>
  );

  const renderDefaultSelected = (option: SelectOption<T> | null) => {
    if (!option) {
      return (
        <Text style={styles.placeholderText}>{placeholder}</Text>
      );
    }
    return <Text style={styles.selectedText}>{option.label}</Text>;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        ref={dropdownRef}
        style={[
          styles.select,
          error && styles.selectError,
          disabled && styles.selectDisabled,
          style,
        ]}
        onPress={handleOpen}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label || placeholder}
        accessibilityState={{ disabled }}
      >
        <View style={styles.selectContent}>
          {renderSelected ? renderSelected(selectedOption) : renderDefaultSelected(selectedOption)}
        </View>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={20}
          color={disabled ? colors.gray400 : colors.gray600}
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}
      {!error && helperText && <Text style={styles.helperText}>{helperText}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={handleClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View
            style={[
              styles.dropdown,
              {
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width || 200,
                maxHeight,
                opacity: opacityAnim,
                transform: [{ translateY: slideY }],
              },
            ]}
          >
            <FlatList
              data={filteredOptions}
              keyExtractor={(item, index) => `${item.value}-${index}`}
              renderItem={({ item }) => {
                const isSelected = item.value === selectedValue;
                return (
                  <TouchableOpacity
                    onPress={() => handleSelect(item)}
                    disabled={item.disabled}
                    style={styles.optionTouchable}
                  >
                    {renderOption
                      ? renderOption(item, isSelected)
                      : renderDefaultOption(item, isSelected)}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No options found</Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            />
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray700,
    marginBottom: spacing.xs,
  },
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
    ...shadows.sm,
  },
  selectError: {
    borderColor: colors.error,
  },
  selectDisabled: {
    backgroundColor: colors.gray100,
    opacity: 0.6,
  },
  selectContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  placeholderText: {
    fontSize: typography.fontSize.base,
    color: colors.gray500,
  },
  selectedText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray900,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  dropdown: {
    position: "absolute",
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    overflow: "hidden",
    zIndex: 1000,
  },
  optionTouchable: {
    minHeight: 48,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  optionSelected: {
    backgroundColor: colors.primaryLight,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: typography.fontSize.base,
    color: colors.gray900,
    flex: 1,
  },
  optionTextSelected: {
    color: colors.primaryDark,
    fontWeight: typography.fontWeight.semibold,
  },
  optionTextDisabled: {
    color: colors.gray400,
  },
  emptyContainer: {
    padding: spacing.lg,
    alignItems: "center",
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
});

