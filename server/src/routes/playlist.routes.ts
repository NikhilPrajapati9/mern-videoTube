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

const router = Router();

router.use(verifyJWT);

router.route("/").get(getOwnPlaylists).post(createPlaylist);
router.route("/user/:userId").get(getUserPlaylists);
router
  .route("/:playlistId")
  .get(getPlaylistDataById)
  .delete(deletePlaylist)
  .patch(updatePlaylist);

router.route("/add/:playlistId/:videoId").post(addVideoToPlaylist);
router.route("/remove/:playlistId/:videoId").post(removeVideoFromPlaylist);
router.route("/toggle/pusblish/:playlistId").patch(togglePublishStatus);
router.route("/videos/:playlistId").get(getPlaylistVideosById);

export default router;
