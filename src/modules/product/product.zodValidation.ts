import { z } from "zod";

const createProductValidation = z.object({
  body: z.object({
    name: z.string().min(2, "Name is required"),
    description: z.string().min(10, "Description is required"),
    price: z.number().positive("Price must be a positive number"),
    category: z.string().min(1, "Category is required"),
    subCategory: z.string().min(1, "Subcategory is required"),
    stock: z.number().int().nonnegative("Stock must be a non-negative integer"),
    size: z.array(z.string().min(1, "Size is required")),
  }),
});

const updateProductValidation = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.number().positive("Price must be a positive number").optional(),
    category: z.string().optional(),
    subCategory: z.string().optional(),
    stock: z
      .number()
      .int()
      .nonnegative("Stock must be a non-negative integer")
      .optional(),
    images: z.array(z.string()).optional(),
    size: z.array(z.string()).optional(),
    bestSeller: z.boolean().optional(),
    isDeleted: z.boolean().optional(),
  }),
});

const toggleProductAvailabilityValidation = z.object({
  body: z.object({
    isDeleted: z.boolean().optional(),
  }),
});

export const productValidation = {
  createProductValidation,
  updateProductValidation,
  toggleProductAvailabilityValidation,
};
