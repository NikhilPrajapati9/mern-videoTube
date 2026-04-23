import { Router } from "express";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getOwnPlaylists,
  getPlaylistDataById,
  getPlaylistVideosById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  togglePublishStatus,
  updatePlaylist,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.js";
import {
  addVideoToPlaylistSchema,
  createPlaylistSchema,
  deletePlaylistSchema,
  getOwnPlaylistsSchema,
  getPlaylistDataByIdSchema,
  getPlaylistVideosByIdSchema,
  getUserPlaylistsSchema,
  removeVideoFromPlaylistSchema,
  updatePlaylistSchema,
} from "../validators/playlist.validator.js";
import { togglePublishStatusSchema } from "../validators/video.validator.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/")
  .get(validate(getOwnPlaylistsSchema), getOwnPlaylists)
  .post(validate(createPlaylistSchema), createPlaylist);
router
  .route("/user/:userId")
  .get(validate(getUserPlaylistsSchema), getUserPlaylists);
router
  .route("/:playlistId")
  .get(validate(getPlaylistDataByIdSchema), getPlaylistDataById)
  .delete(validate(deletePlaylistSchema), deletePlaylist)
  .patch(validate(updatePlaylistSchema), updatePlaylist);

router
  .route("/add/:playlistId/:videoId")
  .post(validate(addVideoToPlaylistSchema), addVideoToPlaylist);
router
  .route("/remove/:playlistId/:videoId")
  .post(validate(removeVideoFromPlaylistSchema), removeVideoFromPlaylist);
router
  .route("/toggle/pusblish/:playlistId")
  .patch(validate(togglePublishStatusSchema), togglePublishStatus);
router
  .route("/videos/:playlistId")
  .get(validate(getPlaylistVideosByIdSchema), getPlaylistVideosById);

export default router;
