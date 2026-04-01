import { Router } from "express";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getOwnPlaylists,
  getPlaylistById,
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
  .get(getPlaylistById)
  .delete(deletePlaylist)
  .patch(updatePlaylist);

router.route("/add/:playlistId/:videoId").post(addVideoToPlaylist);
router.route("/remove/:playlistId/:videoId").post(removeVideoFromPlaylist);
router.route("/toggle/pusblish/:playlistId").post(togglePublishStatus);

export default router;
