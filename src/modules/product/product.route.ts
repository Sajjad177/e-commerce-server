import express from "express";
import { productController } from "./product.controller";
import { multerUpload } from "../../config/multer.config";
import { parseBody } from "../../middleware/parseBody";
import validateRequest from "../../middleware/validateRequest";
import { productValidation } from "./product.zodValidation";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constant";

const router = express.Router();

router.post(
  "/create",
  multerUpload.fields([{ name: "images" }]),
  parseBody,
  validateRequest(productValidation.createProductValidation),
  auth(USER_ROLE.superAdmin),
  productController.addProduct
);

router.get("/", productController.getAllProducts);
router.get("/best-sellers", productController.getBestSellerProducts);
router.get("/:productId", productController.getSingleProduct);
router.put(
  "/:productId",
  multerUpload.fields([{ name: "images" }]),
  parseBody,
  validateRequest(productValidation.updateProductValidation),
  productController.updateProduct
);
router.patch(
  "/:productId",
  validateRequest(productValidation.toggleProductAvailabilityValidation),
  productController.toggleProductAvailability
);

export const productRoute = router;
