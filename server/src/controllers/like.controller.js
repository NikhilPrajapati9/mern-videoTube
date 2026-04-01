import { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const likedVideo = await Like.findOne({
    videoId: videoId,
    likedBy: req.user?._id,
  });

  if (likedVideo) {
    await Like.findByIdAndDelete(likedVideo._id);

    return res
      .status(200)
      .json(
        new ApiResponse(200, { isLiked: false }, "Video Unliked successfully")
      );
  }

  await Like.create({
    videoId: videoId,
    likedBy: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { isLiked: true }, "Video Liked successfully"));
});

export const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const likedComment = await Like.findOne({
    commentId: commentId,
    likedBy: req.user?._id,
  });

  if (likedComment) {
    await Like.findByIdAndDelete(likedComment._id);

    return res
      .status(200)
      .json(
        new ApiResponse(200, { isLiked: false }, "Comment Unliked successfully")
      );
  }

  await Like.create({
    CommentId: commentId,
    likedBy: req.user?._id,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { isLiked: true }, "Comment liked successfully")
    );
});

export const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const likedTweet = await Like.findOne({
    tweetId: tweetId,
    likedBy: req.user?._id,
  });

  if (likedTweet) {
    await Like.findByIdAndDelete(likedTweet._id);

    return res
      .status(200)
      .json(
        new ApiResponse(200, { isLiked: false }, "Tweet Unliked successfully")
      );
  }

  await Like.create({
    tweetId: tweetId,
    likedBy: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { isLiked: true }, "Tweet liked successfully"));
});

export const getLikedVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user?._id;

  const likedVideosAggregation = Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
        videoId: { $exists: true, $ne: null },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videoId",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: { owner: { $first: "$owner" } },
          },
        ],
      },
    },
    { $unwind: "$video" },
    {
      $match: {
        "video.isPublished": true,
      },
    },
    {
      $sort: { created: -1 },
    },
    {
      $project: {
        _id: 1,
        video: 1,
      },
    },
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const result = await Like.aggregatePaginate(likedVideosAggregation, options);

  if (!result.docs.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No liked videos found"));
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        likedVideos: result.docs,
        totalVideos: result.totalDocs,
        totalPages: result.totalPages,
        currentPage: result.page,
        hasNextPage: result.hasNextPage,
      },
      "Liked videos fetched successfully"
    )
  );
});

export const getLikedComments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user?._id;

  const likedCommentsAggregation = Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
        commentId: { $exists: true, $ne: null },
      },
    },
    {
      // 2. Lookup: Comment ki details fetch karein
      $lookup: {
        from: "comments",
        localField: "commentId",
        foreignField: "_id",
        as: "comment",
        pipeline: [
          {
            // 3. Nested Lookup: Comment likhne waale ki detail (Comment Owner)
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "commentOwner",
              pipeline: [{ $project: { username: 1, avatar: 1, fullName: 1 } }],
            },
          },
          {
            // 4. Nested Lookup: Yeh comment kis video par hai
            $lookup: {
              from: "videos",
              localField: "video",
              foreignField: "_id",
              as: "videoInfo",
              pipeline: [{ $project: { title: 1, thumbnail: 1 } }],
            },
          },
          {
            $addFields: {
              owner: { $first: "$commentOwner" },
              video: { $first: "$videoInfo" },
            },
          },
        ],
      },
    },
    { $unwind: "$comment" },
    {
      $sort: { createdAt: -1 }, // Latest liked comments first
    },
    {
      $project: {
        _id: 1,
        comment: 1,
        createdAt: 1,
      },
    },
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const result = await Like.aggregatePaginate(
    likedCommentsAggregation,
    options
  );

  if (!result.docs.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No liked comments found"));
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        likedComments: result.docs,
        totalComments: result.totalDocs,
        totalPages: result.totalPages,
        currentPage: result.page,
      },
      "Liked comments fetched successfully"
    )
  );
});

export const getLikedTweets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user?._id;

  const likedTweetsAggregation = Like.aggregate([
    {
      //  Match: Sirf woh likes jo "Tweet" ke hain aur is user ne kiye hain
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
        tweetId: { $exists: true, $ne: null },
      },
    },
    {
      //  Lookup: Tweet ki actual details fetch karein
      $lookup: {
        from: "tweets",
        localField: "tweetId",
        foreignField: "_id",
        as: "tweet",
        pipeline: [
          {
            //  Nested Lookup: Tweet likhne waale user ki details
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "tweetOwner",
              pipeline: [{ $project: { username: 1, avatar: 1, fullName: 1 } }],
            },
          },
          {
            $addFields: {
              owner: { $first: "$tweetOwner" },
            },
          },
        ],
      },
    },
    { $unwind: "$tweet" },
    {
      // Sort: Naye liked tweets sabse upar
      $sort: { createdAt: -1 },
    },
    {
      $project: {
        _id: 1,
        tweet: 1,
        createdAt: 1, // Ye Like create hone ki date hai
      },
    },
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const result = await Like.aggregatePaginate(likedTweetsAggregation, options);

  if (!result.docs.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No liked tweets found"));
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        likedTweets: result.docs,
        totalTweets: result.totalDocs,
        totalPages: result.totalPages,
        currentPage: result.page,
      },
      "Liked tweets fetched successfully"
    )
  );
});
