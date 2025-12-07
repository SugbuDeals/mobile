/**
 * Promotion domain selectors
 */

import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store/types";
import type { Promotion } from "./types";

// Base selectors
const selectPromotionsState = (state: RootState) => state.store.promotions;

// Memoized selectors
export const selectAllPromotions = createSelector(
  [selectPromotionsState],
  (promotionsState) => promotionsState.promotions
);

export const selectActivePromotions = createSelector(
  [selectPromotionsState],
  (promotionsState) => promotionsState.activePromotions
);

export const selectPromotionsLoading = createSelector(
  [selectPromotionsState],
  (promotionsState) => promotionsState.loading
);

export const selectPromotionsError = createSelector(
  [selectPromotionsState],
  (promotionsState) => promotionsState.error
);

export const selectPromotionById = (promotionId: number) =>
  createSelector([selectAllPromotions], (promotions) =>
    promotions.find((promotion) => promotion.id === promotionId)
  );

export const selectPromotionsByProduct = (productId: number) =>
  createSelector([selectAllPromotions], (promotions) =>
    promotions.filter((promotion) => promotion.productId === productId)
  );

export const selectActivePromotionsByProduct = (productId: number) =>
  createSelector([selectActivePromotions], (promotions) =>
    promotions.filter(
      (promotion) => promotion.productId === productId && promotion.active
    )
  );

