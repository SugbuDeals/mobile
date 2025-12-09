import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATION_PREFERENCE_KEY = "@sugbudeals:notifications_enabled";

/**
 * Get notification preference from storage
 * Defaults to true if not set
 */
export async function getNotificationPreference(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(NOTIFICATION_PREFERENCE_KEY);
    if (value === null) {
      // Default to enabled
      return true;
    }
    return value === "true";
  } catch (error) {
    console.warn("Error reading notification preference:", error);
    return true; // Default to enabled on error
  }
}

/**
 * Save notification preference to storage
 */
export async function setNotificationPreference(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_PREFERENCE_KEY, enabled ? "true" : "false");
  } catch (error) {
    console.warn("Error saving notification preference:", error);
  }
}

