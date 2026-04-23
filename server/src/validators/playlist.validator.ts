import mongoose from "mongoose";
import { z } from "zod";

export const createPlaylistSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Playlist name cannot be empty")
      .max(100, "Playlist name cannot exceed 100 characters"),
    description: z
      .string()
      .max(500, "Playlist description cannot exceed 500 characters"),
  }),
});

export const getOwnPlaylistsSchema = z.object({
  query: z.object({
    sortBy: z.string().optional(),
    sortType: z.enum(["asc", "desc"]).optional(),
  }),
});

export const getUserPlaylistsSchema = z.object({
  query: z.object({
    sortBy: z.string().optional(),
    sortType: z.enum(["asc", "desc"]).optional(),
  }),
});

export const getPlaylistVideosByIdSchema = z.object({
  params: z.object({
    playlistId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid playlist ID",
    }),
  }),
  query: z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
  }),
});

export const getPlaylistDataByIdSchema = z.object({
  params: z.object({
    playlistId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid playlist ID",
    }),
  }),
});

export const addVideoToPlaylistSchema = z.object({
  params: z.object({
    playlistId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid playlist ID",
    }),
    videoId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid video ID",
    }),
  }),
});

export const removeVideoFromPlaylistSchema = z.object({
  params: z.object({
    playlistId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid playlist ID",
    }),
    videoId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid video ID",
    }),
  }),
});

export const deletePlaylistSchema = z.object({
  params: z.object({
    playlistId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid playlist ID",
    }),
  }),
});

export const updatePlaylistSchema = z.object({
  params: z.object({
    playlistId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid playlist ID",
    }),
  }),
  body: z.object({
    name: z
      .string()
      .min(1, "Playlist name cannot be empty")
      .max(100, "Playlist name cannot exceed 100 characters")
      .optional(),
    description: z
      .string()
      .max(500, "Playlist description cannot exceed 500 characters")
      .optional(),
  }),
});

export const togglePublishStatusSchema = z.object({
  params: z.object({
    playlistId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid playlist ID",
    }),
  }),
});


