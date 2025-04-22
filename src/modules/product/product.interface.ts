export interface TProduct {
  name: {
    type: string;
    required: boolean;
  };
  description: {
    type: string;
    required: boolean;
  };
  price: {
    type: number;
    required: boolean;
  };
  category: {
    type: string;
    required: boolean;
  };
  stock: {
    type: number;
    required: boolean;
  };
  images: {
    type: string[];
  };
  size: {
    type: string[];
    required: boolean;
  };
  bestSeller: {
    type: boolean;
    default: false;
  };
  isDeleted: {
    type: boolean;
    default: false;
  }
}
