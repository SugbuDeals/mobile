/**
 * Retailer Analytics Types
 */

export interface RetailerAnalytics {
  // Subscription Info
  subscription: {
    tier: "BASIC" | "PRO";
    role: "CONSUMER" | "RETAILER" | "ADMIN";
  };

  // Store Overview
  store: {
    id: number;
    name: string;
    verificationStatus: "UNVERIFIED" | "VERIFIED";
    isActive: boolean;
    totalProducts: number;
    activeProducts: number;
  };

  // Promotions Analytics
  promotions: {
    total: number;
    active: number;
    inactive: number;
    byPeriod: {
      today: number;
      thisWeek: number;
      thisMonth: number;
      lastMonth: number;
    };
    recent: Array<{
      id: number;
      title: string;
      dealType: string;
      active: boolean;
      startsAt: string;
      endsAt: string | null;
      productCount: number;
    }>;
  };

  // Views Analytics
  views: {
    storeViews: number;
    productViews: number;
    promotionViews: number;
    totalViews: number;
    topProducts: Array<{
      productId: number;
      productName: string;
      viewCount: number;
    }>;
    topPromotions: Array<{
      promotionId: number;
      promotionTitle: string;
      viewCount: number;
    }>;
  };

  // Summary Stats
  summary: {
    totalProducts: number;
    totalPromotions: number;
    totalViews: number;
    averageViewsPerProduct: number;
    averageViewsPerPromotion: number;
  };
}

export interface RetailerAnalyticsParams {
  storeId: number;
  includeInactive?: boolean;
}
