import app from "./app";
import mongoose from "mongoose";
import config from "./config";
import seedSuperAdmin from "./DB";

async function main() {
  try {
    await mongoose.connect(config.mongodbUrl as string);

    // add supper admin
    seedSuperAdmin();

    app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
    });
  } catch (error) {
    console.log(error);
  }
}

main();
