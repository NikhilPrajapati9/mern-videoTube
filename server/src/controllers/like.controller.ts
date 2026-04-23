import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Request, Response } from "express";

export const toggleVideoLike = asyncHandler(
  async (req: Request, res: Response) => {
    const { params } = (req as any).validated;
    const { videoId } = params;

    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid Video ID");
    }

    const likedVideo = await Like.findOne({
      videoId: videoId,
      likedBy: req.user?._id,
    });

    if (likedVideo) {
      await Like.findByIdAndDelete(likedVideo._id);

      res
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
      .json(
        new ApiResponse(200, { isLiked: true }, "Video Liked successfully")
      );
  }
);

export const toggleCommentLike = asyncHandler(
  async (req: Request, res: Response) => {
    const { params } = (req as any).validated;
    const { commentId } = params;

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
          new ApiResponse(
            200,
            { isLiked: false },
            "Comment Unliked successfully"
          )
        );
    } else {
      await Like.create({
        commentId: commentId,
        likedBy: req.user?._id,
      });

      return res
        .status(200)
        .json(
          new ApiResponse(200, { isLiked: true }, "Comment liked successfully")
        );
    }
  }
);

export const toggleTweetLike = asyncHandler(
  async (req: Request, res: Response) => {
    const { params } = (req as any).validated;
    const { tweetId } = params;

    if (!isValidObjectId(tweetId)) {
      throw new ApiError(400, "Invalid Video ID");
    }

    const likedTweet = await Like.findOne({
      tweetId: tweetId,
      likedBy: req.user?._id,
    });

    if (likedTweet) {
      await Like.findByIdAndDelete(likedTweet._id);

      res
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
      .json(
        new ApiResponse(200, { isLiked: true }, "Tweet liked successfully")
      );
  }
);

export const getLikedVideos = asyncHandler(
  async (req: Request, res: Response) => {
    const { query } = (req as any).validated;
    const { page = 1, limit = 10 } = query;
    const userId = req.user?._id;

    const likedVideosAggregation = Like.aggregate([
      {
        $match: {
          likedBy: new mongoose.Types.ObjectId(userId),
          // Sirf un likes ko lo jo videos par hain (not comments/tweets)
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
                      avatar: {
                        url: 1,
                      }, // Avatar.url apne aap include ho jayega agar nested hai
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                owner: { $first: "$owner" },
              },
            },
          ],
        },
      },
      // Array ko object mein badle taaki dot notation (video.isPublished) kaam kare
      { $unwind: "$video" },
      {
        $match: {
          "video.isPublished": true, // Sirf wahi videos jo public hain
        },
      },
      {
        $sort: {
          createdAt: -1, // Sahi field name 'createdAt' hai
        },
      },
      {
        $project: {
          _id: 1,
          video: {
            _id: 1,
            title: 1,
            description: 1,
            duration: 1,
            views: 1,
            thumbnail: { url: 1 },
            owner: 1,
            createdAt: 1,
          },
        },
      },
    ]);

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    };

    const result = await Like.aggregatePaginate(
      likedVideosAggregation,
      options
    );

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
  }
);

export const getLikedComments = asyncHandler(
  async (req: Request, res: Response) => {
    const { query } = (req as any).validated;
    const { page = 1, limit = 10 } = query;
    const userId = req.user?._id;

    const likedCommentsAggregation = Like.aggregate([
      {
        $match: {
          likedBy: new mongoose.Types.ObjectId(userId),
          commentId: { $exists: true, $ne: null },
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "commentId",
          foreignField: "_id",
          as: "comment",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "commentOwner",
                pipeline: [
                  {
                    $project: {
                      username: 1,
                      avatar: {
                        url: 1,
                      },
                      fullName: 1,
                    },
                  },
                ],
              },
            },
            {
              $lookup: {
                from: "videos",
                localField: "videoId",
                foreignField: "_id",
                as: "videoInfo",
                pipeline: [
                  {
                    $project: {
                      title: 1,
                      thumbnail: {
                        url: 1,
                      },
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                commentOwner: { $first: "$commentOwner" },
                videoInfo: { $first: "$videoInfo" },
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
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
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
  }
);

export const getLikedTweets = asyncHandler(
  async (req: Request, res: Response) => {
    const { query } = (req as any).validated;
    const { page = 1, limit = 10 } = query;
    const userId = req.user?._id;

    const likedTweetsAggregation = Like.aggregate([
      {
        $match: {
          likedBy: new mongoose.Types.ObjectId(userId),
          tweetId: { $exists: true, $ne: null },
        },
      },
      {
        $lookup: {
          from: "tweets",
          localField: "tweetId",
          foreignField: "_id",
          as: "tweet",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "tweetOwner",
                pipeline: [
                  {
                    $project: {
                      username: 1,
                      avatar: {
                        url: 1,
                      },
                      fullName: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                tweetOwner: { $first: "$tweetOwner" },
              },
            },
          ],
        },
      },
      { $unwind: "$tweet" },
      {
        $sort: { createdAt: -1 },
      },
      {
        $project: {
          _id: 1,
          tweet: 1,
          createdAt: 1,
        },
      },
    ]);

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    };

    const result = await Like.aggregatePaginate(
      likedTweetsAggregation,
      options
    );

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
  }
);
