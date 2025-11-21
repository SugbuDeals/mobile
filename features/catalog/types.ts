export type Category = {
  id: number;
  name: string;
};

export type CreateCategoryDTO = {
  name: string;
};

export type UpdateCategoryDTO = {
  name?: string;
};

export type Product = {
  id: number;
  name: string;
  description?: string;
  price?: number;
  storeId?: number;
  isActive?: boolean;
  imageUrl?: string;
};

