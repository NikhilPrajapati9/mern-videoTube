import { connectDB } from "./db/index.js";
import { app } from "./app.js";
import { initVideoCleanup } from "./utils/videoCleanup.js";

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("ERROR", error);
      throw error;
    });

    initVideoCleanup();

    app.listen(process.env.PORT || 3000, () => {
      console.log(
        `server is listening on http://localhost:${process.env.PORT}`
      );
    });
  })
  .catch((error) => {
    console.log("MongoDB connection FAILED !!! ", error);
  });

/*
const app = express();
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("ERROR", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(
        `server is listening on https://localhost:${process.env.PORT}`
      );
    });
  } catch (error) {
    console.error("ERROR: ", error);
    throw error;
  }
})();
*/
