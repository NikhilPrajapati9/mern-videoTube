import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { Tweet } from "../models/tweet.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";

export const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Content is required and cannot be empty");
  }

  const newTweet = await Tweet.create({
    content: content.trim(),
    owner: req.user._id,
  });

  if (!newTweet) {
    throw new ApiError(500, "Somthing went wrong while creating a tweet.");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, newTweet, "Tweet created successfully"));
});

export const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User ID");
  }

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweetId",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
              fullName: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
        owner: { $first: "$ownerDetails" },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        likes: 0,
        ownerDetails: 0,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
});

export const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  // 1. Validation: Check if tweetId is valid
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet ID");
  }

  // 2. Validation: Check if new content is provided
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Content is required to update tweet");
  }

  // 3. Find the tweet
  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  // 4. Authorization: Check if the user is the owner of the tweet
  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this tweet");
  }

  // 5. Update the tweet
  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content: content.trim(),
      },
    },
    { new: true } // Taaki humein updated wala document waapis mile
  );

  if (!updatedTweet) {
    throw new ApiError(500, "Something went wrong while updating the tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

export const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  // 1. Validation: Check if tweetId is a valid MongoDB ID
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet ID");
  }

  // 2. Find the tweet to check existence and ownership
  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  // 3. Authorization: Only the owner can delete their tweet
  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this tweet");
  }

  // 4. Delete the tweet
  await Tweet.findByIdAndDelete(tweetId);

  // 5. Cleanup: Delete all likes associated with this tweet
  await Like.deleteMany({
    tweetId: tweetId,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet and its likes deleted successfully"));
});
