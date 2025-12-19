# Consumer Notification System - Complete Enumeration

## Overview
This document enumerates all the ways consumers are notified in the SugbuDeals application.

---

## 1. Notification Delivery Mechanisms

### 1.1 In-App Notifications (Database-Driven)
- **Storage**: Notifications are stored in the database and retrieved via API
- **Display Location**: Dedicated notifications screen (`app/(consumers)/notifications.tsx`)
- **API Endpoints**:
  - `GET /notifications` - Fetch user notifications with pagination
  - `GET /notifications/unread-count` - Get unread notification count
  - `PATCH /notifications/{id}/read` - Mark notification as read
  - `PATCH /notifications/mark-all-read` - Mark all notifications as read
  - `DELETE /notifications/{id}` - Delete a notification
  - `POST /notifications` - Create a notification (admin/backend)

### 1.2 Notification Badge (Header Indicator)
- **Location**: Consumer header (`app/(consumers)/_layout.tsx`)
- **Display**: Badge with unread count on notification icon
- **Behavior**:
  - Shows unread count (up to 99+)
  - Icon changes from `notifications-outline` to `notifications` when unread
  - Refreshes when:
    - Header mounts
    - Screen comes into focus
    - App comes to foreground
    - After marking notifications as read

### 1.3 Location-Based Nearby Promotions
- **Hook**: `useNearbyPromotionNotifications()` (`hooks/useNearbyPromotionNotifications.ts`)
- **Trigger**: Automatic location tracking when app is in foreground
- **Frequency**: Checks every 60 seconds (or when location changes by 100m+)
- **Radius**:
  - BASIC tier: 1km
  - PRO tier: 3km
- **Behavior**:
  - Only works when app is active (foreground)
  - Respects notification preferences (can be disabled)
  - Prevents duplicate notifications (max once per hour per promotion)
  - Groups by store to avoid spam
  - Creates `PROMOTION_NEARBY` notifications in database

---

## 2. Notification Types (Enum)

All notification types are defined in `types/prisma.ts` and `services/api/types/swagger.ts`:

### 2.1 Product-Related Notifications
1. **PRODUCT_CREATED** - New product added
2. **PRODUCT_PRICE_CHANGED** - Product price updated
3. **PRODUCT_STOCK_CHANGED** - Product stock/availability changed
4. **PRODUCT_STATUS_CHANGED** - Product status changed (active/inactive)

### 2.2 Promotion-Related Notifications
5. **PROMOTION_CREATED** - New promotion created
6. **PROMOTION_STARTED** - Promotion has started
7. **PROMOTION_ENDING_SOON** - Promotion ending soon (time-based)
8. **PROMOTION_ENDED** - Promotion has ended
9. **PROMOTION_NEARBY** - Promotion nearby (location-based, auto-generated)

### 2.3 Store-Related Notifications
10. **STORE_VERIFIED** - Store has been verified
11. **STORE_CREATED** - New store added
12. **STORE_UNDER_REVIEW** - Store is under review

### 2.4 Subscription-Related Notifications
13. **SUBSCRIPTION_JOINED** - User joined a subscription
14. **SUBSCRIPTION_CANCELLED** - Subscription cancelled
15. **SUBSCRIPTION_EXPIRED** - Subscription expired
16. **SUBSCRIPTION_RENEWED** - Subscription renewed
17. **SUBSCRIPTION_ENDING_SOON** - Subscription ending soon
18. **SUBSCRIPTION_AVAILABLE** - Subscription available

### 2.5 Consumer-Specific Notifications
19. **CONSUMER_WELCOME** - Welcome notification for new consumers
20. **GPS_REMINDER** - Reminder to enable GPS/location services

### 2.6 Admin/Moderation Notifications
21. **QUESTIONABLE_PRICING_PRODUCT** - Product pricing flagged for review
22. **QUESTIONABLE_PRICING_PROMOTION** - Promotion pricing flagged for review

---

## 3. Notification Features

### 3.1 Notification Display
- **Screen**: `app/(consumers)/notifications.tsx`
- **Features**:
  - List of all notifications with icons, colors, and timestamps
  - Unread notifications highlighted with blue border and background
  - Unread dot indicator
  - Time formatting (relative: "Just now", "5m ago", "2h ago", etc.)
  - Type-specific icons and colors
  - Navigation to related content (store/product) on tap

### 3.2 Notification Management
- **Mark as Read**: Individual or bulk mark as read
- **Delete**: Individual or bulk delete (except welcome notifications)
- **Auto-read**: Notifications marked as read when tapped
- **Pagination**: Loads 50 notifications at a time

### 3.3 Notification Preferences
- **Storage**: AsyncStorage (`@sugbudeals:notifications_enabled`)
- **Default**: Enabled (true)
- **Location**: `utils/notificationPreferences.ts`
- **Controls**: Nearby promotion notifications can be disabled

---

## 4. Notification Flow

### 4.1 Creation Flow
1. **Backend/Admin**: Creates notification via `POST /notifications`
2. **Location-Based**: `useNearbyPromotionNotifications` hook creates `PROMOTION_NEARBY` notifications
3. **Notification stored** in database with:
   - userId
   - type
   - title
   - message
   - Optional: productId, storeId, promotionId

### 4.2 Display Flow
1. **Fetch**: `getNotifications()` called on mount and screen focus
2. **Unread Count**: `getUnreadCount()` called separately (prevents race conditions)
3. **Badge Update**: Header badge updates with unread count
4. **List Display**: Notifications shown in chronological order

### 4.3 Interaction Flow
1. **Tap Notification**: 
   - Marks as read (if unread)
   - Navigates to related content (store/product)
2. **Mark All Read**: Updates all notifications and refreshes count
3. **Delete**: Removes notification and refreshes count

---

## 5. Technical Implementation

### 5.1 Redux State Management
- **Slice**: `features/notifications/slice.ts`
- **State**:
  - `notifications: Notification[]`
  - `unreadCount: number`
  - `loading: boolean`
  - `error: string | null`
- **Thunks**: `features/notifications/thunk.ts`
  - `getNotifications`
  - `getUnreadCount`
  - `markAsRead`
  - `markAllAsRead`
  - `deleteNotification`
  - `createNotification`

### 5.2 Hook Usage
- **useNotifications()**: Main hook for notification operations
  - Returns: `{ action, state }`
  - Actions: All notification thunks
  - State: Current notifications, unread count, loading, error

### 5.3 Location-Based Notifications
- **Hook**: `useNearbyPromotionNotifications()`
- **Dependencies**:
  - Location permissions (foreground)
  - Active promotions from Redux
  - Store and product data from Redux
  - Current user tier (BASIC/PRO)
  - Notification preferences
- **Optimizations**:
  - Uses existing Redux data (no extra API calls)
  - Only checks when location changes significantly (100m+)
  - Prevents duplicate notifications (1 hour cooldown)
  - Groups by store to avoid spam

---

## 6. Notification Icons & Colors

Icons and colors are defined in:
- **Icons**: `app/(consumers)/notifications.tsx` - `getNotificationIcon()`
- **Colors**: `utils/notifications.ts` - `getNotificationColor()`
- **Titles**: `utils/notifications.ts` - `getNotificationTypeTitle()`

Each notification type has:
- Unique icon (Ionicons)
- Color-coded display
- User-friendly type title

---

## 7. Summary

Consumers are notified through:
1. **In-app notification system** - Database-driven, displayed in dedicated screen
2. **Header badge** - Visual indicator with unread count
3. **Location-based notifications** - Automatic nearby promotion alerts
4. **22 notification types** - Covering products, promotions, stores, subscriptions, and more
5. **Rich interaction** - Tap to navigate, mark as read, delete, etc.
6. **Preference controls** - Can disable location-based notifications

All notifications are stored in the database and retrieved via REST API endpoints, ensuring persistence and cross-device synchronization.

