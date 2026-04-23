import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Request, Response } from "express";

export const getAllVideos = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      query,
      sortBy = "createdAt",
      sortType = "desc",
      userId,
    } = (req as any).validated.query;

    const pipeline = [];

    // 1. Initial Filter:
    pipeline.push({
      $match: {
        isPublished: true,
        isDeleted: false,
      },
    });

    if (query) {
      pipeline.push({
        $match: {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
        },
      });
    }

    if (userId) {
      if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User ID");
      }
      pipeline.push({
        $match: {
          owner: new mongoose.Types.ObjectId(userId as string),
        },
      });
    }

    const sortColumn = (sortBy as string) || "createdAt";
    const sortDirection = sortType === "asc" ? 1 : -1;

    pipeline.push({
      $sort: {
        [sortColumn]: sortDirection,
      },
    });

    pipeline.push({
      $project: {
        isDeleted: 0,
      },
    });

    // 5. Pagination Options
    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    };

    // 6. Execute Paginated Aggregation
    const result = await Video.aggregatePaginate(
      Video.aggregate(pipeline as mongoose.PipelineStage[]),
      options
    );

    // Result Handling
    if (!result || result.docs.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, { docs: [] }, "No videos found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Videos fetched successfully"));
  }
);

export const getAllDeletedVideos = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      sortBy = "deletedAt",
      sortType = "desc",
    } = (req as any).validated.query;
    const userId = req.user._id;

    const pipeline = [];

    // 1. Match only DELETED videos of the logged-in user
    pipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
        isDeleted: true,
      },
    });

    // 2. Sorting (Default: Latest deleted first)
    pipeline.push({
      $sort: {
        [sortBy as string]: sortType === "asc" ? 1 : -1,
      },
    });

    // 3. Lookup: Agar aap video ke owner ki details dikhana chahte ke liye
    pipeline.push({
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
    });

    pipeline.push({
      $addFields: {
        ownerDetails: { $first: "$ownerDetails" },
      },
    });

    // Pagination Options
    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    };

    // Execute Paginated Aggregation
    const result = await Video.aggregatePaginate(
      Video.aggregate(pipeline as mongoose.PipelineStage[]),
      options
    );

    if (!result || result.docs.length === 0) {
      res
        .status(200)
        .json(new ApiResponse(200, { docs: [] }, "Trash bin is empty"));
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          "Deleted videos fetched successfully from trash"
        )
      );
  }
);

export const uploadAVideo = asyncHandler(
  async (req: Request, res: Response) => {
    const { body } = (req as any).validated;
    const { title, description } = body;
    const files = (req as any).validated.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;
    const videoLocalPath = files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = files?.thumbnail?.[0]?.path;

    if (!videoLocalPath) {
      throw new ApiError(400, "video is required");
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath);

    if (!videoFile || !videoFile.playback_url || !videoFile.public_id) {
      throw new ApiError(400, "Failed to upload video");
    }

    let thumbnailFile = null;
    if (thumbnailLocalPath) {
      thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);
    }

    console.log("uploaded video res=>", videoFile);

    const video = await Video.create({
      videoFile: {
        url: videoFile.playback_url || videoFile.secure_url || videoFile.url,
        public_id: videoFile.public_id,
      },
      thumbnail: {
        url: thumbnailFile?.secure_url || thumbnailFile?.url || "",
        public_id: thumbnailFile?.public_id || "",
      },
      owner: req.user?._id,
      title: title || `Video_${Date.now()}`,
      description: description ? description.trim() : "",
      duration: videoFile?.duration || 0,
      isPublished: false,
    });

    if (!video) {
      throw new ApiError(400, "Failed to create video");
    }

    const newVideo = video.toObject();
    delete newVideo.isDeleted;
    delete newVideo.deletedAt;

    res
      .status(201)
      .json(new ApiResponse(201, newVideo, "Video uploaded successfully."));
  }
);

export const getVideoById = asyncHandler(
  async (req: Request, res: Response) => {
    const { videoId } = (req as any).validated.params;
    //TODO: get video by id

    if (!videoId) {
      throw new ApiError(400, "video id is required");
    }

    const video = await Video.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(videoId as string),
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
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
              },
            },
            {
              $addFields: {
                subscribersCount: { $size: "$subscribers" },
                isSubscribed: {
                  $cond: {
                    if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                    then: true,
                    else: false,
                  },
                },
              },
            },
            {
              $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                subscribersCount: 1,
                isSubscribed: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          likeCount: { $size: "$likes" },
          owner: { $first: "$owner" },
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
        $project: {
          likes: 0,
          isDeleted: 0,
          deletedAt: 0,
        },
      },
    ]);

    if (!video.length) {
      throw new ApiError(404, "Video not found");
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, video[0], "Video details fetched successfully")
      );
  }
);

export const updateVideo = asyncHandler(async (req: Request, res: Response) => {
  const { body, params, file } = (req as any).validated;
  const { videoId } = params;
  const { title, description } = body;
  const thumbnailLocalPath = file?.path;

  if (!videoId) {
    throw new ApiError(400, "video id is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  // Ownership check (Security)
  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Unauthorized request");
  }

  let thumbnailFile = null;

  if (thumbnailLocalPath) {
    thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnailFile) {
      throw new ApiError(400, "Error while uploading thumbnail");
    }

    
    if (video.thumbnail?.public_id) {
      try {

        await deleteFromCloudinary(video.thumbnail.public_id, "image");
      } catch (error) {
        console.log("Old thumbnail deletion failed", error);
      }
    }
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title || video.title,
        description: description || video.description,
        thumbnail: {
          url:
            thumbnailFile?.secure_url ||
            thumbnailFile?.url ||
            video.thumbnail.url ||
            "",
          public_id:
            thumbnailFile?.public_id || video?.thumbnail.public_id || "",
        },
      },
    },
    {
      new: true,
    }
  );

  const editUpdatedVideo = updatedVideo.toObject();
  delete editUpdatedVideo.isDeleted;
  delete editUpdatedVideo.deletedAt;

  res
    .status(200)
    .json(new ApiResponse(200, editUpdatedVideo, "Video update successfully"));
});

export const deleteVideo = asyncHandler(async (req: Request, res: Response) => {
  const { videoId } = (req as any).validated.params;

  if (!videoId) {
    throw new ApiError(400, "Video Id is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // 2. Authorization check:
  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You do not have permission to delete this video");
  }

  // remove document from database
  await Video.findByIdAndUpdate(videoId, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});

export const recoverVideo = asyncHandler(
  async (req: Request, res: Response) => {
    const { videoId } = (req as any).validated.params;
    if (!videoId) {
      throw new ApiError(400, "Video Id is required");
    }

    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    // 2. Authorization check:
    if (video.owner.toString() !== req.user?._id.toString()) {
      throw new ApiError(
        403,
        "You do not have permission to recover this video"
      );
    }

    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      {
        isDeleted: false,
        $unset: { deletedAt: 1 },
      },
      {
        new: true,
      }
    );

    const editUpdatedVideo = updatedVideo.toObject();
    delete editUpdatedVideo.isDeleted;
    delete editUpdatedVideo.deletedAt;

    res
      .status(200)
      .json(
        new ApiResponse(200, editUpdatedVideo, "Video recover successfully")
      );
  }
);

export const togglePublishStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { videoId } = req.params;

    if (!videoId) {
      throw new ApiError(400, "Video ID is required");
    }

    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    // 2. Security: Check karein ki user owner hai ya nahi
    if (video.owner.toString() !== req.user?._id.toString()) {
      throw new ApiError(
        403,
        "You do not have permission to toggle this video"
      );
    }

    // Agar true hai toh false ho jayega, aur vice versa
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          isPublished: !video.isPublished,
        },
      },
      { new: true }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isPublished: updatedVideo.isPublished },
          `Video has been ${updatedVideo.isPublished ? "Published" : "Unpublished"} successfully`
        )
      );
  }
);
