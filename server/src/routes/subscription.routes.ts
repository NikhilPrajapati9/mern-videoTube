import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller.js";
import { validate } from "../middlewares/validate.js";
import {
  getSubscribedChannelsSchema,
  getUserChannelSubscribersSchema,
  toggleSubscriptionSchema,
} from "../validators/subscription.validator.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/toggle/:channelId")
  .post(validate(toggleSubscriptionSchema), toggleSubscription);
router
  .route("/subscribers/:channelId")
  .get(validate(getUserChannelSubscribersSchema), getUserChannelSubscribers);
router
  .route("/subscribed/:subscriberId")
  .get(validate(getSubscribedChannelsSchema), getSubscribedChannels);

export default router;
