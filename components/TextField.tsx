import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import type { BlurEvent } from "react-native/Libraries/Types/CoreEventTypes";

/**
 * Props for the TextField component
 * 
 * @interface TextFieldProps
 * @extends {Omit<TextInputProps, "onChangeText" | "value" | "disabled">}
 */
export interface TextFieldProps extends Omit<TextInputProps, "onChangeText" | "value" | "disabled"> {
  /** Label text displayed above the input */
  label?: string;
  /** Image source for left icon */
  icon?: ImageSourcePropType;
  /** React component for left icon (takes precedence over icon) */
  iconComponent?: React.ReactNode;
  /** Error message to display below input */
  error?: string;
  /** Helper text displayed below input when no error */
  helperText?: string;
  /** Maximum character length */
  maxLength?: number;
  /** Show character count indicator */
  showCharacterCount?: boolean;
  /** Debounce delay in milliseconds for onDebouncedChange */
  debounceMs?: number;
  /** Enable validation on change */
  validateOnChange?: boolean;
  /** Custom validation function - returns error message or null */
  validationFn?: (value: string) => string | null;
  /** Callback fired after debounce delay */
  onDebouncedChange?: (value: string) => void;
  /** Callback fired on every text change */
  onChangeText?: (value: string) => void;
  /** Controlled value */
  value?: string;
  /** Uncontrolled default value */
  defaultValue?: string;
  /** Show loading indicator */
  loading?: boolean;
  /** Right side icon component */
  rightIcon?: React.ReactNode;
  /** Callback when right icon is pressed */
  rightIconOnPress?: () => void;
  /** Show required indicator (*) */
  required?: boolean;
  /** Disable input */
  disabled?: boolean;
}

/**
 * A robust text input component with built-in validation, debouncing, and advanced features.
 * 
 * Supports both controlled and uncontrolled modes, password visibility toggle,
 * character counting, loading states, and custom validation.
 * 
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <TextField
 *   label="Email"
 *   placeholder="Enter your email"
 *   keyboardType="email-address"
 *   onChangeText={setEmail}
 * />
 * 
 * // With validation
 * <TextField
 *   label="Password"
 *   secureTextEntry
 *   validationFn={(val) => val.length < 8 ? "Must be 8+ characters" : null}
 *   validateOnChange
 *   onChangeText={setPassword}
 * />
 * 
 * // With debouncing
 * <TextField
 *   label="Search"
 *   debounceMs={300}
 *   onDebouncedChange={handleSearch}
 * />
 * 
 * // With character counter
 * <TextField
 *   label="Bio"
 *   maxLength={200}
 *   showCharacterCount
 *   multiline
 * />
 * ```
 * 
 * @param {TextFieldProps} props - TextField component props
 * @returns {JSX.Element} TextField component
 */
export default function TextField({
  label,
  icon,
  iconComponent,
  style,
  error: externalError,
  helperText,
  maxLength,
  showCharacterCount = false,
  debounceMs = 0,
  validateOnChange = false,
  validationFn,
  onDebouncedChange,
  onChangeText,
  value: controlledValue,
  defaultValue,
  loading = false,
  rightIcon,
  rightIconOnPress,
  secureTextEntry,
  required,
  disabled,
  ...props
}: TextFieldProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const [internalError, setInternalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentValue = isControlled ? controlledValue : internalValue;
  const displayError = externalError || internalError;

  // Validation
  const validate = useCallback((val: string): string | null => {
    if (validationFn) {
      return validationFn(val);
    }
    return null;
  }, [validationFn]);

  // Handle value change
  const handleChangeText = useCallback((text: string) => {
    // Apply maxLength if specified
    const finalText = maxLength ? text.slice(0, maxLength) : text;

    if (!isControlled) {
      setInternalValue(finalText);
    }

    // Validate if enabled
    if (validateOnChange && validationFn) {
      const validationError = validate(finalText);
      setInternalError(validationError);
    }

    // Call onChangeText immediately
    onChangeText?.(finalText);

    // Debounce for onDebouncedChange
    if (debounceMs > 0 && onDebouncedChange) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onDebouncedChange(finalText);
      }, debounceMs);
    }
  }, [isControlled, maxLength, validateOnChange, validationFn, validate, onChangeText, onDebouncedChange, debounceMs]);

  // Validate on blur if validation is enabled
  const handleBlur = useCallback((e: BlurEvent) => {
    if (validationFn) {
      const validationError = validate(currentValue);
      setInternalError(validationError);
    }
    props.onBlur?.(e);
  }, [validationFn, validate, currentValue, props]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Reset internal error when external error changes
  useEffect(() => {
    if (externalError) {
      setInternalError(null);
    }
  }, [externalError]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const actualSecureTextEntry = secureTextEntry && !showPassword;
  const characterCount = currentValue?.length || 0;
  const showCounter = showCharacterCount && maxLength !== undefined;

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.required}>*</Text>}
        </View>
      )}
      <View style={[
        styles.inputContainer,
        displayError && styles.inputContainerError,
        disabled && styles.inputContainerDisabled,
      ]}>
        {icon && <Image source={icon} style={styles.icon} />}
        {iconComponent && <View style={styles.iconContainer}>{iconComponent}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="#94a3b8"
          value={currentValue}
          onChangeText={handleChangeText}
          onBlur={handleBlur}
          secureTextEntry={actualSecureTextEntry}
          maxLength={maxLength}
          editable={!disabled && !loading}
          {...props}
        />
        {loading && (
          <ActivityIndicator size="small" color="#277874" style={styles.rightIcon} />
        )}
        {!loading && secureTextEntry && (
          <TouchableOpacity onPress={togglePasswordVisibility} style={styles.rightIcon}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#6b7280"
            />
          </TouchableOpacity>
        )}
        {!loading && !secureTextEntry && rightIcon && (
          <TouchableOpacity onPress={rightIconOnPress} style={styles.rightIcon} disabled={!rightIconOnPress}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.footer}>
        {displayError && <Text style={styles.error}>{displayError}</Text>}
        {!displayError && helperText && <Text style={styles.helperText}>{helperText}</Text>}
        {showCounter && (
          <Text style={[
            styles.characterCount,
            characterCount >= maxLength! && styles.characterCountWarning
          ]}>
            {characterCount}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "500",
  },
  required: {
    fontSize: 14,
    color: "#EF5350",
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#277874",
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 10,
    minHeight: 46,
  },
  inputContainerError: {
    borderColor: "#EF5350",
  },
  inputContainerDisabled: {
    backgroundColor: "#e5e7eb",
    opacity: 0.6,
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
    paddingVertical: 5
  },
  rightIcon: {
    marginLeft: 8,
    padding: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 8,
  },
  error: {
    color: "#EF5350",
    fontSize: 12,
    flex: 1,
  },
  helperText: {
    color: "#6b7280",
    fontSize: 12,
    flex: 1,
  },
  characterCount: {
    color: "#6b7280",
    fontSize: 12,
    marginLeft: 8,
  },
  characterCountWarning: {
    color: "#EF5350",
  },
});
