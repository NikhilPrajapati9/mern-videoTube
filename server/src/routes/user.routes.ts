import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  changeCurrentPassword,
  checkUsernameAvailability,
  getCurrentUser,
  getUserChannelProfile,
  getWatchedHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.js";
import {
  changeCurrentPasswordSchema,
  checkUsernameAvailabilitySchema,
  getUserChannelProfileSchema,
  loginSchema,
  refreshAccessTokenSchema,
  registerSchema,
  updateAccountDetailsSchema,
  updateUserAvatarSchema,
  updateUserCoverImageSchema,
} from "../validators/user.validator.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  validate(registerSchema),
  registerUser
);
router.route("/login").post(validate(loginSchema), loginUser);

//secures routes
router.route("/logout").post(verifyJWT, logoutUser);
router
  .route("/refresh-token")
  .post(validate(refreshAccessTokenSchema), refreshAccessToken);

router
  .route("/change-password")
  .post(
    verifyJWT,
    validate(changeCurrentPasswordSchema),
    changeCurrentPassword
  );
router.route("/current-user").get(verifyJWT, getCurrentUser);
router
  .route("/update-account")
  .patch(verifyJWT, validate(updateAccountDetailsSchema), updateAccountDetails);
router
  .route("/username-check")
  .post(
    verifyJWT,
    validate(checkUsernameAvailabilitySchema),
    checkUsernameAvailability
  );
router
  .route("/avatar")
  .patch(
    verifyJWT,
    upload.single("avatar"),
    validate(updateUserAvatarSchema),
    updateUserAvatar
  );
router
  .route("/cover-image")
  .patch(
    verifyJWT,
    upload.single("coverImage"),
    validate(updateUserCoverImageSchema),
    updateUserCoverImage
  );

router
  .route("/c/:username")
  .get(verifyJWT, validate(getUserChannelProfileSchema), getUserChannelProfile);
router.route("/history").get(verifyJWT, getWatchedHistory);

export default router;
