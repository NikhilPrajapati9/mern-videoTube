import { Router } from "express";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.js";
import {
  addCommentSchema,
  deleteCommentSchema,
  getVideoCommentsSchema,
  updateCommentSchema,
} from "../validators/comment.validator.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/:videoId")
  .get(validate(getVideoCommentsSchema), getVideoComments)
  .post(validate(addCommentSchema), addComment);
router
  .route("/update/:commentId")
  .patch(validate(updateCommentSchema), updateComment);
router
  .route("/delete/:commentId")
  .delete(validate(deleteCommentSchema), deleteComment);

export default router;
