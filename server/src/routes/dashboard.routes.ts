import { Router } from "express";
import {
  getChannelStats,
  getChannelVideos,
} from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.js";
import { getChannelVideosSchema } from "../validators/dashboard.validator.js";

const router = Router();
router.use(verifyJWT);

router.route("/stats").get(getChannelStats);
router
  .route("/videos/:userId")
  .get(validate(getChannelVideosSchema), getChannelVideos);

export default router;
