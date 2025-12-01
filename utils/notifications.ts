import { Notification, NotificationType } from "@/features/notifications/types";

/**
 * Format notification date to a relative time string
 */
export function formatNotificationTime(date: string | Date): string {
  const notificationDate = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - notificationDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 1) return "Less than 1h ago";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  
  // For older notifications, show the date
  return notificationDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: notificationDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Get color for notification based on type
 */
export function getNotificationColor(type: NotificationType): string {
  const colorMap: Record<NotificationType, string> = {
    PRODUCT_CREATED: "#3B82F6", // Blue
    PRODUCT_PRICE_CHANGED: "#F59E0B", // Amber
    PRODUCT_STOCK_CHANGED: "#F59E0B", // Amber
    PRODUCT_STATUS_CHANGED: "#A78BFA", // Purple
    PROMOTION_CREATED: "#10B981", // Green
    PROMOTION_STARTED: "#10B981", // Green
    PROMOTION_ENDING_SOON: "#F59E0B", // Amber
    STORE_VERIFIED: "#10B981", // Green
    STORE_CREATED: "#3B82F6", // Blue
    SUBSCRIPTION_JOINED: "#10B981", // Green
    SUBSCRIPTION_CANCELLED: "#F87171", // Red
    SUBSCRIPTION_EXPIRED: "#F87171", // Red
    SUBSCRIPTION_RENEWED: "#10B981", // Green
  };
  
  return colorMap[type] || "#6B7280"; // Default gray
}

/**
 * Get a user-friendly title for notification type
 */
export function getNotificationTypeTitle(type: NotificationType): string {
  const titleMap: Record<NotificationType, string> = {
    PRODUCT_CREATED: "New Product",
    PRODUCT_PRICE_CHANGED: "Price Changed",
    PRODUCT_STOCK_CHANGED: "Stock Updated",
    PRODUCT_STATUS_CHANGED: "Product Status",
    PROMOTION_CREATED: "New Promotion",
    PROMOTION_STARTED: "Promotion Started",
    PROMOTION_ENDING_SOON: "Promotion Ending Soon",
    STORE_VERIFIED: "Store Verified",
    STORE_CREATED: "New Store",
    SUBSCRIPTION_JOINED: "Subscription Joined",
    SUBSCRIPTION_CANCELLED: "Subscription Cancelled",
    SUBSCRIPTION_EXPIRED: "Subscription Expired",
    SUBSCRIPTION_RENEWED: "Subscription Renewed",
  };
  
  return titleMap[type] || "Notification";
}

