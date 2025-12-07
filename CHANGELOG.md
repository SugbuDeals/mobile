# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.7.0] - 2025-01-XX

### Added
- Complete admin panel with dashboard, user management, and analytics
- AI testing interface for chat, text generation, and recommendations endpoints
- AI-powered search and recommendations in Explore screen with natural language queries
- Query history modal with ability to reuse previous searches
- Insights panel with expandable AI responses and formatted text
- Recommendation tabs (Best Deals, Cheapest, Closest) with sorting functionality
- Maps integration with Google Maps for viewing nearby stores
- Location-based store discovery with distance calculation
- Subscription management system for retailers and admin
- Subscription analytics dashboard with metrics and insights
- Product limits based on subscription tiers (FREE, BASIC, PREMIUM)
- Category management system (CRUD operations) for admin
- Deal analytics dashboard with metrics, charts, and category distribution
- Comprehensive notification system for consumers, retailers, and admins
- Notification types for products, promotions, stores, and subscriptions
- Bookmarks system for saving products and stores
- Save screen with search and category filtering for bookmarked items
- Recommendations screen showing all recommended products with promotions
- Shared component library (modals, forms, cards, empty states, loading states)
- Custom hooks for recommendations, search, query history, pagination, and tabs
- Distance enrichment utility for location-based features
- Image upload functionality for retailers
- Location picker component for store setup

### Updated
- Enhanced Explore screen with AI-powered search and recommendation display
- Improved home screen with better component organization
- Refined consumer layout with better navigation and conditional rendering
- Enhanced retailer dashboard with subscription status and product limits
- Improved notification handling with mark as read/unread functionality
- Better error handling and loading states across all screens
- Optimized state management with proper Redux slices and thunks

### Fixed
- Fixed TypeScript errors in consumer and retailer layout files
- Removed non-existent `useDualRole` hook references
- Fixed duplicate title/subtitle rendering in consumer layout
- Fixed TypeScript type inference issues in setup.tsx and settings.tsx
- Added proper null checks for user object access across all layout files
- Fixed distance calculation and display in recommendations
- Improved error handling for API calls

## [0.2.0] - 2025-10-14
### Added
- Screens for consumers and retailers
- Implemented search interface in Explore component and update layout
- Created slice for store
- Add retailer setup navigation
- RetailerDashboard with weekly views chart and active promotions display
- Created hook for login
### Updated
- Updated consumer layout and home screen design
- Updated save component with search and category
- Enhanced profile component with editable user information
- Enhanced consumer layout with conditional rendering
- Fixed wrong import paths

## [0.1.0] - 2025-10-04

### Added
- Initial project setup with React Native
- Basic navigation structure
- Authentication flow implementation
- State management implementation
