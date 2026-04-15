import { Request, Response } from "express";
import mongoose, { isValidObjectId } from "mongoose";

import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { PlaylistVideo } from "../models/playlistVideos.model.js";

export const createPlaylist = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, description } = req.body;

    if (!name?.trim() || !description?.trim()) {
      throw new ApiError(400, "Name and Description is required");
    }

    const newPlaylist = await Playlist.create({
      name: name.trim(),
      description: description.trim(),
      owner: req.user._id,
      videos: [],
      isPublished: false,
    });

    if (!newPlaylist) {
      throw new ApiError(400, "Failed to create new playlist");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, newPlaylist, "Playlist created successfully"));
  }
);

export const getOwnPlaylists = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { sortBy = "createdAt", sortType = "desc" } = req.query;

    if (!userId) {
      throw new ApiError(401, "User is not authenticated");
    }
    const sortOptions = {
      [sortBy as string]: sortType === "desc" ? -1 : 1,
    };

    const playlists = await Playlist.find({ owner: userId }).sort(
      sortOptions as any
    );

    if (!playlists || playlists.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, [], "No playlists found for this user"));
      
    }

    return res
      .status(200)
      .json(new ApiResponse(200, playlists, "Playlists fetched successfully"));
  }
);

export const getUserPlaylists = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { sortBy = "createdAt", sortType = "desc" } = req.query;

    if (!userId) {
      throw new ApiError(400, "Invalid User ID");
    }
    const sortOptions = {
      [sortBy as string]: sortType === "desc" ? -1 : 1,
    };

    const playlists = await Playlist.find({
      owner: userId,
      isPublished: true,
    }).sort(sortOptions as any);

    if (!playlists || playlists.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, [], "No playlists found for this user"));
      
    }

    return res
      .status(200)
      .json(new ApiResponse(200, playlists, "Playlists fetched successfully"));
  }
);

export const getPlaylistVideosById = asyncHandler(
  async (req: Request, res: Response) => {
    const { playlistId } = req.params as { playlistId: string };
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid Playlist ID");
    }

    const videosAggregation = PlaylistVideo.aggregate([
      {
        $match: {
          playlistId: new mongoose.Types.ObjectId(playlistId),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "videoId",
          foreignField: "_id",
          as: "video",
          pipeline: [
            { $match: { isDeleted: false, isPublished: true } },
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                  {
                    $project: { username: 1, fullName: 1, avatar: { url: 1 } },
                  },
                ],
              },
            },
            { $addFields: { owner: { $first: "$owner" } } },
            { $project: { videoFile: 0, __v: 0 } },
          ],
        },
      },
      {
        $project: {
          video: {
            _id: 1,
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
        },
      },
      { $unwind: "$video" },
      { $replaceRoot: { newRoot: "$video" } },
      { $sort: { createdAt: -1 } },
    ]);

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    };

    const paginatedResult = await PlaylistVideo.aggregatePaginate(
      videosAggregation,
      options
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          videos: paginatedResult.docs,
          pagination: {
            totalVideos: paginatedResult.totalDocs,
            totalPages: paginatedResult.totalPages,
            currentPage: paginatedResult.page,
            hasNextPage: paginatedResult.hasNextPage,
          },
        },
        "Playlist fetched successfully"
      )
    );
  }
);

export const getPlaylistDataById = asyncHandler(
  async (req: Request, res: Response) => {
    const { playlistId } = req.params as { playlistId: string };

    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid Playlist ID");
    }

    const playlistMetadata = await Playlist.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(playlistId),
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
                fullName: 1,
                avatar: { url: 1 },
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
    ]);

    if (!playlistMetadata) {
      throw new ApiError(404, "Playlist not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          playlistMetadata,
          "Playlist data fetched successfully"
        )
      );
  }
);

export const addVideoToPlaylist = asyncHandler(
  async (req: Request, res: Response) => {
    const { playlistId, videoId } = req.params;

    // 1. Validations
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid Playlist or Video ID");
    }

    // 2. Check if Playlist exists and User is the owner
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
      throw new ApiError(403, "You are not the owner of this playlist");
    }

    // 3. Check if Video exists
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    const existingEntry = await PlaylistVideo.findOne({
      playlistId,
      videoId,
    });

    if (existingEntry) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Video is already in this playlist"));
      
    }

    // 5. Create Entry
    const newEntry = await PlaylistVideo.create({
      playlistId,
      videoId,
    });

    if (!newEntry) {
      throw new ApiError(
        500,
        "Something went wrong while adding video to playlist"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, newEntry, "Video added to playlist successfully")
      );
  }
);

export const removeVideoFromPlaylist = asyncHandler(
  async (req: Request, res: Response) => {
    const { playlistId, videoId } = req.params;

    // 1. Validations
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid Playlist or Video ID");
    }

    // 2. Playlist Check & Ownership
    const playlist = await Playlist.findById(playlistId).select("owner");

    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
      throw new ApiError(403, "You are not authorized to modify this playlist");
    }

    // 3. Find and Delete in one go
    // Dhyaan dein: Field ka naam 'video' hai aapke schema mein
    const deletedEntry = await PlaylistVideo.findOneAndDelete({
      playlistId,
      videoId,
    });

    // 4. Check if entry existed
    if (!deletedEntry) {
      throw new ApiError(404, "Video not found in this playlist");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          deletedEntry,
          "Video removed from playlist successfully"
        )
      );
  }
);

export const deletePlaylist = asyncHandler(
  async (req: Request, res: Response) => {
    const { playlistId } = req.params as { playlistId: string };

    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid Playlist ID");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
      throw new ApiError(403, "You are not authorized to delete this playlist");
    }

    await Playlist.findByIdAndDelete(playlistId);

    await PlaylistVideo.deleteMany({
      playlistId: new mongoose.Types.ObjectId(playlistId),
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          "Playlist and its references deleted successfully"
        )
      );
  }
);

export const updatePlaylist = asyncHandler(
  async (req: Request, res: Response) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid Playlist ID");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
      throw new ApiError(403, "You are not authorized to delete this playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        name,
        description,
      },
      {
        new: true,
      }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedPlaylist, "Playlist update successfully")
      );
  }
);

export const togglePublishStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { playlistId } = req.params;
    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid Playlist ID");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
      throw new ApiError(403, "You are not authorized to modify this playlist");
    }

    // Agar true hai toh false ho jayega, aur vice versa
    playlist.isPublished = !playlist.isPublished;
    await playlist.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isPublished: playlist.isPublished },
          `Playlist is now ${playlist.isPublished ? "Public" : "Private"}`
        )
      );
  }
);
