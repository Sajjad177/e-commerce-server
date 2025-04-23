import { v2 as cloudinary } from "cloudinary";
import config from ".";

cloudinary.config({
  cloud_name: config.imgUpload.cloudinary_cloud_name,
  api_key: config.imgUpload.cloudinary_api_key,
  api_secret: config.imgUpload.cloudinary_api_secret,
});

export const cloudinaryUpload = cloudinary;
