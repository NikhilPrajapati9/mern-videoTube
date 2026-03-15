import cron from "node-cron";
import { Video } from "../models/video.model.js";
import { deleteFromCloudinary } from "./utils/cloudinary.js";

// Yeh function har raat 12 baje chalega (0 0 * * *)
export const initVideoCleanup = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("Running daily cleanup task...");

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10); // Aaj se 10 din pehle ki date

    // 1. Un videos ko dhoondo jo isDeleted: true hain aur deletedAt 10 din se purana hai
    const videosToDelete = await Video.find({
      isDeleted: true,
      deletedAt: { $lte: tenDaysAgo }, // $lte matlab Less Than or Equal to (10 din ya usse purana)
    });

    if (videosToDelete.length > 0) {
      for (const video of videosToDelete) {
        // 2. Cloudinary se files delete karein
        if (video.video?.public_id) {
          await deleteFromCloudinary(video.video.public_id, "video");
        }
        if (video.thumbnail?.public_id) {
          await deleteFromCloudinary(video.thumbnail.public_id, "image");
        }

        // 3. Database se permanent delete karein
        await Video.findByIdAndDelete(video._id);
      }
      console.log(`${videosToDelete.length} videos permanently deleted.`);
    }
  });
};
