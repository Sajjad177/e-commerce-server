import dotenv from "dotenv";

dotenv.config();

export default {
  port: process.env.PORT,
  mongodbUrl: process.env.MONGODB_URL,
  bcryptSaltRounds: process.env.BCRYPT_SALT_ROUNDS,
  nodeEnv: process.env.NODE_ENV,
  jwt: {
    jwtAccessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET,
    jwtAccessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET,
    jwtRefreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  },
  reset: {
    reset_password_token_secret: process.env.RESET_PASSWORD_TOKEN,
    reset_password_token_expires: process.env.RESET_PASSWORD_EXPIRES_IN,
    reset_url: process.env.RESET_PASSWORD_TOKEN_URL,
  },

  email: {
    email_host: process.env.EMAIL_HOST,
    email_password: process.env.EMAIL_PASSWORD,
  },

  imgUpload: {
    cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
    cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
  },

  sp: {
    sp_endpoint: process.env.SP_ENDPOINT,
    sp_username: process.env.SP_USERNAME,
    sp_password: process.env.SP_PASSWORD,
    sp_prefix: process.env.SP_PREFIX,
    sp_return_url: process.env.SP_RETURN_URL,
  },
};
