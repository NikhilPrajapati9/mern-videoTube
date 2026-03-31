import { Router } from "express";
import {
  getChannelStats,
  getChannelVideos,
} from "../controllers/dashboard.controller.js";

const router = Router();
router.use(verifyJWT);

(router.route("/stats").get(getChannelStats),
  router.route("/videos/:userId").get(getChannelVideos));

export default router;
