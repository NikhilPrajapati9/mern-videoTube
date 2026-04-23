import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  deleteVideo,
  getAllDeletedVideos,
  getAllVideos,
  getVideoById,
  recoverVideo,
  togglePublishStatus,
  updateVideo,
  uploadAVideo,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { validate } from "../middlewares/validate.js";
import {
  deleteVideoSchema,
  getAllVideosSchema,
  getVideoByIdSchema,
  recoverVideoSchema,
  togglePublishStatusSchema,
  updateVideoSchema,
  uploadVideoSchema,
} from "../validators/video.validator.js";

const router = Router();
router.use(verifyJWT);

router
  .route("/")
  .get(validate(getAllVideosSchema), getAllVideos)
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
    validate(uploadVideoSchema),
    uploadAVideo
  );

router
  .route("/deletedVideo")
  .get(validate(deleteVideoSchema), getAllDeletedVideos);

router
  .route("/:videoId")
  .get(validate(getVideoByIdSchema), getVideoById)
  .delete(validate(deleteVideoSchema), deleteVideo)
  .patch(validate(updateVideoSchema), upload.single("thumbnail"), updateVideo);

router
  .route("/recover/:videoId")
  .patch(validate(recoverVideoSchema), recoverVideo);
router
  .route("/toggle/pusblish/:videoId")
  .patch(validate(togglePublishStatusSchema), togglePublishStatus);

export default router;
