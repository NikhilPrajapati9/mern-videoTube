import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getChannelStats = asyncHandler(async (req, res) => {
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
      // Statistics calculate karo
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: "$views" },
        totalLikes: { $sum: { $size: "$likes" } },
      },
    },
  ]);

  // Agar user ne koi video upload nahi ki hai, toh default values set karein
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
});

export const getChannelVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sortBy = "createdAt", sortType } = req.query;
  const { userId } = req.params;

  const pipeline = [];

  //Filter by userId
  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid User ID");
    }
    pipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
        isDeleted: false,
      },
    });
  }

  const sortColumn = sortBy || "createdAt";
  const sortDirection = sortType === "asc" ? 1 : -1;

  pipeline.push({
    $sort: {
      [sortColumn]: sortDirection,
    },
  });

  //Pagination Options
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  //Execute Paginated Aggregation

  const result = await Video.aggregatePaginate(
    Video.aggregate(pipeline),
    options
  );

  if (!result || !result.docs.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], "No videos found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Videos fetched successfully"));
});
