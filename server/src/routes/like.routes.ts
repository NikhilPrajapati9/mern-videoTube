import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getLikedComments,
  getLikedTweets,
  getLikedVideos,
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";
import { validate } from "../middlewares/validate.js";
import {
  getLikedCommentsSchema,
  getLikedTweetsSchema,
  getLikedVideosSchema,
  toggleCommentLikeSchema,
  toggleTweetLikeSchema,
  toggleVideoLikeSchema,
} from "../validators/like.validator.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/toggle/v/:videoId")
  .post(validate(toggleVideoLikeSchema), toggleVideoLike);
router
  .route("/toggle/c/:commentId")
  .post(validate(toggleCommentLikeSchema), toggleCommentLike);
router
  .route("/toggle/t/:tweetId")
  .post(validate(toggleTweetLikeSchema), toggleTweetLike);
router
  .route("/liked-videos")
  .get(validate(getLikedVideosSchema), getLikedVideos);
router
  .route("/liked-comments")
  .get(validate(getLikedCommentsSchema), getLikedComments);
router
  .route("/liked-tweets")
  .get(validate(getLikedTweetsSchema), getLikedTweets);

export default router;
