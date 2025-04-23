import { IImageFiles } from "../../interface/IImageFiles";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { productService } from "./product.service";

const addProduct = catchAsync(async (req, res) => {
  const result = await productService.addProductInDB(
    req.body,
    req.files as IImageFiles
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Product added successfully",
    data: result,
  });
});

const getAllProducts = catchAsync(async (req, res) => {
  const result = await productService.getAllProductsFromDB();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Products retrieved successfully",
    data: result,
  });
});

const getSingleProduct = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const result = await productService.getSingleProductFromDB(productId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Product retrieved successfully",
    data: result,
  });
});

const updateProduct = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const result = await productService.updateProductInDB(productId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Product updated successfully",
    data: result,
  });
});

const removeProduct = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const result = await productService.removeProductFromDB(productId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Product removed successfully",
    data: result,
  });
});

export const productController = {
  addProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  removeProduct,
};
