export type BookmarkedStore = {
  storeId: number;
  name?: string;
};

export type BookmarkedProduct = {
  productId: number;
  name?: string;
};

export type ListBookmarksPayload = {
  take?: number;
  skip?: number;
};

export type BookmarksState = {
  stores: BookmarkedStore[];
  products: BookmarkedProduct[];
  loading: boolean;
  error: string | null;
};


