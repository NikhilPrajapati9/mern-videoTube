import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { Request, Response } from "express";

export const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params as { videoId: string };
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const aggregate = Comment.aggregate([
    {
      $match: {
        videoId: new mongoose.Types.ObjectId(videoId),
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
      // owner array ko object mein convert karne ke liye
      $addFields: {
        owner: { $first: "$owner" },
      },
    },
    {
      $sort: {
        createdAt: -1, // Latest comments pehle dikhane ke liye
      },
    },
  ]);

  const options = {
    page: parseInt(page as string, 10),
    limit: parseInt(limit as string, 10),
  };

  const result = await Comment.aggregatePaginate(aggregate, options);

  if (!result) {
    throw new ApiError(500, "Error while fetching comments");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comments: result.docs,
        totalComments: result.totalDocs,
        totalPages: result.totalPages,
        currentPage: result.page,
        hasNextPage: result.hasNextPage,
      },
      "Comments fetched successfully"
    )
  );
});

export const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Comment content is required");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const comment = await Comment.create({
    content: content.trim(),
    videoId: videoId,
    owner: req.user?._id,
  });

  if (!comment) {
    throw new ApiError(500, "Something went wrong while adding the comment");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

export const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment ID");
  }

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Comment content is required");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to edit this comment");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content: content.trim(),
      },
    },
    { new: true }
  );

  if (!updatedComment) {
    throw new ApiError(500, "Something went wrong while updating the comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

export const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment ID");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this comment");
  }

  await Comment.findByIdAndDelete(commentId);

  await Like.deleteMany({
    commentId: commentId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { commentId }, "Comment deleted successfully"));
});
