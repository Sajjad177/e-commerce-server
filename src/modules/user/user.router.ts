import express from "express";
import { userController } from "./user.controller";
import validateRequest from "../../middleware/validateRequest";
import { userValidation } from "./user.validation";

const router = express.Router();

router.post(
  "/register",
  validateRequest(userValidation.userRegisterValidation),
  userController.registerUser
);

router.get("/", userController.getAllUsers);
router.get("/:userId", userController.getSingelUser);
router.patch(
  "/:userId",
  // validateRequest(userValidation.toggleUserAvailabilityValidation),
  userController.toggleUserAvailability
);

export const userRouter = router;
