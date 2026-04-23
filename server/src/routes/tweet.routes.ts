import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createTweet,
  deleteTweet,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.controller.js";
import { validate } from "../middlewares/validate.js";
import {
  createTweetSchema,
  deleteTweetSchema,
  getUserTweetsSchema,
  updateTweetSchema,
} from "../validators/tweet.validator.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(validate(createTweetSchema), createTweet);
router.route("/:userId").get(validate(getUserTweetsSchema), getUserTweets);
router
  .route("/:tweetId")
  .patch(validate(updateTweetSchema), updateTweet)
  .delete(validate(deleteTweetSchema), deleteTweet);

export default router;
