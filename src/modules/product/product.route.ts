import express from "express";
import { productController } from "./product.controller";
import { multerUpload } from "../../config/multer.config";
import { parseBody } from "../../middleware/parseBody";
import validateRequest from "../../middleware/validateRequest";
import { productValidation } from "./product.zodValidation";

const router = express.Router();

router.post(
  "/create",
  multerUpload.fields([{ name: "images" }]),
  parseBody,
  validateRequest(productValidation.createProductValidation),
  productController.addProduct
);

router.get("/", productController.getAllProducts);
router.get("/:productId", productController.getSingleProduct);
router.put(
  "/:productId",
  multerUpload.fields([{ name: "images" }]),
  parseBody,
  validateRequest(productValidation.updateProductValidation),
  productController.updateProduct
);
router.put(
  "/:productId",
  validateRequest(productValidation.toggleProductAvailabilityValidation),
  productController.toggleProductAvailability
);

export const productRoute = router;
