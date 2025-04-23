import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { TProduct } from "./product.interface";
import { ProductModel } from "./product.model";
import { IImageFiles } from "../../interface/IImageFiles";

const addProductInDB = async (
  payload: TProduct,
  productImages: IImageFiles
) => {
  const { images } = productImages;
  if (!images || images.length === 0) {
    throw new AppError("Images are required", StatusCodes.BAD_REQUEST);
  }

  payload.images = images.map((image) => image.path);

  const result = await ProductModel.create(payload);
  return result;
};

const getAllProductsFromDB = async () => {
  const result = await ProductModel.find({ isDeleted: false }).sort({
    createdAt: -1,
  });
  return result;
};

const getSingleProductFromDB = async (productId: string) => {
  const result = await ProductModel.findById(productId);
  if (!result) {
    throw new AppError("Product not found", StatusCodes.NOT_FOUND);
  }

  return result;
};

const updateProductInDB = async (productId: string, payload: TProduct) => {
  const product = await ProductModel.findById(productId);
  if (!product) {
    throw new AppError("Product not found", StatusCodes.NOT_FOUND);
  }

  const result = await ProductModel.findByIdAndUpdate(productId, payload, {
    new: true,
  });
  return result;
};

const toggleProductAvailabilityInBD = async (productId: string) => {
  const product = await ProductModel.findById(productId);
  if (!product) {
    throw new AppError("Product not found", StatusCodes.NOT_FOUND);
  }

  const result = await ProductModel.findByIdAndUpdate(
    productId,
    { isDeleted: !product.isDeleted },
    { new: true }
  );
  return result;
};

export const productService = {
  addProductInDB,
  getAllProductsFromDB,
  getSingleProductFromDB,
  updateProductInDB,
  toggleProductAvailabilityInBD,
};
