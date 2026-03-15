import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import mongoose from "mongoose";

const generateAccessAndRefrehToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullName, password } = req.body;
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(409, "user with email or username already exists");
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  let coverImage = "";
  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }

  if (!avatar.url || !avatar?.public_id) {
    throw new ApiError(400, "Avatar file failed to upload ");
  }

  const user = await User.create({
    fullName,
    avatar: {
      url: avatar?.secure_url || avatar?.url,
      public_id: avatar?.public_id,
    },
    coverImage: coverImage
      ? {
          url: coverImage?.secure_url || coverImage?.url,
          public_id: coverImage.public_id,
        }
      : undefined,
    username: username.toLowerCase(),
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Somthing went wrong while registering the user.");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully."));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!(email || username)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password incorrect.");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefrehToken(
    user._id
  );

  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: userResponse, accessToken, refreshToken },
        "user logged In successfully"
      )
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  const userId = req?.user?._id;

  await User.findByIdAndUpdate(
    userId,
    {
      $unset: { refreshToken: 1 }, // remove refreshToken token from the document
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      proccess.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Unauthorized request");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    };

    const { accessToken, refreshToken } = await generateAccessAndRefrehToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access Token Refreshed."
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid R efresh Token");
  }
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const userId = req.user._id;

  const user = await User.findById(userId);

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current fetched successfully"));
});

export const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if ([fullName, email].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { fullName, email },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully."));
});

export const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing.");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url || !!avatar.public_id) {
    throw new ApiError(400, "Error while uploading on avtar files.");
  }

  //delete oldAvatar file from cloudinary

  const oldAvatarPublicId = req.user?.avatar?.public_id;

  if (!oldAvatarPublicId) {
    throw new ApiError(
      400,
      "Didn't get Avatar file publicId from middleware's user !!"
    );
  }

  try {
    await deleteFromCloudinary(oldAvatarPublicId, "image");
  } catch (error) {
    await deleteFromCloudinary(avatar.public_id, "image");
    throw new ApiError(
      400,
      "Something went wrong while deleting avatar file from cloudinary"
    );
  }

  const user = await User.findByIdAndUpdate(
    req?.user._id,
    {
      $set: {
        avatar: {
          url: avatar?.secure_url || avatar?.url,
          public_id: avatar?.public_id,
        },
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar update successfully."));
});

export const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Avatar file is missing.");
  }

  const coverImage = await uploadOnCloudinary(avatarLocalPath);

  if (!coverImage.url || !!coverImage.public_id) {
    throw new ApiError(400, "Error while uploading on coverImage files.");
  }

  //delete oldAvatar file from cloudinary

  const oldCoverImagePublicId = req.user?.coverImage?.public_id;

  if (!oldCoverImagePublicId) {
    throw new ApiError(
      400,
      "Didn't get coverImage file publicId from middleware's user !!"
    );
  }

  try {
    await deleteFromCloudinary(oldCoverImagePublicId, "image");
  } catch (error) {
    await deleteFromCloudinary(coverImage.public_id, "image");
    throw new ApiError(
      400,
      "Something went wrong while deleting coverImage file from cloudinary"
    );
  }

  const user = await User.findByIdAndUpdate(
    req?.user._id,
    {
      $set: {
        coverImage: {
          url: coverImage?.secure_url || coverImage?.url,
          public_id: coverImage?.public_id,
        },
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "CoverImage update successfully."));
});

export const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscribers.subscriber"],
              then: true,
              else: false,
            },
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        email: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);

  console.log("aggregate channel data :=> ", channel);

  if (!channel?.length) {
    throw new ApiError(404, "Channel doesn't exists");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(404, channel[0], "User channel fetched successfully")
    );
});

export const getWatchedHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          // 1. Filter: Sirf Published aur Non-deleted videos dikhao
          {
            $match: {
              isPublished: true,
              isDeleted: false,
            },
          },
          // 2. Lookup: Video ke owner ki details fetch karo
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
          // 3. Sorting: History hamesha latest first honi chahiye
          // Note: Agar aapne watchHistory array mein push karte waqt order handle kiya hai toh zaroorat nahi,
          // par aggregation mein order maintain karne ke liye $sort use kar sakte hain.
        ],
      },
    },
  ]);

  if (!user || user.length === 0) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0]?.watchHistory || [],
        "Watch history fetched successfully"
      )
    );
});
