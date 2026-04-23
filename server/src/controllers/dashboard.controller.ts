import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { Request, Response } from "express";

export const getChannelStats = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const totalSubscribers = await Subscription.countDocuments({
      channel: userId,
    });

    const videoStats = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "videoId",
          as: "likes",
        },
      },
      {
        $group: {
          _id: null,
          totalVideos: { $sum: 1 },
          totalViews: { $sum: "$views" },
          totalLikes: { $sum: { $size: "$likes" } },
        },
      },
    ]);

    const stats = videoStats[0] || {
      totalVideos: 0,
      totalViews: 0,
      totalLikes: 0,
    };

    const channelData = {
      totalSubscribers,
      totalVideos: stats.totalVideos,
      totalViews: stats.totalViews,
      totalLikes: stats.totalLikes,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(200, channelData, "Channel stats fetched successfully")
      );
  }
);

export const getChannelVideos = asyncHandler(
  async (req: Request, res: Response) => {
    const { query } = (req as any).validated;

    const { page = 1, limit = 10, sortBy = "createdAt", sortType } = query;
    const { userId } = req.params as { userId: string };

    const pipeline = [];

    if (!userId) {
      throw new ApiError(400, "User Id is required");
    }
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid User ID");
    }
    pipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
        isDeleted: false,
      },
    });

    pipeline.push({
      $project: {
        _id: 1,
        videoFile: {
          url: 1,
        },
        thumbnail: {
          url: 1,
        },
        owner: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    });

    const sortColumn = sortBy || "createdAt";
    const sortDirection = sortType === "asc" ? 1 : -1;

    pipeline.push({
      $sort: {
        [sortColumn as string]: sortDirection,
      },
    });

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    };

    const result = await Video.aggregatePaginate(
      Video.aggregate(pipeline as mongoose.PipelineStage[]),
      options
    );

    if (!result || result?.docs?.length === 0) {
      return res.status(200).json(new ApiResponse(200, [], "No videos found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Videos fetched successfully"));
  }
);
