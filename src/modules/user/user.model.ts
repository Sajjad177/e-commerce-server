import { model, Schema } from "mongoose";
import { TUser, UserModel } from "./user.interface";
import bcrypt from "bcrypt";
import config from "../../config";

const userModel = new Schema<TUser, UserModel>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    cartData: {
      type: Map,
      of: {
        size: String,
        quantity: Number,
        name: String,
        price: Number,
        image: String,
        productId: Schema.Types.ObjectId,
      },
      default: {},
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "superAdmin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

userModel.pre("save", async function (next) {
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcryptSaltRounds)
  );
});

userModel.post("save", function (doc, next) {
  doc.password = "";
  next();
});

userModel.statics.isPasswordMatch = async function (
  password: string,
  hashedPassword: string
) {
  return await bcrypt.compare(password, hashedPassword);
};

userModel.statics.isUserExistByEmail = async function (email: string) {
  return await User.findOne({ email }).select("+password");
};

userModel.statics.isUserExistById = async function (id: string) {
  return await User.findById(id).select("+password");
};

userModel.statics.isUserDeleted = async function (isDeleted: boolean) {
  return await User.findOne({ isDeleted }).select("+password");
};

export const User = model<TUser, UserModel>("User", userModel);
