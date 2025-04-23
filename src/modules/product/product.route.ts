import express from "express";
import { productController } from "./product.controller";
import { multerUpload } from "../../config/multer.config";
import { parseBody } from "../../middleware/parseBody";

const router = express.Router();

router.post(
  "/create",
  multerUpload.fields([{ name: "images" }]),
  parseBody,
  productController.addProduct
);

router.get("/", productController.getAllProducts);
router.get("/:productId", productController.getSingleProduct);
router.put("/:productId", productController.updateProduct);
router.delete("/:productId", productController.removeProduct);

export const productRoute = router;
