/**
 * Retailer Analytics Thunks
 * Aggregates data from multiple endpoints to provide comprehensive analytics
 */

import { productsApi } from "@/services/api/endpoints/products";
import { promotionsApi } from "@/services/api/endpoints/promotions";
import { storesApi } from "@/services/api/endpoints/stores";
import { subscriptionsApi } from "@/services/api/endpoints/subscriptions";
import { viewsApi } from "@/services/api/endpoints/views";
import { RootState } from "@/store/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RetailerAnalytics, RetailerAnalyticsParams } from "./types";

export const getRetailerAnalytics = createAsyncThunk<
  RetailerAnalytics,
  RetailerAnalyticsParams,
  { rejectValue: { message: string }; state: RootState }
>(
  "analytics/getRetailerAnalytics",
  async ({ storeId, includeInactive = false }, { rejectWithValue }) => {
    try {
      // Fetch all data in parallel
      const [
        subscriptionTier,
        store,
        allPromotions,
        products,
      ] = await Promise.all([
        subscriptionsApi.getCurrentTier(),
        storesApi.findStoreById(storeId),
        promotionsApi.getPromotionsByStore(storeId, { onlyActive: false }),
        productsApi.findProducts({ storeId }),
      ]);

      if (!store) {
        throw new Error("Store not found");
      }

      // Get view analytics using the new retailer analytics endpoint (monthly period)
      const viewAnalytics = await viewsApi.getRetailerAnalytics({
        timePeriod: "monthly",
      }).catch(() => null);

      // Get promotion view counts (not included in retailer analytics endpoint)
      const promotionViewCounts = await Promise.all(
        allPromotions.map((promotion) =>
          viewsApi
            .getEntityViewCount("PROMOTION", promotion.id)
            .then((res) => ({ promotionId: promotion.id, promotionTitle: promotion.title, viewCount: res.viewCount }))
            .catch(() => ({ promotionId: promotion.id, promotionTitle: promotion.title, viewCount: 0 }))
        )
      );

      // Extract view data from analytics response or fallback to 0
      const storeViews = viewAnalytics?.totalStoreViews ?? 0;
      const totalProductViews = viewAnalytics?.totalProductViews ?? 0;
      
      // Map product views from analytics response to match expected format
      const productViewCounts = viewAnalytics?.productViews?.map((pv) => ({
        productId: pv.product.id,
        productName: pv.product.name,
        viewCount: pv.viewCount,
      })) ?? [];

      // Calculate date ranges
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);
      const monthStart = new Date(now);
      monthStart.setMonth(monthStart.getMonth() - 1);
      monthStart.setHours(0, 0, 0, 0);
      const lastMonthStart = new Date(now);
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 2);
      lastMonthStart.setHours(0, 0, 0, 0);
      const lastMonthEnd = new Date(now);
      lastMonthEnd.setMonth(lastMonthEnd.getMonth() - 1);
      lastMonthEnd.setHours(23, 59, 59, 999);

      // Filter promotions by period
      const filterByDate = (promotions: typeof allPromotions, start: Date, end?: Date) => {
        return promotions.filter((p) => {
          const startsAt = new Date(p.startsAt);
          return startsAt >= start && (!end || startsAt <= end);
        });
      };

      const promotionsToday = filterByDate(allPromotions, todayStart);
      const promotionsThisWeek = filterByDate(allPromotions, weekStart);
      const promotionsThisMonth = filterByDate(allPromotions, monthStart);
      const promotionsLastMonth = filterByDate(allPromotions, lastMonthStart, lastMonthEnd);

      // Separate active and inactive promotions
      const activePromotions = allPromotions.filter((p) => p.active);
      const inactivePromotions = allPromotions.filter((p) => !p.active);

      // Get top products by views (already sorted by viewCount from API)
      const topProducts = productViewCounts
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 5);

      // Get top promotions by views
      const topPromotions = promotionViewCounts
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 5);

      // Calculate totals
      const totalPromotionViews = promotionViewCounts.reduce((sum, p) => sum + p.viewCount, 0);
      const totalViews = storeViews + totalProductViews + totalPromotionViews;

      // Calculate averages
      const averageViewsPerProduct = products.length > 0 ? totalProductViews / products.length : 0;
      const averageViewsPerPromotion = allPromotions.length > 0 ? totalPromotionViews / allPromotions.length : 0;

      // Get recent promotions (last 10, sorted by creation date)
      const recentPromotions = allPromotions
        .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
        .slice(0, 10)
        .map((p: any) => {
          // Handle both PromotionWithDetailsDto (has products) and PromotionResponseDto (has promotionProducts)
          const productCount = p.products?.length || p.promotionProducts?.length || 0;
          return {
            id: p.id,
            title: p.title,
            dealType: p.dealType,
            active: p.active,
            startsAt: p.startsAt,
            endsAt: p.endsAt,
            productCount,
          };
        });

      const analytics: RetailerAnalytics = {
        subscription: {
          tier: subscriptionTier.tier,
          role: subscriptionTier.role,
        },
        store: {
          id: store.id,
          name: store.name,
          verificationStatus: store.verificationStatus,
          isActive: store.isActive,
          totalProducts: products.length,
          activeProducts: products.filter((p) => p.isActive).length,
        },
        promotions: {
          total: allPromotions.length,
          active: activePromotions.length,
          inactive: inactivePromotions.length,
          byPeriod: {
            today: promotionsToday.length,
            thisWeek: promotionsThisWeek.length,
            thisMonth: promotionsThisMonth.length,
            lastMonth: promotionsLastMonth.length,
          },
          recent: recentPromotions,
        },
        views: {
          storeViews,
          productViews: totalProductViews,
          promotionViews: totalPromotionViews,
          totalViews,
          topProducts,
          topPromotions,
        },
        summary: {
          totalProducts: products.length,
          totalPromotions: allPromotions.length,
          totalViews,
          averageViewsPerProduct,
          averageViewsPerPromotion,
        },
      };

      return analytics;
    } catch (error) {
      return rejectWithValue({
        message:
          error && typeof error === "object" && "message" in error
            ? String(error.message)
            : "Get retailer analytics failed",
      });
    }
  }
);
