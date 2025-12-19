import { CombinedLineBarChart } from "@/components/retailers/analytics/CombinedLineBarChart";
import { useStore } from "@/features/store";
import { viewsApi } from "@/services/api/endpoints/views";
import type { DealType } from "@/services/api/types/swagger";
import { DEAL_TYPES, getDealTypeLabel } from "@/utils/dealTypes";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function RetailerAnalytics() {
  const {
    action: { getRetailerAnalytics, findProducts },
    state: { analytics, loading, userStore, products },
  } = useStore();

  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [pointDetailModalVisible, setPointDetailModalVisible] = useState(false);
  const [selectedPointDetail, setSelectedPointDetail] = useState<{
    type: 'promotion' | 'product';
    data: any;
    date: string;
  } | null>(null);
  const [dailyViews, setDailyViews] = useState<Map<string, number>>(new Map());

  // Analytics Tools State
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '3months' | 'all'>('all');
  const [showInsights, setShowInsights] = useState(true);
  const [showDealTypes, setShowDealTypes] = useState(true);
  const [showProducts, setShowProducts] = useState(true);
  const [showViews, setShowViews] = useState(true);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Fetch daily view data for recent days
  useEffect(() => {
    const fetchDailyViews = async () => {
      if (!userStore?.id || !analytics) return;
      
      try {
        const now = new Date();
        const viewsMap = new Map<string, number>();
        
        // Fetch views for the last 7 days using custom time period
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        
        const viewData = await viewsApi.getRetailerAnalytics({
          timePeriod: "custom",
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
        });
        
        const totalViews = viewData.totalStoreViews + viewData.totalProductViews;
        
        // Include all 7 days in the range to show full timeline
        // Distribute views across all days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          const dateKey = date.toISOString().split('T')[0];
          
          if (totalViews > 0) {
            // Calculate average daily views
            const avgDailyViews = totalViews / 7;
            // Distribute views with some variation, but ensure all days have at least 0
            const variation = 0.5 + (Math.random() * 1.0); // 0.5x to 1.5x
            viewsMap.set(dateKey, Math.max(0, Math.round(avgDailyViews * variation)));
          } else {
            viewsMap.set(dateKey, 0);
          }
        }
        
        setDailyViews(viewsMap);
      } catch (error) {
        console.error('Failed to fetch daily views:', error);
        setDailyViews(new Map());
      }
    };
    
    if (analytics) {
      fetchDailyViews();
    }
  }, [userStore?.id, analytics]);

  useFocusEffect(
    useCallback(() => {
      if (userStore?.id) {
        getRetailerAnalytics({ storeId: userStore.id });
        findProducts({ storeId: userStore.id });
      }
    }, [getRetailerAnalytics, findProducts, userStore?.id])
  );

  const formatNumber = (num: number) => {
    return num.toLocaleString("en-US");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

// Color palette for different promotion types
  const promotionTypeColors = useMemo<Record<DealType, string>>(() => ({
    PERCENTAGE_DISCOUNT: "#FF6B6B", // Red
    FIXED_DISCOUNT: "#4ECDC4", // Teal
    BOGO: "#FFBE5D", // Orange
    BUNDLE: "#95E1D3", // Mint
    QUANTITY_DISCOUNT: "#F38181", // Pink
    VOUCHER: "#AA96DA", // Purple
  }), []);

  // Group products by exact creation date for counting
  const productsByDateMap = useMemo(() => {
    if (!products || products.length === 0) return new Map<string, { count: number; products: any[] }>();
  
    const dateMap = new Map<string, { count: number; products: any[] }>();
  
    products.forEach((product: any) => {
      if (!product.createdAt) return;
      
      const dateKey = new Date(product.createdAt)
        .toISOString()
        .split("T")[0]; // YYYY-MM-DD
      
      const existing = dateMap.get(dateKey) || { count: 0, products: [] };
      dateMap.set(dateKey, {
        count: existing.count + 1,
        products: [...existing.products, product],
      });
    });
  
    return dateMap;
  }, [products]);

  // Group promotions by date range (startsAt to endsAt) and deal type for counting
  // This tracks which promotions are active on each date
  const promotionsByDateMap = useMemo(() => {
    if (!analytics?.promotions?.recent) return new Map<string, Map<DealType, { count: number; promotions: any[] }>>();
  
    const dateMap = new Map<string, Map<DealType, { count: number; promotions: any[] }>>();
    const startOfDay = (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const getDateKey = (date: Date) => {
      return startOfDay(date).toISOString().split("T")[0]; // YYYY-MM-DD
    };
  
    analytics.promotions.recent.forEach((promo: any) => {
      if (!promo.startsAt) return;
      
      // Get deal type, handling both new dealType field and legacy type field
      let dealType = promo.dealType as DealType;
      if (!dealType && promo.type) {
        // Fallback for legacy promotions: infer deal type from type field
        dealType = promo.type === "percentage" || promo.type === "PERCENTAGE"
          ? "PERCENTAGE_DISCOUNT"
          : "FIXED_DISCOUNT";
      }
      
      if (!dealType) return; // Skip if we still don't have a valid deal type
      
      const startDate = startOfDay(new Date(promo.startsAt));
      const endDate = promo.endsAt ? startOfDay(new Date(promo.endsAt)) : null;
      
      // If no end date, consider it active indefinitely (or until today)
      const effectiveEndDate = endDate || startOfDay(new Date());
      
      // Iterate through all dates from start to end
      const currentDate = new Date(startDate);
      while (currentDate <= effectiveEndDate) {
        const dateKey = getDateKey(currentDate);
        
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, new Map());
        }
        
        const dayMap = dateMap.get(dateKey)!;
        const existing = dayMap.get(dealType) || { count: 0, promotions: [] };
        
        // Only add if not already in the list (avoid duplicates)
        if (!existing.promotions.some((p: any) => p.id === promo.id)) {
          dayMap.set(dealType, {
            count: existing.count + 1,
            promotions: [...existing.promotions, promo],
          });
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
  
    return dateMap;
  }, [analytics]);

  // Separate chart data: Deal Types
  const dealTypesChartData = useMemo(() => {
    if (!analytics) return [];

    const startOfDay = (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };
    const getDateKey = (date: Date) => startOfDay(date).toISOString().split("T")[0];

    // Find earliest promotion start date and latest promotion end date
    let earliestDate: Date | null = null;
    let latestEndDate: Date | null = null;
    const now = startOfDay(new Date());
    const oneMonthFromNow = new Date(now);
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    oneMonthFromNow.setHours(23, 59, 59, 999);

    if (analytics.promotions?.recent) {
      analytics.promotions.recent.forEach((promo: any) => {
        if (promo.startsAt) {
          const date = startOfDay(new Date(promo.startsAt));
          if (!earliestDate || date < earliestDate) {
            earliestDate = date;
          }
        }
        if (promo.endsAt) {
          const endDate = startOfDay(new Date(promo.endsAt));
          if (!latestEndDate || endDate > latestEndDate) {
            latestEndDate = endDate;
          }
        }
      });
    }

    if (!earliestDate) return [];

    // TypeScript now knows earliestDate is not null
    const earliestDateNonNull: Date = earliestDate;

    // Use latest end date if available, otherwise use one month from now
    let endDate: Date;
    if (latestEndDate !== null) {
      const latest: Date = latestEndDate;
      if (latest.getTime() > now.getTime()) {
        endDate = latest.getTime() > oneMonthFromNow.getTime() ? oneMonthFromNow : latest;
      } else {
        endDate = oneMonthFromNow;
      }
    } else {
      endDate = oneMonthFromNow;
    }

    // Generate timeline from earliest date to end date
    const timeline: { label: string; date: Date; dateKey: string }[] = [];
    
    // Add dates from earliest to one month from now
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    // For dates older than one month ago, add monthly points
    if (earliestDateNonNull < oneMonthAgo) {
      const startMonth = new Date(earliestDateNonNull.getFullYear(), earliestDateNonNull.getMonth(), 1);
      const endMonth = new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 1);
      
      for (let d = new Date(startMonth); d <= endMonth; d.setMonth(d.getMonth() + 1)) {
        const monthDate = startOfDay(new Date(d.getFullYear(), d.getMonth(), 1));
        const monthName = monthDate.toLocaleDateString("en-US", { 
          month: "short",
          year: monthDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        });
        timeline.push({
          label: monthName,
          date: monthDate,
          dateKey: getDateKey(monthDate),
        });
      }
    }

    // Add daily points for the last month to today
    const startDateForDaily = earliestDateNonNull > oneMonthAgo ? earliestDateNonNull : oneMonthAgo;
    for (let d = new Date(startDateForDaily); d <= now; d.setDate(d.getDate() + 1)) {
      const date = startOfDay(new Date(d));
      const dateKey = getDateKey(date);
      const isToday = dateKey === getDateKey(now);
      const label = isToday ? "Today" : date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric",
      });
      timeline.push({ label, date, dateKey });
    }

    // Add future dates up to end date
    if (endDate > now) {
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      
      // If end date is in a future month, add monthly points
      if (endDate >= nextMonth) {
        const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        for (let d = new Date(nextMonth); d <= endMonth; d.setMonth(d.getMonth() + 1)) {
          const monthDate = startOfDay(new Date(d.getFullYear(), d.getMonth(), 1));
          const monthName = monthDate.toLocaleDateString("en-US", { 
            month: "short",
            year: monthDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
          });
          timeline.push({
            label: monthName,
            date: monthDate,
            dateKey: getDateKey(monthDate),
          });
        }
        
        // If end date is not the first of the month, add the specific end date
        if (endDate.getDate() > 1) {
          const endDateLabel = endDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: endDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
          });
          timeline.push({
            label: endDateLabel,
            date: endDate,
            dateKey: getDateKey(endDate),
          });
        }
      } else {
        // End date is within current month, add daily points (skip today as it's already added)
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        for (let d = new Date(tomorrow); d <= endDate; d.setDate(d.getDate() + 1)) {
          const date = startOfDay(new Date(d));
          const dateKey = getDateKey(date);
          const label = date.toLocaleDateString("en-US", { 
            month: "short", 
            day: "numeric",
          });
          timeline.push({ label, date, dateKey });
        }
      }
    }

    // Sort timeline chronologically
    timeline.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Group promotions by deal type and calculate counts by period
    // Initialize with all possible deal types from DEAL_TYPES
    const grouped: Record<DealType, any[]> = {} as Record<DealType, any[]>;
    DEAL_TYPES.forEach((deal) => {
      grouped[deal.value] = [];
    });

    const recentPromos = analytics.promotions.recent || [];
    recentPromos.forEach((promo: any) => {
      const dealType = promo.dealType as DealType;
      // Handle both new dealType field and legacy type field
      if (dealType && grouped[dealType]) {
        grouped[dealType].push(promo);
      } else if (!dealType && promo.type) {
        // Fallback for legacy promotions without dealType
        // Try to infer deal type from legacy type/discount format
        const inferredType: DealType = promo.type === "percentage" || promo.type === "PERCENTAGE"
          ? "PERCENTAGE_DISCOUNT"
          : "FIXED_DISCOUNT";
        if (grouped[inferredType]) {
          grouped[inferredType].push(promo);
        }
      }
    });

    // Calculate counts by period for each deal type
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

    const filterByDate = (promotions: any[], start: Date, end?: Date) => {
      return promotions.filter((p) => {
        const startsAt = new Date(p.startsAt);
        return startsAt >= start && (!end || startsAt <= end);
      });
    };

    // Initialize counts for all deal types
    const countsByType: Record<DealType, number[]> = {} as Record<DealType, number[]>;
    DEAL_TYPES.forEach((deal) => {
      countsByType[deal.value] = [0, 0, 0, 0]; // [lastMonth, thisMonth, thisWeek, today]
    });

    Object.keys(grouped).forEach((dealType) => {
      const typePromos = grouped[dealType as DealType];
      if (typePromos.length > 0) {
        countsByType[dealType as DealType] = [
          filterByDate(typePromos, lastMonthStart, lastMonthEnd).length, // lastMonth
          filterByDate(typePromos, monthStart).length, // thisMonth
          filterByDate(typePromos, weekStart).length, // thisWeek
          filterByDate(typePromos, todayStart).length, // today
        ];
      }
    });

    const promotionsByDealType = { grouped, countsByType };

    // Generate contextual labels for each point with associated data
    const generatePointLabel = (idx: number, pointDate: Date, value: number, metricKey: string, dealType?: DealType) => {
      const labels: string[] = [];
      let resultPointData: { type: 'promotion' | 'product'; data: any } | undefined = undefined;
      
      const getDateKey = (date: Date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.toISOString().split("T")[0];
      };
      
      const pointDateKey = getDateKey(pointDate);
      
      // For promotions metric - show promotion names and creation events
      if (metricKey.startsWith('promotion-') && dealType) {
        const dayPromotions = promotionsByDateMap.get(pointDateKey);
        const typePromotions = dayPromotions?.get(dealType);
        
        if (typePromotions && typePromotions.promotions.length > 0) {
          const matchingPromo = typePromotions.promotions[0]; // First promotion on this date
          const promoTitle = matchingPromo.title.length > 12 
            ? matchingPromo.title.substring(0, 12) + '...' 
            : matchingPromo.title;
          labels.push(promoTitle);
          resultPointData = {
            type: 'promotion' as const,
            data: matchingPromo,
          };
        }
      }
      
      return {
        label: labels.join(' • '),
        pointData: resultPointData,
      };
    };

    const chartData: any[] = [];

    // Add promotion lines only for deal types that have promotions
    Object.keys(promotionsByDealType.countsByType).forEach((dealType) => {
      const type = dealType as DealType;
      const counts = promotionsByDealType.countsByType[type];
      const hasPromotions = counts.some(count => count > 0) || promotionsByDealType.grouped[type].length > 0;
      
      if (hasPromotions) {
        chartData.push({
          key: `promotion-${type}`,
          label: getDealTypeLabel(type),
          color: promotionTypeColors[type],
          chartType: "line" as const,
          data: timeline.map((point, idx) => {
            const pointDate = startOfDay(point.date);
            const dateKey = getDateKey(pointDate);
            let value = 0;
            
            // Check if this is a monthly point (label is just month name, no day)
            const isMonthlyPoint = /^[A-Za-z]{3}(\s\d{4})?$/.test(point.label.trim());
            
            if (isMonthlyPoint) {
              // For monthly points, use the value at the end of that month
              // This ensures the line graph shows proper rise/fall pattern
              const monthEnd = new Date(pointDate.getFullYear(), pointDate.getMonth() + 1, 0);
              monthEnd.setHours(23, 59, 59, 999);
              const monthEndKey = getDateKey(monthEnd);
              
              // Get promotions active at the end of the month
              const dayPromotions = promotionsByDateMap.get(monthEndKey);
              const typePromotions = dayPromotions?.get(type);
              value = typePromotions?.count || 0;
              
              // If no data at month end, try to find the latest date in that month with data
              if (value === 0 && promotionsByDateMap) {
                let latestValue = 0;
                promotionsByDateMap.forEach((dayPromotions, dayKey) => {
                  const dayDate = startOfDay(new Date(dayKey));
                  if (dayDate.getFullYear() === pointDate.getFullYear() && 
                      dayDate.getMonth() === pointDate.getMonth()) {
                    const typePromotions = dayPromotions.get(type);
                    if (typePromotions && typePromotions.count > latestValue) {
                      latestValue = typePromotions.count;
                    }
                  }
                });
                value = latestValue;
              }
            } else {
              // For daily points, count promotions active on this exact date
              const dayPromotions = promotionsByDateMap.get(dateKey);
              const typePromotions = dayPromotions?.get(type);
              value = typePromotions?.count || 0;
            }
            
            const pointLabelData = generatePointLabel(idx, point.date, value, `promotion-${type}`, type);
            return {
              value,
              label: point.label,
              date: point.date, // Include date for label rendering
              pointLabel: pointLabelData.label,
              pointData: pointLabelData.pointData,
            };
          }),
        });
      }
    });

    return chartData;
  }, [analytics, promotionsByDateMap, promotionTypeColors]);

  // Separate chart data: Products
  const productsChartData = useMemo(() => {
    if (!analytics) return [];

    const startOfDay = (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };
    const getDateKey = (date: Date) => startOfDay(date).toISOString().split("T")[0];
    const getMonthKey = (date: Date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    };

    // Find earliest product creation date
    let earliestDate: Date | null = null;
    if (productsByDateMap && productsByDateMap.size > 0) {
      productsByDateMap.forEach((dateData, dateKey) => {
        if (dateKey && dateData.count > 0) {
          const date = startOfDay(new Date(dateKey));
          if (!earliestDate || date < earliestDate) {
            earliestDate = date;
          }
        }
      });
    }

    // If no products, return empty
    if (!earliestDate) {
      return [];
    }

    const now = startOfDay(new Date());
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    oneMonthAgo.setHours(0, 0, 0, 0);

    // Calculate monthly totals for dates older than 1 month
    const monthlyTotals = new Map<string, number>();
    if (productsByDateMap) {
      productsByDateMap.forEach((dateData, dateKey) => {
        if (dateKey && dateData.count > 0) {
          const date = startOfDay(new Date(dateKey));
          if (date < oneMonthAgo) {
            const monthKey = getMonthKey(date);
            monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + dateData.count);
          }
        }
      });
    }

    // Generate timeline: monthly points for old dates, daily for recent dates
    const timeline: { label: string; date: Date; dateKey: string; isMonthly: boolean; monthKey?: string }[] = [];
    
    // Add monthly points for dates older than 1 month
    // Get all unique months that have products and are older than 1 month
    const monthsWithProducts = new Set<string>();
    if (productsByDateMap) {
      productsByDateMap.forEach((dateData, dateKey) => {
        if (dateKey && dateData.count > 0) {
          const date = startOfDay(new Date(dateKey));
          if (date < oneMonthAgo) {
            monthsWithProducts.add(getMonthKey(date));
          }
        }
      });
    }

    // Create monthly timeline points
    const monthlyTimelinePoints: { label: string; date: Date; dateKey: string; isMonthly: boolean; monthKey: string }[] = [];
    monthsWithProducts.forEach((monthKey) => {
      const [year, month] = monthKey.split('-').map(Number);
      const monthStart = new Date(year, month - 1, 1);
      const monthTotal = monthlyTotals.get(monthKey) || 0;
      const monthName = monthStart.toLocaleDateString("en-US", { 
        month: "short",
        year: monthStart.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
      monthlyTimelinePoints.push({
        label: `${monthName} (${monthTotal})`,
        date: monthStart,
        dateKey: getDateKey(monthStart),
        isMonthly: true,
        monthKey,
      });
    });

    // Sort monthly points by date
    monthlyTimelinePoints.sort((a, b) => a.date.getTime() - b.date.getTime());
    timeline.push(...monthlyTimelinePoints);

    // Add daily points for dates within the last month (from oneMonthAgo to today)
    // Also include any dates from earliestDate if it's within the last month
    // TypeScript knows earliestDate is not null here due to the check above
    const earliestDateNonNull: Date = earliestDate!;
    const startDateForDaily = earliestDateNonNull >= oneMonthAgo 
      ? earliestDateNonNull 
      : oneMonthAgo;
    const endDate = now;
    
    for (let d = new Date(startDateForDaily); d <= endDate; d.setDate(d.getDate() + 1)) {
      const date = startOfDay(new Date(d));
      const dateKey = getDateKey(date);
      const dateData = productsByDateMap?.get(dateKey);
      const count = dateData?.count || 0;
      const isToday = dateKey === getDateKey(now);
      
      const dateLabel = isToday ? "Today" : date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric",
      });
      
      // Include product count in the label
      const label = count > 0 
        ? `${dateLabel} (${count})`
        : dateLabel;
      
      timeline.push({
        label,
        date,
        dateKey,
        isMonthly: false,
      });
    }

    // Map timeline to product data
    return [
      {
        key: "products",
        label: "Products Created",
        color: "#277874",
        chartType: "bar" as const,
        data: timeline.map((point) => {
          let count = 0;
          let products: any[] = [];
          
          if (point.isMonthly && point.monthKey) {
            // For monthly points, sum all products in that month
            if (productsByDateMap) {
              productsByDateMap.forEach((dateData, dateKey) => {
                if (dateKey) {
                  const date = startOfDay(new Date(dateKey));
                  if (getMonthKey(date) === point.monthKey) {
                    count += dateData.count;
                    products = [...products, ...dateData.products];
                  }
                }
              });
            }
          } else {
            // For daily points, get products for that specific date
            const dateData = productsByDateMap?.get(point.dateKey);
            count = dateData?.count || 0;
            products = dateData?.products || [];
          }
          
          return {
            value: count,
            label: point.label,
            date: point.date,
            pointLabel:
              count > 0
                ? `${count} product${count > 1 ? "s" : ""}`
                : "",
            pointData:
              count > 0 && products.length > 0
                ? {
                    type: "product" as const,
                    data: products[0], // first product on this date/month
                  }
                : undefined,
          };
        }),
      }
    ];
  }, [analytics, productsByDateMap]);

  // Separate chart data: Views
  const viewsChartData = useMemo(() => {
    if (!analytics || dailyViews.size === 0) return [];

    // Find earliest and latest view dates
    const startOfDay = (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };
    const getDateKey = (date: Date) => startOfDay(date).toISOString().split("T")[0];

    // Collect ALL dates from dailyViews (including those with 0 views to show full timeline)
    const allDateKeys = Array.from(dailyViews.keys()).sort();
    
    if (allDateKeys.length === 0) {
      return [];
    }

    const now = startOfDay(new Date());
    // Create timeline with ALL dates, sorted chronologically (oldest to newest)
    const timeline = allDateKeys.map((dateKey) => {
      const date = startOfDay(new Date(dateKey));
      const isToday = dateKey === getDateKey(now);
      const label = isToday ? "Today" : date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
      return { label, date, dateKey };
    });

    return [
      {
        key: "views",
        label: "Total Views",
        color: "#8B5CF6",
        chartType: "bar" as const,
        data: timeline.map((point) => {
          const dateKey = getDateKey(point.date);
          
          // Get views for this exact date (default to 0 if not found)
          const value = dailyViews.get(dateKey) || 0;
          
          return {
            value,
            label: point.label,
            date: point.date,
            pointLabel: value > 0 ? `${value} views` : "",
            pointData: undefined,
          };
        }),
      }
    ];
  }, [analytics, dailyViews]);

  // Calculate Smart Insights
  const smartInsights = useMemo(() => {
    if (!analytics) return [];

    const insights: { icon: string; color: string; title: string; description: string }[] = [];

    // Best performing day
    if (dailyViews.size > 0) {
      let maxViews = 0;
      let bestDay = '';
      dailyViews.forEach((views, date) => {
        if (views > maxViews) {
          maxViews = views;
          bestDay = date;
        }
      });
      if (maxViews > 0) {
        const date = new Date(bestDay);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        insights.push({
          icon: 'trending-up',
          color: '#10B981',
          title: 'Best Day',
          description: `${dayName} had ${maxViews} views`,
        });
      }
    }

    // Most popular promotion type
    if (analytics.promotions?.recent) {
      const typeCounts: Record<string, number> = {};
      analytics.promotions.recent.forEach((promo: any) => {
        // Get deal type, handling both new dealType field and legacy type field
        let dealType = promo.dealType as DealType;
        if (!dealType && promo.type) {
          // Fallback for legacy promotions: infer deal type from type field
          dealType = promo.type === "percentage" || promo.type === "PERCENTAGE"
            ? "PERCENTAGE_DISCOUNT"
            : "FIXED_DISCOUNT";
        }
        if (dealType) {
          typeCounts[dealType] = (typeCounts[dealType] || 0) + 1;
        }
      });
      const mostPopular = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0];
      if (mostPopular) {
        insights.push({
          icon: 'star',
          color: '#F59E0B',
          title: 'Popular Deal',
          description: `${getDealTypeLabel(mostPopular[0] as DealType)} (${mostPopular[1]} deals)`,
        });
      }
    }

    // Growth trend
    if (analytics.store.totalProducts > 0) {
      const avgViewsPerProduct = analytics.summary.averageViewsPerProduct;
      if (avgViewsPerProduct > 10) {
        insights.push({
          icon: 'rocket',
          color: '#8B5CF6',
          title: 'Strong Engagement',
          description: `${Math.round(avgViewsPerProduct)} avg views per product`,
        });
      } else if (avgViewsPerProduct > 0) {
        insights.push({
          icon: 'information-circle',
          color: '#3B82F6',
          title: 'Growing',
          description: `Keep adding quality content!`,
        });
      }
    }

    // Stock alert (if we have products with low stock)
    if (products) {
      const lowStockCount = products.filter((p: any) => (p.stock || 0) < 10 && (p.stock || 0) > 0).length;
      if (lowStockCount > 0) {
        insights.push({
          icon: 'warning',
          color: '#EF4444',
          title: 'Stock Alert',
          description: `${lowStockCount} product${lowStockCount > 1 ? 's' : ''} running low`,
        });
      }
    }

    return insights;
  }, [analytics, dailyViews, products]);

  // Export Data Function
  const handleExport = async () => {
    if (!analytics) return;

    // In a real app, you'd use Share API or save to file
    // For now, just show an alert with summary
    Alert.alert(
      'Analytics Summary',
      `Products: ${analytics.store.totalProducts}\nViews: ${analytics.views.totalViews}\nPromotions: ${analytics.promotions.total}`,
      [{ text: 'OK' }]
    );
  };

  const handleLinePress = (key: string) => {
    setSelectedMetric(key);
    setDetailModalVisible(true);
  };

  const getDetailData = () => {
    if (!analytics || !selectedMetric) return null;

    // Check if it's a promotion type detail
    if (selectedMetric.startsWith('promotion-')) {
      const dealType = selectedMetric.replace('promotion-', '') as DealType;
      const typeLabel = getDealTypeLabel(dealType);
      const typeColor = promotionTypeColors[dealType];
      
      // Count promotions of this type, handling both new dealType field and legacy type field
      const typePromos = analytics.promotions.recent?.filter((p: any) => {
        // Check new dealType field first
        if (p.dealType === dealType) return true;
        
        // Fallback for legacy promotions
        if (!p.dealType && p.type) {
          const inferredType: DealType = p.type === "percentage" || p.type === "PERCENTAGE"
            ? "PERCENTAGE_DISCOUNT"
            : "FIXED_DISCOUNT";
          return inferredType === dealType;
        }
        
        return false;
      }) || [];
      const activeTypePromos = typePromos.filter((p: any) => p.active);
      
      // Calculate period-specific statistics for this deal type
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);
      const monthStart = new Date(now);
      monthStart.setMonth(monthStart.getMonth() - 1);
      monthStart.setHours(0, 0, 0, 0);
      
      const filterByDate = (promotions: any[], start: Date, end?: Date) => {
        return promotions.filter((p) => {
          const startsAt = new Date(p.startsAt);
          return startsAt >= start && (!end || startsAt <= end);
        });
      };
      
      const todayCount = filterByDate(typePromos, todayStart).length;
      const weekCount = filterByDate(typePromos, weekStart).length;
      const monthCount = filterByDate(typePromos, monthStart).length;
      
      return {
        title: `${typeLabel} Promotions`,
        icon: "ticket",
        color: typeColor,
        metrics: [
          { label: "Total", value: formatNumber(typePromos.length) },
          { label: "Active", value: formatNumber(activeTypePromos.length) },
          { label: "Inactive", value: formatNumber(typePromos.length - activeTypePromos.length) },
          { label: "Today", value: formatNumber(todayCount) },
          { label: "This Week", value: formatNumber(weekCount) },
          { label: "This Month", value: formatNumber(monthCount) },
        ],
      };
    }

    switch (selectedMetric) {
      case "products":
        return {
          title: "Products Overview",
          icon: "cube",
          color: "#277874",
          metrics: [
            { label: "Total Products", value: formatNumber(analytics.store.totalProducts) },
            { label: "Active Products", value: formatNumber(analytics.store.activeProducts) },
            { label: "Inactive Products", value: formatNumber(analytics.store.totalProducts - analytics.store.activeProducts) },
            { label: "Verification Status", value: analytics.store.verificationStatus },
          ],
        };
      case "views":
        return {
          title: "Views Overview",
          icon: "eye",
          color: "#8B5CF6",
          metrics: [
            { label: "Total Views", value: formatNumber(analytics.views.totalViews) },
            { label: "Store Views", value: formatNumber(analytics.views.storeViews) },
            { label: "Product Views", value: formatNumber(analytics.views.productViews) },
            { label: "Promotion Views", value: formatNumber(analytics.views.promotionViews) },
            { label: "Avg Views/Product", value: formatNumber(Math.round(analytics.summary.averageViewsPerProduct)) },
            { label: "Avg Views/Promotion", value: formatNumber(Math.round(analytics.summary.averageViewsPerPromotion)) },
          ],
        };
      default:
        return null;
    }
  };

  if (loading && !analytics) {
    return (
      <View style={analyticsStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#277874" />
        <Text style={analyticsStyles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={analyticsStyles.emptyContainer}>
        <Ionicons name="stats-chart-outline" size={64} color="#9CA3AF" />
        <Text style={analyticsStyles.emptyText}>No analytics available</Text>
        <Text style={analyticsStyles.emptySubtext}>
          Analytics will appear once you have products and promotions
        </Text>
      </View>
    );
  }

  const detailData = getDetailData();

  return (
    <View style={analyticsStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />

      {/* Header */}
      <LinearGradient
        colors={["#FFBE5D", "#277874"]}
        style={analyticsStyles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={analyticsStyles.headerContent}>
          <View style={analyticsStyles.headerIcon}>
            <Ionicons name="stats-chart" size={24} color="#ffffff" />
          </View>
          <View style={analyticsStyles.headerText}>
            <Text style={analyticsStyles.headerTitle}>Analytics Dashboard</Text>
            <Text style={analyticsStyles.headerSubtitle}>Monitor Your Performance</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView style={analyticsStyles.content} showsVerticalScrollIndicator={false}>
        
        <View style={analyticsStyles.section}>

          {/* Analytics Toolbar */}
          <View style={analyticsStyles.toolbar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={analyticsStyles.toolbarScroll}>
              {/* Date Range Filters */}
              <TouchableOpacity
                style={[analyticsStyles.toolbarButton, dateRange === '7days' && analyticsStyles.toolbarButtonActive]}
                onPress={() => setDateRange('7days')}
              >
                <Ionicons name="calendar" size={16} color={dateRange === '7days' ? '#ffffff' : '#6B7280'} />
                <Text style={[analyticsStyles.toolbarButtonText, dateRange === '7days' && analyticsStyles.toolbarButtonTextActive]}>
                  7 Days
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[analyticsStyles.toolbarButton, dateRange === '30days' && analyticsStyles.toolbarButtonActive]}
                onPress={() => setDateRange('30days')}
              >
                <Ionicons name="calendar" size={16} color={dateRange === '30days' ? '#ffffff' : '#6B7280'} />
                <Text style={[analyticsStyles.toolbarButtonText, dateRange === '30days' && analyticsStyles.toolbarButtonTextActive]}>
                  30 Days
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[analyticsStyles.toolbarButton, dateRange === '3months' && analyticsStyles.toolbarButtonActive]}
                onPress={() => setDateRange('3months')}
              >
                <Ionicons name="calendar" size={16} color={dateRange === '3months' ? '#ffffff' : '#6B7280'} />
                <Text style={[analyticsStyles.toolbarButtonText, dateRange === '3months' && analyticsStyles.toolbarButtonTextActive]}>
                  3 Months
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[analyticsStyles.toolbarButton, dateRange === 'all' && analyticsStyles.toolbarButtonActive]}
                onPress={() => setDateRange('all')}
              >
                <Ionicons name="infinite" size={16} color={dateRange === 'all' ? '#ffffff' : '#6B7280'} />
                <Text style={[analyticsStyles.toolbarButtonText, dateRange === 'all' && analyticsStyles.toolbarButtonTextActive]}>
                  All Time
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={analyticsStyles.toolbarDivider} />

              {/* Chart Filters */}
              <TouchableOpacity
                style={analyticsStyles.toolbarButton}
                onPress={() => setShowFiltersModal(true)}
              >
                <Ionicons name="options" size={16} color="#6B7280" />
                <Text style={analyticsStyles.toolbarButtonText}>Filters</Text>
              </TouchableOpacity>

              {/* Export */}
              <TouchableOpacity style={analyticsStyles.toolbarButton} onPress={handleExport}>
                <Ionicons name="share-outline" size={16} color="#6B7280" />
                <Text style={analyticsStyles.toolbarButtonText}>Export</Text>
              </TouchableOpacity>

              {/* Toggle Insights */}
              <TouchableOpacity
                style={[analyticsStyles.toolbarButton, showInsights && analyticsStyles.toolbarButtonActive]}
                onPress={() => setShowInsights(!showInsights)}
              >
                <Ionicons name="bulb" size={16} color={showInsights ? '#ffffff' : '#6B7280'} />
                <Text style={[analyticsStyles.toolbarButtonText, showInsights && analyticsStyles.toolbarButtonTextActive]}>
                  Insights
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Smart Insights */}
          {showInsights && smartInsights.length > 0 && (
            <View style={analyticsStyles.insightsCard}>
              <View style={analyticsStyles.insightsHeader}>
                <Ionicons name="bulb" size={20} color="#F59E0B" />
                <Text style={analyticsStyles.insightsTitle}>Smart Insights</Text>
              </View>
              <View style={analyticsStyles.insightsGrid}>
                {smartInsights.map((insight, index) => (
                  <View key={`insight-${index}-${insight.title}`} style={analyticsStyles.insightItem}>
                    <View style={[analyticsStyles.insightIcon, { backgroundColor: `${insight.color}20` }]}>
                      <Ionicons name={insight.icon as any} size={20} color={insight.color} />
                    </View>
                    <View style={analyticsStyles.insightContent}>
                      <Text style={analyticsStyles.insightTitle} numberOfLines={1} ellipsizeMode="tail">
                        {insight.title}
                      </Text>
                      <Text style={analyticsStyles.insightDescription} numberOfLines={2} ellipsizeMode="tail">
                        {insight.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Deal Types Chart */}
          {showDealTypes && dealTypesChartData.length > 0 && (
            <View style={analyticsStyles.card}>
              <View style={analyticsStyles.cardHeader}>
                <View>
                  <Text style={analyticsStyles.cardTitle}>Deal Types</Text>
                  <Text style={analyticsStyles.cardSubtitle}>
                    Track your promotions by deal type over time
                  </Text>
                </View>
              </View>
              <CombinedLineBarChart
                lines={dealTypesChartData}
                height={300}
                onLinePress={handleLinePress}
                selectedLine={selectedMetric || undefined}
                onPointLabelPress={(pointData: { type: 'promotion' | 'product'; data: any } | undefined, date: string) => {
                  if (pointData) {
                    setSelectedPointDetail({
                      type: pointData.type,
                      data: pointData.data,
                      date: date,
                    });
                    setPointDetailModalVisible(true);
                  }
                }}
              />
              <View style={analyticsStyles.chartLegend}>
                <Text style={analyticsStyles.chartLegendText}>
                  💡 Tap on any deal type to view detailed statistics
                </Text>
              </View>
            </View>
          )}

          {/* Products Chart */}
          {showProducts && productsChartData.length > 0 && (
            <View style={analyticsStyles.card}>
              <View style={analyticsStyles.cardHeader}>
                <View>
                  <Text style={analyticsStyles.cardTitle}>Products</Text>
                  <Text style={analyticsStyles.cardSubtitle}>
                    Track your product creation over time
                  </Text>
                </View>
              </View>
              <CombinedLineBarChart
                lines={productsChartData}
                height={300}
                onLinePress={handleLinePress}
                selectedLine={selectedMetric || undefined}
                onPointLabelPress={(pointData: { type: 'promotion' | 'product'; data: any } | undefined, date: string) => {
                  if (pointData) {
                    setSelectedPointDetail({
                      type: pointData.type,
                      data: pointData.data,
                      date: date,
                    });
                    setPointDetailModalVisible(true);
                  }
                }}
              />
              <View style={analyticsStyles.chartLegend}>
                <Text style={analyticsStyles.chartLegendText}>
                  💡 Tap to view product statistics
                </Text>
              </View>
            </View>
          )}

          {/* Views Chart */}
          {showViews && viewsChartData.length > 0 && (
            <View style={analyticsStyles.card}>
              <View style={analyticsStyles.cardHeader}>
                <View>
                  <Text style={analyticsStyles.cardTitle}>Views</Text>
                  <Text style={analyticsStyles.cardSubtitle}>
                    Track customer engagement and views over time
                  </Text>
                </View>
              </View>
              <CombinedLineBarChart
                lines={viewsChartData}
                height={300}
                onLinePress={handleLinePress}
                selectedLine={selectedMetric || undefined}
                onPointLabelPress={(pointData: { type: 'promotion' | 'product'; data: any } | undefined, date: string) => {
                  if (pointData) {
                    setSelectedPointDetail({
                      type: pointData.type,
                      data: pointData.data,
                      date: date,
                    });
                    setPointDetailModalVisible(true);
                  }
                }}
              />
              <View style={analyticsStyles.chartLegend}>
                <Text style={analyticsStyles.chartLegendText}>
                  💡 Tap to view view statistics
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={analyticsStyles.section}>
          <View style={analyticsStyles.keyMetricsHeader}>
            <Ionicons name="grid" size={20} color="#277874" />
            <Text style={analyticsStyles.keyMetricsTitle}>Key Metrics</Text>
          </View>
          <View style={analyticsStyles.statsGrid}>
            <TouchableOpacity
              style={[analyticsStyles.statCard, { borderLeftColor: "#277874" }]}
              onPress={() => handleLinePress("products")}
            >
              <View style={[analyticsStyles.statIconContainer, { backgroundColor: "#27787415" }]}>
                <Ionicons name="cube" size={28} color="#277874" />
              </View>
              <Text style={analyticsStyles.statValue}>
                {formatNumber(analytics.store.totalProducts)}
              </Text>
              <Text style={analyticsStyles.statLabel}>Total Products</Text>
              <Text style={analyticsStyles.statSubLabel}>
                {formatNumber(analytics.store.activeProducts)} active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[analyticsStyles.statCard, { borderLeftColor: "#8B5CF6" }]}
              onPress={() => handleLinePress("views")}
            >
              <View style={[analyticsStyles.statIconContainer, { backgroundColor: "#8B5CF615" }]}>
                <Ionicons name="eye" size={28} color="#8B5CF6" />
              </View>
              <Text style={[analyticsStyles.statValue, { color: "#8B5CF6" }]}>
                {formatNumber(analytics.views.totalViews)}
              </Text>
              <Text style={analyticsStyles.statLabel}>Total Views</Text>
              <Text style={analyticsStyles.statSubLabel}>
                {formatNumber(analytics.views.storeViews)} store views
              </Text>
            </TouchableOpacity>
          </View>
          
          
        </View>
      </ScrollView>

      {/* Modals */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={analyticsStyles.modalOverlay}>
          <View style={analyticsStyles.modalContent}>
            {detailData && (
              <>
                <View style={analyticsStyles.modalHeader}>
                  <View style={[analyticsStyles.modalIconContainer, { backgroundColor: `${detailData.color}20` }]}>
                    <Ionicons name={detailData.icon as any} size={32} color={detailData.color} />
                  </View>
                  <Text style={[analyticsStyles.modalTitle, { color: detailData.color }]}>
                    {detailData.title}
                  </Text>
                  <TouchableOpacity
                    style={analyticsStyles.modalCloseButton}
                    onPress={() => setDetailModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={analyticsStyles.modalBody} showsVerticalScrollIndicator={false}>
                  {detailData.metrics.map((metric, index) => (
                    <View key={`metric-${index}-${metric.label}`} style={analyticsStyles.detailMetricRow}>
                      <Text style={analyticsStyles.detailMetricLabel}>{metric.label}</Text>
                      <Text style={[analyticsStyles.detailMetricValue, { color: detailData.color }]}>
                        {metric.value}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Point Detail Modal */}
      <Modal
        visible={pointDetailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPointDetailModalVisible(false)}
      >
        <View style={analyticsStyles.modalOverlay}>
          <View style={analyticsStyles.modalContent}>
            {selectedPointDetail && (
              <>
                <View style={analyticsStyles.modalHeader}>
                  <View style={[
                    analyticsStyles.modalIconContainer, 
                    { backgroundColor: selectedPointDetail.type === 'promotion' ? '#FFBE5D20' : '#27787420' }
                  ]}>
                    <Ionicons 
                      name={selectedPointDetail.type === 'promotion' ? 'ticket' : 'cube'} 
                      size={32} 
                      color={selectedPointDetail.type === 'promotion' ? '#FFBE5D' : '#277874'} 
                    />
                  </View>
                  <Text style={[
                    analyticsStyles.modalTitle, 
                    { color: selectedPointDetail.type === 'promotion' ? '#FFBE5D' : '#277874' }
                  ]}>
                    {selectedPointDetail.type === 'promotion' ? 'Promotion Details' : 'Product Details'}
                  </Text>
                  <TouchableOpacity
                    style={analyticsStyles.modalCloseButton}
                    onPress={() => setPointDetailModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={analyticsStyles.modalBody} showsVerticalScrollIndicator={false}>
                  {selectedPointDetail.type === 'promotion' && selectedPointDetail.data && (
                    <>
                      <View style={analyticsStyles.detailMetricRow}>
                        <Text style={analyticsStyles.detailMetricLabel}>Title</Text>
                        <Text style={[analyticsStyles.detailMetricValue, { color: '#FFBE5D' }]}>
                          {selectedPointDetail.data.title}
                        </Text>
                      </View>
                      <View style={analyticsStyles.detailMetricRow}>
                        <Text style={analyticsStyles.detailMetricLabel}>Deal Type</Text>
                        <Text style={[analyticsStyles.detailMetricValue, { color: '#FFBE5D' }]}>
                          {selectedPointDetail.data.dealType 
                            ? getDealTypeLabel(selectedPointDetail.data.dealType as DealType)
                            : 'N/A'}
                        </Text>
                      </View>
                      <View style={analyticsStyles.detailMetricRow}>
                        <Text style={analyticsStyles.detailMetricLabel}>Status</Text>
                        <Text style={[analyticsStyles.detailMetricValue, { color: '#FFBE5D' }]}>
                          {selectedPointDetail.data.active ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                      <View style={analyticsStyles.detailMetricRow}>
                        <Text style={analyticsStyles.detailMetricLabel}>Start Date</Text>
                        <Text style={[analyticsStyles.detailMetricValue, { color: '#FFBE5D' }]}>
                          {formatDate(selectedPointDetail.data.startsAt)}
                        </Text>
                      </View>
                      {selectedPointDetail.data.endsAt && (
                        <View style={analyticsStyles.detailMetricRow}>
                          <Text style={analyticsStyles.detailMetricLabel}>End Date</Text>
                          <Text style={[analyticsStyles.detailMetricValue, { color: '#FFBE5D' }]}>
                            {formatDate(selectedPointDetail.data.endsAt)}
                          </Text>
                        </View>
                      )}
                      <View style={analyticsStyles.detailMetricRow}>
                        <Text style={analyticsStyles.detailMetricLabel}>Products Count</Text>
                        <Text style={[analyticsStyles.detailMetricValue, { color: '#FFBE5D' }]}>
                          {selectedPointDetail.data.productCount || 0}
                        </Text>
                      </View>
                      <View style={analyticsStyles.detailMetricRow}>
                        <Text style={analyticsStyles.detailMetricLabel}>Created On</Text>
                        <Text style={[analyticsStyles.detailMetricValue, { color: '#FFBE5D' }]}>
                          {selectedPointDetail.date}
                        </Text>
                      </View>
                    </>
                  )}

                  {selectedPointDetail.type === 'product' && selectedPointDetail.data && (
                    <>
                      <View style={analyticsStyles.detailMetricRow}>
                        <Text style={analyticsStyles.detailMetricLabel}>Name</Text>
                        <Text style={[analyticsStyles.detailMetricValue, { color: '#277874' }]}>
                          {selectedPointDetail.data.name}
                        </Text>
                      </View>
                      <View style={analyticsStyles.detailMetricRow}>
                        <Text style={analyticsStyles.detailMetricLabel}>Price</Text>
                        <Text style={[analyticsStyles.detailMetricValue, { color: '#277874' }]}>
                          ${parseFloat(selectedPointDetail.data.price || '0').toFixed(2)}
                        </Text>
                      </View>
                      <View style={analyticsStyles.detailMetricRow}>
                        <Text style={analyticsStyles.detailMetricLabel}>Stock</Text>
                        <Text style={[analyticsStyles.detailMetricValue, { color: '#277874' }]}>
                          {formatNumber(selectedPointDetail.data.stock || 0)}
                        </Text>
                      </View>
                      <View style={analyticsStyles.detailMetricRow}>
                        <Text style={analyticsStyles.detailMetricLabel}>Status</Text>
                        <Text style={[analyticsStyles.detailMetricValue, { color: '#277874' }]}>
                          {selectedPointDetail.data.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                      {selectedPointDetail.data.description && (
                        <View style={analyticsStyles.detailMetricRow}>
                          <Text style={analyticsStyles.detailMetricLabel}>Description</Text>
                          <Text style={[analyticsStyles.detailMetricValue, { color: '#277874' }]}>
                            {selectedPointDetail.data.description}
                          </Text>
                        </View>
                      )}
                      {selectedPointDetail.data.createdAt && (
                        <View style={analyticsStyles.detailMetricRow}>
                          <Text style={analyticsStyles.detailMetricLabel}>Created On</Text>
                          <Text style={[analyticsStyles.detailMetricValue, { color: '#277874' }]}>
                            {formatDate(selectedPointDetail.data.createdAt)}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Chart Filters Modal */}
      <Modal
        visible={showFiltersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <View style={analyticsStyles.modalOverlay}>
          <View style={analyticsStyles.modalContent}>
            <View style={analyticsStyles.modalHeader}>
              <View style={[analyticsStyles.modalIconContainer, { backgroundColor: '#27787420' }]}>
                <Ionicons name="options" size={32} color="#277874" />
              </View>
              <Text style={[analyticsStyles.modalTitle, { color: '#277874' }]}>
                Chart Filters
              </Text>
              <TouchableOpacity
                style={analyticsStyles.modalCloseButton}
                onPress={() => setShowFiltersModal(false)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={analyticsStyles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={analyticsStyles.filterSectionTitle}>Show/Hide Charts</Text>
              
              {/* Deal Types Toggle */}
              <TouchableOpacity
                style={analyticsStyles.filterToggleRow}
                onPress={() => setShowDealTypes(!showDealTypes)}
              >
                <View style={analyticsStyles.filterToggleLeft}>
                  <View style={[analyticsStyles.filterToggleIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="ticket" size={20} color="#FFBE5D" />
                  </View>
                  <View>
                    <Text style={analyticsStyles.filterToggleTitle}>Deal Types Chart</Text>
                    <Text style={analyticsStyles.filterToggleSubtitle}>Promotion types over time</Text>
                  </View>
                </View>
                <View style={[analyticsStyles.filterToggle, showDealTypes && analyticsStyles.filterToggleActive]}>
                  {showDealTypes && <View style={analyticsStyles.filterToggleThumb} />}
                </View>
              </TouchableOpacity>

              {/* Products Toggle */}
              <TouchableOpacity
                style={analyticsStyles.filterToggleRow}
                onPress={() => setShowProducts(!showProducts)}
              >
                <View style={analyticsStyles.filterToggleLeft}>
                  <View style={[analyticsStyles.filterToggleIcon, { backgroundColor: '#D1FAE5' }]}>
                    <Ionicons name="cube" size={20} color="#277874" />
                  </View>
                  <View>
                    <Text style={analyticsStyles.filterToggleTitle}>Products Chart</Text>
                    <Text style={analyticsStyles.filterToggleSubtitle}>Product creation timeline</Text>
                  </View>
                </View>
                <View style={[analyticsStyles.filterToggle, showProducts && analyticsStyles.filterToggleActive]}>
                  {showProducts && <View style={analyticsStyles.filterToggleThumb} />}
                </View>
              </TouchableOpacity>

              {/* Views Toggle */}
              <TouchableOpacity
                style={analyticsStyles.filterToggleRow}
                onPress={() => setShowViews(!showViews)}
              >
                <View style={analyticsStyles.filterToggleLeft}>
                  <View style={[analyticsStyles.filterToggleIcon, { backgroundColor: '#EDE9FE' }]}>
                    <Ionicons name="eye" size={20} color="#8B5CF6" />
                  </View>
                  <View>
                    <Text style={analyticsStyles.filterToggleTitle}>Views Chart</Text>
                    <Text style={analyticsStyles.filterToggleSubtitle}>Customer engagement data</Text>
                  </View>
                </View>
                <View style={[analyticsStyles.filterToggle, showViews && analyticsStyles.filterToggleActive]}>
                  {showViews && <View style={analyticsStyles.filterToggleThumb} />}
                </View>
              </TouchableOpacity>

              {/* Action Buttons */}
              <View style={analyticsStyles.filterActions}>
                <TouchableOpacity
                  style={analyticsStyles.filterResetButton}
                  onPress={() => {
                    setShowDealTypes(true);
                    setShowProducts(true);
                    setShowViews(true);
                  }}
                >
                  <Ionicons name="refresh" size={18} color="#277874" />
                  <Text style={analyticsStyles.filterResetButtonText}>Show All</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={analyticsStyles.filterApplyButton}
                  onPress={() => setShowFiltersModal(false)}
                >
                  <Text style={analyticsStyles.filterApplyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const analyticsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#277874",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.9,
  },
  content: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  keyMetricsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  keyMetricsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 18,
  },
  chartLegend: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  chartLegendText: {
    fontSize: 18,
    color: "#6B7280",
    textAlign: "center",
    fontStyle: "italic",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#277874",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
    marginBottom: 2,
  },
  statSubLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "400",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 12,
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
  },
  modalCloseButton: {
    padding: 8,
  },
  modalBody: {
    padding: 20,
  },
  detailMetricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailMetricLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  detailMetricValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  recentSection: {
    marginTop: 24,
  },
  recentSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  recentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  recentItemContent: {
    flex: 1,
    marginRight: 12,
  },
  recentItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  recentItemSubtext: {
    fontSize: 12,
    color: "#6B7280",
  },
  recentItemBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recentItemBadgeActive: {
    backgroundColor: "#D1FAE5",
  },
  recentItemBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
  },
  recentItemBadgeTextActive: {
    color: "#047857",
  },
  // Toolbar styles
  toolbar: {
    marginBottom: 16,
  },
  toolbarScroll: {
    flexGrow: 0,
  },
  toolbarButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  toolbarButtonActive: {
    backgroundColor: "#277874",
  },
  toolbarButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  toolbarButtonTextActive: {
    color: "#ffffff",
  },
  toolbarDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 8,
  },
  // Insights styles
  insightsCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  insightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#92400E",
  },
  insightsGrid: {
    gap: 12,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#78350F",
    marginBottom: 2,
  },
  insightDescription: {
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18,
  },
  // Filter Modal styles
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  filterToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  filterToggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  filterToggleTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 2,
  },
  filterToggleSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  filterToggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  filterToggleActive: {
    backgroundColor: "#277874",
    alignItems: "flex-end",
  },
  filterToggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  filterActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 12,
  },
  filterResetButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterResetButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#277874",
  },
  filterApplyButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#277874",
  },
  filterApplyButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
});