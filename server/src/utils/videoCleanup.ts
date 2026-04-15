import cron from "node-cron";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js"; // Import Comment model
import { Like } from "../models/like.model.js"; // Import Like model
import { deleteFromCloudinary } from "./cloudinary.js";

export const initVideoCleanup = () => {
  // Har raat 12 baje chalega
  cron.schedule("0 0 * * *", async () => {
    console.log("--- Starting Daily Permanent Cleanup Task ---");

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    // 1. Un videos ko dhoondo jo 10 din pehle soft-delete hui thi
    const videosToDelete = await Video.find({
      isDeleted: true,
      deletedAt: { $lte: tenDaysAgo },
    });

    if (videosToDelete.length === 0) {
      console.log("No videos found for permanent deletion.");
      return;
    }

    for (const video of videosToDelete) {
      try {
        const videoId = video._id;

        // 2. Cloudinary se Assets delete karein
        if (video?.videoFile?.public_id) {
          await deleteFromCloudinary(video.videoFile.public_id, "video");
        }
        if (video?.thumbnail?.public_id) {
          await deleteFromCloudinary(video.thumbnail.public_id, "image");
        }

        // 3. Database Cleanup (Relational Data)
        // Video se jude saare comments uda do
        await Comment.deleteMany({ videoId: videoId });

        // Video se jude saare likes (Video likes + Comment likes) uda do
        // Note: Agar aapne Like schema mein videoId rakha hai toh:
        await Like.deleteMany({ videoId: videoId });

        // 4. Video document ko permanent delete karein
        await Video.findByIdAndDelete(videoId);

        console.log(`Successfully purged video and its data: ${videoId}`);
      } catch (error) {
        console.error(
          `Error purging video ${video._id}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    console.log(`Cleanup completed for ${videosToDelete.length} videos.`);
  });
};
