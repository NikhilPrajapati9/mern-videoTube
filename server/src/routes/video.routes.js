import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
  getAllDeletedVideos,
  getAllVideos,
  getUserVideos,
  getVideoById,
  recoverVideo,
  togglePublishStatus,
  updateVideo,
  uploadAVideo,
} from "../controllers/video.controller";
import { upload } from "../middlewares/multer.middleware";

const router = Router();
router.use(verifyJWT);

router
  .route("/")
  .get(getAllVideos)
  .post(
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    uploadAVideo
  );

router.route("deletedVideo").get(getAllDeletedVideos);

router
  .route("/:videoId")
  .get(getVideoById)
  .delete(deleteVideo)
  .patch(upload.single(thumbnail), updateVideo);

router.route("/recover/:videoId").patch(recoverVideo);
router.route("/toggle/pusblish/:videoId").patch(togglePublishStatus);


export default router;