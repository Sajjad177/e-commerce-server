export interface TProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subCategory: string;
  stock: number;
  images: string[];
  size: string[];
  bestSeller: boolean;
  isDeleted: boolean;
  inStock: boolean;
}
